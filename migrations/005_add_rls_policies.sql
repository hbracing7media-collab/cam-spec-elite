-- RLS Policies for deployment
-- This migration adds Row Level Security policies for cam submissions and cylinder heads

-- ========== CAM SUBMISSIONS ==========
ALTER TABLE public.cse_cam_submissions_table ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can see approved cams
CREATE POLICY "Public view approved cams" ON public.cse_cam_submissions_table
  FOR SELECT USING (status = 'approved');

-- Policy: Users can see their own pending submissions
CREATE POLICY "Users view own pending submissions" ON public.cse_cam_submissions_table
  FOR SELECT USING (auth.uid()::text = user_id OR status = 'approved');

-- Policy: Authenticated users can create cam submissions
CREATE POLICY "Users create cam submissions" ON public.cse_cam_submissions_table
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- ========== CYLINDER HEADS ==========
ALTER TABLE public.cylinder_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cylinder_heads_flow_data ENABLE ROW LEVEL SECURITY;

-- Cylinder Heads: Public read access to approved heads only
CREATE POLICY "Public view approved heads" ON public.cylinder_heads
  FOR SELECT USING (status = 'approved');

-- Cylinder Heads: Users can see their own pending submissions
CREATE POLICY "Users view own pending heads" ON public.cylinder_heads
  FOR SELECT USING (auth.uid()::text = created_by OR status = 'approved');

-- Flow Data: Public read access (linked to approved heads)
CREATE POLICY "Public view flow data for approved heads" ON public.cylinder_heads_flow_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cylinder_heads 
      WHERE id = head_id AND status = 'approved'
    )
  );

-- ========== ADMIN ACCESS ==========
-- Create a function to check if user is admin (assumes admin flag in user metadata)
-- Admins need full access to both tables for approval workflow

-- For service role / admin endpoints: These queries use service_role key which bypasses RLS
-- The API endpoints handle admin authorization via the service_role key

-- Storage bucket policies (if using Supabase Storage for files)
-- Note: Storage has its own policy system, not RLS

-- ========== INDEXES FOR PERFORMANCE ==========
-- Ensure critical indexes exist for filtered queries
CREATE INDEX IF NOT EXISTS idx_cse_cam_status ON public.cse_cam_submissions_table (status);
CREATE INDEX IF NOT EXISTS idx_cylinder_heads_status ON public.cylinder_heads (status);
CREATE INDEX IF NOT EXISTS idx_cylinder_heads_created_by ON public.cylinder_heads (created_by);
CREATE INDEX IF NOT EXISTS idx_cylinder_heads_flow_data_head_id ON public.cylinder_heads_flow_data (head_id);
