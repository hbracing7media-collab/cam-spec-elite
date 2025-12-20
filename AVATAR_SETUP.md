# User Avatars Bucket Setup

## Step 1: Create the Bucket in Supabase

### Option A: Via Supabase CLI
```bash
supabase storage create-bucket user_avatars --public
```

### Option B: Via Supabase Dashboard
1. Go to your Supabase project
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Enter name: `user_avatars`
5. Toggle **Public** ON
6. Click **Create**

## Step 2: Apply RLS Policies (Optional but Recommended)

Run this SQL in your Supabase SQL editor to enforce security policies:

```sql
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
```

## What Changed

- Page renamed from "Profile" → "My Garage"
- Avatar uploads now use `user_avatars` bucket instead of `forum_avatars`
- Files stored in user-specific folders: `{user_id}/{timestamp}.{ext}`
- Users can upload, update, and delete their own avatars
- Avatars are publicly visible

## Test the Feature

1. Navigate to https://cam-spec-elite.vercel.app/profile
2. Upload an avatar image
3. Check your avatar appears (may need to refresh)
4. Avatar should be visible in forum posts if linked
