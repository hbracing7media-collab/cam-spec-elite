-- Seed AFR (Air Flow Research) Cylinder Heads
-- Category: cylinder_head
-- Multiple engine families: SBC, SBF, BBC, LS, Mopar
-- Images from AFR 2020 dealer catalog

INSERT INTO cse_parts_products (
  name, brand, part_number, description, category,
  engine_make, engine_family,
  price, fulfillment_type, supplier_name, supplier_sku,
  is_active, is_featured, slug, image_url
) VALUES

-- ============================================
-- CHEVY SMALL BLOCK (23°) - ENFORCER SERIES
-- ============================================
('AFR 200cc Enforcer SBC Head - Assembled', 'Air Flow Research', '1011',
 'AFR 23° SBC 200cc Enforcer As Cast Straight Plug 69cc chamber - Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 789.60, 'dropship', 'Air Flow Research', '1011',
 true, true, 'afr-1011-200cc-enforcer-sbc', '/shop/afr-heads/afr-1011.png'),

('AFR 200cc Enforcer SBC Head - Bare', 'Air Flow Research', '1012',
 'AFR 23° SBC 200cc Enforcer As Cast Straight Plug 69cc chamber - Ready for Assembly',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 488.25, 'dropship', 'Air Flow Research', '1012',
 true, false, 'afr-1012-200cc-enforcer-sbc-bare', '/shop/afr-heads/afr-sbc-head.png'),

('AFR 200cc Enforcer SBC Angle Plug - Assembled', 'Air Flow Research', '1016',
 'AFR 23° SBC 200cc Enforcer As Cast Angle Plug 69cc chamber - Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 789.60, 'dropship', 'Air Flow Research', '1016',
 true, false, 'afr-1016-200cc-enforcer-angle', '/shop/afr-heads/afr-sbc-head.png'),

-- ============================================
-- CHEVY SMALL BLOCK (23°) - 180cc STREET
-- ============================================
('AFR 180cc SBC Street Head 75cc - Assembled', 'Air Flow Research', '0911',
 'AFR 23° SBC Cylinder Head 180cc Street Heads, straight plug w/heat riser, 75cc, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 2328.90, 'dropship', 'Air Flow Research', '0911',
 true, false, 'afr-0911-180cc-street-75cc', '/shop/afr-heads/afr-0911.png'),

('AFR 180cc SBC Street Head 65cc - Assembled', 'Air Flow Research', '0916',
 'AFR 23° SBC Cylinder Head 180cc Street Heads, straight plug w/heat riser, 65cc, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 2328.90, 'dropship', 'Air Flow Research', '0916',
 true, false, 'afr-0916-180cc-street-65cc', '/shop/afr-heads/afr-0916.png'),

('AFR 180cc SBC LT1 Reverse Cool 65cc - Assembled', 'Air Flow Research', '908',
 'AFR 23° SBC Cylinder Head 180cc LT1 Reverse Cool Heads, 65cc chambers, L98 angle plug, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 2499.00, 'dropship', 'Air Flow Research', '908',
 true, false, 'afr-908-180cc-lt1-65cc', '/shop/afr-heads/afr-sbc-head.png'),

-- ============================================
-- CHEVY SMALL BLOCK (23°) - 195cc STREET
-- ============================================
('AFR 195cc SBC Street Head 65cc - Assembled', 'Air Flow Research', '1034',
 'AFR 23° SBC Cylinder Head 195cc Street Heads, straight plug w/heat riser, 65cc, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 2328.90, 'dropship', 'Air Flow Research', '1034',
 true, true, 'afr-1034-195cc-street-65cc', '/shop/afr-heads/afr-1034.png'),

('AFR 195cc SBC Street Head 75cc - Assembled', 'Air Flow Research', '1036',
 'AFR 23° SBC Cylinder Head 195cc Street Heads, straight plug w/heat riser, 75cc, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 2328.90, 'dropship', 'Air Flow Research', '1036',
 true, false, 'afr-1036-195cc-street-75cc', '/shop/afr-heads/afr-1036.png'),

('AFR 195cc SBC Competition 65cc - Assembled', 'Air Flow Research', '1095-716',
 'AFR 23° SBC Cylinder Head 195cc Competition Package Heads w/heat riser, L98 angle plug, 65cc chambers, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 3166.80, 'dropship', 'Air Flow Research', '1095-716',
 true, false, 'afr-1095-195cc-comp-65cc', '/shop/afr-heads/afr-1095-716.png'),

