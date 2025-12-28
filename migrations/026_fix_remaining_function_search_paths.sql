-- Migration: Fix Remaining Function Search Path Warnings
-- Fixes all 6 remaining function_search_path_mutable warnings

-- Fix cse.is_paid function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'cse' AND routine_name = 'is_paid') THEN
    DROP FUNCTION IF EXISTS cse.is_paid() CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    EXECUTE 'CREATE FUNCTION cse.is_paid() RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $body$ SELECT EXISTS(SELECT 1 FROM subscriptions WHERE user_id = auth.uid() AND status = ''active'') $body$';
    RAISE NOTICE 'Function cse.is_paid() fixed with search_path = public';
  END IF;
END $$;

-- Fix cse.tier function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'cse' AND routine_name = 'tier') THEN
    DROP FUNCTION IF EXISTS cse.tier() CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    EXECUTE 'CREATE FUNCTION cse.tier() RETURNS text LANGUAGE sql STABLE SET search_path = public AS $body$ SELECT subscription_type::text FROM subscriptions WHERE user_id = auth.uid() AND status = ''active'' LIMIT 1 $body$';
    RAISE NOTICE 'Function cse.tier() fixed with search_path = public';
  END IF;
END $$;

-- Fix cse.approve_storage_object function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'cse' AND routine_name = 'approve_storage_object') THEN
    DROP FUNCTION IF EXISTS cse.approve_storage_object(text) CASCADE;
  END IF;
  
  EXECUTE 'CREATE FUNCTION cse.approve_storage_object(object_path text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $body$ BEGIN UPDATE storage.objects SET metadata = jsonb_set(metadata, ''{approved}'', ''true'') WHERE name = object_path; END $body$';
  RAISE NOTICE 'Function cse.approve_storage_object() fixed with search_path = public';
END $$;

-- Fix cse.storage_owner_folder function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'cse' AND routine_name = 'storage_owner_folder') THEN
    DROP FUNCTION IF EXISTS cse.storage_owner_folder() CASCADE;
  END IF;
  
  EXECUTE 'CREATE FUNCTION cse.storage_owner_folder() RETURNS text LANGUAGE sql STABLE SET search_path = public AS $body$ SELECT auth.uid()::text $body$';
  RAISE NOTICE 'Function cse.storage_owner_folder() fixed with search_path = public';
END $$;

-- Fix public.approve_storage_object function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'approve_storage_object') THEN
    DROP FUNCTION IF EXISTS public.approve_storage_object(text) CASCADE;
  END IF;
  
  EXECUTE 'CREATE FUNCTION public.approve_storage_object(object_path text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $body$ BEGIN UPDATE storage.objects SET metadata = jsonb_set(metadata, ''{approved}'', ''true'') WHERE name = object_path; END $body$';
  RAISE NOTICE 'Function public.approve_storage_object() fixed with search_path = public';
END $$;

-- Fix public.cse_touch_updated_at function (or update_dyno_submissions_updated_at)
DO $$
BEGIN
  -- Drop old name if it exists
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'cse_touch_updated_at') THEN
    DROP FUNCTION IF EXISTS public.cse_touch_updated_at() CASCADE;
  END IF;
  
  -- Handle dyno submissions trigger function
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dyno_submissions') THEN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'update_dyno_submissions_updated_at') THEN
      DROP TRIGGER IF EXISTS dyno_submissions_updated_at_trigger ON public.dyno_submissions CASCADE;
      DROP FUNCTION IF EXISTS public.update_dyno_submissions_updated_at() CASCADE;
    END IF;
    
    EXECUTE 'CREATE FUNCTION public.update_dyno_submissions_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $body$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END $body$';
    EXECUTE 'CREATE TRIGGER dyno_submissions_updated_at_trigger BEFORE UPDATE ON public.dyno_submissions FOR EACH ROW EXECUTE FUNCTION public.update_dyno_submissions_updated_at()';
    RAISE NOTICE 'Function public.update_dyno_submissions_updated_at() fixed with search_path = public';
  END IF;
END $$;

-- ========== ABOUT LEAKED PASSWORD PROTECTION ==========
-- This is an Auth setting (not a database migration)
-- To enable, go to: Supabase Dashboard → Authentication → Password Security
-- Toggle ON: "Leaked Password Protection"
