-- ============================================================================
-- CRITICAL: Run these migrations in Supabase SQL Editor
-- These tables are required for cam builds, head builds, and engine submissions
-- ============================================================================

-- MIGRATION 1: Create user_cam_builds table
-- This table links up to 3 cams per short block
CREATE TABLE IF NOT EXISTS public.user_cam_builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  short_block_id uuid NOT NULL REFERENCES public.user_short_blocks(id) ON DELETE CASCADE,
  cam1_id uuid REFERENCES public.cse_cam_submissions_table(id) ON DELETE SET NULL,
  cam2_id uuid REFERENCES public.cse_cam_submissions_table(id) ON DELETE SET NULL,
  cam3_id uuid REFERENCES public.cse_cam_submissions_table(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_cam_builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow users to view own cam builds" ON public.user_cam_builds 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Allow users to create cam builds" ON public.user_cam_builds 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Allow users to update own cam builds" ON public.user_cam_builds 
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Allow users to delete own cam builds" ON public.user_cam_builds 
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_cam_builds_user_id ON public.user_cam_builds (user_id);
CREATE INDEX IF NOT EXISTS idx_user_cam_builds_short_block_id ON public.user_cam_builds (short_block_id);

-- ============================================================================

-- MIGRATION 2: Create user_head_builds table
-- This table links approved cylinder heads to short blocks
CREATE TABLE IF NOT EXISTS public.user_head_builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  short_block_id uuid NOT NULL REFERENCES public.user_short_blocks(id) ON DELETE CASCADE,
  head_id uuid NOT NULL REFERENCES public.cylinder_heads(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_head_builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow users to view own head builds" 
  ON public.user_head_builds 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Allow users to create head builds" 
  ON public.user_head_builds 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Allow users to delete own head builds" 
  ON public.user_head_builds 
  FOR DELETE 
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_head_builds_user_id 
  ON public.user_head_builds (user_id);

CREATE INDEX IF NOT EXISTS idx_user_head_builds_short_block_id 
  ON public.user_head_builds (short_block_id);

CREATE INDEX IF NOT EXISTS idx_user_head_builds_head_id 
  ON public.user_head_builds (head_id);

-- ============================================================================

-- MIGRATION 3: Create user_engine_submissions table
-- For complete engine builds with dyno sheets and cam cards
CREATE TABLE IF NOT EXISTS public.user_engine_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  short_block_id uuid NOT NULL REFERENCES public.user_short_blocks(id) ON DELETE CASCADE,
  head_id uuid REFERENCES public.cylinder_heads(id) ON DELETE SET NULL,
  cam_ids jsonb,
  engine_name text NOT NULL,
  description text,
  dyno_sheet_path text NOT NULL,
  cam_card_path text,
  status text DEFAULT 'pending',
  rejection_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_engine_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow users to view own engine submissions" 
  ON public.user_engine_submissions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Allow users to create engine submissions" 
  ON public.user_engine_submissions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Allow users to delete own pending submissions" 
  ON public.user_engine_submissions 
  FOR DELETE 
  USING (auth.uid() = user_id AND status = 'pending');

CREATE INDEX IF NOT EXISTS idx_user_engine_submissions_user_id 
  ON public.user_engine_submissions (user_id);

CREATE INDEX IF NOT EXISTS idx_user_engine_submissions_status 
  ON public.user_engine_submissions (status);

CREATE INDEX IF NOT EXISTS idx_user_engine_submissions_created_at 
  ON public.user_engine_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_engine_submissions_short_block_id 
  ON public.user_engine_submissions (short_block_id);

-- ============================================================================
-- All three tables are now ready. Your profile features should work!
-- ============================================================================
