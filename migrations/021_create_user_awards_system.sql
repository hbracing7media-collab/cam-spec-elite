-- Migration: Create user awards system
-- Allows users to earn appreciation awards for contributions (camshaft/cylinder head submissions)
-- Awards can be tagged in forum posts as status tokens

-- Create award types enum-like table
CREATE TABLE IF NOT EXISTS public.award_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon_emoji text,
  icon_path text,
  badge_color text DEFAULT '#4CAF50',
  rarity text DEFAULT 'common',
  grant_mode text DEFAULT 'automatic',
  award_type text DEFAULT 'achievement',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert initial award types
INSERT INTO public.award_types (slug, name, description, icon_emoji, icon_path, badge_color, rarity, grant_mode, award_type)
VALUES 
  ('camshaft_contributor', 'Cam Contributor', 'Earned for submitting a camshaft specification', '🏎️', '/tokens/cam_contributor.png', '#FF6B6B', 'common', 'automatic', 'submission'),
  ('cylinder_head_contributor', 'Head Contributor', 'Earned for submitting a cylinder head specification', '🔧', '/tokens/head_contributor.png', '#4ECDC4', 'common', 'automatic', 'submission'),
  ('dyno_king', 'Dyno King', 'Earned for exceptional dyno sheet submissions', '🏆', '/tokens/dyno_king.png', '#FFD700', 'rare', 'automatic', 'submission'),
  ('submission_streak', 'Submission Streak', 'Earned for consecutive approved submissions', '🔥', '/tokens/submission_streak.png', '#FF00FF', 'epic', 'automatic', 'achievement'),
  ('car_guru', 'Car Guru', 'Earned for high forum engagement and reputation', '🧠', '/tokens/car_guru.png', '#00D9FF', 'epic', 'automatic', 'forum'),
  ('admin_award', 'Admin Award', 'Manually granted by administrators', '👑', '/tokens/admin_award.png', '#FFD700', 'legendary', 'manual', 'special')
ON CONFLICT (slug) DO NOTHING;

-- Create user awards junction table
CREATE TABLE IF NOT EXISTS public.user_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  award_type_id uuid NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  submission_id uuid,
  submission_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_award_type_id FOREIGN KEY (award_type_id) REFERENCES public.award_types(id) ON DELETE CASCADE,
  UNIQUE (user_id, award_type_id, submission_id)
);

-- Create award usage in forum posts (track which awards are tagged in each post)
CREATE TABLE IF NOT EXISTS public.forum_post_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_award_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_post_id FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_award_id FOREIGN KEY (user_award_id) REFERENCES public.user_awards(id) ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE public.award_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_post_awards ENABLE ROW LEVEL SECURITY;

-- Award types are publicly readable
CREATE POLICY "Allow public read access to award_types" ON public.award_types FOR SELECT USING (true);

-- User awards are publicly readable (to show contributions)
CREATE POLICY "Allow public read access to user_awards" ON public.user_awards FOR SELECT USING (true);

-- Users can only insert awards for themselves (via server-side logic)
CREATE POLICY "Allow authenticated users to view own awards" ON public.user_awards 
  FOR SELECT 
  USING (auth.uid() = user_id OR true);

-- Forum post awards are publicly readable
CREATE POLICY "Allow public read access to forum_post_awards" ON public.forum_post_awards FOR SELECT USING (true);

-- Users can tag awards in their own forum posts
CREATE POLICY "Allow users to tag awards in own posts" ON public.forum_post_awards 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forum_posts 
      WHERE id = post_id AND user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_awards_user_id ON public.user_awards (user_id);
CREATE INDEX IF NOT EXISTS idx_user_awards_award_type_id ON public.user_awards (award_type_id);
CREATE INDEX IF NOT EXISTS idx_user_awards_submission_id ON public.user_awards (submission_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_awards_post_id ON public.forum_post_awards (post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_awards_user_award_id ON public.forum_post_awards (user_award_id);