-- ============================================
-- CHEVY SMALL BLOCK (23°) - 210cc RACE READY
-- ============================================
('AFR 210cc SBC Race Ready 75cc - Assembled', 'Air Flow Research', '1050',
 'AFR 23° SBC Cylinder Head 210cc Race Ready Heads, standard exhaust, 75cc chambers, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 2592.45, 'dropship', 'Air Flow Research', '1050',
 true, false, 'afr-1050-210cc-race-75cc', '/shop/afr-heads/afr-1050.png'),

('AFR 210cc SBC Race Ready 65cc - Assembled', 'Air Flow Research', '1054',
 'AFR 23° SBC Cylinder Head 210cc Race Ready Heads, standard exhaust, 65cc chambers, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 2592.45, 'dropship', 'Air Flow Research', '1054',
 true, false, 'afr-1054-210cc-race-65cc', '/shop/afr-heads/afr-1054.png'),

('AFR 210cc SBC Competition 75cc - Assembled', 'Air Flow Research', '1100',
 'AFR 23° SBC Cylinder Head 210cc Competition Package Heads, standard exhaust, 75cc chambers, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 3193.05, 'dropship', 'Air Flow Research', '1100',
 true, false, 'afr-1100-210cc-comp-75cc', '/shop/afr-heads/afr-1100.png'),

-- ============================================
-- CHEVY SMALL BLOCK (23°) - 220cc
-- ============================================
('AFR 220cc SBC Race Ready 65cc - Assembled', 'Air Flow Research', '1065',
 'AFR 23° SBC Cylinder Head 220cc Race Ready Heads, standard exhaust, 65cc chambers, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 2592.45, 'dropship', 'Air Flow Research', '1065',
 true, false, 'afr-1065-220cc-race-65cc', '/shop/afr-heads/afr-1065.png'),

('AFR 220cc SBC Competition 65cc - Assembled', 'Air Flow Research', '1110',
 'AFR 23° SBC Cylinder Head 220cc Competition Package Heads, standard exhaust, 65cc chambers, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 3279.15, 'dropship', 'Air Flow Research', '1110',
 true, false, 'afr-1110-220cc-comp-65cc', '/shop/afr-heads/afr-1110.png'),

-- ============================================
-- CHEVY SMALL BLOCK (23°) - 227cc
-- ============================================
('AFR 227cc SBC Race Ready 65cc - Assembled', 'Air Flow Research', '1068',
 'AFR 23° SBC Cylinder Head 227cc Race Ready Heads, standard exhaust, 65cc chambers, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 2592.45, 'dropship', 'Air Flow Research', '1068',
 true, false, 'afr-1068-227cc-race-65cc', '/shop/afr-heads/afr-1068.png'),

('AFR 227cc SBC Competition 65cc - Assembled', 'Air Flow Research', '1121',
 'AFR 23° SBC Cylinder Head 227cc Competition Package Heads, standard exhaust, 65cc chambers, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 3279.15, 'dropship', 'Air Flow Research', '1121',
 true, false, 'afr-1121-227cc-comp-65cc', '/shop/afr-heads/afr-1121.png'),

-- ============================================
-- CHEVY SMALL BLOCK (23°) - 235cc & 245cc
-- ============================================
('AFR 235cc SBC Competition 70cc - Assembled', 'Air Flow Research', '1132-TI',
 'AFR 23° SBC Cylinder Head 235cc Competition Package Heads, standard exhaust, 70cc chambers, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 3820.95, 'dropship', 'Air Flow Research', '1132-TI',
 true, false, 'afr-1132-235cc-comp-70cc', '/shop/afr-heads/afr-1132-ti.png'),

('AFR 245cc SBC Competition 70cc - Assembled', 'Air Flow Research', '1137-TI',
 'AFR 23° SBC Cylinder Head 245cc Competition Package Heads, standard exhaust, 70cc chambers, Assembled',
 'cylinder_head', 'Chevy', 'Small Block Chevy',
 4035.15, 'dropship', 'Air Flow Research', '1137-TI',
 true, false, 'afr-1137-245cc-comp-70cc', '/shop/afr-heads/afr-1137-ti.png'),

-- ============================================
-- FORD SMALL BLOCK (20°) - ENFORCER
-- ============================================
('AFR 185cc SBF Enforcer - Assembled', 'Air Flow Research', '1351',
 'AFR 20° SBF 185 Enforcer Street As Cast 64cc chambers - Assembled',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 767.55, 'dropship', 'Air Flow Research', '1351',
 true, true, 'afr-1351-185cc-enforcer-sbf', '/shop/afr-heads/afr-1351.png'),

