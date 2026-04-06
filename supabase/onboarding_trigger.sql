-- RUN THIS IN THE SUPABASE SQL EDITOR

-- 1. Create the function to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Essential for bypassing RLS during creation
SET search_path = public -- Ensures it targets the public schema
AS $$
BEGIN
  -- We extract metadata provided by OAuth (like Full Name and Avatar)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    student_id
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'student'), -- Default to student
    new.raw_user_meta_data->>'student_id' -- This will likely be NULL for Google users
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
