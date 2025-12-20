-- Create user_cam_builds table to link 3 cams per short block
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

CREATE POLICY "Allow users to view own cam builds" ON public.user_cam_builds 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create cam builds" ON public.user_cam_builds 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own cam builds" ON public.user_cam_builds 
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own cam builds" ON public.user_cam_builds 
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_cam_builds_user_id ON public.user_cam_builds (user_id);
CREATE INDEX IF NOT EXISTS idx_user_cam_builds_short_block_id ON public.user_cam_builds (short_block_id);