('AFR 185cc SBF Enforcer - Bare', 'Air Flow Research', '1352',
 'AFR 20° SBF 185 Enforcer Street As Cast 64cc chambers - NO PARTS',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 498.75, 'dropship', 'Air Flow Research', '1352',
 true, false, 'afr-1352-185cc-enforcer-sbf-bare', '/shop/afr-heads/afr-1352.png'),

-- ============================================
-- FORD SMALL BLOCK (20°) - 165cc STREET
-- ============================================
('AFR 165cc SBF Street 58cc Stud - Assembled', 'Air Flow Research', '1402',
 'AFR 20° SBF Cylinder Head 165cc, Street Heads, 58cc chambers, Stud Mount, Assembled',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 2328.90, 'dropship', 'Air Flow Research', '1402',
 true, false, 'afr-1402-165cc-street-58cc', '/shop/afr-heads/afr-1402.png'),

('AFR 165cc SBF Street 58cc Pedestal - Assembled', 'Air Flow Research', '1472',
 'AFR 20° SBF Cylinder Head 165cc, Street Heads, 58cc chambers, Pedestal Mount, Assembled',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 2328.90, 'dropship', 'Air Flow Research', '1472',
 true, false, 'afr-1472-165cc-street-pedestal', '/shop/afr-heads/afr-1472.png'),

-- ============================================
-- FORD SMALL BLOCK (20°) - 185cc STREET
-- ============================================
('AFR 185cc SBF Street 58cc Stud - Assembled', 'Air Flow Research', '1422',
 'AFR 20° SBF Cylinder Head 185cc, Street Heads, 58cc chambers, Stud Mount, Assembled',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 2328.90, 'dropship', 'Air Flow Research', '1422',
 true, true, 'afr-1422-185cc-street-58cc', '/shop/afr-heads/afr-1422.png'),

('AFR 185cc SBF Street 72cc Stud - Assembled', 'Air Flow Research', '1420',
 'AFR 20° SBF Cylinder Head 185cc, Street Heads, 72cc chambers, Stud Mount, Assembled',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 2328.90, 'dropship', 'Air Flow Research', '1420',
 true, false, 'afr-1420-185cc-street-72cc', '/shop/afr-heads/afr-1420.png'),

-- ============================================
-- FORD SMALL BLOCK (20°) - 195cc COMPETITION
-- ============================================
('AFR 195cc SBF Competition 58cc - Assembled', 'Air Flow Research', '1426-716',
 'AFR 20° SBF Cylinder Head 195cc Competition Package, 58cc chambers, Stud Mount, Assembled',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 2947.35, 'dropship', 'Air Flow Research', '1426-716',
 true, false, 'afr-1426-195cc-comp-58cc', '/shop/afr-heads/afr-1426-716.png'),

('AFR 195cc SBF Competition 72cc - Assembled', 'Air Flow Research', '1428-716',
 'AFR 20° SBF Cylinder Head 195cc Competition Package, 72cc chambers, Stud Mount, Assembled',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 2947.35, 'dropship', 'Air Flow Research', '1428-716',
 true, false, 'afr-1428-195cc-comp-72cc', '/shop/afr-heads/afr-1428-716.png'),

-- ============================================
-- FORD SMALL BLOCK (20°) - 205cc & 220cc COMPETITION
-- ============================================
('AFR 205cc SBF Competition 58cc - Assembled', 'Air Flow Research', '1450',
 'AFR 20° SBF Cylinder Head 205cc Competition Package, 58cc chambers, Stud Mount, Assembled',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 3014.55, 'dropship', 'Air Flow Research', '1450',
 true, false, 'afr-1450-205cc-comp-58cc', '/shop/afr-heads/afr-1450.png'),

('AFR 220cc SBF Competition 58cc - Assembled', 'Air Flow Research', '1451',
 'AFR 20° SBF Cylinder Head 220cc Competition Package, 58cc chambers, Stud Mount, Assembled',
 'cylinder_head', 'Ford', 'Small Block Windsor',
 3143.70, 'dropship', 'Air Flow Research', '1451',
 true, false, 'afr-1451-220cc-comp-58cc', '/shop/afr-heads/afr-1451.png'),

