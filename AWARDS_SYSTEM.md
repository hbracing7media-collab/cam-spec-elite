# User Awards System Documentation

## Overview

The User Awards System is a recognition and gamification feature that:
1. **Automatically awards badges** when users submit camshafts or cylinder heads
2. **Displays awards in user profiles** showing their contribution history
3. **Allows tagging awards in forum posts** as status tokens to showcase achievements

## Database Schema

### Tables

#### `award_types`
Stores the available award types. Pre-populated with:
- `camshaft_contributor` - 🏎️ Earned for submitting a camshaft
- `cylinder_head_contributor` - 🔧 Earned for submitting a cylinder head  
- `legendary_contributor` - ⭐ Earned after 10 contributions

**Fields:**
- `id` (uuid): Primary key
- `slug` (text): Unique identifier (e.g., "camshaft_contributor")
- `name` (text): Display name
- `description` (text): What the award represents
- `icon_emoji` (text): Emoji to display with award
- `badge_color` (text): CSS color for badge background
- `created_at` (timestamptz): Creation timestamp

#### `user_awards`
Tracks which awards each user has earned.

**Fields:**
- `id` (uuid): Primary key
- `user_id` (uuid): Reference to `auth.users`
- `award_type_id` (uuid): Reference to `award_types`
- `earned_at` (timestamptz): When the award was earned
- `submission_id` (uuid): Optional reference to submission (cam or head ID)
- `submission_type` (text): Type of submission ("camshaft" or "cylinder_head")
- `created_at` (timestamptz): Record creation timestamp

**Constraints:**
- Unique constraint on `(user_id, award_type_id, submission_id)` prevents duplicate awards

#### `forum_post_awards`
Links awards to forum posts when users tag them.

**Fields:**
- `id` (uuid): Primary key
- `post_id` (uuid): Reference to `forum_posts`
- `user_award_id` (uuid): Reference to `user_awards`
- `created_at` (timestamptz): When award was tagged

## API Endpoints

### GET `/api/profile/awards?user_id={user_id}`
Fetches all awards for a user with award type details.

**Response:**
```json
{
  "ok": true,
  "awards": [
    {
      "id": "uuid",
      "earned_at": "2025-01-15T10:30:00Z",
      "submission_id": "uuid",
      "submission_type": "camshaft",
      "award_types": {
        "id": "uuid",
        "slug": "camshaft_contributor",
        "name": "Camshaft Contributor",
        "description": "Earned for submitting a camshaft specification",
        "icon_emoji": "🏎️",
        "badge_color": "#FF6B6B"
      }
    }
  ],
  "total_count": 1
}
```

### POST `/api/profile/awards`
Manually grant an award (server-side only).

**Request:**
```json
{
  "user_id": "uuid",
  "award_type_id": "uuid",
  "submission_id": "uuid (optional)",
  "submission_type": "camshaft | cylinder_head (optional)"
}
```

## Automatic Award Granting

### When Submitting a Camshaft
The `/api/cam-submit` endpoint automatically:
1. Inserts the camshaft submission
2. Queries for the "camshaft_contributor" award type
3. Awards it to the user (if not already earned)

**Code Location:** [app/api/cam-submit/route.ts](../app/api/cam-submit/route.ts#L287-L310)

### When Submitting a Cylinder Head
The `/api/cylinder-heads/submit` endpoint automatically:
1. Inserts the cylinder head submission
2. Queries for the "cylinder_head_contributor" award type
3. Awards it to the user (if not already earned)

**Code Location:** [app/api/cylinder-heads/submit/route.ts](../app/api/cylinder-heads/submit/route.ts#L120-L143)

## React Components

### `AwardBadge`
Displays a single award badge.

**Props:**
```typescript
interface AwardBadgeProps {
  award: Award;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onSelect?: (award: Award) => void;
}
```

**Usage:**
```tsx
import { AwardBadge } from "@/components/AwardBadge";

<AwardBadge 
  award={award}
  size="md"
  interactive={true}
  onSelect={(award) => console.log(award)}
/>
```

### `AwardShowcase`
Displays multiple awards in a grid.

**Props:**
```typescript
interface AwardShowcaseProps {
  awards: Award[];
  size?: "sm" | "md" | "lg";
  maxDisplay?: number;
  canEdit?: boolean;
  onAwardSelect?: (award: Award) => void;
}
```

**Usage:**
```tsx
import { AwardShowcase } from "@/components/AwardBadge";

<AwardShowcase 
  awards={userAwards}
  size="lg"
  maxDisplay={12}
  canEdit={isOwnProfile}
/>
```

### `AwardTags`
Allows users to select and tag awards in forum posts.

**Props:**
```typescript
interface AwardTagsProps {
  userId: string;
  selectedAwards: string[]; // array of user_award IDs
  onAwardsChange: (awardIds: string[]) => void;
  disabled?: boolean;
}
```

**Usage:**
```tsx
import { AwardTags } from "@/components/AwardTags";
import { useState } from "react";

export function ForumPostForm({ userId }) {
  const [selectedAwards, setSelectedAwards] = useState<string[]>([]);

  return (
    <form onSubmit={handleSubmit}>
      <textarea placeholder="Your message..." />
      
      <AwardTags
        userId={userId}
        selectedAwards={selectedAwards}
        onAwardsChange={setSelectedAwards}
      />
      
      <button type="submit">Post</button>
    </form>
  );
}
```

### `UserAwardsProfile`
Displays the user's awards section in their profile with stats.

**Props:**
```typescript
interface UserAwardsProfileProps {
  userId: string;
  isOwnProfile?: boolean;
}
```

**Usage:**
```tsx
import { UserAwardsProfile } from "@/components/UserAwardsProfile";

export function UserProfile({ userId, isOwn }) {
  return (
    <div>
      <h1>User Profile</h1>
      <UserAwardsProfile userId={userId} isOwnProfile={isOwn} />
    </div>
  );
}
```

## Forum Integration

### Creating a New Thread with Awards
When creating a forum thread, include the `tagged_awards` array:

```json
{
  "title": "My Build Thread",
  "body": "Here's my engine build...",
  "tagged_awards": ["uuid1", "uuid2"]
}
```

### Posting a Reply with Awards
When replying to a thread, include the `tagged_awards` array:

```json
{
  "thread_id": "uuid",
  "body": "Great setup!",
  "tagged_awards": ["uuid1"]
}
```

The backend will:
1. Create the forum post/thread
2. Link the specified awards via `forum_post_awards` table

**Updated Endpoints:**
- [app/api/forum/new/route.ts](../app/api/forum/new/route.ts)
- [app/api/forum/reply/route.ts](../app/api/forum/reply/route.ts)

## Customizing Award Types

To add new award types, insert into the `award_types` table:

```sql
INSERT INTO public.award_types (slug, name, description, icon_emoji, badge_color)
VALUES 
  ('my_award', 'My Award', 'Award description', '🎯', '#FFD700');
```

Then grant it programmatically via the POST `/api/profile/awards` endpoint or add auto-awarding logic to relevant submission endpoints.

## Row-Level Security (RLS)

- **award_types**: Public read access
- **user_awards**: Public read access (users can see all awards)
- **forum_post_awards**: Public read access; users can only tag awards in their own posts

## Future Enhancements

1. **Milestone Tracking**: Auto-award "Legendary Contributor" at 10 contributions
2. **Leaderboard**: Display top contributors by award count
3. **Achievement Notifications**: Notify users when they earn new awards
4. **Award Rarity Tiers**: Add visual indicators for rarer achievements
5. **Custom Awards**: Admins can create special awards for contests
6. **Award Expiration**: Time-limited seasonal awards
