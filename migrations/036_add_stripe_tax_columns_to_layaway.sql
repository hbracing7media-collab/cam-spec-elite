-- Migration: Add Stripe Tax columns to layaway_plans
-- Date: 2026-01-19
-- Purpose: Store Stripe Tax calculation ID and customer ID for audit/reference

-- Add columns for Stripe Tax integration
ALTER TABLE public.layaway_plans
ADD COLUMN IF NOT EXISTS tax_calculation_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_layaway_plans_stripe_customer 
ON public.layaway_plans(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- Comment on columns for documentation
COMMENT ON COLUMN public.layaway_plans.tax_calculation_id IS 'Stripe Tax calculation ID from when the plan was created';
COMMENT ON COLUMN public.layaway_plans.stripe_customer_id IS 'Stripe customer ID used for tax calculation and payments';
