# RLS & Deployment Setup Guide

## Overview
This guide outlines the Row Level Security (RLS) policies and deployment configuration needed for the cam and cylinder heads submission systems.

## What's Been Set Up

### 1. RLS Policies (migrations/005_add_rls_policies.sql)

#### CAM SUBMISSIONS (cse_cam_submissions_table)
- **Public view approved cams**: Anyone can SELECT approved (status='approved') records
- **Users view own submissions**: Users can see their own submissions regardless of status, plus all approved ones
- **Users can create**: Authenticated users can INSERT their own submissions (user_id must match auth.uid())

#### CYLINDER HEADS (cylinder_heads + cylinder_heads_flow_data)
- **Public view approved heads**: Public read-only access to approved heads (status='approved')
- **Users view own pending**: Users can see their own pending submissions plus all approved heads
- **Flow data access**: Public can view flow data for approved heads via SELECT USING EXISTS check
- **Flow data indexed**: Index on head_id for fast lookups

### 2. Admin Access
- **Service Role Key**: API endpoints use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS
- **Protected endpoints**: Admin approval/denial endpoints use service_role key and run on the server
  - POST /api/admin/cylinder-heads/approve
  - POST /api/admin/cylinder-heads/deny
  - GET /api/admin/cylinder-heads/pending
- **Frontend auth**: Admin pages check authentication and redirect to /auth/login if not logged in

### 3. Storage Buckets
Two public Supabase Storage buckets are configured:
- `cam_cards` - stores cam specification cards
- `dyno_sheets` - stores dyno sheet documents

Note: Storage has its own policy system separate from RLS. Configure via Supabase dashboard if needed.

## Deployment Checklist

### Pre-Deployment
- [ ] Run migration 005_add_rls_policies.sql in Supabase dashboard or CLI
- [ ] Verify Supabase auth is configured with email/password or OAuth providers
- [ ] Create storage buckets `cam_cards` and `dyno_sheets` if not present

### Environment Variables
Ensure these are set in your deployment platform:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Admin Setup
To set up an admin user:
1. Create a user account via auth signup
2. In Supabase Auth > Users, select the user
3. Update user metadata or use a custom "role" column in a users table (optional future enhancement)
4. Admin pages redirect to /auth/login if not authenticated

### Current Security Model
- **Client-side**: Auth checks on protected pages (/cams, /cams/new, /cylinder-heads, /cylinder-heads/submit, /admin/*)
- **Server-side**: RLS policies prevent unauthorized data access
- **API routes**: Admin endpoints use service_role key to bypass RLS for approval workflows

## Data Flow

### Cam Submission
1. User logs in → redirected to /cams
2. Click "Submit Cam" → /cams/new (protected by auth)
3. Fill form & upload cam card + dyno sheets
4. POST to /api/cam-submit (creates record with status='pending')
5. Admin views at /admin/cam-review (protected by auth)
6. Admin approves/denies → updates status → visible to public if approved

### Cylinder Head Submission
1. User logs in → redirected to /cylinder-heads/submit
2. Fill form with specs & flow data points
3. POST to /api/cylinder-heads/upload (creates record with status='pending')
4. Admin views at /admin/cylinder-heads-approve (protected by auth)
5. Admin approves/denies → updates status → visible to public if approved
6. Flow data queried via /api/cylinder-heads/flow-data for calculator

## Future Enhancements
- Add admin role column to users table for finer permission control
- Implement webhook for email notifications on approvals
- Add audit logging for all admin actions
- Implement soft-delete for submissions instead of hard-delete
- Add approval queue with timestamps and notes

## Support & Troubleshooting
- Check Supabase Logs in dashboard for policy violations (4xx errors)
- Verify service_role_key has highest privileges in Supabase settings
- Test RLS policies with different roles using Supabase CLI: `supabase test`
