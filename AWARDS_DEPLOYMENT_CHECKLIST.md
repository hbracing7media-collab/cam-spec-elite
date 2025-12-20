# Awards System - Implementation Checklist

## Pre-Deployment

### Code Review
- [ ] Review migration 021 for correctness
- [ ] Check API endpoint implementations
- [ ] Verify component prop types
- [ ] Test TypeScript compilation
- [ ] Ensure no breaking changes to existing code

### Testing
- [ ] Run migrations in local/staging environment
- [ ] Test camshaft submission → auto-award
- [ ] Test cylinder head submission → auto-award
- [ ] Test award fetch endpoint
- [ ] Test award tagging in forum posts
- [ ] Verify RLS policies work correctly
- [ ] Test with multiple users

### Documentation Review
- [ ] Review AWARDS_SYSTEM.md for completeness
- [ ] Review AWARDS_INTEGRATION.md examples
- [ ] Verify code comments and JSDoc
- [ ] Check migration SQL syntax

---

## Deployment Steps

### Step 1: Database Migration
- [ ] Backup Supabase database
- [ ] Apply migration 021 to staging
- [ ] Verify tables created:
  ```sql
  SELECT * FROM award_types;
  SELECT * FROM user_awards LIMIT 1;
  SELECT * FROM forum_post_awards LIMIT 1;
  ```
- [ ] Verify indexes created
- [ ] Test RLS policies
- [ ] Apply migration to production

### Step 2: Backend Deployment
- [ ] Deploy updated API routes:
  - [ ] `app/api/profile/awards/route.ts` (new)
  - [ ] `app/api/cam-submit/route.ts` (modified)
  - [ ] `app/api/cylinder-heads/submit/route.ts` (modified)
  - [ ] `app/api/forum/new/route.ts` (modified)
  - [ ] `app/api/forum/reply/route.ts` (modified)
- [ ] Verify API endpoints accessible
- [ ] Test award auto-granting

### Step 3: Component Deployment
- [ ] Deploy new components:
  - [ ] `components/AwardBadge.tsx`
  - [ ] `components/AwardTags.tsx`
  - [ ] `components/UserAwardsProfile.tsx`
- [ ] Deploy new hook:
  - [ ] `lib/hooks/useUserAwards.ts`
- [ ] Verify components render without errors

### Step 4: Frontend Integration
- [ ] Add `UserAwardsProfile` to user profile page
  - [ ] Import component
  - [ ] Add to layout
  - [ ] Test rendering
  - [ ] Verify styling
- [ ] Update forum components to use `AwardTags`
  - [ ] Add to thread creation form
  - [ ] Add to reply form
  - [ ] Test selection UI
- [ ] Display awards below forum posts
  - [ ] Query `forum_post_awards`
  - [ ] Render with `AwardBadge`

### Step 5: Testing in Production-like Environment
- [ ] Create test user account
- [ ] Submit test camshaft
- [ ] Verify award appears in profile
- [ ] Submit test cylinder head
- [ ] Verify second award appears
- [ ] Create forum thread with awards tagged
- [ ] Verify awards display in post
- [ ] Test with different user accounts
- [ ] Test award display permissions (public read)

---

## Post-Deployment

### Monitoring
- [ ] Monitor application logs for errors
- [ ] Check for "Error awarding badge:" messages
- [ ] Monitor database performance
- [ ] Watch for database query slowness
- [ ] Check Supabase storage usage (if applicable)

### User Communication
- [ ] Announce feature to community (optional)
- [ ] Add to changelog/release notes
- [ ] Create help documentation for users
- [ ] Add awards section to FAQ (if applicable)

### Analytics
- [ ] Track feature adoption
- [ ] Monitor award grant success rate
- [ ] Count award tags in forum posts
- [ ] Measure component render times

---

## Verification Queries

Run these after deployment to verify everything works:

