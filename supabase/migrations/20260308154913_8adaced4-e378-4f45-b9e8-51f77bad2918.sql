-- Add action_url to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS action_url text DEFAULT NULL;

-- Create ads table
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  redirect_url text NOT NULL,
  placement text NOT NULL DEFAULT 'banner',
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on ads
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Admins can manage ads
CREATE POLICY "Admins can manage ads" ON public.ads
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active ads
CREATE POLICY "Anyone can view active ads" ON public.ads
  FOR SELECT TO authenticated
  USING (is_active = true AND (end_date IS NULL OR end_date > now()));