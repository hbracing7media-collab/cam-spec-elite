-- Migration: Create layaway system tables
-- Date: 2025-01-14
-- Supports: Custom layaway plans, Affirm integration, vendor-managed payments

-- ============================================
-- LAYAWAY PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.layaway_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_number TEXT UNIQUE NOT NULL,
  
  -- Link to user (optional for guests) or order
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  
  -- Customer info (denormalized for quick access)
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Items being held
  items JSONB NOT NULL,  -- Array of {id, name, sku, size, quantity, price, image_url}
  
  -- Financial details
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment structure
  down_payment_amount DECIMAL(10,2) NOT NULL,
  down_payment_percent INTEGER DEFAULT 25,  -- Typically 25%
  remaining_balance DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  
  -- Plan configuration
  payment_frequency TEXT DEFAULT 'biweekly' CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  num_payments INTEGER NOT NULL DEFAULT 4,  -- Number of installments after down payment
  payment_amount DECIMAL(10,2) NOT NULL,    -- Each installment amount
  
  -- Dates
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_payment_due DATE,
  final_payment_due DATE NOT NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'pending_down_payment' CHECK (status IN (
    'pending_down_payment',  -- Waiting for initial payment
    'active',                -- Plan active, making payments
    'completed',             -- Fully paid
    'defaulted',             -- Missed payments, grace period expired
    'cancelled',             -- Customer cancelled
    'forfeited'              -- Customer abandoned, items restocked
  )),
  
  -- Vendor integration (Affirm, Sezzle, etc.)
  payment_provider TEXT DEFAULT 'internal' CHECK (payment_provider IN (
    'internal',    -- Our own layaway system
    'affirm',      -- Affirm BNPL
    'sezzle',      -- Sezzle BNPL
    'afterpay',    -- Afterpay BNPL
    'klarna',      -- Klarna BNPL
    'paypal_bnpl'  -- PayPal Pay in 4
  )),
  provider_plan_id TEXT,         -- External provider's plan/loan ID
  provider_checkout_token TEXT,  -- For completing checkout with provider
  provider_metadata JSONB,       -- Extra provider-specific data
  
  -- Policy settings
  cancellation_fee_percent INTEGER DEFAULT 10,
  late_fee_amount DECIMAL(10,2) DEFAULT 5.00,
  grace_period_days INTEGER DEFAULT 7,
  
  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- ============================================
