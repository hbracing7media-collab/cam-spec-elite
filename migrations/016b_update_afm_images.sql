-- Update all Anderson Ford Motorsport cams with the correct image URL
UPDATE cse_parts_products 
SET image_url = '/shop/Anderson-sbf-cams.png'
WHERE brand = 'Anderson Ford Motorsport' 
  AND engine_family = 'Small Block Windsor';
