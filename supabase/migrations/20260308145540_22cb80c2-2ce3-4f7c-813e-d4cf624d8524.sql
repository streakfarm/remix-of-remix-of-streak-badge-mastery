
-- Grant permissions on profiles table
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Also grant on other tables that might need it
GRANT SELECT, INSERT, UPDATE ON public.user_roles TO authenticated;
GRANT SELECT ON public.user_roles TO anon;

GRANT SELECT, INSERT, UPDATE ON public.boxes TO authenticated;
GRANT SELECT, INSERT ON public.task_completions TO authenticated;
GRANT SELECT ON public.tasks TO authenticated;
GRANT SELECT ON public.tasks TO anon;
GRANT SELECT ON public.badges TO authenticated;
GRANT SELECT ON public.badges TO anon;
GRANT SELECT, INSERT, UPDATE ON public.user_badges TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leaderboards TO authenticated;
GRANT SELECT, INSERT ON public.points_ledger TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.referrals TO authenticated;
GRANT SELECT ON public.referral_tiers TO authenticated;
GRANT SELECT ON public.referral_tiers TO anon;
GRANT SELECT, INSERT, UPDATE ON public.seasonal_events TO authenticated;
GRANT SELECT ON public.seasonal_events TO anon;
GRANT SELECT, INSERT, UPDATE ON public.event_participations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.admin_config TO authenticated;
