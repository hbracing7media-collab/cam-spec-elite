-- Migration: Add missing AFR cylinder head variations
-- Date: 2026-01-05
-- Source: https://www.airflowresearch.com/
-- This adds heads found on AFR website that were missing from the database

INSERT INTO cse_parts_products (
  name, brand, part_number, description, category,
  engine_make, engine_family,
  price, fulfillment_type, supplier_name, supplier_sku,
  is_active, is_featured, slug, image_url
) VALUES

-- ============================================
-- CHEVY SMALL BLOCK - 190cc VORTEC
-- (New head style - Vortec bolt pattern)
-- ============================================
('AFR 190cc SBC Vortec Street - Assembled', 'Air Flow Research', '912',
 'AFR 190cc SBC Vortec Cylinder Head, fully CNC ported, Vortec bolt pattern, 64cc chambers - Recommended for 350-383ci up to 6000 RPM',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 2392.00, 'dropship', 'Air Flow Research', '912',
 true, false, 'afr-912-190cc-vortec-sbc', '/shop/SBC-heads-AFR.webp'),

-- ============================================
-- CHEVY SMALL BLOCK LT1/LT4 - Reverse Cool
-- (Missing LT variants)
-- ============================================
('AFR 195cc SBC LT1 Reverse Cool 65cc - Assembled', 'Air Flow Research', '1039',
 'AFR 195cc SBC LT1 Reverse Cool Cylinder Head, fully CNC ported, 65cc chambers, L98 angle plug - Recommended up to 6500 RPM',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 2499.00, 'dropship', 'Air Flow Research', '1039',
 true, false, 'afr-1039-195cc-lt1-65cc', '/shop/SBC-heads-AFR.webp'),

('AFR 195cc SBC LT4 Competition 65cc - Assembled', 'Air Flow Research', '1039-716',
 'AFR 195cc SBC LT4 Competition Cylinder Head, fully CNC ported, 65cc chambers - Recommended up to 6500-6800 RPM',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 3399.00, 'dropship', 'Air Flow Research', '1039-716',
 true, false, 'afr-1039-716-195cc-lt4-comp', '/shop/SBC-heads-AFR.webp'),

('AFR 210cc SBC LT4 Competition 65cc - Assembled', 'Air Flow Research', '1055-716',
 'AFR 210cc SBC LT4 Competition Cylinder Head, fully CNC ported, 65cc chambers - Recommended up to 6500-6800 RPM',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 3399.00, 'dropship', 'Air Flow Research', '1055-716',
 true, false, 'afr-1055-716-210cc-lt4-comp', '/shop/SBC-heads-AFR.webp'),

('AFR 227cc SBC LT4 Race Ready 65cc - Assembled', 'Air Flow Research', '1076',
 'AFR 227cc SBC LT4 Race Ready Cylinder Head, partially CNC ported, 65cc chambers, 60/40 valve spacing - Requires shaft mount rockers',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 2771.00, 'dropship', 'Air Flow Research', '1076',
 true, false, 'afr-1076-227cc-lt4-race', '/shop/SBC-heads-AFR.webp'),

('AFR 227cc SBC LT4 Competition 65cc - Assembled', 'Air Flow Research', '1076-716',
 'AFR 227cc SBC LT4 Competition Cylinder Head, fully CNC ported, 65cc chambers, 60/40 valve spacing - Requires shaft mount rockers',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 3503.00, 'dropship', 'Air Flow Research', '1076-716',
 true, false, 'afr-1076-716-227cc-lt4-comp', '/shop/SBC-heads-AFR.webp'),

-- ============================================
-- CHEVY BIG BLOCK - OVAL PORT
-- (Missing oval port heads)
-- ============================================
('AFR 265cc BBC Oval Port Race Ready 117cc - Assembled', 'Air Flow Research', '2050',
 'AFR 24° BBC Oval Port Cylinder Head 265cc, partially CNC ported, 117cc chambers - High velocity torque monster for street/towing up to 468ci',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 2906.00, 'dropship', 'Air Flow Research', '2050',
 true, false, 'afr-2050-265cc-oval-bbc', '/shop/bbc-enforcer.jpg'),

('AFR 265cc BBC Oval Port Competition 117cc - Assembled', 'Air Flow Research', '2055',
 'AFR 24° BBC Oval Port Cylinder Head 265cc, fully CNC ported chambers, 117cc chambers - Recommended up to 468ci at 6200 RPM',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 3214.00, 'dropship', 'Air Flow Research', '2055',
 true, false, 'afr-2055-265cc-oval-comp-bbc', '/shop/bbc-enforcer.jpg'),

('AFR 290cc BBC Oval Port Competition 117cc - Assembled', 'Air Flow Research', '2060',
 'AFR 24° BBC Oval Port Cylinder Head 290cc, fully CNC ported, 117cc chambers - 375 CFM at 0.700" lift, recommended up to 509ci at 6500 RPM',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 4106.00, 'dropship', 'Air Flow Research', '2060',
 true, false, 'afr-2060-290cc-oval-bbc', '/shop/bbc-enforcer.jpg'),

