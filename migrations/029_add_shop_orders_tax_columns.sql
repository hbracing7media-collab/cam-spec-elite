-- Migration: Add sales tax columns to shop_orders table
-- Date: 2026-01-05

-- Add tax columns to shop_orders table
ALTER TABLE public.shop_orders 
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0;

-- Add comment explaining columns
COMMENT ON COLUMN public.shop_orders.tax_amount IS 'Sales tax amount in USD';
COMMENT ON COLUMN public.shop_orders.tax_rate IS 'Sales tax rate as decimal (e.g., 0.0625 = 6.25%)';
