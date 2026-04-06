-- Enabling Row Level Security (RLS) for all user-related tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE laundry_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_passes ENABLE ROW LEVEL SECURITY;

-- Creating SELECT policies (Allow users to read their own data)
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own portal_records" ON portal_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own hostel_requests" ON hostel_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own laundry_bookings" ON laundry_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own assignments" ON assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own chats" ON chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own visitor_passes" ON visitor_passes FOR SELECT USING (auth.uid() = student_id);

-- Creating DELETE policies (Essential for Account Wiping)
CREATE POLICY "Users can delete their own profile" ON profiles FOR DELETE USING (auth.uid() = id);
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own portal_records" ON portal_records FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own hostel_requests" ON hostel_requests FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own laundry_bookings" ON laundry_bookings FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assignments" ON assignments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chats" ON chats FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own visitor_passes" ON visitor_passes FOR DELETE USING (auth.uid() = student_id);

-- Special Logic for Messages (since they lack user_id)
-- We allow deletion if the message's chat belongs to the user
CREATE POLICY "Users can delete messages in their own chats" 
ON messages FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM chats 
    WHERE chats.id = messages.chat_id 
    AND chats.user_id = auth.uid()
  )
);
