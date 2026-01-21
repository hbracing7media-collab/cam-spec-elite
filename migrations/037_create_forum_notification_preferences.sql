-- Forum email notification preferences
-- Users can opt-in/out of email notifications when someone replies to threads they participate in

CREATE TABLE IF NOT EXISTS public.forum_notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_on_thread_reply boolean NOT NULL DEFAULT true,  -- Get emails when someone replies to a thread you started
  notify_on_post_reply boolean NOT NULL DEFAULT true,    -- Get emails when someone replies in a thread you've posted in
  notify_on_mention boolean NOT NULL DEFAULT true,       -- Get emails when someone mentions you (future feature)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own preferences
CREATE POLICY "Users can read own notification preferences"
  ON public.forum_notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
  ON public.forum_notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own preferences
CREATE POLICY "Users can update own notification preferences"
  ON public.forum_notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to read all preferences (needed for sending emails from server)
CREATE POLICY "Service role can read all notification preferences"
  ON public.forum_notification_preferences
  FOR SELECT
  USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_forum_notification_preferences_user 
  ON public.forum_notification_preferences (user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_forum_notification_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS forum_notification_preferences_updated_at ON public.forum_notification_preferences;
CREATE TRIGGER forum_notification_preferences_updated_at
  BEFORE UPDATE ON public.forum_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_notification_preferences_updated_at();

-- Insert default preferences for existing users who have posted in forums
INSERT INTO public.forum_notification_preferences (user_id)
SELECT DISTINCT user_id FROM public.forum_threads
WHERE user_id NOT IN (SELECT user_id FROM public.forum_notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.forum_notification_preferences (user_id)
SELECT DISTINCT user_id FROM public.forum_posts
WHERE user_id NOT IN (SELECT user_id FROM public.forum_notification_preferences)
ON CONFLICT (user_id) DO NOTHING;
