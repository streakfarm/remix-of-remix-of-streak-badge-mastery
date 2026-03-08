INSERT INTO public.tasks (id, title, description, icon_emoji, task_type, points_reward, is_repeatable, repeat_interval_hours, max_completions, status, sort_order)
VALUES ('watch-ad', 'Watch Ad', 'Watch an ad to earn bonus points', '📺', 'daily', 50, true, NULL, NULL, 'active', 100)
ON CONFLICT (id) DO NOTHING;