-- LAYAWAY PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.layaway_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.layaway_plans(id) ON DELETE CASCADE,
  
  -- Payment details
  payment_number INTEGER NOT NULL,  -- 0 = down payment, 1+ = installments
  amount DECIMAL(10,2) NOT NULL,
  late_fee DECIMAL(10,2) DEFAULT 0,
  total_charged DECIMAL(10,2) NOT NULL,
  
  -- Due date tracking
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Not yet due
    'due',          -- Currently due
    'paid',         -- Successfully paid
    'overdue',      -- Past due, not paid
    'waived',       -- Fee waived by admin
    'refunded'      -- Payment refunded
  )),
  
  -- Payment method
  payment_method TEXT,  -- 'card', 'paypal', 'affirm', etc.
  transaction_id TEXT,  -- External payment reference
  
  -- For recurring/auto-pay
  is_autopay BOOLEAN DEFAULT FALSE,
  autopay_failed BOOLEAN DEFAULT FALSE,
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LAYAWAY SETTINGS TABLE (admin configurable)
-- ============================================
CREATE TABLE IF NOT EXISTS public.layaway_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Global settings
  is_enabled BOOLEAN DEFAULT TRUE,
  min_order_amount DECIMAL(10,2) DEFAULT 100.00,  -- Minimum cart for layaway
  max_order_amount DECIMAL(10,2) DEFAULT 5000.00, -- Maximum cart for layaway
  
  -- Down payment options
  min_down_payment_percent INTEGER DEFAULT 10,
  default_down_payment_percent INTEGER DEFAULT 25,
  
  -- Payment plans
  available_frequencies TEXT[] DEFAULT ARRAY['weekly', 'biweekly', 'monthly'],
  min_installments INTEGER DEFAULT 2,
  max_installments INTEGER DEFAULT 12,
  max_plan_duration_days INTEGER DEFAULT 90,  -- Max 90 days to pay off
  
  -- Fees and penalties
  late_fee_amount DECIMAL(10,2) DEFAULT 5.00,
  grace_period_days INTEGER DEFAULT 7,
  cancellation_fee_percent INTEGER DEFAULT 10,
  
  -- Item hold policy
  hold_inventory BOOLEAN DEFAULT TRUE,  -- Reserve items when plan starts
  auto_forfeit_days INTEGER DEFAULT 30, -- Days overdue before auto-forfeit
  
  -- Vendor integrations enabled
  affirm_enabled BOOLEAN DEFAULT FALSE,
  affirm_public_key TEXT,
  sezzle_enabled BOOLEAN DEFAULT FALSE,
  afterpay_enabled BOOLEAN DEFAULT FALSE,
  klarna_enabled BOOLEAN DEFAULT FALSE,
  paypal_bnpl_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.layaway_settings (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_layaway_plans_user ON public.layaway_plans(user_id);
CREATE INDEX idx_layaway_plans_email ON public.layaway_plans(customer_email);
CREATE INDEX idx_layaway_plans_status ON public.layaway_plans(status);
CREATE INDEX idx_layaway_plans_next_due ON public.layaway_plans(next_payment_due);
CREATE INDEX idx_layaway_plans_provider ON public.layaway_plans(payment_provider);
CREATE INDEX idx_layaway_payments_plan ON public.layaway_payments(plan_id);
CREATE INDEX idx_layaway_payments_status ON public.layaway_payments(status);
CREATE INDEX idx_layaway_payments_due ON public.layaway_payments(due_date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.layaway_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layaway_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layaway_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own layaway plans
CREATE POLICY "Users view own layaway plans" ON public.layaway_plans
  FOR SELECT USING (
    user_id = auth.uid() OR 
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow creating layaway plans
CREATE POLICY "Users can create layaway plans" ON public.layaway_plans
  FOR INSERT WITH CHECK (true);

-- Users can view payments for their plans
CREATE POLICY "Users view own layaway payments" ON public.layaway_payments
  FOR SELECT USING (
    plan_id IN (SELECT id FROM public.layaway_plans WHERE user_id = auth.uid())
  );

-- Anyone can read layaway settings (public config)
CREATE POLICY "Public can read layaway settings" ON public.layaway_settings
  FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate layaway plan number
CREATE OR REPLACE FUNCTION generate_layaway_number()
RETURNS TEXT 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'LAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6));
END;
$$;

-- Calculate next payment due date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_payment_date(
  p_start_date DATE,
  p_payment_number INTEGER,
  p_frequency TEXT
)
RETURNS DATE
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN CASE p_frequency
    WHEN 'weekly' THEN p_start_date + (p_payment_number * 7)
    WHEN 'biweekly' THEN p_start_date + (p_payment_number * 14)
    WHEN 'monthly' THEN p_start_date + (p_payment_number * INTERVAL '1 month')::INTEGER
    ELSE p_start_date + (p_payment_number * 14)  -- Default biweekly
  END;
END;
$$;

-- Update plan status and balances after payment
CREATE OR REPLACE FUNCTION process_layaway_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_plan layaway_plans%ROWTYPE;
  v_total_paid DECIMAL(10,2);
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Get the plan
    SELECT * INTO v_plan FROM layaway_plans WHERE id = NEW.plan_id;
    
    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM layaway_payments
    WHERE plan_id = NEW.plan_id AND status = 'paid';
    
    -- Update plan
    UPDATE layaway_plans
    SET 
      amount_paid = v_total_paid,
      remaining_balance = total_amount - v_total_paid,
      status = CASE 
        WHEN v_total_paid >= total_amount THEN 'completed'
        WHEN NEW.payment_number = 0 THEN 'active'  -- Down payment received
        ELSE status
      END,
      next_payment_due = (
        SELECT MIN(due_date) FROM layaway_payments 
        WHERE plan_id = NEW.plan_id AND status IN ('pending', 'due')
      ),
      completed_at = CASE WHEN v_total_paid >= total_amount THEN NOW() ELSE NULL END,
      updated_at = NOW()
    WHERE id = NEW.plan_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for payment processing
CREATE TRIGGER tr_process_layaway_payment
AFTER UPDATE OF status ON public.layaway_payments
FOR EACH ROW
EXECUTE FUNCTION process_layaway_payment();

-- ============================================
-- GRANTS
-- ============================================
GRANT SELECT, INSERT, UPDATE ON public.layaway_plans TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.layaway_payments TO anon, authenticated;
GRANT SELECT ON public.layaway_settings TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