('AFR 300cc BBC Oval Port Competition 121cc - Assembled', 'Air Flow Research', '2070',
 'AFR 24° BBC Oval Port Cylinder Head 300cc, fully CNC ported, 121cc chambers - 388 CFM at 0.700" lift, recommended up to 540ci at 6800 RPM',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 4194.00, 'dropship', 'Air Flow Research', '2070',
 true, true, 'afr-2070-300cc-oval-bbc', '/shop/bbc-enforcer.jpg'),

-- ============================================
-- CHEVY BIG BLOCK - ENFORCER AS CAST
-- (Missing Enforcer head)
-- ============================================
('AFR 335cc BBC Enforcer - Assembled', 'Air Flow Research', '3001',
 'AFR 24° BBC 335cc Enforcer As Cast Cylinder Head, 121cc chambers - Budget friendly for 509-540ci up to 6500 RPM',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 1024.00, 'dropship', 'Air Flow Research', '3001',
 true, true, 'afr-3001-335cc-enforcer-bbc', '/shop/bbc-enforcer.jpg'),

('AFR 335cc BBC Enforcer - Bare', 'Air Flow Research', '3002',
 'AFR 24° BBC 335cc Enforcer As Cast Cylinder Head, 121cc chambers - Ready for assembly',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 665.00, 'dropship', 'Air Flow Research', '3002',
 true, false, 'afr-3002-335cc-enforcer-bbc-bare', '/shop/bbc-enforcer.jpg'),

-- ============================================
-- CHEVY BIG BLOCK 18° RACING
-- (High performance 18° head)
-- ============================================
('AFR 457cc BBC 18° Racing 90cc - Assembled', 'Air Flow Research', '3708',
 'AFR 18° BBC 457cc Racing Cylinder Head, fully CNC ported, 90cc chambers, .500 raised intake port, 2.400/1.800 valves - For 540ci+ race engines',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 3274.00, 'dropship', 'Air Flow Research', '3708',
 true, true, 'afr-3708-457cc-18deg-bbc', '/shop/BBCCNC-24-degree-magnum.jpg'),

-- ============================================
-- FORD BIG BLOCK - BBF BULLITT
-- (Missing 295cc variant)
-- ============================================
('AFR 295cc BBF Bullitt - Assembled', 'Air Flow Research', '3825',
 'AFR 295cc BBF Bullitt Cylinder Head, fully CNC ported, standard or .250 raised exhaust - Recommended for 512ci up to 6500 RPM',
 'cylinder_head', 'Ford', 'BBF',
 3392.00, 'dropship', 'Air Flow Research', '3825',
 true, false, 'afr-3825-295cc-bullitt-bbf', '/shop/BBF-heads.png'),

('AFR 280cc BBF Bullitt Race Ready - Assembled', 'Air Flow Research', '3801',
 'AFR 280cc BBF Bullitt Cylinder Head, partially CNC ported, standard exhaust locations - Recommended for street/towing up to 477ci at 6200 RPM',
 'cylinder_head', 'Ford', 'BBF',
 2854.00, 'dropship', 'Air Flow Research', '3801',
 true, false, 'afr-3801-280cc-bullitt-bbf', '/shop/BBF-heads.png'),

('AFR 315cc BBF Bullitt CNC .250 Raised - Assembled', 'Air Flow Research', '3850',
 'AFR 315cc BBF Bullitt Cylinder Head, fully CNC ported, .250 raised exhaust - AFR''s largest and best flowing BBF head for racing/Pro Street',
 'cylinder_head', 'Ford', 'BBF',
 3668.00, 'dropship', 'Air Flow Research', '3850',
 true, true, 'afr-3850-315cc-bullitt-bbf-raised', '/shop/BBF-heads.png'),

('AFR 315cc BBF Bullitt CNC .625 Raised - Assembled', 'Air Flow Research', '3855',
 'AFR 315cc BBF Bullitt Cylinder Head, fully CNC ported, .625 raised exhaust - Maximum airflow for large displacement BBF racing engines',
 'cylinder_head', 'Ford', 'BBF',
 3779.00, 'dropship', 'Air Flow Research', '3855',
 true, false, 'afr-3855-315cc-bullitt-bbf-high-raised', '/shop/BBF-heads.png'),

-- ============================================
-- FORD SMALL BLOCK - MISSING VARIANTS
-- ============================================
('AFR 185cc SBF Street 58cc CNC - Assembled', 'Air Flow Research', '1429',
 'AFR 185cc SBF Street Cylinder Head, fully CNC ported, 58cc chambers - Recommended for 302-393ci up to 6000-6500 RPM, CARB EO #D-250-3',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 2947.00, 'dropship', 'Air Flow Research', '1429',
 true, false, 'afr-1429-185cc-street-sbf', '/shop/SBF-Heads-AFR.png'),

('AFR 185cc SBF Enforcer Small Valve - Assembled', 'Air Flow Research', '1353',
 'AFR 185cc SBF Enforcer Cylinder Head with 1.900" intake valve, compatible with OEM piston valve relief - Perfect for 302-363ci up to 6000 RPM',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 768.00, 'dropship', 'Air Flow Research', '1353',
 true, false, 'afr-1353-185cc-enforcer-small-valve-sbf', '/shop/SBF-Heads-AFR.png'),

