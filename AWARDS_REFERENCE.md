#!/usr/bin/env node

/**
 * Awards System - Quick Reference Card
 * 
 * Use this as a cheat sheet for common awards system operations
 */

// ============================================================================
// IMPORTS
// ============================================================================

// In your components:
import { AwardBadge, AwardShowcase, Award } from '@/components/AwardBadge';
import { AwardTags } from '@/components/AwardTags';
import { UserAwardsProfile } from '@/components/UserAwardsProfile';
import { useUserAwards, useAwardSelection } from '@/lib/hooks/useUserAwards';

// ============================================================================
// FETCH AWARDS
// ============================================================================

// Using custom hook (Recommended)
const { awards, loading, awardCount, camshaftCount, cylinderHeadCount } = 
  useUserAwards({ userId: 'user-123' });

// Using API directly
const response = await fetch('/api/profile/awards?user_id=user-123');
const { awards } = await response.json();

// ============================================================================
// DISPLAY AWARDS
// ============================================================================

// Single badge
<AwardBadge award={award} size="md" />;

// Multiple awards grid
<AwardShowcase 
  awards={awards}
  size="md"
  maxDisplay={6}
/>;

// Full profile section
<UserAwardsProfile userId={userId} isOwnProfile={true} />;

// ============================================================================
// AWARD TAGGING IN FORUM
// ============================================================================

// State management
const { selected, toggle, clear } = useAwardSelection();

// Component usage
<AwardTags
  userId={userId}
  selectedAwards={selected}
  onAwardsChange={setSelected}
/>;

// API call with awards
await fetch('/api/forum/new', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Thread',
    body: 'Content here',
    tagged_awards: selected, // ← Array of award IDs
  }),
});

// ============================================================================
// DATABASE QUERIES
// ============================================================================

// Get all awards for user
SELECT ua.*, at.name, at.icon_emoji
FROM user_awards ua
JOIN award_types at ON ua.award_type_id = at.id
WHERE ua.user_id = '{{user_id}}'
ORDER BY ua.earned_at DESC;

// Check if user has specific award
SELECT COUNT(*) as has_award
FROM user_awards
WHERE user_id = '{{user_id}}'
AND award_type_id = (SELECT id FROM award_types WHERE slug = 'camshaft_contributor');

// Get awards tagged in a post
SELECT ua.id, at.name, at.icon_emoji
FROM forum_post_awards fpa
JOIN user_awards ua ON fpa.user_award_id = ua.id
JOIN award_types at ON ua.award_type_id = at.id
WHERE fpa.post_id = '{{post_id}}';

// ============================================================================
// AWARD TYPES
// ============================================================================

// Default award types:
// - camshaft_contributor (🏎️)
// - cylinder_head_contributor (🔧)
// - legendary_contributor (⭐)

// Add custom award type
INSERT INTO award_types (slug, name, description, icon_emoji, badge_color)
VALUES ('my_award', 'My Award', 'Description', '🎯', '#FFD700');

// ============================================================================
// API ENDPOINTS
// ============================================================================

// GET awards
GET /api/profile/awards?user_id={{user_id}}
→ { ok: true, awards: [...], total_count: 5 }

// POST award (server-side only)
POST /api/profile/awards
Body: {
  user_id: "uuid",
  award_type_id: "uuid",
  submission_id?: "uuid",
  submission_type?: "camshaft|cylinder_head"
}
→ { ok: true, award: {...} }

// POST forum thread with awards
POST /api/forum/new
Body: {
  title: "...",
  body: "...",
  tagged_awards: ["award_id_1", "award_id_2"]
}

