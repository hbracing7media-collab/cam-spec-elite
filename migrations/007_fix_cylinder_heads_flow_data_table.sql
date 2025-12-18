-- Fix cylinder_heads_flow_data table: add DEFAULT to id column and ensure structure is correct
-- This migration will create the table if it doesn't exist or fix it if it does

-- First, check if table exists - if it does, we need to drop and recreate to fix the id column
-- Safely drop if exists (this will be idempotent)
DROP TABLE IF EXISTS public.cylinder_heads_flow_data CASCADE;

-- Create the table with proper defaults
CREATE TABLE public.cylinder_heads_flow_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  head_id UUID NOT NULL REFERENCES public.cylinder_heads(id) ON DELETE CASCADE,
  lift NUMERIC NOT NULL,
  intake_flow NUMERIC NOT NULL,
  exhaust_flow NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for queries by head_id
CREATE INDEX idx_cylinder_heads_flow_data_head_id ON public.cylinder_heads_flow_data (head_id);

-- Enable RLS
ALTER TABLE public.cylinder_heads_flow_data ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access to flow data for approved heads
CREATE POLICY "Public view flow data for approved heads" ON public.cylinder_heads_flow_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cylinder_heads 
      WHERE id = head_id AND status = 'approved'
    )
  );
