-- Create user_engine_submissions table for complete engine builds
-- Requires dyno sheet and cam card uploads for approval
CREATE TABLE IF NOT EXISTS public.user_engine_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  short_block_id uuid NOT NULL REFERENCES public.user_short_blocks(id) ON DELETE CASCADE,
  head_id uuid REFERENCES public.cylinder_heads(id) ON DELETE SET NULL,
  cam_ids jsonb, -- Array of cam IDs from cse_generic_cams or cse_cam_submissions_table
  engine_name text NOT NULL,
  description text,
  dyno_sheet_path text NOT NULL,
  cam_card_path text,
  status text DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_engine_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow users to view own engine submissions" 
  ON public.user_engine_submissions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create engine submissions" 
  ON public.user_engine_submissions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own pending submissions" 
  ON public.user_engine_submissions 
  FOR DELETE 
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Allow admins to view all submissions"
  ON public.user_engine_submissions
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admins to update submissions"
  ON public.user_engine_submissions
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_engine_submissions_user_id 
  ON public.user_engine_submissions (user_id);

CREATE INDEX IF NOT EXISTS idx_user_engine_submissions_status 
  ON public.user_engine_submissions (status);

CREATE INDEX IF NOT EXISTS idx_user_engine_submissions_created_at 
  ON public.user_engine_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_engine_submissions_short_block_id 
  ON public.user_engine_submissions (short_block_id);
