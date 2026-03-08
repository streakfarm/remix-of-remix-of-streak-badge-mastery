
-- Seasonal Events table
CREATE TABLE public.seasonal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_emoji text DEFAULT '🎉',
  event_type text NOT NULL DEFAULT 'seasonal',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  rewards jsonb DEFAULT '{}',
  bonus_multiplier numeric DEFAULT 1.0,
  is_active boolean DEFAULT true,
  max_participants integer,
  current_participants integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Event participation tracking
CREATE TABLE public.event_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.seasonal_events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  points_earned integer DEFAULT 0,
  tasks_completed integer DEFAULT 0,
  is_claimed boolean DEFAULT false,
  claimed_at timestamptz,
  UNIQUE(event_id, user_id)
);

-- Referral tiers
CREATE TABLE public.referral_tiers (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon_emoji text DEFAULT '🎯',
  min_referrals integer NOT NULL DEFAULT 0,
  bonus_points integer NOT NULL DEFAULT 0,
  multiplier_bonus numeric DEFAULT 0,
  badge_reward text REFERENCES public.badges(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seasonal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tiers ENABLE ROW LEVEL SECURITY;

-- Seasonal events: anyone can view active events
CREATE POLICY "Anyone can view active events"
ON public.seasonal_events FOR SELECT
TO authenticated
USING (is_active = true AND end_date > now());

CREATE POLICY "Admins can manage events"
ON public.seasonal_events FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Event participations
CREATE POLICY "Users can view their participations"
ON public.event_participations FOR SELECT
TO authenticated
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can join events"
ON public.event_participations FOR INSERT
TO authenticated
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their participations"
ON public.event_participations FOR UPDATE
TO authenticated
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage participations"
ON public.event_participations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Referral tiers: anyone can view
CREATE POLICY "Anyone can view referral tiers"
ON public.referral_tiers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage referral tiers"
ON public.referral_tiers FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Insert default referral tiers
INSERT INTO public.referral_tiers (id, name, icon_emoji, min_referrals, bonus_points, multiplier_bonus) VALUES
  ('tier_bronze', 'Bronze Referrer', '🥉', 3, 500, 0.05),
  ('tier_silver', 'Silver Referrer', '🥈', 10, 2000, 0.1),
  ('tier_gold', 'Gold Referrer', '🥇', 25, 5000, 0.2),
  ('tier_diamond', 'Diamond Referrer', '💎', 50, 15000, 0.5),
  ('tier_legend', 'Legendary Referrer', '👑', 100, 50000, 1.0);

-- Insert sample seasonal events
INSERT INTO public.seasonal_events (name, description, icon_emoji, event_type, start_date, end_date, rewards, bonus_multiplier) VALUES
  ('Launch Week', 'Celebrate the StreakFarm launch! Complete tasks for 2x points during this event.', '🚀', 'seasonal', now(), now() + interval '7 days', '{"bonus_points": 5000, "badge": "launch_pioneer"}', 2.0),
  ('Referral Rush', 'Invite friends and earn massive bonuses! Top referrers get exclusive badges.', '🎯', 'referral', now(), now() + interval '14 days', '{"bonus_points": 10000}', 1.5);