-- ============================================
-- GM LS CATHEDRAL PORT (15°) - ENFORCER
-- ============================================
('AFR 210cc LS Enforcer - Assembled', 'Air Flow Research', '1501',
 'AFR 15° LSx 210cc Enforcer As Cast 64cc chambers - Assembled',
 'cylinder_head', 'Chevy', 'LS',
 780.15, 'dropship', 'Air Flow Research', '1501',
 true, true, 'afr-1501-210cc-enforcer-ls', '/shop/afr-heads/afr-1501.png'),

('AFR 210cc LS Enforcer - Bare', 'Air Flow Research', '1502',
 'AFR 15° LSx 210cc Enforcer As Cast 64cc chambers - NO PARTS',
 'cylinder_head', 'Chevy', 'LS',
 562.80, 'dropship', 'Air Flow Research', '1502',
 true, false, 'afr-1502-210cc-enforcer-ls-bare', '/shop/afr-heads/afr-1502.png'),

('AFR 210cc LS Enforcer 4.8/5.3 - Assembled', 'Air Flow Research', '1506',
 'AFR 15° LSx 210cc Enforcer As Cast 64cc chambers, 4.8/5.3 small bore - Assembled',
 'cylinder_head', 'Chevy', 'LS',
 780.15, 'dropship', 'Air Flow Research', '1506',
 true, false, 'afr-1506-210cc-enforcer-ls-small', '/shop/afr-heads/afr-ls-head.png'),

-- ============================================
-- GM LS CATHEDRAL PORT (15°) - CNC PORTED
-- ============================================
('AFR 205cc LS CNC 5.7 Small Bore - Assembled', 'Air Flow Research', '1510',
 'AFR 15° LS Cathedral Port Cylinder Head 205cc fully CNC ported, 66cc chambers, 5.7 Small Bore, Assembled',
 'cylinder_head', 'Chevy', 'LS',
 3057.60, 'dropship', 'Air Flow Research', '1510',
 true, false, 'afr-1510-205cc-cnc-ls', '/shop/afr-heads/afr-1510.png'),

('AFR 215cc LS CNC Large Bore - Assembled', 'Air Flow Research', '1530',
 'AFR 15° LS Cathedral Port Cylinder Head 215cc fully CNC ported, 65cc chambers, Large Bore, Assembled',
 'cylinder_head', 'Chevy', 'LS',
 3148.95, 'dropship', 'Air Flow Research', '1530',
 true, false, 'afr-1530-215cc-cnc-ls', '/shop/afr-heads/afr-1530.png'),

('AFR 230cc LS CNC 62cc - Assembled', 'Air Flow Research', '1610',
 'AFR 15° LS Cathedral Port Cylinder Head 230cc fully CNC ported, 62cc chambers, Big Bore, Assembled',
 'cylinder_head', 'Chevy', 'LS',
 3332.70, 'dropship', 'Air Flow Research', '1610',
 true, true, 'afr-1610-230cc-cnc-ls', '/shop/afr-heads/afr-1610.png'),

('AFR 245cc LS CNC 65cc - Assembled', 'Air Flow Research', '1680',
 'AFR 15° LS Cathedral Port Cylinder Head 245cc fully CNC ported, 65cc chambers, Large Bore, Assembled',
 'cylinder_head', 'Chevy', 'LS',
 3460.80, 'dropship', 'Air Flow Research', '1680',
 true, false, 'afr-1680-245cc-cnc-ls', '/shop/afr-heads/afr-1680.png'),

-- ============================================
-- GM LS3 RECTANGLE PORT (12°)
-- ============================================
('AFR 238cc LS3 Enforcer - Assembled', 'Air Flow Research', '1803',
 'AFR 12° LS3 Enforcer As Cast 238cc Int Runner, 72cc Chamber, Assembled',
 'cylinder_head', 'Chevy', 'LS3',
 834.75, 'dropship', 'Air Flow Research', '1803',
 true, true, 'afr-1803-238cc-enforcer-ls3', '/shop/afr-heads/afr-ls3-head.png'),

('AFR 238cc LS3 Enforcer - Bare', 'Air Flow Research', '1804',
 'AFR 12° LS3 Enforcer As Cast, 238cc Int Runner, 72cc Chamber, Bare',
 'cylinder_head', 'Chevy', 'LS3',
 681.45, 'dropship', 'Air Flow Research', '1804',
 true, false, 'afr-1804-238cc-enforcer-ls3-bare', '/shop/afr-heads/afr-ls3-head.png'),

