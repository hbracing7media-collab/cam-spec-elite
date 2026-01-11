-- Migration 032: Fix ALL AFR Small Block Chevy cylinder head prices
-- Based on AFR website prices as of January 2026
-- ALL UPDATES ONLY - no inserts

-- ============================================
-- SBC ENFORCER AS CAST (EACH HEAD, NOT PAIR)
-- $488 bare, $790 assembled per AFR website
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 200cc SBC Enforcer As Cast Straight Plug - Assembled',
  price = 790.00
WHERE part_number = '1011' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 200cc SBC Enforcer As Cast Straight Plug - Bare',
  price = 488.00
WHERE part_number = '1012' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 200cc SBC Enforcer As Cast Angle Plug - Assembled',
  price = 790.00
WHERE part_number = '1016' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 200cc SBC Enforcer As Cast Angle Plug - Bare',
  price = 488.00
WHERE part_number = '1017' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 200cc SBC Enforcer As Cast Straight Plug Flat Tappet - Assembled',
  price = 790.00
WHERE part_number = '1011-FT' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 200cc SBC Enforcer As Cast Angle Plug Flat Tappet - Assembled',
  price = 790.00
WHERE part_number = '1016-FT' AND category = 'cylinder_head';

-- ============================================
-- SBC 180cc STREET CNC (PAIR) - $2,329.00
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 180cc SBC Street CNC 75cc Straight Plug - Assembled',
  price = 2329.00
WHERE part_number = '0911' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 180cc SBC Street CNC 65cc Straight Plug - Assembled',
  price = 2329.00
WHERE part_number = '0916' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 180cc SBC Street CNC 75cc Angle Plug - Assembled',
  price = 2329.00
WHERE part_number = '917' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 180cc SBC Street CNC 65cc Angle Plug - Assembled',
  price = 2329.00
WHERE part_number = '918' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 180cc SBC Street CNC 72° Intake Bolt - Assembled',
  price = 2329.00
WHERE part_number = '919' AND category = 'cylinder_head';

-- ============================================
-- SBC 180cc LT1 STREET CNC (PAIR) - $2,499.00
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 180cc SBC LT1 Street CNC 65cc - Assembled',
  price = 2499.00
WHERE part_number = '908' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 180cc SBC LT1 Street CNC 54cc - Assembled',
  price = 2499.00
WHERE part_number = '909' AND category = 'cylinder_head';

-- ============================================
-- SBC 190cc VORTEC (PAIR) - $2,392.00
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 190cc SBC Vortec Street CNC - Assembled',
  price = 2392.00
WHERE part_number = '912' AND category = 'cylinder_head';

-- ============================================
-- SBC 195cc STREET CNC (PAIR) - $2,329.00
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 195cc SBC Street CNC 65cc Straight Plug - Assembled',
  price = 2329.00
WHERE part_number = '1034' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 195cc SBC Street CNC 75cc Straight Plug - Assembled',
  price = 2329.00
WHERE part_number = '1036' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 195cc SBC Street CNC 75cc Angle Plug - Assembled',
  price = 2329.00
WHERE part_number = '1038' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 195cc SBC Street CNC 65cc Angle Plug - Assembled',
  price = 2329.00
WHERE part_number = '1040' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 195cc SBC Street CNC 65cc 72° Intake Bolt - Assembled',
  price = 2329.00
WHERE part_number = '1041' AND category = 'cylinder_head';

-- ============================================
-- SBC 195cc COMPETITION CNC (PAIR) - $3,167.00
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 195cc SBC Competition CNC 65cc - Assembled',
  price = 3167.00
WHERE part_number = '1095-716' AND category = 'cylinder_head';

-- ============================================
-- SBC 210cc RACE READY CNC (PAIR) - $2,592.00
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 210cc SBC Race Ready CNC 75cc - Assembled',
  price = 2592.00
WHERE part_number = '1050' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 210cc SBC Race Ready CNC 65cc - Assembled',
  price = 2592.00
WHERE part_number = '1054' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 210cc SBC Race Ready CNC 65cc Spread Port - Assembled',
  price = 2592.00
WHERE part_number = '1059' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 210cc SBC Race Ready CNC 75cc Spread Port - Assembled',
  price = 2592.00
WHERE part_number = '1055' AND category = 'cylinder_head';

-- ============================================
-- SBC 210cc COMPETITION CNC (PAIR) - $3,193.00
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 210cc SBC Competition CNC 75cc - Assembled',
  price = 3193.00
WHERE part_number = '1100' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 210cc SBC Competition CNC 65cc - Assembled',
  price = 3193.00
WHERE part_number = '1103' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 210cc SBC Competition CNC 65cc Spread Port - Assembled',
  price = 3193.00
WHERE part_number = '1106' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 210cc SBC Competition CNC 75cc Spread Port - Assembled',
  price = 3193.00
