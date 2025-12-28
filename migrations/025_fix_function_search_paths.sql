-- Migration: Fix Function Search Path Warnings
-- Sets search_path to explicit for security functions to prevent SQL injection

-- ========== FIX: Set search_path for functions ==========

-- Fix cse.uid function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'cse' AND routine_name = 'uid') THEN
    EXECUTE 'DROP FUNCTION IF EXISTS cse.uid() CASCADE';
  END IF;
  
  EXECUTE 'CREATE FUNCTION cse.uid() RETURNS uuid LANGUAGE sql STABLE SET search_path = public AS $inner$ SELECT auth.uid() $inner$';
  RAISE NOTICE 'Function cse.uid() recreated with search_path = public';
END $$;

-- Fix cse.is_paid function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'cse' AND routine_name = 'is_paid') THEN
    EXECUTE 'DROP FUNCTION IF EXISTS cse.is_paid() CASCADE';
  END IF;
  
  -- Note: requires public.subscriptions table to exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    EXECUTE 'CREATE FUNCTION cse.is_paid() RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $inner$ SELECT EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id = auth.uid() AND status = ''active'') $inner$';
    RAISE NOTICE 'Function cse.is_paid() recreated with search_path = public';
  ELSE
    RAISE NOTICE 'Skipping cse.is_paid() - public.subscriptions table does not exist';
  END IF;
END $$;

-- Fix cse.tier function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'cse' AND routine_name = 'tier') THEN
    EXECUTE 'DROP FUNCTION IF EXISTS cse.tier() CASCADE';
  END IF;
  
  -- Note: requires public.subscriptions table to exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    EXECUTE 'CREATE FUNCTION cse.tier() RETURNS text LANGUAGE sql STABLE SET search_path = public AS $inner$ SELECT subscription_type::text FROM public.subscriptions WHERE user_id = auth.uid() AND status = ''active'' LIMIT 1 $inner$';
    RAISE NOTICE 'Function cse.tier() recreated with search_path = public';
  ELSE
    RAISE NOTICE 'Skipping cse.tier() - public.subscriptions table does not exist';
  END IF;
END $$;

-- Fix cse.approve_storage_object function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'cse' AND routine_name = 'approve_storage_object') THEN
    EXECUTE 'DROP FUNCTION IF EXISTS cse.approve_storage_object(text) CASCADE';
  END IF;
  
  EXECUTE 'CREATE FUNCTION cse.approve_storage_object(object_path text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $inner$ BEGIN UPDATE storage.objects SET metadata = jsonb_set(metadata, ''{approved}'', ''true'') WHERE name = object_path; END; $inner$';
  RAISE NOTICE 'Function cse.approve_storage_object() recreated with search_path = public';
END $$;

-- Fix cse.storage_owner_folder function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'cse' AND routine_name = 'storage_owner_folder') THEN
    EXECUTE 'DROP FUNCTION IF EXISTS cse.storage_owner_folder() CASCADE';
  END IF;
  
  EXECUTE 'CREATE FUNCTION cse.storage_owner_folder() RETURNS text LANGUAGE sql STABLE SET search_path = public AS $inner$ SELECT auth.uid()::text $inner$';
  RAISE NOTICE 'Function cse.storage_owner_folder() recreated with search_path = public';
END $$;

-- Fix cse.list_pending_storage_uploads function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'cse' AND routine_name = 'list_pending_storage_uploads') THEN
    EXECUTE 'DROP FUNCTION IF EXISTS cse.list_pending_storage_uploads() CASCADE';
  END IF;
  
  EXECUTE 'CREATE FUNCTION cse.list_pending_storage_uploads() RETURNS TABLE(name text, created_at timestamp with time zone, metadata jsonb) LANGUAGE sql STABLE SET search_path = public AS $inner$ SELECT name, created_at, metadata FROM storage.objects WHERE owner_id = auth.uid()::text AND metadata::text ILIKE ''%pending%'' ORDER BY created_at DESC $inner$';
  RAISE NOTICE 'Function cse.list_pending_storage_uploads() recreated with search_path = public';
END $$;

-- Fix public.approve_storage_object function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'approve_storage_object') THEN
    EXECUTE 'DROP FUNCTION IF EXISTS public.approve_storage_object(text) CASCADE';
  END IF;
  
  EXECUTE 'CREATE FUNCTION public.approve_storage_object(object_path text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $inner$ BEGIN UPDATE storage.objects SET metadata = jsonb_set(metadata, ''{approved}'', ''true'') WHERE name = object_path; END; $inner$';
  RAISE NOTICE 'Function public.approve_storage_object() recreated with search_path = public';
END $$;

-- Fix public.list_pending_storage_uploads function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'list_pending_storage_uploads') THEN
    EXECUTE 'DROP FUNCTION IF EXISTS public.list_pending_storage_uploads() CASCADE';
  END IF;
  
  EXECUTE 'CREATE FUNCTION public.list_pending_storage_uploads() RETURNS TABLE(name text, created_at timestamp with time zone, metadata jsonb) LANGUAGE sql STABLE SET search_path = public AS $inner$ SELECT name, created_at, metadata FROM storage.objects WHERE owner_id = auth.uid()::text AND metadata::text ILIKE ''%pending%'' ORDER BY created_at DESC $inner$';
  RAISE NOTICE 'Function public.list_pending_storage_uploads() recreated with search_path = public';
END $$;

-- Fix public.update_dyno_submissions_updated_at function (from migration 021)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'update_dyno_submissions_updated_at') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS dyno_submissions_updated_at_trigger ON public.dyno_submissions CASCADE';
    EXECUTE 'DROP FUNCTION IF EXISTS public.update_dyno_submissions_updated_at() CASCADE';
  END IF;
  
  EXECUTE 'CREATE FUNCTION public.update_dyno_submissions_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $inner$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $inner$';
  
  EXECUTE 'CREATE TRIGGER dyno_submissions_updated_at_trigger BEFORE UPDATE ON public.dyno_submissions FOR EACH ROW EXECUTE FUNCTION public.update_dyno_submissions_updated_at()';
  
  RAISE NOTICE 'Function public.update_dyno_submissions_updated_at() recreated with search_path = public';
END $$;

-- ========== ABOUT LEAKED PASSWORD PROTECTION ==========
-- This is an Auth setting (not a database object)
-- To enable, go to: Supabase Dashboard → Authentication → Password Security
-- Toggle ON: "Leaked Password Protection"
-- Note: This checks against HaveIBeenPwned.org database