('AFR 260cc LS3 CNC 69cc 6-Bolt - Assembled', 'Air Flow Research', '1840',
 'AFR 12° LS3 Head 260cc, fully CNC ported, 69cc chambers, 6 BOLT, Assembled',
 'cylinder_head', 'Chevy', 'LS3',
 3490.20, 'dropship', 'Air Flow Research', '1840',
 true, false, 'afr-1840-260cc-cnc-ls3-6bolt', '/shop/afr-heads/afr-1840.png'),

('AFR 260cc LS3 CNC 69cc - Assembled', 'Air Flow Research', '1845',
 'AFR 12° LS3 Head 260cc, fully CNC ported, 69cc chambers, Assembled',
 'cylinder_head', 'Chevy', 'LS3',
 3490.20, 'dropship', 'Air Flow Research', '1845',
 true, false, 'afr-1845-260cc-cnc-ls3', '/shop/afr-heads/afr-1845.png'),

-- ============================================
-- CHEVY BIG BLOCK (24°) - CNC PORTED
-- ============================================
('AFR 315cc BBC CNC 121cc - Assembled', 'Air Flow Research', '2000',
 'AFR 24° BBC Cylinder Head 315cc fully CNC ported, 121cc Chambers, Competition Package, Assembled',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 4938.15, 'dropship', 'Air Flow Research', '2000',
 true, false, 'afr-2000-315cc-cnc-bbc', '/shop/afr-heads/afr-bbc-head.png'),

('AFR 335cc BBC CNC 121cc - Assembled', 'Air Flow Research', '2001',
 'AFR 24° BBC Cylinder Head 335cc fully CNC ported, 121cc Chambers, Competition Package, Assembled',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 4938.15, 'dropship', 'Air Flow Research', '2001',
 true, false, 'afr-2001-335cc-cnc-bbc', '/shop/afr-heads/afr-bbc-head.png'),

('AFR 357cc BBC CNC 121cc - Assembled', 'Air Flow Research', '2010-TI',
 'AFR 24° BBC Cylinder Head 357cc fully CNC ported, 121cc Chambers, Competition Package, Assembled',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 5184.90, 'dropship', 'Air Flow Research', '2010-TI',
 true, true, 'afr-2010-357cc-cnc-bbc', '/shop/afr-heads/afr-bbc-head.png'),

('AFR 377cc BBC CNC 121cc - Assembled', 'Air Flow Research', '2015-TI',
 'AFR 24° BBC Cylinder Head 377cc fully CNC ported, 121cc chambers, Competition Package, Assembled',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 5344.50, 'dropship', 'Air Flow Research', '2015-TI',
 true, false, 'afr-2015-377cc-cnc-bbc', '/shop/afr-heads/afr-bbc-head.png'),

('AFR 385cc BBC CNC 121cc - Assembled', 'Air Flow Research', '2020-TI',
 'AFR 24° BBC Cylinder Head 385cc fully CNC ported, 121cc Chambers, Competition Package, Assembled',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 5344.50, 'dropship', 'Air Flow Research', '2020-TI',
 true, false, 'afr-2020-385cc-cnc-bbc', '/shop/afr-heads/afr-bbc-head.png'),

-- ============================================
-- CHEVY BIG BLOCK (24°) - RACE READY
-- ============================================
('AFR 305cc BBC Race Ready 117cc - Assembled', 'Air Flow Research', '2100',
 'AFR 24° BBC Cylinder Head 305cc Partially CNC Ported, 117cc Chambers, Race Ready, Assembled',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 3754.80, 'dropship', 'Air Flow Research', '2100',
 true, false, 'afr-2100-305cc-race-bbc', '/shop/afr-heads/afr-bbc-head.png'),

('AFR 325cc BBC Race Ready 117cc - Assembled', 'Air Flow Research', '2101',
 'AFR 24° BBC Cylinder Head 325cc Partially CNC Ported, 117cc Chambers, Race Ready, Assembled',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 3754.80, 'dropship', 'Air Flow Research', '2101',
 true, false, 'afr-2101-325cc-race-bbc', '/shop/afr-heads/afr-bbc-head.png'),

('AFR 345cc BBC Race Ready 117cc - Assembled', 'Air Flow Research', '2110',
 'AFR 24° BBC Cylinder Head 345cc Partially CNC Ported, 117cc chambers, Race Ready, Assembled',
 'cylinder_head', 'Chevy', 'Big Block Chevy',
 3754.80, 'dropship', 'Air Flow Research', '2110',
 true, false, 'afr-2110-345cc-race-bbc', '/shop/afr-heads/afr-bbc-head.png'),

