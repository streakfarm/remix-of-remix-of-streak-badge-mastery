
-- Drop the problematic policy that references auth.users
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.profiles;

-- Recreate without referencing auth.users table
CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (is_banned = false) AND (
    (user_id = auth.uid()) OR (auth.uid() IS NOT NULL)
  )
);
