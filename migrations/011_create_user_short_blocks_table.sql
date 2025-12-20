CREATE TABLE IF NOT EXISTS public.user_short_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_name text NOT NULL,
  engine_make text,
  engine_family text,
  displacement text,
  bore_stroke text,
  compression_ratio text,
  material text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_short_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own short blocks" ON public.user_short_blocks 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create short blocks" ON public.user_short_blocks 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own short blocks" ON public.user_short_blocks 
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own short blocks" ON public.user_short_blocks 
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_short_blocks_user_id ON public.user_short_blocks (user_id);
CREATE INDEX IF NOT EXISTS idx_user_short_blocks_created_at ON public.user_short_blocks (created_at DESC);
