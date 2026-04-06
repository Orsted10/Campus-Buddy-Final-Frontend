-- THE ABSOLUTE PERMISSION & DELETION FIX
-- Copy and Run this in your Supabase SQL Editor

-- 1. Create a "Security Definer" function for wiping DB data
CREATE OR REPLACE FUNCTION delete_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as admin to bypass RLS
AS $$
BEGIN
  DELETE FROM notifications WHERE user_id = auth.uid();
  DELETE FROM portal_records WHERE user_id = auth.uid();
  DELETE FROM hostel_requests WHERE user_id = auth.uid();
  DELETE FROM laundry_bookings WHERE user_id = auth.uid();
  DELETE FROM book_reservations WHERE user_id = auth.uid();
  DELETE FROM assignments WHERE user_id = auth.uid();
  DELETE FROM messages WHERE chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid());
  DELETE FROM chats WHERE user_id = auth.uid();
  DELETE FROM visitor_passes WHERE student_id = auth.uid();
  DELETE FROM profiles WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION delete_user_data TO authenticated;

-- 2. ENABLE RLS & FIX "PERMISSION DENIED" ON DASHBOARD
-- This ensures the 'authenticated' role can see their own notifications/data
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'notifications', 'portal_records', 'hostel_requests', 'laundry_bookings', 'assignments', 'chats', 'messages', 'visitor_passes')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated Manage Own" ON %I', t);
        
        -- Use specific column names based on the table
        IF t = 'profiles' THEN
            EXECUTE format('CREATE POLICY "Authenticated Manage Own" ON %I FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)', t);
        ELSIF t = 'visitor_passes' THEN
            EXECUTE format('CREATE POLICY "Authenticated Manage Own" ON %I FOR ALL TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id)', t);
        ELSIF t = 'messages' THEN
             EXECUTE format('CREATE POLICY "Authenticated Manage Own" ON %I FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid()))', t);
        ELSE
            EXECUTE format('CREATE POLICY "Authenticated Manage Own" ON %I FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
        END IF;
    END LOOP;
END $$;
