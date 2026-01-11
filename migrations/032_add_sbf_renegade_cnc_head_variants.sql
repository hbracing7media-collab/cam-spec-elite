-- Migration: Update AFR cylinder head prices and names
-- Date: 2026-01-05
-- ALL UPDATES ONLY - no inserts (products already exist)

-- ============================================
-- UPDATE SBF Renegade CNC Heads - Names and Prices
-- ============================================
UPDATE public.cse_parts_products SET name = 'AFR 185cc SBF Renegade CNC Street - 58cc', price = 2329.00 WHERE part_number = '1388' AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET name = 'AFR 185cc SBF Renegade CNC Street - 58cc Pedestal/EGR', price = 2329.00 WHERE part_number = '1492' AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET name = 'AFR 185cc SBF Renegade CNC Street - 72cc', price = 2329.00 WHERE part_number = '1387' AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET name = 'AFR 195cc SBF Renegade CNC Competition - 58cc w/EGR', price = 2947.00 WHERE part_number = '1381-716' AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET name = 'AFR 195cc SBF Renegade CNC Competition - 72cc w/EGR', price = 2947.00 WHERE part_number = '1383-716' AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET name = 'AFR 205cc SBF Renegade CNC 72cc - Assembled', price = 3015.00 WHERE part_number = '1458' AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET name = 'AFR 220cc SBF Renegade CNC 72cc - Assembled', price = 3144.00 WHERE part_number = '1456' AND category = 'cylinder_head';

-- ============================================
-- UPDATE existing SBF heads names (Renegade CNC)
-- ============================================
UPDATE public.cse_parts_products SET
  name = 'AFR 165cc SBF Renegade CNC 58cc Stud - Assembled'
WHERE part_number = '1402' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET
  name = 'AFR 165cc SBF Renegade CNC 58cc Pedestal - Assembled'
WHERE part_number = '1472' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET
  name = 'AFR 185cc SBF Renegade CNC 58cc Stud - Assembled'
WHERE part_number = '1422' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET
  name = 'AFR 185cc SBF Renegade CNC 72cc Stud - Assembled'
WHERE part_number = '1420' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET
  name = 'AFR 195cc SBF Renegade CNC 58cc - Assembled'
WHERE part_number = '1426-716' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET
  name = 'AFR 195cc SBF Renegade CNC 72cc - Assembled'
WHERE part_number = '1428-716' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET
  name = 'AFR 205cc SBF Renegade CNC 58cc - Assembled'
WHERE part_number = '1450' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET
  name = 'AFR 220cc SBF Renegade CNC 58cc - Assembled'
WHERE part_number = '1451' AND category = 'cylinder_head';

-- Update Enforcer names and prices to clarify As Cast
UPDATE public.cse_parts_products SET
  name = 'AFR 185cc SBF Enforcer As Cast - Assembled',
  price = 768.00
WHERE part_number = '1351' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET
  name = 'AFR 185cc SBF Enforcer As Cast - Bare',
  price = 499.00
WHERE part_number = '1352' AND category = 'cylinder_head';

-- Fix all SBF Renegade CNC prices to match AFR website
-- 165cc = $2329.00
UPDATE public.cse_parts_products SET price = 2329.00
WHERE part_number IN ('1402', '1472') AND category = 'cylinder_head';

-- 185cc = $2329.00
UPDATE public.cse_parts_products SET price = 2329.00
WHERE part_number IN ('1420', '1422') AND category = 'cylinder_head';

-- 195cc = $2947.00
UPDATE public.cse_parts_products SET price = 2947.00
WHERE part_number IN ('1426-716', '1428-716') AND category = 'cylinder_head';

-- 205cc = $3015.00
UPDATE public.cse_parts_products SET price = 3015.00
WHERE part_number = '1450' AND category = 'cylinder_head';

