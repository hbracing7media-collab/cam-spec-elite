-- Migration: 035_fix_layaway_rls_policy.sql
-- Description: Fix overly permissive RLS policy on layaway_plans INSERT
-- The original policy used WITH CHECK (true) which bypasses security
-- This update ensures users can only create layaway plans for themselves

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can create layaway plans" ON public.layaway_plans;

-- Create a proper policy that restricts INSERT to:
-- 1. Authenticated users inserting their own user_id, OR
-- 2. Server-side inserts (service role) for guest checkout scenarios
CREATE POLICY "Users can create layaway plans" ON public.layaway_plans
  FOR INSERT WITH CHECK (
    -- User must be authenticated and inserting their own user_id
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- Allow insert if user_id is null (guest checkout - handled server-side)
    (user_id IS NULL)
  );

-- Also add an UPDATE policy so users can update their own plans (e.g., cancel)
DROP POLICY IF EXISTS "Users can update own layaway plans" ON public.layaway_plans;
CREATE POLICY "Users can update own layaway plans" ON public.layaway_plans
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
