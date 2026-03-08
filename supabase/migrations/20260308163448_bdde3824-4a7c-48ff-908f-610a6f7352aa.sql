
-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage config" ON public.admin_config;
DROP POLICY IF EXISTS "Anyone can read public config" ON public.admin_config;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can manage config"
  ON public.admin_config
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read public config"
  ON public.admin_config
  FOR SELECT
  TO authenticated
  USING (id IN ('app_theme', 'game_config', 'ad_settings'));
