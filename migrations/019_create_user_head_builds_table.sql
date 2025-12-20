-- Create user_head_builds table to link approved cylinder heads to short blocks
-- Similar to user_cam_builds but for cylinder heads
CREATE TABLE IF NOT EXISTS public.user_head_builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  short_block_id uuid NOT NULL REFERENCES public.user_short_blocks(id) ON DELETE CASCADE,
  head_id uuid NOT NULL REFERENCES public.cylinder_heads(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_head_builds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow users to view own head builds" 
  ON public.user_head_builds 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create head builds" 
  ON public.user_head_builds 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own head builds" 
  ON public.user_head_builds 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_head_builds_user_id 
  ON public.user_head_builds (user_id);

CREATE INDEX IF NOT EXISTS idx_user_head_builds_short_block_id 
  ON public.user_head_builds (short_block_id);

CREATE INDEX IF NOT EXISTS idx_user_head_builds_head_id 
  ON public.user_head_builds (head_id);
