-- ========================================================
-- AI CHAT SCHEMA FIX
-- ========================================================

-- We are creating isolated tables for the AI chatbot so they don't collide 
-- with the Discord Social Hub's "messages" table!

CREATE TABLE IF NOT EXISTS public.ai_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES public.ai_chats(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI chats" ON public.ai_chats
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI messages" ON public.ai_messages
    USING (
        EXISTS (SELECT 1 FROM public.ai_chats c WHERE c.id = public.ai_messages.chat_id AND c.user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.ai_chats c WHERE c.id = public.ai_messages.chat_id AND c.user_id = auth.uid())
    );
