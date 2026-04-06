-- TRIPLE-STRENGTH PERMISSION FIX
-- Run this in your Supabase SQL Editor to enable self-deletion bypassing RLS

-- 1. Create a "Security Definer" function (This runs as an admin)
CREATE OR REPLACE FUNCTION delete_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS!
AS $$
BEGIN
  -- Delete from all tables based on the calling user's ID
  -- We use auth.uid() inside the function to ensure users can only delete THEMSELVES
  
  DELETE FROM notifications WHERE user_id = auth.uid();
  DELETE FROM portal_records WHERE user_id = auth.uid();
  DELETE FROM hostel_requests WHERE user_id = auth.uid();
  DELETE FROM laundry_bookings WHERE user_id = auth.uid();
  DELETE FROM book_reservations WHERE user_id = auth.uid();
  DELETE FROM assignments WHERE user_id = auth.uid();
  DELETE FROM messages WHERE chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid());
  DELETE FROM chats WHERE user_id = auth.uid();
  DELETE FROM visitor_passes WHERE student_id = auth.uid();
  
  -- Finally delete the profile
  DELETE FROM profiles WHERE id = auth.uid();
END;
$$;

-- 2. Ensure users have permission to call this function
GRANT EXECUTE ON FUNCTION delete_user_data TO authenticated;

-- 3. Also grant SELECT on notifications so the dashboard works
-- If you are still seeing 'permission denied' on dashboard, run this too:
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
