# Email Verification Regression - Quick Fix Guide

## Since it worked before, something broke. Check these first:

### 1. **Check if Supabase Email Provider is Still Enabled**

❌ **Most Common Cause** - Provider got disabled or hit rate limits

**Quick Fix:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. **Authentication > Email Templates** 
4. Check if the **Test Email** button works
5. If it doesn't, your email provider is disabled/broken

### 2. **Verify Email Provider Configuration**

**Go to:** Authentication > Email Provider
- Should show "SendGrid", "Mailgun", "AWS SES", or "Custom SMTP"
- If it says "Auth0" (the default), this is limited and may have hit quota

**Current Status to Check:**
- ✅ Custom SMTP configured and working
- ✅ SendGrid API key still valid
- ❌ Default Auth0 service (very limited)
- ❌ No provider configured

### 3. **Check Redirect URL Configuration**

**Go to:** Authentication > URL Configuration
- For dev: should include `http://localhost:3000/auth/callback`
- For prod: should include `https://yourdomain.com/auth/callback`

If this changed, confirmation emails won't complete properly.

### 4. **Quick Diagnostic Test**

Run this to check your setup:
```bash
# Get a detailed diagnostic report
curl http://localhost:3000/api/auth/diagnose

# Test sending an email (will create a test signup)
curl -X POST http://localhost:3000/api/auth/diagnose \
  -H "Content-Type: application/json" \
  -d '{"email":"youremail@gmail.com"}'
```

This will show:
- ✅ If your Supabase credentials are valid
- ✅ If email sending is working
- ❌ What specifically is broken

### 5. **Check Recent Supabase Logs**

**Go to:** Logs (in Supabase Dashboard)
```sql
-- Look for auth events
SELECT 
  created_at,
  action,
  problem,
  errors
FROM auth.audit_log_entries 
WHERE action IN ('user_signedup', 'user_confirmation_requested')
ORDER BY created_at DESC 
LIMIT 50;
```

Common failures:
- `email_provider_disabled` → Email provider not set up
- `invalid_redirect_url` → URL config mismatch
- `rate_limit_exceeded` → Too many emails sent (Auth0 limit: ~10/min)
- `invalid_smtp_credentials` → Custom SMTP keys expired

### 6. **Check if Email Service API Key Expired**

If using **SendGrid**, **Mailgun**, or **AWS SES**:
- Login to your email service provider
- Verify API key is still valid
- Check quota/usage limits
- Regenerate key if needed and update in Supabase

### 7. **Verify User was Created (even if email failed)**

**Go to:** Authentication > Users
- New users should appear here
- Check `email_confirmed_at` column:
  - NULL = user created but didn't confirm email
  - Has timestamp = user confirmed email

If users appear but `email_confirmed_at` is NULL:
- **Email never sent** → Provider issue
- **Email sent but user didn't click link** → User issue

## Quick Fixes by Scenario

### Scenario A: Email provider disappeared
```
Action: Set up SendGrid (free 100/day tier)
1. Create account at SendGrid.com
2. Get API key
3. In Supabase: Authentication > Email Provider > SendGrid
4. Paste API key
5. Test with "Test Email" button
```

### Scenario B: API key expired
```
Action: Regenerate and update key
1. Regenerate key in SendGrid/Mailgun dashboard
2. Update in Supabase: Authentication > Email Provider
3. Click "Save" and test
```

### Scenario C: Redirect URL doesn't match deployment
```
Action: Add correct redirect URL
1. Go to Authentication > URL Configuration
2. Add: https://yourdomain.com/auth/callback
3. For dev: add http://localhost:3000/auth/callback
4. Save and test signup
```

### Scenario D: NEXT_PUBLIC_APP_URL not set in deployment
```
Action: Set environment variable
In your deployment (Vercel, Railway, etc):
NEXT_PUBLIC_APP_URL=https://yourdomain.com

Without this, emails redirect to wrong URL.
```

## Immediate Action Checklist

- [ ] Run diagnostic: `curl http://localhost:3000/api/auth/diagnose`
- [ ] Check Supabase logs for error messages
- [ ] Verify email provider is enabled
- [ ] Verify API key is still valid
- [ ] Test email button in Supabase
- [ ] Check redirect URL configuration
- [ ] Try signup again
- [ ] Check spam/promotions folder for email

## If Still Not Working

1. **Export recent auth logs** from Supabase
2. **Check email provider logs** (SendGrid, Mailgun, etc)
3. **Test with test email endpoint**: `POST /api/auth/diagnose`
4. **Look for error patterns** in Supabase Dashboard > Logs

## Permanent Fix: Use Custom SMTP

Instead of relying on Auth0's limited service, set up **SendGrid**:

1. **Create SendGrid Account** (free tier: 100 emails/day)
   - Go to sendgrid.com
   - Sign up (free)
   
2. **Get API Key**
   - Settings > API Keys
   - Create new key with "Mail Send" permission
   - Copy the key

3. **Configure in Supabase**
   - Go to Authentication > Email Provider
   - Select "SendGrid"
   - Paste API key
   - Click "Save"

4. **Test It**
   - Click "Test Email" in Email Templates
   - Should arrive in seconds

5. **Verify Redirect URL**
   - Authentication > URL Configuration
   - Ensure `http://localhost:3000/auth/callback` is there

After this, emails should work reliably.