WHERE part_number = '1105' AND category = 'cylinder_head';

-- ============================================
-- SBC 220cc RACE READY CNC (PAIR) - $2,592.00
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 220cc SBC Race Ready CNC 65cc - Assembled',
  price = 2592.00
WHERE part_number = '1065' AND category = 'cylinder_head';

-- ============================================
-- SBC 220cc COMPETITION CNC (PAIR) - $3,279.00
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 220cc SBC Competition CNC 65cc - Assembled',
  price = 3279.00
WHERE part_number = '1110' AND category = 'cylinder_head';

-- ============================================
-- SBC 227cc RACE READY CNC (PAIR) - $2,592.00
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 227cc SBC Race Ready CNC 65cc - Assembled',
  price = 2592.00
WHERE part_number = '1068' AND category = 'cylinder_head';

-- ============================================
-- SBC 227cc COMPETITION CNC (PAIR) - $3,279.00
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 227cc SBC Competition CNC 65cc - Assembled',
  price = 3279.00
WHERE part_number = '1121' AND category = 'cylinder_head';

-- ============================================
-- SBC 235cc COMPETITION CNC (PAIR) - $3,821.00
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 235cc SBC Competition CNC 70cc - Assembled',
  price = 3821.00
WHERE part_number = '1132-TI' AND category = 'cylinder_head';

-- ============================================
-- SBC 245cc COMPETITION CNC (PAIR) - $4,035.00
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 245cc SBC Competition CNC 70cc - Assembled',
  price = 4035.00
WHERE part_number = '1137-TI' AND category = 'cylinder_head';

-- ============================================
-- SBF ENFORCER AS CAST
-- ============================================
UPDATE public.cse_parts_products SET 
  name = 'AFR 185cc SBF Enforcer As Cast - Assembled',
  price = 768.00
WHERE part_number = '1351' AND category = 'cylinder_head';

UPDATE public.cse_parts_products SET 
  name = 'AFR 185cc SBF Enforcer As Cast - Bare',
  price = 499.00
WHERE part_number = '1352' AND category = 'cylinder_head';

-- ============================================
-- SBF RENEGADE CNC PRICES
-- ============================================
UPDATE public.cse_parts_products SET price = 2329.00 WHERE part_number IN ('1402', '1472', '1420', '1422', '1387', '1388', '1492') AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET price = 2947.00 WHERE part_number IN ('1426-716', '1428-716', '1381-716', '1383-716') AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET price = 3015.00 WHERE part_number IN ('1450', '1458') AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET price = 3144.00 WHERE part_number IN ('1451', '1456') AND category = 'cylinder_head';

-- ============================================
-- LS ENFORCER PRICES
-- ============================================
UPDATE public.cse_parts_products SET price = 780.00, image_url = '/shop/LS1-enforcer.png' WHERE part_number IN ('1501', '1506') AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET price = 563.00, image_url = '/shop/LS1-enforcer.png' WHERE part_number IN ('1502', '1507') AND category = 'cylinder_head';

-- ============================================
-- LS MONGOOSE CNC PRICES
-- ============================================
UPDATE public.cse_parts_products SET price = 3058.00 WHERE part_number = '1510' AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET price = 3149.00 WHERE part_number = '1530' AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET price = 3333.00 WHERE part_number = '1610' AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET price = 3461.00 WHERE part_number = '1680' AND category = 'cylinder_head';

-- ============================================
-- LS3 PRICES
-- ============================================
UPDATE public.cse_parts_products SET price = 835.00 WHERE part_number = '1803' AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET price = 681.00 WHERE part_number = '1804' AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET price = 3490.00 WHERE part_number IN ('1840', '1845') AND category = 'cylinder_head';

-- ============================================
-- BBC MAGNUM CNC PRICES
-- ============================================
UPDATE public.cse_parts_products SET price = 4938.00, image_url = '/shop/BBCCNC-24-degree-magnum.jpg' WHERE part_number IN ('2000', '2001') AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET price = 5185.00, image_url = '/shop/BBCCNC-24-degree-magnum.jpg' WHERE part_number = '2010-TI' AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET price = 5345.00, image_url = '/shop/BBCCNC-24-degree-magnum.jpg' WHERE part_number IN ('2015-TI', '2020-TI') AND category = 'cylinder_head';

-- ============================================
-- BBC RACE READY PRICES
-- ============================================
UPDATE public.cse_parts_products SET price = 3755.00, image_url = '/shop/BBC-oval-port.png' WHERE part_number IN ('2100', '2101') AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET price = 3754.80, image_url = '/shop/BBC-oval-port.png' WHERE part_number = '2110' AND category = 'cylinder_head';
UPDATE public.cse_parts_products SET price = 4051.00, image_url = '/shop/BBC-oval-port.png' WHERE part_number IN ('2100-1', '2101-1') AND category = 'cylinder_head';

