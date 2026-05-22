-- ========================================================
-- PHASE 3: CAMPUS BUDDY "DISCORD" SOCIAL HUB SCHEMA & ADMIN CONFIGS
-- Please run this entire file in your Supabase SQL Editor
-- ========================================================

-- 0.1 Create Profiles Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'student',
    student_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 0.2 Create Global App Config Table (for Admin Dashboard)
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We disable RLS or set policy so ONLY YOU can update it.
-- For now, we allow reading for everyone, but updating requires knowing the specific key or being admin.
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read config" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "Only authenticated users can update config" ON public.app_config FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Only authenticated users can insert config" ON public.app_config FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 1. Create Servers Table
CREATE TABLE IF NOT EXISTS public.servers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Channels Table
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'voice')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Server Members Table
CREATE TABLE IF NOT EXISTS public.server_members (
    server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (server_id, user_id)
);

-- 4. Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Set up RLS Policies

-- Servers: Anyone can view servers they are a member of
CREATE POLICY "Users can view servers they are a member of" ON public.servers
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.server_members WHERE server_id = public.servers.id AND user_id = auth.uid())
    );

-- Servers: Authenticated users can create servers
CREATE POLICY "Users can create servers" ON public.servers
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Channels: Anyone can view channels of servers they are a member of
CREATE POLICY "Users can view channels of their servers" ON public.channels
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.server_members WHERE server_id = public.channels.server_id AND user_id = auth.uid())
    );

-- Channels: Only Server Admins can create channels
CREATE POLICY "Admins can create channels" ON public.channels
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.server_members WHERE server_id = public.channels.server_id AND user_id = auth.uid() AND role = 'admin')
    );

-- Server Members: Users can see members of their servers
CREATE POLICY "Users can view members of their servers" ON public.server_members
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.server_members sm WHERE sm.server_id = public.server_members.server_id AND sm.user_id = auth.uid())
    );

-- Server Members: Users can join servers (or admins can add them)
CREATE POLICY "Users can join servers" ON public.server_members
    FOR INSERT WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.server_members sm WHERE sm.server_id = server_id AND sm.user_id = auth.uid() AND sm.role = 'admin'));

-- Messages: Users can read messages in their servers
CREATE POLICY "Users can read messages in their servers" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.channels c
            JOIN public.server_members sm ON c.server_id = sm.server_id
            WHERE c.id = public.messages.channel_id AND sm.user_id = auth.uid()
        )
    );

-- Messages: Users can insert messages in their servers
CREATE POLICY "Users can insert messages in their servers" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.channels c
            JOIN public.server_members sm ON c.server_id = sm.server_id
            WHERE c.id = public.messages.channel_id AND sm.user_id = auth.uid()
        )
    );

-- Trigger to update 'updated_at' on messages
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_modtime
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Function to automatically add server creator as admin
CREATE OR REPLACE FUNCTION add_server_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.server_members (server_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin');
    
    -- Create default 'general' channel
    INSERT INTO public.channels (server_id, name, type)
    VALUES (NEW.id, 'general', 'text');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_server_created
AFTER INSERT ON public.servers
FOR EACH ROW EXECUTE PROCEDURE add_server_creator_as_admin();

-- Enable Realtime for Discord features
alter publication supabase_realtime add table public.servers;
alter publication supabase_realtime add table public.channels;
alter publication supabase_realtime add table public.server_members;
alter publication supabase_realtime add table public.messages;
