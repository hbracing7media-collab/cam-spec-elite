-- Parts Store Products Table
CREATE TABLE IF NOT EXISTS cse_parts_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product info
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  part_number TEXT NOT NULL,
  description TEXT,
  
  -- Category/type
  category TEXT NOT NULL DEFAULT 'camshaft',  -- camshaft, lifters, pushrods, timing, etc.
  
  -- Engine compatibility
  engine_make TEXT,          -- Ford, Chevy, Mopar, etc.
  engine_family TEXT,        -- Small Block Windsor, LS, etc.
  
  -- Cam specs (for camshafts)
  duration_int_050 INTEGER,
  duration_exh_050 INTEGER,
  lift_int DECIMAL(4,3),
  lift_exh DECIMAL(4,3),
  lsa DECIMAL(4,1),
  cam_type TEXT,             -- hydraulic flat, hydraulic roller, solid roller
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),  -- Original/MSRP price for showing savings
  cost DECIMAL(10,2),              -- Your cost (admin only)
  
  -- Inventory
  fulfillment_type TEXT NOT NULL DEFAULT 'in_stock',  -- 'in_stock', 'dropship', 'made_to_order'
  quantity_in_stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 2,
  
  -- Dropship info
  supplier_name TEXT,
  supplier_sku TEXT,
  supplier_cost DECIMAL(10,2),
  
  -- Images
  image_url TEXT,
  image_urls JSONB,  -- Array of additional images
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- SEO
  slug TEXT UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_parts_products_category ON cse_parts_products(category);
CREATE INDEX idx_parts_products_brand ON cse_parts_products(brand);
CREATE INDEX idx_parts_products_engine ON cse_parts_products(engine_make, engine_family);
CREATE INDEX idx_parts_products_active ON cse_parts_products(is_active);
CREATE INDEX idx_parts_products_slug ON cse_parts_products(slug);

-- Orders table for parts
CREATE TABLE IF NOT EXISTS cse_parts_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Shipping
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_zip TEXT NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  
  -- Order details
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending',  -- pending, confirmed, processing, shipped, delivered, cancelled
  payment_status TEXT DEFAULT 'pending',  -- pending, paid, refunded
  
  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,
  
  -- Tracking
  tracking_number TEXT,
  carrier TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS cse_parts_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES cse_parts_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES cse_parts_products(id),
  
  -- Snapshot of product at time of order
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Fulfillment
  fulfillment_type TEXT,  -- in_stock, dropship
  fulfillment_status TEXT DEFAULT 'pending',  -- pending, fulfilled, shipped
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE cse_parts_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cse_parts_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cse_parts_order_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view active products
CREATE POLICY "Anyone can view active products" ON cse_parts_products
  FOR SELECT USING (is_active = true);

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON cse_parts_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own order items" ON cse_parts_order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM cse_parts_orders WHERE user_id = auth.uid())
  );
