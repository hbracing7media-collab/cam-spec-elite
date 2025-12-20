-- Complete SQL to create user_short_blocks table with current schema
-- This includes all fields after all migrations applied

CREATE TABLE IF NOT EXISTS public.user_short_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_name text NOT NULL,
  engine_make text,
  engine_family text,
  displacement text,
  bore text,
  stroke text,
  deck_height text,
  piston_dome_dish text,
  head_gasket_bore text,
  head_gasket_compressed_thickness text,
  rod_length text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_short_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow users to view only their own short blocks
CREATE POLICY "Allow users to view own short blocks" 
  ON public.user_short_blocks 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to create short blocks for themselves
CREATE POLICY "Allow users to create short blocks" 
  ON public.user_short_blocks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own short blocks
CREATE POLICY "Allow users to update own short blocks" 
  ON public.user_short_blocks 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete only their own short blocks
CREATE POLICY "Allow users to delete own short blocks" 
  ON public.user_short_blocks 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_short_blocks_user_id 
  ON public.user_short_blocks (user_id);

CREATE INDEX IF NOT EXISTS idx_user_short_blocks_created_at 
  ON public.user_short_blocks (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_short_blocks_make_family 
  ON public.user_short_blocks (engine_make, engine_family);