-- ============================================
-- SET IMAGES FOR ALL BBC HEADS BY TYPE
-- ============================================
-- BBC Enforcer heads
UPDATE public.cse_parts_products SET image_url = '/shop/bbc-enforcer.jpg' WHERE engine_family = 'Big Block Chevy' AND category = 'cylinder_head' AND name LIKE '%Enforcer%';

-- BBC Magnum CNC heads
UPDATE public.cse_parts_products SET image_url = '/shop/BBCCNC-24-degree-magnum.jpg' WHERE engine_family = 'Big Block Chevy' AND category = 'cylinder_head' AND (name LIKE '%Magnum%' OR name LIKE '%Rectangle Port%');

-- BBC Oval Port heads (catch-all for remaining BBC)
UPDATE public.cse_parts_products SET image_url = '/shop/BBC-oval-port.png' WHERE engine_family = 'Big Block Chevy' AND category = 'cylinder_head' AND (image_url IS NULL OR image_url = '' OR image_url = '/shop/BBC-race-ready.png');

-- ============================================
-- INSERT MISSING SBC ENFORCER VARIANTS (if not exists)
-- ============================================
INSERT INTO public.cse_parts_products (
  name, brand, part_number, description, category, engine_make, engine_family,
  price, fulfillment_type, supplier_name, supplier_sku,
  is_active, is_featured, slug, image_url
) 
SELECT * FROM (VALUES
  ('AFR 200cc SBC Enforcer As Cast Angle Plug - Bare', 'Air Flow Research', '1017',
   'AFR 23° SBC 200cc Enforcer As Cast Angle Plug 69cc chamber - Ready for Assembly. Sold as single head.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   488.00, 'dropship', 'Air Flow Research', '1017',
   true, false, 'afr-1017-200cc-enforcer-angle-bare', '/shop/SBC-heads-AFR.webp'),
  ('AFR 200cc SBC Enforcer As Cast Straight Plug Flat Tappet - Assembled', 'Air Flow Research', '1011-FT',
   'AFR 23° SBC 200cc Enforcer As Cast Straight Plug 69cc chamber with Flat Tappet springs - Assembled. Sold as single head.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   790.00, 'dropship', 'Air Flow Research', '1011-FT',
   true, false, 'afr-1011-ft-200cc-enforcer-flat-tappet', '/shop/SBC-heads-AFR.webp'),
  ('AFR 200cc SBC Enforcer As Cast Angle Plug Flat Tappet - Assembled', 'Air Flow Research', '1016-FT',
   'AFR 23° SBC 200cc Enforcer As Cast Angle Plug 69cc chamber with Flat Tappet springs - Assembled. Sold as single head.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   790.00, 'dropship', 'Air Flow Research', '1016-FT',
   true, false, 'afr-1016-ft-200cc-enforcer-angle-flat-tappet', '/shop/SBC-heads-AFR.webp'),
  ('AFR 180cc SBC LT1 Street CNC 54cc - Assembled', 'Air Flow Research', '909',
   'AFR 23° SBC Cylinder Head 180cc LT1 Street CNC, 54cc chambers, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   2499.00, 'dropship', 'Air Flow Research', '909',
   true, false, 'afr-909-180cc-lt1-street-54cc', '/shop/SBC-heads-AFR.webp'),
  ('AFR 195cc SBC Street CNC 65cc Angle Plug - Assembled', 'Air Flow Research', '1040',
   'AFR 23° SBC Cylinder Head 195cc Street CNC, 65cc chambers, angle plug, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   2329.00, 'dropship', 'Air Flow Research', '1040',
   true, false, 'afr-1040-195cc-street-65cc-angle', '/shop/SBC-heads-AFR.webp'),
  ('AFR 195cc SBC Street CNC 75cc Angle Plug - Assembled', 'Air Flow Research', '1038',
   'AFR 23° SBC Cylinder Head 195cc Street CNC, 75cc chambers, angle plug, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   2329.00, 'dropship', 'Air Flow Research', '1038',
   true, false, 'afr-1038-195cc-street-75cc-angle', '/shop/SBC-heads-AFR.webp'),
  ('AFR 195cc SBC Street CNC 65cc 72° Intake Bolt - Assembled', 'Air Flow Research', '1041',
   'AFR 23° SBC Cylinder Head 195cc Street CNC, 65cc chambers, 72° angle intake bolt pattern for Vortec intakes, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   2329.00, 'dropship', 'Air Flow Research', '1041',
   true, false, 'afr-1041-195cc-street-65cc-72deg', '/shop/SBC-heads-AFR.webp'),
  ('AFR 210cc SBC Race Ready CNC 65cc Spread Port - Assembled', 'Air Flow Research', '1059',
   'AFR 23° SBC Cylinder Head 210cc Race Ready CNC, 65cc chambers, spread port exhaust, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   2592.00, 'dropship', 'Air Flow Research', '1059',
   true, false, 'afr-1059-210cc-race-ready-65cc-spread', '/shop/SBC-heads-AFR.webp'),
  ('AFR 210cc SBC Race Ready CNC 75cc Spread Port - Assembled', 'Air Flow Research', '1055',
   'AFR 23° SBC Cylinder Head 210cc Race Ready CNC, 75cc chambers, spread port exhaust, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   2592.00, 'dropship', 'Air Flow Research', '1055',
   true, false, 'afr-1055-210cc-race-ready-75cc-spread', '/shop/SBC-heads-AFR.webp'),
  ('AFR 210cc SBC Competition CNC 65cc - Assembled', 'Air Flow Research', '1103',
   'AFR 23° SBC Cylinder Head 210cc Competition CNC, 65cc chambers, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   3193.00, 'dropship', 'Air Flow Research', '1103',
   true, false, 'afr-1103-210cc-comp-65cc', '/shop/SBC-heads-AFR.webp'),
  ('AFR 210cc SBC Competition CNC 65cc Spread Port - Assembled', 'Air Flow Research', '1106',
   'AFR 23° SBC Cylinder Head 210cc Competition CNC, 65cc chambers, spread port exhaust, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   3193.00, 'dropship', 'Air Flow Research', '1106',
   true, false, 'afr-1106-210cc-comp-65cc-spread', '/shop/SBC-heads-AFR.webp'),
  ('AFR 210cc SBC Competition CNC 75cc Spread Port - Assembled', 'Air Flow Research', '1105',
   'AFR 23° SBC Cylinder Head 210cc Competition CNC, 75cc chambers, spread port exhaust, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   3193.00, 'dropship', 'Air Flow Research', '1105',
   true, false, 'afr-1105-210cc-comp-75cc-spread', '/shop/SBC-heads-AFR.webp'),
  ('AFR 220cc SBC Competition CNC 75cc - Assembled', 'Air Flow Research', '1114',
   'AFR 23° SBC Cylinder Head 220cc Competition CNC, 75cc chambers, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   3279.00, 'dropship', 'Air Flow Research', '1114',
   true, false, 'afr-1114-220cc-comp-75cc', '/shop/SBC-heads-AFR.webp'),
  ('AFR 220cc SBC Race Ready CNC 75cc - Assembled', 'Air Flow Research', '1066',
   'AFR 23° SBC Cylinder Head 220cc Race Ready CNC, 75cc chambers, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   2592.00, 'dropship', 'Air Flow Research', '1066',
   true, false, 'afr-1066-220cc-race-ready-75cc', '/shop/SBC-heads-AFR.webp'),
  ('AFR 220cc SBC Competition CNC 75cc Spread Port - Assembled', 'Air Flow Research', '1115',
   'AFR 23° SBC Cylinder Head 220cc Competition CNC, 75cc chambers, spread port exhaust, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   3279.00, 'dropship', 'Air Flow Research', '1115',
   true, false, 'afr-1115-220cc-comp-75cc-spread', '/shop/SBC-heads-AFR.webp'),
  ('AFR 227cc SBC Competition CNC 75cc Spread Port - Assembled', 'Air Flow Research', '1124',
   'AFR 23° SBC Cylinder Head 227cc Competition CNC, 75cc chambers, spread port exhaust, 60/40 valve spacing, requires shaft mount rockers, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   3279.00, 'dropship', 'Air Flow Research', '1124',
   true, false, 'afr-1124-227cc-comp-75cc-spread', '/shop/SBC-heads-AFR.webp'),
  ('AFR 227cc SBC Race Ready CNC 75cc - Assembled', 'Air Flow Research', '1074',
   'AFR 23° SBC Cylinder Head 227cc Race Ready CNC, 75cc chambers, 60/40 valve spacing, requires shaft mount rockers, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   2592.00, 'dropship', 'Air Flow Research', '1074',
   true, false, 'afr-1074-227cc-race-ready-75cc', '/shop/SBC-heads-AFR.webp'),
  ('AFR 227cc SBC Competition CNC 75cc - Assembled', 'Air Flow Research', '1125',
   'AFR 23° SBC Cylinder Head 227cc Competition CNC, 75cc chambers, 60/40 valve spacing, requires shaft mount rockers, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   3279.00, 'dropship', 'Air Flow Research', '1125',
   true, false, 'afr-1125-227cc-comp-75cc', '/shop/SBC-heads-AFR.webp'),
  ('AFR 227cc SBC Race Ready CNC 75cc Spread Port - Assembled', 'Air Flow Research', '1075',
   'AFR 23° SBC Cylinder Head 227cc Race Ready CNC, 75cc chambers, spread port exhaust, 60/40 valve spacing, requires shaft mount rockers, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   2592.00, 'dropship', 'Air Flow Research', '1075',
   true, false, 'afr-1075-227cc-race-ready-75cc-spread', '/shop/SBC-heads-AFR.webp'),
  ('AFR 235cc SBC Competition CNC 80cc - Assembled', 'Air Flow Research', '1136-TI',
   'AFR 23° SBC Cylinder Head 235cc Competition CNC, 80cc chambers, titanium retainers, 60/40 valve spacing, requires shaft mount rockers, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   3821.00, 'dropship', 'Air Flow Research', '1136-TI',
   true, false, 'afr-1136-ti-235cc-comp-80cc', '/shop/SBC-heads-AFR.webp'),
  ('AFR 245cc SBC Competition CNC 80cc - Assembled', 'Air Flow Research', '1140-TI',
   'AFR 23° SBC Cylinder Head 245cc Competition CNC, 80cc chambers, titanium retainers, 60/40 valve spacing, requires shaft mount rockers, NPP (no pushrod pinch), 350 CFM @ 0.800" lift, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   4035.00, 'dropship', 'Air Flow Research', '1140-TI',
   true, false, 'afr-1140-ti-245cc-comp-80cc', '/shop/SBC-heads-AFR.webp'),
  ('AFR 195cc SBC LT1 Street CNC 65cc - Assembled', 'Air Flow Research', '1031',
   'AFR 23° SBC Cylinder Head 195cc LT1 Street CNC, 65cc chambers, 100% CNC ported. Exhaust ports and bolt location same as Gen 1 SBC. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   2499.00, 'dropship', 'Air Flow Research', '1031',
   true, false, 'afr-1031-195cc-lt1-street-65cc', '/shop/SBC-heads-AFR.webp'),
  ('AFR 195cc SBC LT1 Street CNC 54cc - Assembled', 'Air Flow Research', '1032',
   'AFR 23° SBC Cylinder Head 195cc LT1 Street CNC, 54cc chambers, 100% CNC ported. Exhaust ports and bolt location same as Gen 1 SBC. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   2499.00, 'dropship', 'Air Flow Research', '1032',
   true, false, 'afr-1032-195cc-lt1-street-54cc', '/shop/SBC-heads-AFR.webp'),
  ('AFR 195cc SBC LT4 Competition CNC 65cc - Assembled', 'Air Flow Research', '1039-716',
   'AFR 23° SBC Cylinder Head 195cc LT4 Competition CNC, 65cc chambers, 100% CNC ported. CARB EO #D-250-2. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   3399.00, 'dropship', 'Air Flow Research', '1039-716',
   true, false, 'afr-1039-716-195cc-lt4-comp-65cc', '/shop/SBC-heads-AFR.webp'),
  ('AFR 210cc SBC LT4 Competition CNC 65cc - Assembled', 'Air Flow Research', '1101',
   'AFR 23° SBC Cylinder Head 210cc LT4 Competition CNC, 65cc chambers, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   3503.00, 'dropship', 'Air Flow Research', '1101',
   true, false, 'afr-1101-210cc-lt4-comp-65cc', '/shop/SBC-heads-AFR.webp'),
  ('AFR 210cc SBC LT4 Race Ready CNC 65cc - Assembled', 'Air Flow Research', '1057',
   'AFR 23° SBC Cylinder Head 210cc LT4 Race Ready CNC, 65cc chambers, 100% CNC ported. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   2771.00, 'dropship', 'Air Flow Research', '1057',
   true, false, 'afr-1057-210cc-lt4-race-ready-65cc', '/shop/SBC-heads-AFR.webp'),
  ('AFR 195cc SBC Slinger Speedway Limited Late Model - Assembled', 'Air Flow Research', '1096',
   'AFR 195cc Slinger Speedway Limited Late Model, 62cc min chambers, 100% CNC ported, 5 angle valve job. Saves 38lbs. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   3135.00, 'dropship', 'Air Flow Research', '1096',
   true, false, 'afr-1096-195cc-slinger-assembled', '/shop/SBC-heads-AFR.webp'),
  ('AFR 195cc SBC Slinger Speedway Limited Late Model - No Parts', 'Air Flow Research', '1096NP',
   'AFR 195cc Slinger Speedway Limited Late Model, 62cc min chambers, 100% CNC ported, no parts/bare. Saves 38lbs. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   2654.00, 'dropship', 'Air Flow Research', '1096NP',
   true, false, 'afr-1096np-195cc-slinger-bare', '/shop/SBC-heads-AFR.webp'),
  ('AFR 195cc SBC Slinger Speedway Limited Late Model - No Valves', 'Air Flow Research', '1097',
   'AFR 195cc Slinger Speedway Limited Late Model, 62cc min chambers, 100% CNC ported, no valves. Saves 38lbs. Sold as pair.',
   'cylinder_head', 'Chevy', 'Small Block Chevy',
   3049.00, 'dropship', 'Air Flow Research', '1097',
   true, false, 'afr-1097-195cc-slinger-no-valves', '/shop/SBC-heads-AFR.webp'),
  ('AFR 335cc BBC Enforcer As Cast - Bare', 'Air Flow Research', '3002',
   'AFR 335cc BBC Enforcer As Cast, permanent mold technology, for 509-540ci engines below 6500 RPM. Sold as single head.',
   'cylinder_head', 'Chevy', 'Big Block Chevy',
   665.00, 'dropship', 'Air Flow Research', '3002',
   true, false, 'afr-3002-335cc-bbc-enforcer-bare', '/shop/bbc-enforcer.jpg'),
  ('AFR 335cc BBC Enforcer As Cast - Assembled', 'Air Flow Research', '3001',
   'AFR 335cc BBC Enforcer As Cast, permanent mold technology, ARP studs, PAC springs, for 509-540ci engines below 6500 RPM. Sold as single head.',
   'cylinder_head', 'Chevy', 'Big Block Chevy',
   1024.00, 'dropship', 'Air Flow Research', '3001',
   true, false, 'afr-3001-335cc-bbc-enforcer-assembled', '/shop/bbc-enforcer.jpg'),
  ('AFR 345cc BBC Rectangle Port 117cc Partial CNC - Assembled', 'Air Flow Research', '2110-1',
   'AFR 345cc BBC Rectangle Port, 117cc chambers, partial CNC intake/exhaust, 401 CFM @ 0.700" lift, for up to 572ci @ 7000 RPM. Sold as pair.',
   'cylinder_head', 'Chevy', 'Big Block Chevy',
   4051.00, 'dropship', 'Air Flow Research', '2110-1',
   true, false, 'afr-2110-1-345cc-bbc-rect-117cc', '/shop/BBCCNC-24-degree-magnum.jpg'),
  ('AFR 290cc BBC Oval Port 112cc Hydraulic Roller - Assembled', 'Air Flow Research', '3640',
   'AFR 290cc BBC Oval Port CNC, 112cc chambers, hydraulic roller springs, 375 CFM @ 0.700" lift, for up to 509ci @ 6500 RPM. Sold as pair.',
   'cylinder_head', 'Chevy', 'Big Block Chevy',
   4106.00, 'dropship', 'Air Flow Research', '3640',
   true, false, 'afr-3640-290cc-bbc-oval-hyd', '/shop/BBC-oval-port.png'),
  ('AFR 290cc BBC Oval Port 112cc Solid Roller - Assembled', 'Air Flow Research', '3650',
   'AFR 290cc BBC Oval Port CNC, 112cc chambers, solid roller springs, 375 CFM @ 0.700" lift, for up to 509ci @ 6500 RPM. Sold as pair.',
   'cylinder_head', 'Chevy', 'Big Block Chevy',
   4139.00, 'dropship', 'Air Flow Research', '3650',
   true, false, 'afr-3650-290cc-bbc-oval-solid', '/shop/BBC-oval-port.png'),
  ('AFR 300cc BBC Oval Port 112cc Hydraulic Roller - Assembled', 'Air Flow Research', '3670',
   'AFR 300cc BBC Oval Port CNC, 112cc chambers, hydraulic roller springs, 388 CFM @ 0.700" lift, for up to 540ci @ 6800 RPM. Sold as pair.',
   'cylinder_head', 'Chevy', 'Big Block Chevy',
   4194.00, 'dropship', 'Air Flow Research', '3670',
   true, false, 'afr-3670-300cc-bbc-oval-hyd', '/shop/BBC-oval-port.png'),
  ('AFR 300cc BBC Oval Port 112cc Solid Roller - Assembled', 'Air Flow Research', '3680',
   'AFR 300cc BBC Oval Port CNC, 112cc chambers, solid roller springs, 388 CFM @ 0.700" lift, for up to 540ci @ 6800 RPM. Sold as pair.',
   'cylinder_head', 'Chevy', 'Big Block Chevy',
   4337.00, 'dropship', 'Air Flow Research', '3680',
   true, false, 'afr-3680-300cc-bbc-oval-solid', '/shop/BBC-oval-port.png'),
  ('AFR 265cc BBC Oval Port 109cc Partial CNC Hydraulic - Assembled', 'Air Flow Research', '3610',
   'AFR 265cc BBC Oval Port, 109cc chambers, partial CNC, hydraulic roller springs, 354 CFM @ 0.650" lift, for up to 468ci @ 6200 RPM. Sold as pair.',
   'cylinder_head', 'Chevy', 'Big Block Chevy',
   2906.00, 'dropship', 'Air Flow Research', '3610',
   true, false, 'afr-3610-265cc-bbc-oval-partial-hyd', '/shop/BBC-oval-port.png'),
  ('AFR 265cc BBC Oval Port 109cc Partial CNC Solid - Assembled', 'Air Flow Research', '3620',
   'AFR 265cc BBC Oval Port, 109cc chambers, partial CNC, solid roller springs, 354 CFM @ 0.650" lift, for up to 468ci @ 6200 RPM. Sold as pair.',
   'cylinder_head', 'Chevy', 'Big Block Chevy',
   2941.00, 'dropship', 'Air Flow Research', '3620',
   true, false, 'afr-3620-265cc-bbc-oval-partial-solid', '/shop/BBC-oval-port.png'),
  ('AFR 265cc BBC Oval Port 109cc Full CNC Hydraulic - Assembled', 'Air Flow Research', '3610-1',
   'AFR 265cc BBC Oval Port, 109cc chambers, full CNC chambers, hydraulic roller springs, 354 CFM @ 0.650" lift, for up to 468ci @ 6200 RPM. Sold as pair.',
   'cylinder_head', 'Chevy', 'Big Block Chevy',
   3183.00, 'dropship', 'Air Flow Research', '3610-1',
   true, false, 'afr-3610-1-265cc-bbc-oval-full-hyd', '/shop/BBC-oval-port.png'),
  ('AFR 265cc BBC Oval Port 109cc Full CNC Solid - Assembled', 'Air Flow Research', '3620-1',
   'AFR 265cc BBC Oval Port, 109cc chambers, full CNC chambers, solid roller springs, 354 CFM @ 0.650" lift, for up to 468ci @ 6200 RPM. Sold as pair.',
   'cylinder_head', 'Chevy', 'Big Block Chevy',
   3214.00, 'dropship', 'Air Flow Research', '3620-1',
   true, false, 'afr-3620-1-265cc-bbc-oval-full-solid', '/shop/BBC-oval-port.png'),
  -- ============================================
  -- GEN III HEMI - 185cc ENFORCER AS-CAST (single heads)
  -- ============================================
  ('AFR 185cc Gen III Hemi Enforcer Driver Side 5.7/6.1L 69cc - Bare', 'Air Flow Research', '2511',
   'AFR 185cc As-Cast Enforcer Gen III Hemi. Ultimate OE replacement for 5.7/6.1L. A356 aluminum, permanent-mold, .750" thick deck, improved water jacketing. For hydraulic roller cams up to .600" lift. Sold as single head.',
   'cylinder_head', 'Chrysler', 'Gen III Hemi',
   1164.00, 'dropship', 'Air Flow Research', '2511',
   true, false, 'afr-2511-185cc-hemi-enforcer-driver-bare', '/shop/hemi-gen3.jpg'),
  ('AFR 185cc Gen III Hemi Enforcer Passenger Side 5.7/6.1L 69cc - Bare', 'Air Flow Research', '2512',
   'AFR 185cc As-Cast Enforcer Gen III Hemi. Ultimate OE replacement for 5.7/6.1L. A356 aluminum, permanent-mold, .750" thick deck, improved water jacketing. For hydraulic roller cams up to .600" lift. Sold as single head.',
   'cylinder_head', 'Chrysler', 'Gen III Hemi',
   1164.00, 'dropship', 'Air Flow Research', '2512',
   true, false, 'afr-2512-185cc-hemi-enforcer-pass-bare', '/shop/hemi-gen3.jpg'),
  -- ============================================
  -- GEN III HEMI - 212cc BLACK HAWK CNC (single heads)
  -- ============================================
  ('AFR 212cc Gen III Hemi Black Hawk Driver Side 5.7/6.1L 69cc - Bare', 'Air Flow Research', '2507',
   'AFR 212cc Black Hawk Gen III Hemi CNC. 100% CNC ported intake/exhaust/chambers. A356 aluminum, .750" thick deck, improved water jacketing. For hydraulic roller cams up to .600" lift. Sold as single head.',
   'cylinder_head', 'Chrysler', 'Gen III Hemi',
   1805.00, 'dropship', 'Air Flow Research', '2507',
   true, false, 'afr-2507-212cc-hemi-blackhawk-driver-57-bare', '/shop/hemi-gen3.jpg'),
  ('AFR 212cc Gen III Hemi Black Hawk Passenger Side 5.7/6.1L 69cc - Bare', 'Air Flow Research', '2508',
   'AFR 212cc Black Hawk Gen III Hemi CNC. 100% CNC ported intake/exhaust/chambers. A356 aluminum, .750" thick deck, improved water jacketing. For hydraulic roller cams up to .600" lift. Sold as single head.',
   'cylinder_head', 'Chrysler', 'Gen III Hemi',
   1805.00, 'dropship', 'Air Flow Research', '2508',
   true, false, 'afr-2508-212cc-hemi-blackhawk-pass-57-bare', '/shop/hemi-gen3.jpg'),
  ('AFR 212cc Gen III Hemi Black Hawk Driver Side 6.2/6.4L 69cc - Assembled', 'Air Flow Research', '2521',
   'AFR 212cc Black Hawk Gen III Hemi CNC. 100% CNC ported intake/exhaust/chambers. A356 aluminum, .750" thick deck, improved water jacketing. For hydraulic roller cams up to .600" lift. Sold as single head.',
   'cylinder_head', 'Chrysler', 'Gen III Hemi',
   2105.00, 'dropship', 'Air Flow Research', '2521',
   true, false, 'afr-2521-212cc-hemi-blackhawk-driver-62-assy', '/shop/hemi-gen3.jpg'),
  ('AFR 212cc Gen III Hemi Black Hawk Passenger Side 6.2/6.4L 69cc - Assembled', 'Air Flow Research', '2522',
   'AFR 212cc Black Hawk Gen III Hemi CNC. 100% CNC ported intake/exhaust/chambers. A356 aluminum, .750" thick deck, improved water jacketing. For hydraulic roller cams up to .600" lift. Sold as single head.',
   'cylinder_head', 'Chrysler', 'Gen III Hemi',
   2105.00, 'dropship', 'Air Flow Research', '2522',
   true, false, 'afr-2522-212cc-hemi-blackhawk-pass-62-assy', '/shop/hemi-gen3.jpg'),
  ('AFR 212cc Gen III Hemi Black Hawk Driver Side 6.2/6.4L 69cc - Bare', 'Air Flow Research', '2523',
   'AFR 212cc Black Hawk Gen III Hemi CNC. 100% CNC ported intake/exhaust/chambers. A356 aluminum, .750" thick deck, improved water jacketing. For hydraulic roller cams up to .600" lift. Sold as single head.',
   'cylinder_head', 'Chrysler', 'Gen III Hemi',
   1805.00, 'dropship', 'Air Flow Research', '2523',
   true, false, 'afr-2523-212cc-hemi-blackhawk-driver-62-bare', '/shop/hemi-gen3.jpg'),
  ('AFR 212cc Gen III Hemi Black Hawk Passenger Side 6.2/6.4L 69cc - Bare', 'Air Flow Research', '2524',
   'AFR 212cc Black Hawk Gen III Hemi CNC. 100% CNC ported intake/exhaust/chambers. A356 aluminum, .750" thick deck, improved water jacketing. For hydraulic roller cams up to .600" lift. Sold as single head.',
   'cylinder_head', 'Chrysler', 'Gen III Hemi',
   1805.00, 'dropship', 'Air Flow Research', '2524',
   true, false, 'afr-2524-212cc-hemi-blackhawk-pass-62-bare', '/shop/hemi-gen3.jpg'),
  -- ============================================
  -- GEN III HEMI - 224cc BLACK HAWK CNC (single heads)
  -- ============================================
  ('AFR 224cc Gen III Hemi Black Hawk Passenger Side 5.7/6.1L 69cc - Bare', 'Air Flow Research', '2516',
   'AFR 224cc Black Hawk Gen III Hemi CNC. All-out performance. 100% CNC ported intake/exhaust/chambers. A356 aluminum, .750" thick deck, improved water jacketing. For hydraulic roller cams up to .650" lift. Sold as single head.',
   'cylinder_head', 'Chrysler', 'Gen III Hemi',
   1805.00, 'dropship', 'Air Flow Research', '2516',
   true, false, 'afr-2516-224cc-hemi-blackhawk-pass-57-bare', '/shop/hemi-gen3.jpg'),
  ('AFR 224cc Gen III Hemi Black Hawk Passenger Side 6.2/6.4L 69cc - Assembled', 'Air Flow Research', '2518',
   'AFR 224cc Black Hawk Gen III Hemi CNC. All-out performance. 100% CNC ported intake/exhaust/chambers. A356 aluminum, .750" thick deck, improved water jacketing. For hydraulic roller cams up to .650" lift. Sold as single head.',
   'cylinder_head', 'Chrysler', 'Gen III Hemi',
   2105.00, 'dropship', 'Air Flow Research', '2518',
   true, false, 'afr-2518-224cc-hemi-blackhawk-pass-62-assy', '/shop/hemi-gen3.jpg'),
  ('AFR 224cc Gen III Hemi Black Hawk Passenger Side 6.2/6.4L 69cc - Bare', 'Air Flow Research', '2520',
   'AFR 224cc Black Hawk Gen III Hemi CNC. All-out performance. 100% CNC ported intake/exhaust/chambers. A356 aluminum, .750" thick deck, improved water jacketing. For hydraulic roller cams up to .650" lift. Sold as single head.',
   'cylinder_head', 'Chrysler', 'Gen III Hemi',
   1805.00, 'dropship', 'Air Flow Research', '2520',
   true, false, 'afr-2520-224cc-hemi-blackhawk-pass-62-bare', '/shop/hemi-gen3.jpg')
) AS new_heads(name, brand, part_number, description, category, engine_make, engine_family, price, fulfillment_type, supplier_name, supplier_sku, is_active, is_featured, slug, image_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.cse_parts_products WHERE slug = new_heads.slug
);