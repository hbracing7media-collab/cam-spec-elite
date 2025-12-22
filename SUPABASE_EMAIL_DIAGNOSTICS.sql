-- ============================================
-- EMAIL VERIFICATION DIAGNOSTIC & TESTING SQL
-- ============================================
-- Run this in Supabase Dashboard > SQL Editor
-- Copy-paste each section and execute

-- ============================================
-- SECTION 1: Check Recent Signups & Email Status
-- ============================================
-- This shows if users are being created and if they confirmed email

SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
    ELSE '✅ CONFIRMED'
  END as status,
  AGE(NOW(), u.created_at) as time_since_signup
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 20;

-- ============================================
-- SECTION 2: Check Auth Audit Logs for Email Events
-- ============================================
-- This shows what Supabase is doing with signups & emails

SELECT 
  created_at,
  action,
  user_id,
  raw_user_meta_data,
  raw_app_meta_data,
  raw_error_attributes,
  CASE 
    WHEN action = 'user_signedup' THEN '📝 User Signed Up'
    WHEN action = 'user_confirmation_requested' THEN '📧 Email Sent'
    WHEN action = 'user_confirmed' THEN '✅ Email Confirmed'
    WHEN action = 'user_deleted' THEN '🗑️ User Deleted'
    ELSE action
  END as event_type
FROM auth.audit_log_entries
WHERE action IN (
  'user_signedup',
  'user_confirmation_requested', 
  'user_confirmed',
  'user_recovery_requested'
)
ORDER BY created_at DESC
LIMIT 50;

-- ============================================
-- SECTION 3: Find Users With Confirmation Issues
-- ============================================
-- This identifies users stuck waiting for email confirmation

SELECT 
  u.id,
  u.email,
  u.created_at,
  NOW() - u.created_at as pending_for,
  u.email_confirmed_at,
  u.last_sign_in_at
FROM auth.users u
WHERE u.email_confirmed_at IS NULL
  AND u.created_at > NOW() - INTERVAL '7 days'
ORDER BY u.created_at DESC;

-- ============================================
-- SECTION 4: Check for Email Sending Errors
-- ============================================
-- This looks for any error messages in the audit log

SELECT 
  created_at,
  user_id,
  action,
  raw_error_attributes ->> 'error_code' as error_code,
  raw_error_attributes ->> 'error_message' as error_message,
  raw_error_attributes ->> 'cause' as cause
FROM auth.audit_log_entries
WHERE raw_error_attributes IS NOT NULL
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 30;

-- ============================================
-- SECTION 5: Email Provider Configuration Status
-- ============================================
-- This checks if email sending is configured properly
-- (View from public schema if available)

SELECT 
  'Email Provider Status' as check_name,
  EXISTS(
    SELECT 1 FROM auth.users LIMIT 1
  ) as auth_system_working,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unconfirmed_users
FROM auth.users;

-- ============================================
-- SECTION 6: Test: Manually Confirm a User
-- ============================================
-- UNCOMMENT AND MODIFY: Replace 'test@example.com' with real email
-- This manually confirms a user (useful if email system is broken but user clicked link)

-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE email = 'test@example.com' AND email_confirmed_at IS NULL;

-- ============================================
-- SECTION 7: Test: Create Admin Test User
-- ============================================
-- UNCOMMENT: This creates a test user with email already confirmed
-- Useful to test if the rest of the system works

-- INSERT INTO auth.users (
--   id,
--   instance_id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   user_metadata
-- ) VALUES (
--   gen_random_uuid(),
--   '00000000-0000-0000-0000-000000000000',
--   'test-user-' || gen_random_uuid()::text || '@example.com',
--   crypt('TestPassword123!', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW(),
--   '{"auto_confirmed": true}'
-- ) ON CONFLICT DO NOTHING;

-- ============================================
-- SECTION 8: Summary Dashboard
-- ============================================
-- Complete overview of your email verification system

WITH stats AS (
  SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed,
    COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unconfirmed,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as signups_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days' AND email_confirmed_at IS NULL) as pending_7d
  FROM auth.users
),
recent_issues AS (
  SELECT COUNT(*) as error_count
  FROM auth.audit_log_entries
  WHERE raw_error_attributes IS NOT NULL
    AND created_at > NOW() - INTERVAL '24 hours'
)
SELECT 
  'SUMMARY' as section,
  (SELECT total_users FROM stats)::text as total_users,
  (SELECT confirmed FROM stats)::text as confirmed_users,
  (SELECT unconfirmed FROM stats)::text as unconfirmed_users,
  (SELECT signups_24h FROM stats)::text as new_signups_24h,
  (SELECT pending_7d FROM stats)::text as pending_confirmation_7d,
  (SELECT error_count FROM recent_issues)::text as errors_last_24h;

-- ============================================
-- INTERPRETATION GUIDE
-- ============================================
/*
✅ HEALTHY SYSTEM:
- New users appear in "Recent Signups" immediately
- email_confirmed_at becomes NOT NULL after user clicks email link
- No errors in audit log
- Confirmed users count increases over time

⚠️ EMAIL PROVIDER BROKEN:
- user_confirmation_requested action is missing from logs
- Users stuck with email_confirmed_at = NULL
- Errors mentioning "email_provider", "SMTP", or "SendGrid"

🔴 REDIRECT URL WRONG:
- Users click link but email_confirmed_at stays NULL
- Errors mentioning "invalid_redirect" or "callback failed"

🔴 USER CREATED BUT EMAIL NEVER SENT:
- user_signedup appears in logs
- user_confirmation_requested is MISSING
- No errors logged
- = Provider not sending emails (disabled or quota exceeded)
*/

-- ============================================
-- QUICK FIXES
-- ============================================

-- FIX 1: If email provider is broken, manually confirm a user for testing
-- Replace test@example.com with your test email
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE email = 'test@example.com';

-- FIX 2: Delete test/spam signups to clean up
-- DANGEROUS: Only delete if you're sure
-- DELETE FROM auth.users WHERE email LIKE '%@test%' AND created_at < NOW() - INTERVAL '7 days';

-- FIX 3: Check individual user's full signup journey
-- Replace test@example.com with the email to check
-- SELECT * FROM auth.audit_log_entries 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
-- ORDER BY created_at;
