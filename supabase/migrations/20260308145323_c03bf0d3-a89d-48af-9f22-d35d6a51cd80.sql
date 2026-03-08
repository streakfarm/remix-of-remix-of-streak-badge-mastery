
-- Fix: Drop and recreate the profile select policy for authenticated users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Fix: Drop and recreate insert policy for authenticated
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Fix: Drop and recreate update policy for authenticated
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Fix is_banned default
ALTER TABLE public.profiles ALTER COLUMN is_banned SET DEFAULT false;
UPDATE public.profiles SET is_banned = false WHERE is_banned IS NULL;
