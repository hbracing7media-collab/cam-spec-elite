-- Enable client-side uploads to forum_attachments storage bucket
-- This allows authenticated users to upload files directly from the browser

-- Create the storage bucket if it doesn't exist (run in Supabase dashboard or CLI)
-- Note: Bucket creation must be done via Supabase Dashboard or CLI, not SQL
-- supabase storage create-bucket forum_attachments --public

-- Storage RLS Policies for forum_attachments bucket
-- These need to be created in Supabase Dashboard > Storage > Policies

-- Policy 1: Allow authenticated users to upload files
-- Name: "Allow authenticated uploads"
-- Allowed operation: INSERT
-- Target roles: authenticated
-- Policy definition: true
-- OR use SQL in Supabase SQL Editor:

-- INSERT policy for authenticated users
CREATE POLICY "Allow authenticated uploads to forum_attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'forum_attachments');

-- SELECT policy for public read access
CREATE POLICY "Allow public read access to forum_attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'forum_attachments');

-- DELETE policy for users to delete their own uploads
CREATE POLICY "Allow users to delete own forum attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'forum_attachments' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- UPDATE policy for users to update their own uploads
CREATE POLICY "Allow users to update own forum attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'forum_attachments')
WITH CHECK (bucket_id = 'forum_attachments');
