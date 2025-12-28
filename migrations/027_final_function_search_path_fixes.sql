-- Migration: Final Function Search Path Fixes
-- Direct function recreation without EXECUTE for proper SET search_path parsing

-- Fix cse.is_paid (only if subscriptions table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    DROP FUNCTION IF EXISTS cse.is_paid() CASCADE;
    EXECUTE 'CREATE FUNCTION cse.is_paid() RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $body$ SELECT EXISTS(SELECT 1 FROM subscriptions WHERE user_id = auth.uid() AND status = ''active'') $body$';
  ELSE
    DROP FUNCTION IF EXISTS cse.is_paid() CASCADE;
  END IF;
END $$;

-- Fix cse.tier (only if subscriptions table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    DROP FUNCTION IF EXISTS cse.tier() CASCADE;
    EXECUTE 'CREATE FUNCTION cse.tier() RETURNS text LANGUAGE sql STABLE SET search_path = public AS $body$ SELECT subscription_type::text FROM subscriptions WHERE user_id = auth.uid() AND status = ''active'' LIMIT 1 $body$';
  ELSE
    DROP FUNCTION IF EXISTS cse.tier() CASCADE;
  END IF;
END $$;

-- Fix cse.approve_storage_object
DROP FUNCTION IF EXISTS cse.approve_storage_object(text) CASCADE;
CREATE FUNCTION cse.approve_storage_object(object_path text) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE storage.objects SET metadata = jsonb_set(metadata, '{approved}', 'true') WHERE name = object_path;
END;
$$;

-- Fix cse.storage_owner_folder
DROP FUNCTION IF EXISTS cse.storage_owner_folder() CASCADE;
CREATE FUNCTION cse.storage_owner_folder() RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT auth.uid()::text
$$;

-- Fix public.approve_storage_object
DROP FUNCTION IF EXISTS public.approve_storage_object(text) CASCADE;
CREATE FUNCTION public.approve_storage_object(object_path text) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE storage.objects SET metadata = jsonb_set(metadata, '{approved}', 'true') WHERE name = object_path;
END;
$$;

-- Fix public.update_dyno_submissions_updated_at (trigger function)
DROP TRIGGER IF EXISTS dyno_submissions_updated_at_trigger ON public.dyno_submissions CASCADE;
DROP FUNCTION IF EXISTS public.update_dyno_submissions_updated_at() CASCADE;

CREATE FUNCTION public.update_dyno_submissions_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER dyno_submissions_updated_at_trigger
BEFORE UPDATE ON public.dyno_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_dyno_submissions_updated_at();
