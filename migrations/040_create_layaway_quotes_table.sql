-- Migration: Create layaway quotes table
-- Date: 2026-03-30
-- Purpose: Allow admins to create layaway quotes that users can accept

-- ============================================
-- LAYAWAY QUOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.layaway_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,
  
  -- Link to user (optional - can create for guest with email)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Items being quoted
  items JSONB NOT NULL,  -- Array of {id, name, sku, size, quantity, price, image_url, description}
  
  -- Financial details
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Quote-specific pricing (optional discounts)
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_description TEXT,
  
  -- Payment structure (suggested terms)
  suggested_down_payment_percent INTEGER DEFAULT 25,
  suggested_payment_frequency TEXT DEFAULT 'biweekly' CHECK (suggested_payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  suggested_num_payments INTEGER DEFAULT 4,
  
  -- Calculated payment amounts (for display)
  suggested_down_payment_amount DECIMAL(10,2),
  suggested_payment_amount DECIMAL(10,2),
  
  -- Quote validity
  valid_until DATE NOT NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',       -- Waiting for customer response
    'accepted',      -- Customer accepted, converted to layaway plan
    'declined',      -- Customer explicitly declined
    'expired',       -- Past valid_until date without response
    'cancelled'      -- Admin cancelled the quote
  )),
  
  -- If accepted, link to the created layaway plan
  converted_plan_id UUID REFERENCES public.layaway_plans(id) ON DELETE SET NULL,
  
  -- Notes
  customer_notes TEXT,     -- Notes visible to customer
  admin_notes TEXT,        -- Internal admin notes
  decline_reason TEXT,     -- If customer declined, why
  
  -- Admin who created the quote
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_layaway_quotes_user ON public.layaway_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_layaway_quotes_email ON public.layaway_quotes(customer_email);
CREATE INDEX IF NOT EXISTS idx_layaway_quotes_status ON public.layaway_quotes(status);
CREATE INDEX IF NOT EXISTS idx_layaway_quotes_valid_until ON public.layaway_quotes(valid_until);
CREATE INDEX IF NOT EXISTS idx_layaway_quotes_quote_number ON public.layaway_quotes(quote_number);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.layaway_quotes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users view own quotes" ON public.layaway_quotes;
DROP POLICY IF EXISTS "Service role full access to quotes" ON public.layaway_quotes;
DROP POLICY IF EXISTS "Users can respond to quotes" ON public.layaway_quotes;

-- Users can view quotes sent to them
CREATE POLICY "Users view own quotes" ON public.layaway_quotes
  FOR SELECT USING (
    user_id = auth.uid() OR 
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Service role can do anything (admin API uses service role key)
CREATE POLICY "Service role full access to quotes" ON public.layaway_quotes
  FOR ALL USING (auth.role() = 'service_role');

-- Users can update their own quotes (to accept/decline)
CREATE POLICY "Users can respond to quotes" ON public.layaway_quotes
  FOR UPDATE USING (
    (user_id = auth.uid() OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND status = 'pending'
  )
  WITH CHECK (
    (user_id = auth.uid() OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND status IN ('accepted', 'declined')
  );

-- ============================================
-- FUNCTION: Auto-expire quotes
-- ============================================
CREATE OR REPLACE FUNCTION expire_old_quotes()
RETURNS void AS $$
BEGIN
  UPDATE public.layaway_quotes
  SET 
    status = 'expired',
    expired_at = NOW(),
    updated_at = NOW()
  WHERE status = 'pending' 
    AND valid_until < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Update timestamp on changes
-- ============================================
CREATE OR REPLACE FUNCTION update_layaway_quotes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_layaway_quotes_timestamp ON public.layaway_quotes;

CREATE TRIGGER trigger_update_layaway_quotes_timestamp
  BEFORE UPDATE ON public.layaway_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_layaway_quotes_timestamp();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.layaway_quotes IS 'Layaway quotes created by admin for customers to accept';
COMMENT ON COLUMN public.layaway_quotes.quote_number IS 'Human-readable quote identifier (e.g., QTE-20260330-ABC123)';
COMMENT ON COLUMN public.layaway_quotes.items IS 'JSON array of items: [{id, name, sku, size, quantity, price, image_url, description}]';
COMMENT ON COLUMN public.layaway_quotes.valid_until IS 'Quote expiration date - after this date, quote becomes invalid';
COMMENT ON COLUMN public.layaway_quotes.converted_plan_id IS 'When accepted, references the created layaway_plan';
