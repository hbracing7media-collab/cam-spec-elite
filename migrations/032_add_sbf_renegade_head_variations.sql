-- Migration: Add AFR SBF Renegade head variations (58cc and 72cc chamber options)
-- Date: 2026-01-05
-- Source: https://www.airflowresearch.com/renegade-cnc/c244
-- 
-- AFR SBF heads come in two product lines:
--   1. RENEGADE CNC - All CNC ported (165cc, 185cc, 195cc, 205cc, 220cc runners)
--   2. ENFORCER As Cast - Budget friendly, permanent mold technology
--
-- Heads come in two combustion chamber sizes: 58cc and 72cc
-- Some also come in Stud Mount vs Pedestal Mount versions

INSERT INTO cse_parts_products (
  name, brand, part_number, description, category,
  engine_make, engine_family,
  price, fulfillment_type, supplier_name, supplier_sku,
  is_active, is_featured, slug, image_url
) VALUES

-- ============================================
-- FORD SMALL BLOCK (20°) - 165cc RENEGADE CNC
-- Missing: 1399 (Stud Mount - NOT Emissions Legal)
-- Already in DB: 1402 (58cc Stud w/EGR), 1472 (58cc Pedestal w/EGR)
-- ============================================
('AFR 165cc SBF Renegade CNC 58cc Stud No EGR - Assembled', 'Air Flow Research', '1399',
 'AFR 20° SBF Cylinder Head 165cc, Renegade CNC, 58cc chambers, Stud Mount, No EGR/Air Pump - NOT Emissions Legal',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 2329.00, 'dropship', 'Air Flow Research', '1399',
 true, false, 'afr-1399-165cc-renegade-cnc-58cc-no-egr', '/shop/SBF-Heads-AFR.png'),

-- ============================================
-- FORD SMALL BLOCK (20°) - 185cc RENEGADE CNC
-- Missing: 1387 (72cc Stud No EGR), 1388 (58cc Stud No EGR), 1492 (58cc Pedestal w/EGR)
-- Already in DB: 1420 (72cc Stud w/EGR), 1422 (58cc Stud w/EGR)
-- ============================================
('AFR 185cc SBF Renegade CNC 72cc Stud No EGR - Assembled', 'Air Flow Research', '1387',
 'AFR 20° SBF Cylinder Head 185cc, Renegade CNC, 72cc chambers, Stud Mount, No EGR/Air Pump',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 2329.00, 'dropship', 'Air Flow Research', '1387',
 true, false, 'afr-1387-185cc-renegade-cnc-72cc-no-egr', '/shop/SBF-Heads-AFR.png'),

('AFR 185cc SBF Renegade CNC 58cc Stud No EGR - Assembled', 'Air Flow Research', '1388',
 'AFR 20° SBF Cylinder Head 185cc, Renegade CNC, 58cc chambers, Stud Mount, No EGR/Air Pump',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 2329.00, 'dropship', 'Air Flow Research', '1388',
 true, false, 'afr-1388-185cc-renegade-cnc-58cc-no-egr', '/shop/SBF-Heads-AFR.png'),

('AFR 185cc SBF Renegade CNC 58cc Pedestal - Assembled', 'Air Flow Research', '1492',
 'AFR 20° SBF Cylinder Head 185cc, Renegade CNC, 58cc chambers, Pedestal Mount, w/EGR - CARB EO #D-250-3',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 2329.00, 'dropship', 'Air Flow Research', '1492',
 true, false, 'afr-1492-185cc-renegade-cnc-58cc-pedestal', '/shop/SBF-Heads-AFR.png'),

-- ============================================
-- FORD SMALL BLOCK (20°) - 195cc RENEGADE CNC
-- Missing: 1381-716 (58cc w/EGR), 1383-716 (72cc w/EGR)
-- Already in DB: 1426-716 (58cc), 1428-716 (72cc)
-- ============================================
('AFR 195cc SBF Renegade CNC 58cc w/EGR - Assembled', 'Air Flow Research', '1381-716',
 'AFR 20° SBF Cylinder Head 195cc, Renegade CNC, 58cc chambers, Stud Mount, w/EGR & Air Pump',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 2947.00, 'dropship', 'Air Flow Research', '1381-716',
 true, false, 'afr-1381-195cc-renegade-cnc-58cc-egr', '/shop/SBF-Heads-AFR.png'),

