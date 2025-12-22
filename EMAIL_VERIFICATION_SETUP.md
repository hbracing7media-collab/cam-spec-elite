# Email Verification Setup Guide

## Problem
Users are not receiving verification emails when signing up.

## Root Causes & Solutions

### 1. **Supabase Email Provider Not Configured** (Most Common)

By default, Supabase uses Auth0's email service which is limited and may be disabled on free tier projects.

**Solution:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication > Email Templates**
4. Verify that email confirmation is enabled
5. For production, configure a **custom SMTP** provider:
   - Go to **Authentication > Email Provider**
   - Select one of:
     - **SendGrid** (recommended - free tier available)
     - **Mailgun**
     - **AWS SES**
     - **Custom SMTP** (your own mail server)

### 2. **Email Confirmation Not Enabled**

**Solution:**
1. Go to **Authentication > Providers > Email**
2. Enable **"Confirm email"** toggle
3. Set the email redirect URL to: `https://yourdomain.com/auth/callback`

### 3. **Redirect URL Mismatch**

Users might be clicking the confirmation link, but if the redirect URL doesn't match your deployment URL, the callback fails.

**Solution:**
1. Go to **Authentication > URL Configuration**
2. Add your redirect URLs:
   - For development: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`

### 4. **NEXT_PUBLIC_APP_URL Not Set**

The signup endpoint needs to know your app's URL for the email redirect link.

**Solution:**
Set this environment variable in your deployment:
```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Changes Made

### New Files
- **`app/api/auth/signup/route.ts`** - Server-side signup endpoint with email confirmation
- **`app/auth/callback/route.ts`** - Email confirmation callback handler

### Updated Files
- **`app/auth/login/page.tsx`** - Now uses server endpoint instead of client-side signup

## How It Works Now

1. User fills signup form
2. **POST** to `/api/auth/signup` (server-side)
3. Server calls `supabase.auth.signUp()` with:
   - Email and password
   - Redirect URL: `{NEXT_PUBLIC_APP_URL}/auth/callback`
4. Supabase sends confirmation email to user
5. User clicks link in email
6. Browser redirects to `/auth/callback?code=...`
7. Callback endpoint exchanges code for session
8. User is authenticated and redirected

## Testing Email Flow

### Option A: Test Supabase Email (Recommended)
1. Go to Supabase Dashboard
2. **Authentication > Email Templates**
3. Click the test email icon
4. Check your Supabase project email (usually shown in logs)

### Option B: Check Auth User Status
1. Go to **Supabase Dashboard > Authentication > Users**
2. Look for the new user
3. Check if `email_confirmed_at` is populated
4. If NULL, email confirmation hasn't been done yet

### Option C: Check Email Logs
1. **Supabase Dashboard > Logs** (SQL Editor)
2. Look for auth events
3. Search for "user signup" or "email send" events

## Troubleshooting

### Users say they never got the email:

**Check Supabase logs:**
```sql
-- In Supabase SQL Editor
SELECT * FROM auth.audit_log_entries 
ORDER BY created_at DESC 
LIMIT 20;
```

Look for:
- `action` = "user_signedup" → signup succeeded
- `action` = "user_confirmation_requested" → email should have been sent

**If email wasn't sent:**
- Email provider not configured
- Email address is invalid
- Rate limit exceeded (Supabase Auth0 email service limit: ~10/minute)

### Users clicked link but get "Invalid confirmation" error:

**Causes:**
- Redirect URL mismatch
- Code expired (valid for ~1 hour)
- User already confirmed
- Database corruption

**Fix:**
- Verify redirect URL in Supabase (Authentication > URL Configuration)
- Make sure `NEXT_PUBLIC_APP_URL` is correct

### Login still fails after confirming email:

**Cause:** Email confirmed but user isn't created in profiles table

**Solution:** Create an after-signup trigger to create profile:
```sql
-- Add to migrations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, created_at)
  VALUES (new.id, new.email, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Verification Checklist

- [ ] Supabase email provider configured (SendGrid, Mailgun, or custom SMTP)
- [ ] "Confirm email" enabled in Authentication > Providers > Email
- [ ] Redirect URL added in Authentication > URL Configuration
- [ ] `NEXT_PUBLIC_APP_URL` set in environment variables
- [ ] Test signup flow end-to-end
- [ ] Verify user appears in Supabase Auth > Users
- [ ] Check `email_confirmed_at` is populated after clicking email link
- [ ] User can log in after confirmation

## For Production Deployment

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### Pre-Launch Checklist
1. Configure custom email provider (SendGrid/Mailgun)
2. Set production redirect URLs in Supabase
3. Test with real email accounts
4. Monitor signup logs for errors
5. Set up alert if email sending fails

## Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Email Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Custom SMTP Setup](https://supabase.com/docs/guides/auth/smtp)
