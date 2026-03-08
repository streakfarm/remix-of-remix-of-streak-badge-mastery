-- Allow all authenticated users to read specific public config keys (theme, etc.)
CREATE POLICY "Anyone can read public config"
  ON public.admin_config
  FOR SELECT
  TO authenticated
  USING (id IN ('app_theme', 'game_config', 'ad_settings'));