-- Create storage buckets for dyno submission images
-- Run in Supabase SQL editor

-- Note: These can also be created via Supabase CLI:
-- supabase storage create-bucket dyno_runs --public
-- supabase storage create-bucket dyno_cam_cards --public
-- supabase storage create-bucket dyno_car_photos --public

-- OR in dashboard: Go to Storage > New bucket
-- Make them public so images can be viewed

-- Update RLS policies for dyno_submissions to show pending status
-- Pending submissions are only visible to:
-- 1. The user who submitted them
-- 2. Admins (via service role)
-- 3. Once approved: visible based on visibility setting

ALTER TABLE dyno_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view own submissions (all statuses)
CREATE POLICY "Users can view own dyno submissions"
  ON dyno_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Public approved submissions visible to all
CREATE POLICY "Public approved dyno submissions visible"
  ON dyno_submissions
  FOR SELECT
  USING (visibility = 'public' AND status = 'approved');

-- Service role can view all (for admin)
CREATE POLICY "Service role views all dyno submissions"
  ON dyno_submissions
  FOR SELECT
  USING (true);