-- ============================================
-- MOPAR SMALL BLOCK LA
-- Note: No images in 2020 catalog, using BBC fallback
-- ============================================
('AFR 175cc Mopar LA Enforcer - Assembled', 'Air Flow Research', '2401',
 'AFR 175cc SB Mopar LA Enforcer Cylinder Head - AS Cast - 62cc Chamber, Assembled, Sold Each',
 'cylinder_head', 'Mopar', 'Small Block LA',
 933.45, 'dropship', 'Air Flow Research', '2401',
 true, true, 'afr-2401-175cc-enforcer-mopar', '/shop/afr-heads/afr-bbc-head.png'),

('AFR 175cc Mopar LA Enforcer - Bare', 'Air Flow Research', '2402',
 'AFR 175cc SB Mopar LA Enforcer Cylinder Head - AS Cast - 62cc Chamber, Ready for Assembly, Sold Each',
 'cylinder_head', 'Mopar', 'Small Block LA',
 627.90, 'dropship', 'Air Flow Research', '2402',
 true, false, 'afr-2402-175cc-enforcer-mopar-bare', '/shop/afr-heads/afr-bbc-head.png'),

-- ============================================
-- MOPAR GEN 3 HEMI
-- Note: No images in 2020 catalog, using BBC fallback
-- ============================================
('AFR 185cc Gen 3 Hemi Driver - Assembled', 'Air Flow Research', '2509',
 'AFR 185cc Gen 3 Hemi - As Cast - 69cc Chamber Driver Side, Assembled (5.7 - 2003/current & 6.1 2005/2010)',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 1464.00, 'dropship', 'Air Flow Research', '2509',
 true, false, 'afr-2509-185cc-hemi-driver', '/shop/afr-heads/afr-bbc-head.png'),

('AFR 185cc Gen 3 Hemi Passenger - Assembled', 'Air Flow Research', '2510',
 'AFR 185cc Gen 3 Hemi - As Cast - 69cc Chamber Passenger Side, Assembled (5.7 - 2003/current & 6.1 2005/2010)',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 1464.00, 'dropship', 'Air Flow Research', '2510',
 true, false, 'afr-2510-185cc-hemi-passenger', '/shop/afr-heads/afr-bbc-head.png'),

('AFR 212cc Gen 3 Hemi CNC Driver - Assembled', 'Air Flow Research', '2505',
 'AFR 212cc Gen 3 Hemi - Full CNC - 66cc Chamber Driver Side, Assembled (5.7 - 2003/current & 6.1 2005/2010)',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 2105.00, 'dropship', 'Air Flow Research', '2505',
 true, true, 'afr-2505-212cc-hemi-cnc-driver', '/shop/afr-heads/afr-bbc-head.png'),

('AFR 212cc Gen 3 Hemi CNC Passenger - Assembled', 'Air Flow Research', '2506',
 'AFR 212cc Gen 3 Hemi - Full CNC - 69cc Chamber Passenger Side, Assembled (5.7 - 2003/current & 6.1 2005/2010)',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 2105.00, 'dropship', 'Air Flow Research', '2506',
 true, false, 'afr-2506-212cc-hemi-cnc-passenger', '/shop/afr-heads/afr-bbc-head.png'),

('AFR 224cc Gen 3 Hemi CNC Driver - Assembled', 'Air Flow Research', '2513',
 'AFR 224cc Gen 3 Hemi - Full CNC - 69cc Chamber Driver Side, Assembled (5.7 - 2003/current & 6.1 2005/2010)',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 2105.00, 'dropship', 'Air Flow Research', '2513',
 true, false, 'afr-2513-224cc-hemi-cnc-driver', '/shop/afr-heads/afr-bbc-head.png'),

('AFR 224cc Gen 3 Hemi CNC Passenger - Assembled', 'Air Flow Research', '2514',
 'AFR 224cc Gen 3 Hemi - Full CNC - 69cc Chamber Passenger Side, Assembled (5.7 - 2003/current & 6.1 2005/2010)',
 'cylinder_head', 'Mopar', 'Gen 3 Hemi',
 2105.00, 'dropship', 'Air Flow Research', '2514',
 true, false, 'afr-2514-224cc-hemi-cnc-passenger', '/shop/afr-heads/afr-bbc-head.png');
