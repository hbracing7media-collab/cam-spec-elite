-- Create storage bucket for parts store product images

-- Create the bucket (run this via Supabase CLI or Dashboard)
-- supabase storage create-bucket parts_images --public

-- If using SQL (Supabase dashboard SQL editor):
INSERT INTO storage.buckets (id, name, public)
VALUES ('parts_images', 'parts_images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to product images
CREATE POLICY "Anyone can view parts images"
ON storage.objects FOR SELECT
USING (bucket_id = 'parts_images');

-- Allow authenticated admins to upload/manage images
-- (In practice, you'll use service role key for admin uploads)
CREATE POLICY "Admins can upload parts images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'parts_images');

CREATE POLICY "Admins can update parts images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'parts_images');

CREATE POLICY "Admins can delete parts images"
ON storage.objects FOR DELETE
USING (bucket_id = 'parts_images');