('AFR 195cc SBF Renegade CNC 72cc w/EGR - Assembled', 'Air Flow Research', '1383-716',
 'AFR 20° SBF Cylinder Head 195cc, Renegade CNC, 72cc chambers, Stud Mount, w/EGR & Air Pump',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 2947.00, 'dropship', 'Air Flow Research', '1383-716',
 true, false, 'afr-1383-195cc-renegade-cnc-72cc-egr', '/shop/SBF-Heads-AFR.png'),

-- ============================================
-- FORD SMALL BLOCK (20°) - 205cc RENEGADE CNC
-- Missing: 1458 (72cc)
-- Already in DB: 1450 (58cc)
-- ============================================
('AFR 205cc SBF Renegade CNC 72cc - Assembled', 'Air Flow Research', '1458',
 'AFR 20° SBF Cylinder Head 205cc, Renegade CNC, 72cc chambers, Stud Mount - For race/Pro-Street up to 7400 RPM',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 3015.00, 'dropship', 'Air Flow Research', '1458',
 true, false, 'afr-1458-205cc-renegade-cnc-72cc', '/shop/SBF-Heads-AFR.png'),

-- ============================================
-- FORD SMALL BLOCK (20°) - 220cc RENEGADE CNC
-- Missing: 1456 (72cc)
-- Already in DB: 1451 (58cc)
-- ============================================
('AFR 220cc SBF Renegade CNC 72cc - Assembled', 'Air Flow Research', '1456',
 'AFR 20° SBF Cylinder Head 220cc, Renegade CNC, 72cc chambers, Stud Mount - For race/Pro-Street, highest flowing SBF head',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 3144.00, 'dropship', 'Air Flow Research', '1456',
 true, false, 'afr-1456-220cc-renegade-cnc-72cc', '/shop/SBF-Heads-AFR.png')

ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- UPDATE EXISTING SBF HEADS
-- Renegade = CNC
-- Enforcer = As Cast
-- ============================================

-- Update existing 165cc Street heads to "Renegade CNC"
UPDATE cse_parts_products
SET name = REPLACE(name, 'SBF Street', 'SBF Renegade CNC'),
    description = REPLACE(description, 'Street Heads', 'Renegade CNC')
WHERE brand = 'Air Flow Research'
  AND engine_family = 'Small Block Windsor'
  AND category = 'cylinder_head'
  AND part_number IN ('1402', '1472')
  AND name NOT LIKE '%Renegade%';

-- Update existing 185cc Street heads to "Renegade CNC"
UPDATE cse_parts_products
SET name = REPLACE(name, 'SBF Street', 'SBF Renegade CNC'),
    description = REPLACE(description, 'Street Heads', 'Renegade CNC')
WHERE brand = 'Air Flow Research'
  AND engine_family = 'Small Block Windsor'
  AND category = 'cylinder_head'
  AND part_number IN ('1420', '1422')
  AND name NOT LIKE '%Renegade%';

-- Update existing 195cc Competition heads to "Renegade CNC"
UPDATE cse_parts_products
SET name = REPLACE(name, 'SBF Competition', 'SBF Renegade CNC'),
    description = REPLACE(description, 'Competition Package', 'Renegade CNC')
WHERE brand = 'Air Flow Research'
  AND engine_family = 'Small Block Windsor'
  AND category = 'cylinder_head'
  AND part_number IN ('1426-716', '1428-716')
  AND name NOT LIKE '%Renegade%';

-- Update existing 205cc & 220cc Competition heads to "Renegade CNC"
UPDATE cse_parts_products
SET name = REPLACE(name, 'SBF Competition', 'SBF Renegade CNC'),
    description = REPLACE(description, 'Competition Package', 'Renegade CNC')
WHERE brand = 'Air Flow Research'
  AND engine_family = 'Small Block Windsor'
  AND category = 'cylinder_head'
  AND part_number IN ('1450', '1451')
  AND name NOT LIKE '%Renegade%';

-- Update Enforcer heads to "Enforcer As Cast"
UPDATE cse_parts_products
SET name = REPLACE(name, 'SBF Enforcer', 'SBF Enforcer As Cast'),
    description = REPLACE(description, 'Enforcer Street As Cast', 'Enforcer As Cast (Permanent Mold)')
WHERE brand = 'Air Flow Research'
  AND engine_family = 'Small Block Windsor'
  AND category = 'cylinder_head'
  AND part_number IN ('1351', '1352')
  AND name NOT LIKE '%Enforcer As Cast%';
