-- Storage Bucket Setup for User Avatars
-- Supabase Storage buckets cannot be created via SQL migrations
-- Run these commands via Supabase CLI or create manually via dashboard

-- CLI Command to create public avatar bucket:
-- supabase storage create-bucket user_avatars --public

-- OR create via Supabase Dashboard:
-- 1. Go to Project > Storage > Buckets
-- 2. Click "New Bucket"
-- 3. Name: "user_avatars"
-- 4. Set as Public
-- 5. Click Create

-- After creation, add RLS policies via SQL:

CREATE POLICY "Users can upload own avatars" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user_avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'user_avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'user_avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatars" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user_avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can read avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'user_avatars');
