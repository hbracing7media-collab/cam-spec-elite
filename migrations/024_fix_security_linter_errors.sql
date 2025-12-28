-- Migration: Fix Supabase Security Linter Errors
-- Fixes:
-- 1. Remove SECURITY DEFINER from public.cse_cam_submissions view
-- 2. Enable RLS on public.cylinder_heads_submissions_table

-- ========== FIX 1: Drop and recreate cse_cam_submissions view without SECURITY DEFINER ==========
DROP VIEW IF EXISTS public.cse_cam_submissions CASCADE;

CREATE VIEW public.cse_cam_submissions AS
SELECT 
  c.id,
  c.user_id,
  c.brand,
  c.cam_name,
  c.part_number,
  c.engine_make,
  c.engine_family,
  c.status,
  c.created_at
FROM public.cse_cam_submissions_table c;

-- ========== FIX 2: Enable RLS on cylinder_heads_submissions_table ==========
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cylinder_heads_submissions_table') THEN
    ALTER TABLE public.cylinder_heads_submissions_table ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on public.cylinder_heads_submissions_table';
  END IF;
END $$;

-- ========== Grant permissions on views ==========
GRANT SELECT ON public.cse_cam_submissions TO anon, authenticated;