// POST forum reply with awards
POST /api/forum/reply
Body: {
  thread_id: "...",
  body: "...",
  tagged_awards: ["award_id_1", "award_id_2"]
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

// AwardBadge
{
  award: Award;           // Required
  size?: 'sm' | 'md' | 'lg';  // Default: 'md'
  interactive?: boolean;   // Default: false
  onSelect?: (award) => void;
}

// AwardShowcase
{
  awards: Award[];
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;     // Default: 6
  canEdit?: boolean;
  onAwardSelect?: (award) => void;
}

// AwardTags
{
  userId: string;
  selectedAwards: string[];
  onAwardsChange: (ids: string[]) => void;
  disabled?: boolean;
}

// UserAwardsProfile
{
  userId: string;
  isOwnProfile?: boolean;
}

// ============================================================================
// HOOKS
// ============================================================================

// useUserAwards
const {
  awards,                    // Award[]
  loading,                   // boolean
  error,                     // string | null
  refetch,                   // () => Promise<void>
  awardCount,                // number
  camshaftCount,             // number
  cylinderHeadCount,         // number
} = useUserAwards({ userId, autoFetch: true });

// useAwardSelection
const {
  selected,                  // string[]
  setSelected,               // (ids: string[]) => void
  toggle,                    // (id: string) => void
  clear,                     // () => void
  add,                       // (id: string) => void
  remove,                    // (id: string) => void
  count,                     // number
  isEmpty,                   // boolean
} = useAwardSelection();

// ============================================================================
// COMMON PATTERNS
// ============================================================================

// Pattern: Show user's awards with conditional display
if (loading) return <Skeleton />;
if (error) return <ErrorAlert message={error} />;
if (awards.length === 0) return <EmptyState />;
return <AwardShowcase awards={awards} size="lg" />;

// Pattern: Forum post with award tagging
const [selectedAwards, setSelectedAwards] = useState<string[]>([]);
return (
  <form onSubmit={(e) => {
    e.preventDefault();
    fetch('/api/forum/reply', {
      method: 'POST',
      body: JSON.stringify({ thread_id, body, tagged_awards: selectedAwards }),
    });
  }}>
    <textarea name="body" />
    <AwardTags userId={userId} selectedAwards={selectedAwards} 
               onAwardsChange={setSelectedAwards} />
    <button type="submit">Post</button>
  </form>
);

// Pattern: Display awards below a post
const { data: postAwards } = await supabase
  .from('forum_post_awards')
  .select('user_awards(*, award_types(*))')
  .eq('post_id', post.id);

return (
  <div className="flex gap-3 mt-4">
    {postAwards?.map(({ user_awards: award }) => (
      <AwardBadge key={award.id} award={award} size="sm" />
    ))}
  </div>
);

// ============================================================================
// TESTING
// ============================================================================

// Test award auto-generation
1. Submit a camshaft via /api/cam-submit
2. Query: SELECT * FROM user_awards WHERE user_id = '...'
3. Should see new row with award_type_id pointing to camshaft_contributor

// Test forum tagging
1. Create forum post with tagged_awards: ["uuid1", "uuid2"]
2. Query: SELECT * FROM forum_post_awards WHERE post_id = '...'
3. Should see 2 rows linking the awards to the post

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

// Award not appearing after submission?
→ Check logs for "Error awarding badge:" 
→ Verify award_types table has correct award
→ Check user_id format (should be uuid)

// Can't tag awards in forum?
→ Verify user has earned awards (fetch /api/profile/awards)
→ Check AwardTags component renders without error
→ Ensure forum post/reply endpoints updated with tagged_awards field

// Duplicate award rows in user_awards?
→ UNIQUE constraint should prevent this
→ Run: ALTER TABLE user_awards ADD UNIQUE (user_id, award_type_id, submission_id);

// Performance issues?
→ Add indexes: CREATE INDEX idx_ua_user ON user_awards(user_id);
→ Limit maxDisplay in AwardShowcase
→ Use pagination for user list

// ============================================================================
// RESOURCES
// ============================================================================

// Full documentation: See AWARDS_SYSTEM.md
// Integration guide: See AWARDS_INTEGRATION.md
// Implementation details: See AWARDS_IMPLEMENTATION.md

// Database migration: migrations/021_create_user_awards_system.sql
// API endpoints: app/api/profile/awards/route.ts
//                app/api/forum/new/route.ts (updated)
//                app/api/forum/reply/route.ts (updated)

// ============================================================================
