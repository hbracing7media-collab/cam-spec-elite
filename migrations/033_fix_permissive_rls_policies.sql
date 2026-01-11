-- Migration: Fix overly permissive RLS policies flagged by Supabase linter
-- Date: 2026-01-10
-- Addresses: rls_policy_always_true warnings for INSERT policies with `WITH CHECK (true)`

-- ============================================================================
-- 1. FIX: public.shop_orders - "Anyone can create orders"
-- ============================================================================
-- Guest checkout is allowed, but we should validate that required fields are present
-- to prevent empty/spam order insertions

DROP POLICY IF EXISTS "Anyone can create orders" ON public.shop_orders;

-- New policy: Allow inserts only when required order data is present
-- This prevents empty/garbage inserts while still allowing guest checkout
CREATE POLICY "Validated order creation" ON public.shop_orders
  FOR INSERT
  WITH CHECK (
    -- Required fields must be non-empty
    customer_name IS NOT NULL AND customer_name <> '' AND
    customer_email IS NOT NULL AND customer_email <> '' AND
    shipping_address IS NOT NULL AND shipping_address <> '' AND
    shipping_city IS NOT NULL AND shipping_city <> '' AND
    shipping_state IS NOT NULL AND shipping_state <> '' AND
    shipping_zip IS NOT NULL AND shipping_zip <> '' AND
    items IS NOT NULL AND
    total IS NOT NULL AND total > 0
  );

-- ============================================================================
-- 2. FIX: public.cams - "Allow anon insert cams"
-- ============================================================================
-- NOTE: If this table doesn't exist or the policy name differs, this will safely no-op
-- The main cam submissions go through cse_cam_submissions_table which has proper policies
-- If public.cams is used, require authentication for inserts

DROP POLICY IF EXISTS "Allow anon insert cams" ON public.cams;

-- Only allow authenticated users to insert cams, and they must provide their user_id
-- If the table has a user_id column:
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cams' 
    AND column_name = 'user_id'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users insert own cams" ON public.cams
      FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL AND auth.uid()::text = user_id)';
  ELSE
    -- If no user_id column, just require authentication
    EXECUTE 'CREATE POLICY "Authenticated users insert cams" ON public.cams
      FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL)';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Table public.cams does not exist, skipping policy creation';
END $$;

-- ============================================================================
-- 3. FIX: cse.calculator_runs - "calculator_runs_insert_public"
-- ============================================================================
-- Calculator runs should log usage but prevent abuse
-- Allow inserts but require some basic data validation

DROP POLICY IF EXISTS "calculator_runs_insert_public" ON cse.calculator_runs;

-- Only create policy if the table exists in cse schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'cse' 
    AND table_name = 'calculator_runs'
  ) THEN
    -- Check what columns exist to create appropriate policy
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'cse' 
      AND table_name = 'calculator_runs' 
      AND column_name = 'created_at'
    ) THEN
      -- If it's a logging table, we can allow public inserts but require timestamps
      -- and limit to prevent abuse (created_at must be recent, i.e., server-generated)
      EXECUTE 'CREATE POLICY "Public calculator runs with validation" ON cse.calculator_runs
        FOR INSERT
        WITH CHECK (
          created_at IS NOT NULL AND 
          created_at >= NOW() - INTERVAL ''1 minute''
        )';
    ELSE
      -- Fallback: require authentication to prevent anonymous abuse
      EXECUTE 'CREATE POLICY "Authenticated calculator runs" ON cse.calculator_runs
        FOR INSERT
        WITH CHECK (auth.uid() IS NOT NULL)';
    END IF;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Table cse.calculator_runs does not exist, skipping policy creation';
  WHEN undefined_object THEN
    RAISE NOTICE 'Schema cse does not exist, skipping policy creation';
END $$;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- These policies replace overly permissive `WITH CHECK (true)` policies that
-- effectively bypassed Row Level Security for INSERT operations.
--
-- If you need to revert to permissive behavior for testing, you can:
--   DROP POLICY "Validated order creation" ON public.shop_orders;
--   CREATE POLICY "Anyone can create orders" ON public.shop_orders
--     FOR INSERT WITH CHECK (true);
--
-- For production, these stricter policies help prevent:
-- - Spam/garbage data insertion
-- - Potential denial-of-service via mass inserts
-- - Data integrity issues from malformed records
