-- Run this in your Supabase SQL Editor to fix the 403 Error
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_config TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read config" ON public.app_config;
CREATE POLICY "Anyone can read config" ON public.app_config FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Only authenticated users can update config" ON public.app_config;
CREATE POLICY "Only authenticated users can update config" ON public.app_config FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Only authenticated users can insert config" ON public.app_config;
CREATE POLICY "Only authenticated users can insert config" ON public.app_config FOR INSERT TO anon, authenticated WITH CHECK (true);
