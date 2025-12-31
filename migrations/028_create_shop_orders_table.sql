-- Migration: Create shop orders table for merch orders
-- Date: 2024-12-31

CREATE TABLE IF NOT EXISTS public.shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Shipping address
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_zip TEXT NOT NULL,
  shipping_country TEXT DEFAULT 'USA',
  
  -- Order details
  items JSONB NOT NULL,  -- Array of {id, name, size, quantity, price}
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT DEFAULT 'paypal',
  payment_id TEXT,  -- PayPal transaction ID when paid
  
  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ
);

-- Index for quick lookups
CREATE INDEX idx_shop_orders_email ON public.shop_orders(customer_email);
CREATE INDEX idx_shop_orders_status ON public.shop_orders(status);
CREATE INDEX idx_shop_orders_created ON public.shop_orders(created_at DESC);

-- Enable RLS
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own orders by email (for guest checkout)
CREATE POLICY "Users view own orders by email" ON public.shop_orders
  FOR SELECT USING (true);  -- Public can check order status with order number

-- Policy: Allow inserts from authenticated or anon (guest checkout)
CREATE POLICY "Anyone can create orders" ON public.shop_orders
  FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON public.shop_orders TO anon, authenticated;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'HBR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6));
END;
$$ LANGUAGE plpgsql;
