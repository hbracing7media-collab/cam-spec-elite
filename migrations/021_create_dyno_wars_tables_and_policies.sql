-- Create Dyno Wars Submissions Table
CREATE TABLE IF NOT EXISTS dyno_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  engine_name TEXT NOT NULL,
  engine_make TEXT,
  engine_family TEXT,
  horsepower DECIMAL(10, 2),
  torque DECIMAL(10, 2),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Full data stored as JSONB for flexibility
  spec JSONB, -- Contains: engine_specs, rpm_intervals, submitted_at
  
  -- Image storage paths
  dyno_run_image TEXT, -- Path to dyno run/graph image in storage
  cam_card_image TEXT, -- Path to cam card submission image in storage
  car_photo_image TEXT, -- Path to car photo in storage
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for common queries
  CONSTRAINT engine_name_not_empty CHECK (engine_name != '')
);

CREATE INDEX IF NOT EXISTS idx_dyno_submissions_user_id ON dyno_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_dyno_submissions_visibility ON dyno_submissions(visibility);
CREATE INDEX IF NOT EXISTS idx_dyno_submissions_status ON dyno_submissions(status);
CREATE INDEX IF NOT EXISTS idx_dyno_submissions_created_at ON dyno_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dyno_submissions_horsepower ON dyno_submissions(horsepower DESC);

-- Create Leaderboard View (Top 100 Public Submissions by Horsepower)
CREATE OR REPLACE VIEW dyno_leaderboard AS
SELECT 
  ds.id,
  ds.user_id,
  ds.engine_name,
  ds.engine_make,
  ds.engine_family,
  ds.horsepower,
  ds.torque,
  ds.created_at,
  up.forum_handle as username,
  RANK() OVER (ORDER BY ds.horsepower DESC) as rank
FROM dyno_submissions ds
LEFT JOIN user_profiles up ON ds.user_id = up.id
WHERE ds.visibility = 'public' 
  AND ds.status = 'approved'
ORDER BY ds.horsepower DESC;

-- Create User Dyno Stats View (aggregated data per user)
CREATE OR REPLACE VIEW user_dyno_stats AS
SELECT 
  ds.user_id,
  COUNT(*) as total_submissions,
  COUNT(CASE WHEN ds.visibility = 'public' THEN 1 END) as public_submissions,
  COUNT(CASE WHEN ds.visibility = 'private' THEN 1 END) as private_submissions,
  MAX(ds.horsepower) as max_horsepower,
  MAX(ds.torque) as max_torque,
  AVG(ds.horsepower) as avg_horsepower,
  AVG(ds.torque) as avg_torque,
  MAX(ds.created_at) as last_submission_date
FROM dyno_submissions ds
WHERE ds.status = 'approved'
GROUP BY ds.user_id;

-- Enable Row Level Security
ALTER TABLE dyno_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Dyno Submissions

-- Policy 1: Users can SELECT their own submissions (private or public)
CREATE POLICY "Users can view own submissions" ON dyno_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Anyone (including anonymous) can SELECT public approved submissions
CREATE POLICY "Public submissions visible to all" ON dyno_submissions
  FOR SELECT
  USING (visibility = 'public' AND status = 'approved');

-- Policy 3: Service Role (server-side) can SELECT all submissions
-- Note: Admin operations via service role key are handled server-side
CREATE POLICY "Service role can view all submissions" ON dyno_submissions
  FOR SELECT
  USING (true);

-- Policy 4: Authenticated users can INSERT new submissions
CREATE POLICY "Users can insert own submissions" ON dyno_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 5: Users can UPDATE their own pending/approved submissions
CREATE POLICY "Users can update own submissions" ON dyno_submissions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 6: Users can DELETE their own submissions (soft delete via status)
CREATE POLICY "Users can delete own submissions" ON dyno_submissions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy 7: Service role (server-side) handles admin operations
-- No client-side admin policies needed - all admin operations use service role key

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dyno_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS dyno_submissions_updated_at_trigger ON dyno_submissions;
CREATE TRIGGER dyno_submissions_updated_at_trigger
  BEFORE UPDATE ON dyno_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_dyno_submissions_updated_at();

-- Grant permissions
GRANT SELECT ON dyno_leaderboard TO anon, authenticated;
GRANT SELECT ON user_dyno_stats TO authenticated;
GRANT ALL ON dyno_submissions TO authenticated;

-- Storage buckets for dyno submission images
-- Note: Execute these via Supabase dashboard or CLI if not available via SQL:
-- supabase storage create-bucket dyno_runs --public
-- supabase storage create-bucket dyno_cam_cards --public
-- supabase storage create-bucket dyno_car_photos --public