-- 220cc = $3144.00
UPDATE public.cse_parts_products SET price = 3144.00
WHERE part_number = '1451' AND category = 'cylinder_head';

-- Fix LS Enforcer prices and add images
UPDATE public.cse_parts_products SET 
  price = 780.00,
  image_url = '/shop/LS1-enforcer.png'
WHERE part_number IN ('1501', '1506') AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  price = 563.00,
  image_url = '/shop/LS1-enforcer.png'
WHERE part_number IN ('1502', '1507') AND category = 'cylinder_head';

-- Fix LS1 Mongoose CNC prices to match AFR website
UPDATE public.cse_parts_products SET price = 3058.00
WHERE part_number = '1510' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET price = 3149.00
WHERE part_number = '1530' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET price = 3333.00
WHERE part_number = '1610' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET price = 3461.00
WHERE part_number = '1680' AND category = 'cylinder_head';

-- Fix LS3 Enforcer prices
UPDATE public.cse_parts_products SET price = 835.00
WHERE part_number = '1803' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET price = 681.00
WHERE part_number = '1804' AND category = 'cylinder_head';

-- Fix LS3 Mongoose CNC prices
UPDATE public.cse_parts_products SET price = 3490.00
WHERE part_number IN ('1840', '1845') AND category = 'cylinder_head';

-- Fix BBC 24° Magnum CNC prices
UPDATE public.cse_parts_products SET price = 4938.00
WHERE part_number IN ('2000', '2001') AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET price = 5185.00
WHERE part_number = '2010-TI' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET price = 5345.00
WHERE part_number IN ('2015-TI', '2020-TI') AND category = 'cylinder_head';

-- Fix BBC Race Ready prices and add images
UPDATE public.cse_parts_products SET 
  price = 3755.00,
  image_url = '/shop/BBC-race-ready.png'
WHERE part_number IN ('2100', '2101') AND category = 'cylinder_head';

-- Add images to BBC Race Ready Full CNC heads (already exist)
UPDATE public.cse_parts_products SET image_url = '/shop/BBC-race-ready.png'
WHERE part_number IN ('2100-1', '2101-1') AND category = 'cylinder_head';

-- Fix SBC 180cc Street Head prices ($2328.90 -> $2329.00)
UPDATE public.cse_parts_products SET price = 2329.00
WHERE part_number IN ('0911', '0916') AND category = 'cylinder_head';

-- ============================================
-- UPDATE SBC 180cc Street Heads (917, 918, 919) - already exist
-- ============================================
UPDATE public.cse_parts_products SET
  name = 'AFR 180cc SBC Street Head 75cc Angle Plug - Assembled',
  price = 2329.00,
  description = 'AFR 23° SBC Cylinder Head 180cc Street Heads, angle plug, 75cc chambers, 100% CNC ported intake/exhaust/chambers. For engines up to 383ci, 6000 RPM. CARB EO #D-250-2.',
  image_url = '/shop/SBC-heads-AFR.webp'
WHERE part_number = '917' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET
  name = 'AFR 180cc SBC Street Head 65cc Angle Plug - Assembled',
  price = 2329.00,
  description = 'AFR 23° SBC Cylinder Head 180cc Street Heads, angle plug, 65cc chambers, 100% CNC ported intake/exhaust/chambers. For engines up to 383ci, 6000 RPM. CARB EO #D-250-2.',
  image_url = '/shop/SBC-heads-AFR.webp'
WHERE part_number = '918' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET
  name = 'AFR 180cc SBC Street Head 72° Intake Bolt - Assembled',
  price = 2329.00,
  description = 'AFR 23° SBC Cylinder Head 180cc Street Heads, 72 degree intake bolt pattern for Vortec intakes, 100% CNC ported intake/exhaust/chambers. For engines up to 383ci, 6000 RPM. CARB EO #D-250-2.',
  image_url = '/shop/SBC-heads-AFR.webp'
WHERE part_number = '919' AND category = 'cylinder_head';
