# Awards System - Quick Integration Guide

## 🚀 Quick Start

### 1. Run the Migration
```bash
# Apply the migration to your Supabase database
psql -h [host] -U [user] -d [database] -f migrations/021_create_user_awards_system.sql
```

Or via Supabase CLI:
```bash
supabase db push
```

## 2. Display Awards in User Profile

Add this to your user profile page component:

```tsx
import { UserAwardsProfile } from "@/components/UserAwardsProfile";

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const userId = params.id;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1>User Profile</h1>
      
      {/* Other profile sections... */}
      
      <div className="mt-8">
        <UserAwardsProfile userId={userId} isOwnProfile={isOwnProfile} />
      </div>
    </div>
  );
}
```

## 3. Add Awards to Forum Posts

Update your forum post form component:

```tsx
"use client";

import { useState } from "react";
import { AwardTags } from "@/components/AwardTags";

export function ForumThreadForm({ userId }: { userId: string }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedAwards, setSelectedAwards] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/forum/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          tagged_awards: selectedAwards, // ← Include awards
        }),
      });

      if (response.ok) {
        // Reset form and navigate
        setTitle("");
        setBody("");
        setSelectedAwards([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Thread Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <textarea
        placeholder="Your message..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />

      {/* Award Selection */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3">Tag Your Awards</h3>
        <AwardTags
          userId={userId}
          selectedAwards={selectedAwards}
          onAwardsChange={setSelectedAwards}
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Posting..." : "Create Thread"}
      </button>
    </form>
  );
}
```

## 4. Display Awards in Forum Posts

Create a component to show tagged awards in forum posts:

```tsx
import { createClient } from "@supabase/supabase-js";
import { AwardBadge } from "@/components/AwardBadge";

export async function PostAwards({ postId }: { postId: string }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: awards } = await supabase
    .from("forum_post_awards")
    .select(
      `
      id,
      user_awards (
        id,
        earned_at,
        submission_id,
        submission_type,
        award_types (
          id,
          slug,
          name,
          description,
          icon_emoji,
          badge_color
        )
      )
    `
    )
    .eq("post_id", postId);

  if (!awards || awards.length === 0) return null;

  const userAwards = awards
    .map((a: any) => a.user_awards)
    .filter(Boolean);

  return (
    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
      {userAwards.map((award: any) => (
        <AwardBadge key={award.id} award={award} size="sm" />
      ))}
    </div>
  );
}
```

Then use it in your forum post display:

```tsx
export function ForumPost({ post }: { post: any }) {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <p>{post.body}</p>
      <PostAwards postId={post.id} />
    </div>
  );
}
```

## 5. Use the Custom Hook (Optional)

Simplify award fetching with the `useUserAwards` hook:

```tsx
"use client";

import { useUserAwards } from "@/lib/hooks/useUserAwards";
import { AwardShowcase } from "@/components/AwardBadge";

export function UserAwardsSummary({ userId }: { userId: string }) {
  const { awards, loading, error, awardCount, camshaftCount, cylinderHeadCount } =
    useUserAwards({ userId });

  if (loading) return <div>Loading awards...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="font-bold mb-2">
        {awardCount} Awards • {camshaftCount} Camshaft Submissions • {cylinderHeadCount} Cylinder Head Submissions
      </h3>
      <AwardShowcase awards={awards} size="md" maxDisplay={8} />
    </div>
  );
}
```

## 📊 Database Queries

### Check a user's awards
```sql
SELECT ua.id, ua.earned_at, at.name, at.icon_emoji, ua.submission_type
FROM user_awards ua
JOIN award_types at ON ua.award_type_id = at.id
WHERE ua.user_id = '{{user_id}}'
ORDER BY ua.earned_at DESC;
```

### See award distribution
```sql
SELECT at.name, at.icon_emoji, COUNT(ua.id) as count
FROM award_types at
LEFT JOIN user_awards ua ON at.id = ua.award_type_id
GROUP BY at.id, at.name, at.icon_emoji
ORDER BY count DESC;
```

### Find awards tagged in forum posts
```sql
SELECT fp.post_id, ua.id as award_id, at.name, at.icon_emoji, fp.created_at
FROM forum_post_awards fp
JOIN user_awards ua ON fp.user_award_id = ua.id
JOIN award_types at ON ua.award_type_id = at.id
ORDER BY fp.created_at DESC;
```

## 🎨 Styling Reference

All components use Tailwind CSS classes. You can customize colors and sizes:

### Award Badge Sizes
- `sm`: 3rem (for sidebars)
- `md`: 3.5rem (default, for lists)
- `lg`: 4rem (for profiles/hero sections)

### Colors
- Update `badge_color` in `award_types` table to match your theme
- Default colors:
  - Camshaft: `#FF6B6B` (red)
  - Cylinder Head: `#4ECDC4` (teal)
  - Legendary: `#FFD700` (gold)

## ✅ Testing

### Test Auto-Award on Submission
1. Log in as a test user
2. Submit a camshaft via `/upload`
3. Go to user profile → Awards section
4. Should see new "🏎️ Camshaft Contributor" award

### Test Award Tagging in Forum
1. Log in to forum
2. Create new thread
3. Click "Tag Awards" button
4. Select awards and post
5. Awards should appear below the post

### Test Award Endpoints
```bash
# Fetch user's awards
curl "http://localhost:3000/api/profile/awards?user_id=USER_ID"

# Grant award (server-side)
curl -X POST http://localhost:3000/api/profile/awards \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID",
    "award_type_id": "AWARD_TYPE_ID",
    "submission_type": "camshaft"
  }'
```

## 📝 Next Steps

1. ✅ Migration applied
2. ✅ Auto-awarding on submissions (already implemented)
3. Integrate components into your existing pages
4. Customize award types and colors
5. Add leaderboard showing top contributors
6. Create admin panel for managing awards
