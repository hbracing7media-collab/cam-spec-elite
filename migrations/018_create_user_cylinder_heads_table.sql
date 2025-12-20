-- Create user_cylinder_heads table for user-owned cylinder head specifications
CREATE TABLE IF NOT EXISTS public.user_cylinder_heads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  head_name text NOT NULL,
  engine_make text,
  engine_family text,
  brand text,
  part_number text,
  intake_valve_size text,
  exhaust_valve_size text,
  max_lift text,
  max_rpm text,
  intake_runner_cc text,
  chamber_cc text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_cylinder_heads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow users to view own cylinder heads" 
  ON public.user_cylinder_heads 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create cylinder heads" 
  ON public.user_cylinder_heads 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own cylinder heads" 
  ON public.user_cylinder_heads 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own cylinder heads" 
  ON public.user_cylinder_heads 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_cylinder_heads_user_id 
  ON public.user_cylinder_heads (user_id);

CREATE INDEX IF NOT EXISTS idx_user_cylinder_heads_created_at 
  ON public.user_cylinder_heads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_cylinder_heads_make_family 
  ON public.user_cylinder_heads (engine_make, engine_family);
