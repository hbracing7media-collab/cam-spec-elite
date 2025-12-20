-- Migration: Disable RLS on cse_generic_cams (public catalog)
-- The cse_generic_cams table is a public catalog that doesn't require row-level security
-- RLS was silently blocking inserts beyond 100 records

ALTER TABLE public.cse_generic_cams DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
-- SELECT * FROM pg_policies WHERE tablename = 'cse_generic_cams';
