# Deployment Instructions - Awards System & Email Fix

## What's Being Deployed

### 1. **Email Verification Flow** ✉️
- New server-side signup endpoint: `app/api/auth/signup/route.ts`
- Email confirmation callback: `app/auth/callback/route.ts`
- Added `NEXT_PUBLIC_APP_URL` to `.env.local`

### 2. **Awards System** 🏆
- New migration: `migrations/022_create_user_awards_system.sql`
- Tables: `award_types`, `user_awards`, `forum_post_awards`
- Auto-awards for cam and head submissions

### 3. **Security Fixes** 🔒
- Fixed overpermissive RLS policy in dyno submissions

---

## Step 1: Deploy to Supabase

### Run This Migration in Supabase SQL Editor:

Go to: **Supabase Dashboard > SQL Editor**

Copy and paste the entire content of:
```
migrations/022_create_user_awards_system.sql
```

Click **Run** and wait for success message.

**Expected output:** No errors, tables created.

---

## Step 2: Verify Database Setup

In SQL Editor, run this to confirm:

```sql
SELECT slug, icon_emoji, name FROM public.award_types ORDER BY created_at;
```

**Expected result:**
- camshaft_contributor (🏎️)
- cylinder_head_contributor (🔧)
- dyno_king (🏆)
- (and 3 more...)

If this shows results, awards system is ready.

---

## Step 3: Deploy Code Changes

### For Local Development:
```bash
cd cam-spec-elite
npm install
npm run dev
```

### For Production (Vercel):
Changes are already in your repo. Just:
1. Push to main branch
2. Vercel auto-deploys

Verify these files exist in your deployment:
- ✅ `app/api/auth/signup/route.ts`
- ✅ `app/auth/callback/route.ts`
- ✅ `.env.local` has `NEXT_PUBLIC_APP_URL`

---

## Step 4: Test Email Verification

1. Go to http://localhost:3000/auth/login (or your production URL)
2. Click "Sign Up"
3. Enter email and password
4. Should see: "Signup successful! Please check your email..."
5. Check email inbox for confirmation link
6. Click link → should redirect and auto-login

**If email doesn't arrive:**
- Check Supabase Dashboard > Authentication > Email Provider
- Verify SendGrid/Mailgun key is valid
- Check spam folder

---

## Step 5: Test Awards

1. Sign up and create cam/head submission
2. Go to user profile
3. Should see award badge for the submission type

Check database:
```sql
SELECT 
  ua.user_id,
  at.slug,
  at.icon_emoji,
  ua.earned_at
FROM public.user_awards ua
JOIN public.award_types at ON ua.award_type_id = at.id
ORDER BY ua.earned_at DESC
LIMIT 10;
```

---

## Deployment Checklist

- [ ] Run migration 022 in Supabase SQL Editor
- [ ] Verify award_types exist (run SELECT query)
- [ ] Code deployed to production (or npm run dev locally)
- [ ] `.env.local` has NEXT_PUBLIC_APP_URL
- [ ] Test signup with email verification
- [ ] Test cam submission and check for award badge
- [ ] Test head submission and check for award badge

---

## Rollback (if needed)

If something breaks:

```sql
-- WARNING: This deletes awards data!
DROP TABLE IF EXISTS public.forum_post_awards CASCADE;
DROP TABLE IF EXISTS public.user_awards CASCADE;
DROP TABLE IF EXISTS public.award_types CASCADE;
```

Then remove migration and re-deploy.

---

## Support

If you get errors:

1. **Email not sending?**
   - Check Supabase Email Provider config
   - Regenerate SendGrid API key if expired

2. **Award tables error?**
   - Migration may have failed
   - Run migration again in SQL Editor
   - Check for permission errors

3. **Signup still broken?**
   - Check `/api/auth/diagnose` endpoint
   - Look at browser console for errors
   - Check Supabase logs

Done! 🚀
