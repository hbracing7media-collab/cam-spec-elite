-- Cylinder Heads Submissions Table
CREATE TABLE IF NOT EXISTS cylinder_heads_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  part_number TEXT NOT NULL,
  engine_make TEXT NOT NULL,
  engine_family TEXT NOT NULL,
  intake_valve_size TEXT NOT NULL,
  exhaust_valve_size TEXT NOT NULL,
  max_lift TEXT NOT NULL,
  max_rpm TEXT NOT NULL,
  intake_runner_cc TEXT NOT NULL,
  chamber_cc TEXT NOT NULL,
  flow_data JSONB NOT NULL, -- Array of {lift, intakeFlow, exhaustFlow}
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cylinder Heads Images Table
CREATE TABLE IF NOT EXISTS cylinder_heads_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES cylinder_heads_submissions(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Approved Cylinder Heads Table (denormalized for fast access)
CREATE TABLE IF NOT EXISTS cylinder_heads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES cylinder_heads_submissions(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  part_number TEXT NOT NULL,
  engine_make TEXT NOT NULL,
  engine_family TEXT NOT NULL,
  intake_valve_size TEXT NOT NULL,
  exhaust_valve_size TEXT NOT NULL,
  max_lift TEXT NOT NULL,
  max_rpm TEXT NOT NULL,
  intake_runner_cc TEXT NOT NULL,
  chamber_cc TEXT NOT NULL,
  flow_data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_cylinder_heads_submissions_user_id ON cylinder_heads_submissions(user_id);
CREATE INDEX idx_cylinder_heads_submissions_status ON cylinder_heads_submissions(status);
CREATE INDEX idx_cylinder_heads_images_submission_id ON cylinder_heads_images(submission_id);
CREATE INDEX idx_cylinder_heads_engine_make ON cylinder_heads(engine_make);
CREATE INDEX idx_cylinder_heads_engine_family ON cylinder_heads(engine_family);

-- RLS Policies
ALTER TABLE cylinder_heads_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cylinder_heads_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE cylinder_heads ENABLE ROW LEVEL SECURITY;

-- Submissions: Users can view/create their own, public can see approved
CREATE POLICY "Users can view own submissions" ON cylinder_heads_submissions
  FOR SELECT USING (auth.uid() = user_id OR status = 'approved');

CREATE POLICY "Users can create submissions" ON cylinder_heads_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Images: Public read access to approved submissions
CREATE POLICY "Public can view images of approved heads" ON cylinder_heads_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cylinder_heads_submissions 
      WHERE id = submission_id AND status = 'approved'
    )
  );

-- Approved heads: Public read-only
CREATE POLICY "Public read access to approved cylinder heads" ON cylinder_heads
  FOR SELECT USING (true);
