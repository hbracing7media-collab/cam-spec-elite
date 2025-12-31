-- Migration: Fix function search_path warnings using ALTER FUNCTION
-- Uses dynamic SQL to find and fix functions regardless of their exact signature

-- Fix all flagged functions in cse and public schemas
DO $$
DECLARE
  func_oid oid;
  func_name text;
  func_sig text;
BEGIN
  -- Fix all functions in cse schema that need search_path
  FOR func_oid, func_name IN 
    SELECT p.oid, p.proname 
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'cse' 
    AND p.proname IN ('approve_storage_object', 'is_paid', 'tier', 'storage_owner_folder')
  LOOP
    func_sig := func_oid::regprocedure::text;
    EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', func_sig);
    RAISE NOTICE 'Fixed % search_path', func_sig;
  END LOOP;
  
  -- Fix public.approve_storage_object
  FOR func_oid, func_name IN 
    SELECT p.oid, p.proname 
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' 
    AND p.proname = 'approve_storage_object'
  LOOP
    func_sig := func_oid::regprocedure::text;
    EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', func_sig);
    RAISE NOTICE 'Fixed % search_path', func_sig;
  END LOOP;
END $$;

-- Fix SECURITY DEFINER view: recreate cse_cam_submissions without it
DROP VIEW IF EXISTS public.cse_cam_submissions CASCADE;

CREATE VIEW public.cse_cam_submissions 
WITH (security_invoker = true)
AS
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

GRANT SELECT ON public.cse_cam_submissions TO anon, authenticated;

-- Fix RLS enabled but no policies on cylinder_heads_submissions_table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cylinder_heads_submissions_table') THEN
    -- Public can view approved submissions
    DROP POLICY IF EXISTS "Public view approved heads" ON public.cylinder_heads_submissions_table;
    CREATE POLICY "Public view approved heads" ON public.cylinder_heads_submissions_table
      FOR SELECT USING (status = 'approved');
    
    -- Users can view their own pending submissions
    DROP POLICY IF EXISTS "Users view own pending submissions" ON public.cylinder_heads_submissions_table;
    CREATE POLICY "Users view own pending submissions" ON public.cylinder_heads_submissions_table
      FOR SELECT USING (auth.uid()::text = user_id);
    
    -- Users can create submissions
    DROP POLICY IF EXISTS "Users create head submissions" ON public.cylinder_heads_submissions_table;
    CREATE POLICY "Users create head submissions" ON public.cylinder_heads_submissions_table
      FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    
    RAISE NOTICE 'Added RLS policies to cylinder_heads_submissions_table';
  END IF;
END $$;
