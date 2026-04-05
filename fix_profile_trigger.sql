-- Manual Profile Creation Script
-- Run this in Supabase SQL Editor if signup doesn't create profiles automatically

-- Step 1: Check existing users and their profiles
SELECT 
  au.id,
  au.email,
  au.created_at,
  p.full_name,
  p.role,
  CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'OK' END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- Step 2: Drop and recreate the trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_role TEXT;
  user_student_id TEXT;
BEGIN
  -- Extract metadata with fallbacks
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'User'
  );
  
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'student'
  );
  
  user_student_id := NEW.raw_user_meta_data->>'student_id';
  
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, role, student_id)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_role,
    user_student_id
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the user creation
    RAISE NOTICE 'Error creating profile for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Fix any missing profiles for existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO profiles (id, email, full_name, role, student_id)
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'full_name', split_part(user_record.email, '@', 1)),
      COALESCE(user_record.raw_user_meta_data->>'role', 'student'),
      user_record.raw_user_meta_data->>'student_id'
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created profile for: %', user_record.email;
  END LOOP;
END $$;

-- Step 4: Verify all users now have profiles
SELECT 
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profiles,
  COUNT(*) - COUNT(p.id) as missing_profiles
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id;