('AFR 185cc SBF Enforcer Small Valve - Bare', 'Air Flow Research', '1354',
 'AFR 185cc SBF Enforcer Cylinder Head with 1.900" intake valve - Bare, ready for assembly',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 499.00, 'dropship', 'Air Flow Research', '1354',
 true, false, 'afr-1354-185cc-enforcer-small-valve-sbf-bare', '/shop/SBF-Heads-AFR.png'),

-- ============================================
-- MOPAR GEN 3 HEMI - STREET HAWK (NEW!)
-- ============================================
('AFR 195cc Gen 3 Hemi Street Hawk Driver - Assembled', 'Air Flow Research', '2520',
 'AFR 195cc Gen 3 Hemi Street Hawk Driver Side, street performance CNC ported, 68cc chambers - Perfect for stock/mildly modified 5.7L/6.1L',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 1478.00, 'dropship', 'Air Flow Research', '2520',
 true, true, 'afr-2520-195cc-street-hawk-hemi-driver', NULL),

('AFR 195cc Gen 3 Hemi Street Hawk Passenger - Assembled', 'Air Flow Research', '2521',
 'AFR 195cc Gen 3 Hemi Street Hawk Passenger Side, street performance CNC ported, 68cc chambers - Perfect for stock/mildly modified 5.7L/6.1L',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 1478.00, 'dropship', 'Air Flow Research', '2521',
 true, false, 'afr-2521-195cc-street-hawk-hemi-passenger', NULL),

('AFR 195cc Gen 3 Hemi Street Hawk Driver - Bare', 'Air Flow Research', '2522',
 'AFR 195cc Gen 3 Hemi Street Hawk Driver Side, street performance CNC ported, 68cc chambers - Ready for assembly',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 1254.00, 'dropship', 'Air Flow Research', '2522',
 true, false, 'afr-2522-195cc-street-hawk-hemi-driver-bare', NULL),

('AFR 195cc Gen 3 Hemi Street Hawk Passenger - Bare', 'Air Flow Research', '2523',
 'AFR 195cc Gen 3 Hemi Street Hawk Passenger Side, street performance CNC ported, 68cc chambers - Ready for assembly',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 1254.00, 'dropship', 'Air Flow Research', '2523',
 true, false, 'afr-2523-195cc-street-hawk-hemi-passenger-bare', NULL),

-- ============================================
-- MOPAR GEN 3 HEMI - BARE OPTIONS
-- ============================================
('AFR 185cc Gen 3 Hemi Driver - Bare', 'Air Flow Research', '2507',
 'AFR 185cc Gen 3 Hemi As Cast Driver Side, 69cc chambers - Ready for assembly',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 1164.00, 'dropship', 'Air Flow Research', '2507',
 true, false, 'afr-2507-185cc-hemi-driver-bare', NULL),

('AFR 185cc Gen 3 Hemi Passenger - Bare', 'Air Flow Research', '2508',
 'AFR 185cc Gen 3 Hemi As Cast Passenger Side, 69cc chambers - Ready for assembly',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 1164.00, 'dropship', 'Air Flow Research', '2508',
 true, false, 'afr-2508-185cc-hemi-passenger-bare', NULL),

('AFR 212cc Gen 3 Hemi CNC Driver - Bare', 'Air Flow Research', '2503',
 'AFR 212cc Gen 3 Hemi Full CNC Driver Side, 66cc chambers - Ready for assembly',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 1805.00, 'dropship', 'Air Flow Research', '2503',
 true, false, 'afr-2503-212cc-hemi-cnc-driver-bare', NULL),

('AFR 212cc Gen 3 Hemi CNC Passenger - Bare', 'Air Flow Research', '2504',
 'AFR 212cc Gen 3 Hemi Full CNC Passenger Side, 69cc chambers - Ready for assembly',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 1805.00, 'dropship', 'Air Flow Research', '2504',
 true, false, 'afr-2504-212cc-hemi-cnc-passenger-bare', NULL),

('AFR 224cc Gen 3 Hemi CNC Driver - Bare', 'Air Flow Research', '2511',
 'AFR 224cc Gen 3 Hemi Full CNC Driver Side, 69cc chambers - Ready for assembly, Hellcat supercharger compatible with machine option',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 1805.00, 'dropship', 'Air Flow Research', '2511',
 true, false, 'afr-2511-224cc-hemi-cnc-driver-bare', NULL),

('AFR 224cc Gen 3 Hemi CNC Passenger - Bare', 'Air Flow Research', '2512',
 'AFR 224cc Gen 3 Hemi Full CNC Passenger Side, 69cc chambers - Ready for assembly, Hellcat supercharger compatible with machine option',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 1805.00, 'dropship', 'Air Flow Research', '2512',
 true, false, 'afr-2512-224cc-hemi-cnc-passenger-bare', NULL)

ON CONFLICT (slug) DO NOTHING;
