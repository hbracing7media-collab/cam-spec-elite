-- DIAGNOSTIC QUERY FOR SPECIFIC USERS
-- Run this in Supabase SQL Editor to check email verification status

-- ============================================
-- CHECK: User Account Status
-- ============================================
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
    ELSE '✅ CONFIRMED at ' || u.email_confirmed_at::text
  END as verification_status,
  u.last_sign_in_at,
  AGE(NOW(), u.created_at) as account_age
FROM auth.users u
WHERE u.id IN (
  'cc0a8729-eba7-4bef-8373-db7b09ccabfb',
  '1401fb8d-e531-4aec-b864-1bfad4985a6e'
)
OR u.email IN (
  'micah.politte@gmail.com',
  'mustangkidd21@gmail.com',
  'christopher68young@gmail.com'
);

-- ============================================
-- CHECK: Email Events in Audit Log
-- ============================================
SELECT 
  ale.created_at,
  ale.action,
  ale.user_id,
  u.email,
  ale.raw_error_attributes ->> 'error_message' as error_message,
  CASE 
    WHEN ale.action = 'user_signedup' THEN '📝 User Created'
    WHEN ale.action = 'user_confirmation_requested' THEN '📧 Confirmation Email Sent'
    WHEN ale.action = 'user_confirmed' THEN '✅ Email Confirmed'
    ELSE ale.action
  END as event_type
FROM auth.audit_log_entries ale
LEFT JOIN auth.users u ON ale.user_id = u.id
WHERE ale.user_id IN (
  'cc0a8729-eba7-4bef-8373-db7b09ccabfb',
  '1401fb8d-e531-4aec-b864-1bfad4985a6e'
)
OR u.email IN (
  'micah.politte@gmail.com',
  'mustangkidd21@gmail.com',
  'christopher68young@gmail.com'
)
ORDER BY ale.created_at DESC;

-- ============================================
-- CHECK: Full Journey for Each User
-- ============================================
WITH user_list AS (
  SELECT id, email FROM auth.users
  WHERE id IN ('cc0a8729-eba7-4bef-8373-db7b09ccabfb', '1401fb8d-e531-4aec-b864-1bfad4985a6e')
  OR email IN ('micah.politte@gmail.com', 'mustangkidd21@gmail.com', 'christopher68young@gmail.com')
)
SELECT 
  ul.email,
  ul.id,
  u.created_at as account_created,
  u.email_confirmed_at as email_verified,
  u.last_sign_in_at as last_login,
  (
    SELECT COUNT(*) FROM auth.audit_log_entries 
    WHERE user_id = ul.id AND action = 'user_signedup'
  ) as signup_events,
  (
    SELECT COUNT(*) FROM auth.audit_log_entries 
    WHERE user_id = ul.id AND action = 'user_confirmation_requested'
  ) as confirmation_email_sent,
  (
    SELECT COUNT(*) FROM auth.audit_log_entries 
    WHERE user_id = ul.id AND action = 'user_confirmed'
  ) as email_confirmed_events,
  (
    SELECT COUNT(*) FROM auth.audit_log_entries 
    WHERE user_id = ul.id AND raw_error_attributes IS NOT NULL
  ) as error_events
FROM user_list ul
LEFT JOIN auth.users u ON ul.id = u.id;

-- ============================================
-- SUMMARY TABLE - What Happened to Each User
-- ============================================
WITH user_list AS (
  SELECT id, email FROM auth.users
  WHERE id IN ('cc0a8729-eba7-4bef-8373-db7b09ccabfb', '1401fb8d-e531-4aec-b864-1bfad4985a6e')
  OR email IN ('micah.politte@gmail.com', 'mustangkidd21@gmail.com', 'christopher68young@gmail.com')
),
audit_data AS (
  SELECT 
    ul.email,
    ul.id,
    BOOL_OR(ale.action = 'user_signedup') as user_created,
    BOOL_OR(ale.action = 'user_confirmation_requested') as email_sent,
    BOOL_OR(ale.action = 'user_confirmed') as email_confirmed,
    ARRAY_AGG(DISTINCT ale.raw_error_attributes ->> 'error_message' 
      ORDER BY ale.raw_error_attributes ->> 'error_message') FILTER (WHERE ale.raw_error_attributes IS NOT NULL) as errors
  FROM user_list ul
  LEFT JOIN auth.audit_log_entries ale ON ul.id = ale.user_id
  GROUP BY ul.email, ul.id
)
SELECT 
  email,
  CASE 
    WHEN user_created THEN '✅' ELSE '❌' 
  END || ' Account Created' as step_1,
  CASE 
    WHEN email_sent THEN '✅' ELSE '❌' 
  END || ' Email Sent' as step_2,
  CASE 
    WHEN email_confirmed THEN '✅' ELSE '❌' 
  END || ' Email Confirmed' as step_3,
  CASE 
    WHEN errors IS NULL OR array_length(errors, 1) = 0 THEN 'No errors'
    ELSE errors[1]
  END as first_error
FROM audit_data
ORDER BY email;

/* 
INTERPRETATION:

✅ Account Created + ✅ Email Sent + ✅ Email Confirmed = User verified successfully

✅ Account Created + ✅ Email Sent + ❌ Email Confirmed = User got email but didn't click link OR link expired

✅ Account Created + ❌ Email Sent + ❌ Email Confirmed = Email provider broken/disabled (CRITICAL)

❌ Account Created = User never got created (request never reached Supabase)

If you see "No errors" but "Email Sent" is ❌, the email provider is misconfigured but not logging errors.
*/
