-- Update SBC heads
UPDATE cse_parts_products 
SET image_url = '/shop/SBC-heads-AFR.webp'
WHERE category = 'cylinder_head' 
AND engine_family = 'Small Block Chevy';

-- Update SBF heads  
UPDATE cse_parts_products 
SET image_url = '/shop/SBF-Heads-AFR.png'
WHERE category = 'cylinder_head' 
AND engine_family = 'Small Block Windsor';