```sql
-- Verify migration applied
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name IN ('award_types', 'user_awards', 'forum_post_awards');
-- Should return: 3

-- Verify award types seeded
SELECT * FROM award_types;
-- Should return: 3 rows (camshaft_contributor, cylinder_head_contributor, legendary_contributor)

-- Check if any users have earned awards
SELECT COUNT(DISTINCT user_id) FROM user_awards;
-- Count of users with at least one award

-- Verify RLS policies exist
SELECT COUNT(*) FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('user_awards', 'forum_post_awards');
-- Should return: 4+ policies

-- Check forum post awards
SELECT COUNT(*) FROM forum_post_awards;
-- Count of awards tagged in forum posts

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' AND tablename IN ('user_awards', 'forum_post_awards')
ORDER BY indexname;
-- Should see idx_* for performance
```

---

## Rollback Plan

If issues occur:

### Database Rollback
```bash
# Backup current state first
pg_dump [database] > backup_$(date +%s).sql

# Drop new tables if needed
DROP TABLE IF EXISTS public.forum_post_awards;
DROP TABLE IF EXISTS public.user_awards;
DROP TABLE IF EXISTS public.award_types;
```

### Code Rollback
- Revert API endpoints to previous version
- Remove component imports from pages
- Clear browser cache
- Restart application

### Recovery Steps
1. Identify root cause
2. Fix issue in code or schema
3. Apply fix to staging
4. Re-test thoroughly
5. Re-deploy to production

---

## Troubleshooting Checklist

### Issue: Awards not appearing after submission
- [ ] Check logs for "Error awarding badge:"
- [ ] Verify award_types table has records
- [ ] Check user_id format (should be UUID)
- [ ] Verify user_awards table is writable
- [ ] Test manual INSERT to user_awards
- [ ] Check RLS policy allows inserts from service role

### Issue: Components not rendering
- [ ] Verify TypeScript compilation
- [ ] Check for missing imports
- [ ] Inspect browser console for errors
- [ ] Verify Supabase API credentials
- [ ] Test API endpoint directly with curl
- [ ] Check network tab for failed requests

### Issue: Performance problems
- [ ] Check database query logs
- [ ] Verify indexes are created
- [ ] Check AwardShowcase maxDisplay setting
- [ ] Consider query optimization
- [ ] Check Supabase request limits
- [ ] Review component re-render performance

### Issue: RLS policy errors
- [ ] Check policy SQL syntax
- [ ] Verify service role key is correct
- [ ] Test with different user accounts
- [ ] Check policy conditions logic
- [ ] Verify policy is attached to correct table
- [ ] Test direct DB access with correct role

---

## Performance Benchmarks

### Expected Performance
- Award fetch endpoint: < 200ms
- Auto-award grant: < 500ms
- Award tag creation: < 300ms
- Component render: < 100ms

### Monitoring
- [ ] Set up alerts for slow queries
- [ ] Monitor database connection pool
- [ ] Track API endpoint response times
- [ ] Monitor storage usage growth

---

## Documentation Links

- **Full System Guide**: AWARDS_SYSTEM.md
- **Integration Instructions**: AWARDS_INTEGRATION.md
- **Quick Reference**: AWARDS_REFERENCE.md
- **Architecture Diagrams**: AWARDS_ARCHITECTURE.md
- **Implementation Summary**: AWARDS_IMPLEMENTATION.md
- **Complete Guide**: AWARDS_COMPLETE_GUIDE.md

---

## Sign-Off

- [ ] Code review complete
- [ ] Testing complete
- [ ] Documentation complete
- [ ] Deployment approved
- [ ] Go-live date: ________________
- [ ] Deployed by: ________________
- [ ] Verified by: ________________

---

## Notes & Known Limitations

### Current Implementation
- Awards must be manually configured (future: admin panel)
- No automatic promotion to "Legendary" yet (ready to implement)
- No expiration/revocation system yet
- Single award instance per user per type (can't earn same award twice)

### Future Enhancements
- [ ] Auto-promote to legendary at 10 contributions
- [ ] Leaderboard of top contributors
- [ ] Email notifications for new awards
- [ ] Admin dashboard for award management
- [ ] Seasonal/time-limited awards
- [ ] Award tiers (Bronze/Silver/Gold)

### Known Issues
(None documented yet - add if found during testing)

---

**Last Updated**: December 2025
**Status**: Ready for Deployment ✅
