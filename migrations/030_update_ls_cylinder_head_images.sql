-- Migration: Add images for LS, BBC and BBF cylinder heads
-- Date: 2026-01-05
-- Images: LS1-enforcer.png, LS1-mongoose.png, LS3-enforcer.webp, LS3-mongoose.png, BBF-heads.png, bbc-enforcer.jpg, BBCCNC-24-degree-magnum.jpg

-- Update LS Cathedral Port (15°) Enforcer heads with LS1-enforcer image
UPDATE public.cse_parts_products
SET image_url = '/shop/LS1-enforcer.png'
WHERE engine_family = 'LS'
  AND category = 'cylinder_head'
  AND LOWER(name) LIKE '%enforcer%';

-- Update LS3 Rectangle Port (12°) Enforcer heads with LS3-enforcer image
UPDATE public.cse_parts_products
SET image_url = '/shop/LS3-enforcer.webp'
WHERE engine_family = 'LS3'
  AND category = 'cylinder_head'
  AND LOWER(name) LIKE '%enforcer%';

-- Update specific LS Mongoose CNC heads by part number
UPDATE public.cse_parts_products
SET image_url = '/shop/LS1-mongoose.png'
WHERE part_number IN ('1510', '1530', '1610', '1630', '1680', '1690')
  AND category = 'cylinder_head';

-- Update specific LS3 Mongoose CNC heads by part number
UPDATE public.cse_parts_products
SET image_url = '/shop/LS3-mongoose.png'
WHERE part_number IN ('1840', '1845')
  AND category = 'cylinder_head';

-- Update remaining LS Cathedral Port CNC heads (non-Enforcer) with LS1-mongoose image
UPDATE public.cse_parts_products
SET image_url = '/shop/LS1-mongoose.png'
WHERE engine_family = 'LS'
  AND category = 'cylinder_head'
  AND LOWER(name) NOT LIKE '%enforcer%'
  AND image_url IS NULL;

-- Update LS3 Rectangle Port CNC heads (non-Enforcer) with LS3-mongoose image
UPDATE public.cse_parts_products
SET image_url = '/shop/LS3-mongoose.png'
WHERE engine_family = 'LS3'
  AND category = 'cylinder_head'
  AND LOWER(name) NOT LIKE '%enforcer%'
  AND image_url IS NULL;

-- Update BBC (Big Block Chevy) Enforcer heads
UPDATE public.cse_parts_products
SET image_url = '/shop/bbc-enforcer.jpg'
WHERE engine_family = 'Big Block Chevy'
  AND category = 'cylinder_head'
  AND LOWER(name) LIKE '%enforcer%';

-- Update BBC 24° CNC heads (Competition Package)
UPDATE public.cse_parts_products
SET image_url = '/shop/BBCCNC-24-degree-magnum.jpg'
WHERE engine_family = 'Big Block Chevy'
  AND category = 'cylinder_head'
  AND (LOWER(description) LIKE '%cnc ported%' OR LOWER(name) LIKE '%cnc%');

-- Update BBC Race Ready heads (Partially CNC)
UPDATE public.cse_parts_products
SET image_url = '/shop/BBC-18-Degree-magnum.png'
WHERE engine_family = 'Big Block Chevy'
  AND category = 'cylinder_head'
  AND LOWER(name) LIKE '%race ready%';

-- Update Big Block Ford heads with BBF-heads image
UPDATE public.cse_parts_products
SET image_url = '/shop/BBF-heads.png'
WHERE engine_family = 'BBF'
  AND category = 'cylinder_head';

-- Update Mopar Small Block LA heads (Enforcer As Cast)
UPDATE public.cse_parts_products
SET image_url = '/shop/sbmopar-la-175.webp'
WHERE engine_make = 'Mopar'
  AND engine_family = 'Small Block LA'
  AND category = 'cylinder_head';

-- Update Mopar Gen 3 Hemi heads
UPDATE public.cse_parts_products
SET image_url = '/shop/hemi-gen3.jpg'
WHERE engine_make = 'Mopar'
  AND engine_family = 'Gen 3 Hemi'
  AND category = 'cylinder_head';

-- Update Small Block Ford (SBF) heads with SBF-Heads-AFR image
UPDATE public.cse_parts_products
SET image_url = '/shop/SBF-Heads-AFR.png'
WHERE engine_family = 'SBF'
  AND category = 'cylinder_head';
