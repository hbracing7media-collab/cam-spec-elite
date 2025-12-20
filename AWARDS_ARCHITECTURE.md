# Awards System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AWARDS SYSTEM FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

1. CAMSHAFT/CYLINDER HEAD SUBMISSION
═══════════════════════════════════════════════════════════════════════════

   User                          Server                        Database
     │                             │                              │
     │── POST /api/cam-submit ────→│                              │
     │    + file + metadata        │                              │
     │                             │── INSERT cam submission ─────→│
     │                             │                              │
     │                             │← [submission created] ────────│
     │                             │                              │
     │                             │── Query award_types ─────────→│
     │                             │   (camshaft_contributor)     │
     │                             │                              │
     │                             │← [award type ID] ─────────────│
     │                             │                              │
     │                             │── INSERT user_awards ───────→│
     │                             │   (user_id, award_type_id)   │
     │                             │                              │
     │                             │← [award created] ─────────────│
     │                             │                              │
     │← Response (ok: true) ───────│                              │
     │                             │                              │
   ✅ Submission uploaded        ✅ Award automatically granted
   ✅ Award appears in profile



2. VIEWING AWARDS IN PROFILE
═══════════════════════════════════════════════════════════════════════════

   User                          Server                        Database
     │                             │                              │
     │── GET /profile/awards ────→ │                              │
     │    ?user_id=xyz             │── SELECT FROM user_awards ──→│
     │                             │    JOIN award_types          │
     │                             │                              │
     │                             │← [awards with types] ────────│
     │                             │                              │
     │← UserAwardsProfile ─────────│                              │
     │    - Award grid             │                              │
     │    - Statistics             │                              │
     │    - How to earn guide      │                              │
     │                             │                              │
   ✅ User sees their achievements



3. TAGGING AWARDS IN FORUM
═══════════════════════════════════════════════════════════════════════════

   User                          Server                        Database
     │                             │                              │
     │── Open forum reply form ───→│                              │
     │                             │── GET /api/profile/awards ──→│
     │                             │    (fetch user's awards)     │
     │                             │                              │
     │                             │← [awards list] ───────────────│
     │                             │                              │
     │← AwardTags component ──────│                              │
     │    - Expandable grid        │                              │
     │    - Select awards          │                              │
     │                             │                              │
     │── POST /api/forum/reply ───→│                              │
     │    - body                   │                              │
     │    - thread_id              │── INSERT forum_posts ──────→│
     │    - tagged_awards: [...]   │                              │
     │                             │← [post created] ─────────────│
     │                             │                              │
     │                             │── INSERT forum_post_awards ──→│
     │                             │    (for each tagged award)   │
     │                             │                              │
     │                             │← [awards tagged] ─────────────│
     │                             │                              │
     │← Response (ok: true) ───────│                              │
     │                             │                              │
   ✅ Forum post created        ✅ Awards displayed in post
```

## Database Schema Diagram

```
┌──────────────────────────┐
│      award_types         │
├──────────────────────────┤
│ id (PK)                  │
│ slug (UNIQUE)            │
│ name                     │
│ description              │
│ icon_emoji               │
│ badge_color              │
│ created_at               │
└──────────────────────────┘
         ▲
         │ (has many)
         │
         │ award_type_id (FK)
         │
┌──────────────────────────────────┐
│      user_awards                 │
├──────────────────────────────────┤
│ id (PK)                          │
│ user_id (FK) ──────────────┐     │
│ award_type_id (FK) ────────┼────→│
│ earned_at                  │     │
│ submission_id              │     │
│ submission_type            │     │
│ created_at                 │     │
├──────────────────────────────────┤
│ UNIQUE: (user_id, award_   │     │
│          type_id, subm_id) │     │
└──────────────────────────────────┘
         ▲
         │ (has many)
         │
         │ user_award_id (FK)
         │
┌──────────────────────────────────┐
│    forum_post_awards             │
├──────────────────────────────────┤
│ id (PK)                          │
│ post_id (FK) ───────────────────→│ forum_posts
│ user_award_id (FK) ──────────────→│ (points to post)
│ created_at                       │
└──────────────────────────────────┘


RELATED TABLES:

auth.users ◄──── user_id (FK)
  ├─ id
  ├─ email
  └─ ...

forum_posts ◄──── post_id (FK)
  ├─ id
  ├─ thread_id
  ├─ user_id
  ├─ body
  └─ ...

cse_cam_submissions_table
  ├─ id (referenced in submission_id for camshaft awards)

cylinder_heads
  ├─ id (referenced in submission_id for cylinder head awards)
```

## Component Hierarchy

```
Page Component
│
├── UserProfile
│   └── UserAwardsProfile
│       ├── Stats Cards (total, camshaft, cylinder head)
│       └── AwardShowcase
│           ├── AwardBadge (multiple)
│           │   └── Emoji + Name + Date
│           └── "More" indicator
│
└── ForumPage
    └── ForumThreadList
        └── ForumPost
            ├── Post Content
            └── PostAwards
                └── AwardBadge (multiple, from forum_post_awards)

ForumReplyForm
├── TextArea
├── AwardTags
│   ├── "Tag Awards" Button
│   └── ExpandableGrid
│       ├── AwardBadge (interactive, multiple)
│       └── SelectedAwardChips
└── Submit Button
```

## Data Flow: Award Creation

```
[User submits camshaft]
         ↓
    [Validate data]
         ↓
[Upload files to Supabase Storage]
         ↓
[INSERT to cse_cam_submissions_table]
         ↓
         ┌─────────────────────────┐
         │ AWARD GRANT LOGIC       │
         │                         │
         │ Query award_types table │
         │ for 'camshaft_          │
         │ contributor'            │
         │                         │
         │ INSERT to user_awards:  │
         │  - user_id              │
         │  - award_type_id        │
         │  - submission_id        │
         │  - submission_type      │
         └─────────────────────────┘
         ↓
         ✅ Award appears in profile
```

## State Management: Forum Tagging

```
ForumReplyForm Component State:
│
├── body (string) ──────────→ Textarea
├── threadId (string)
├── selectedAwards (string[])
│                   ↓
│          useAwardSelection()
│          ├── add(id)
│          ├── remove(id)
│          ├── toggle(id)
│          ├── clear()
│          └── count
│
└── When submitting:
    {
      thread_id: threadId,
      body: body,
      tagged_awards: selectedAwards  ← API expects this
    }
```

## Security & Permissions Flow

```
RLS Policy: award_types
├── SELECT: Public (anyone can see available awards)
└── INSERT/UPDATE/DELETE: Deny

RLS Policy: user_awards
├── SELECT: Public (show all users' achievements)
├── INSERT: Only via server-side API (no client insert)
└── UPDATE/DELETE: Deny

RLS Policy: forum_post_awards
├── SELECT: Public (see awards tagged in posts)
├── INSERT: Only if user_id matches post creator
│           (can only tag in own posts)
└── DELETE: Only post creator
```

## Performance Optimization

```
Indexes Created:
├── idx_user_awards_user_id
│   └─ Speed up: "GET all awards for user"
├── idx_user_awards_award_type_id
│   └─ Speed up: "How many users have award X"
├── idx_user_awards_submission_id
│   └─ Speed up: "Which award for this submission"
├── idx_forum_post_awards_post_id
│   └─ Speed up: "What awards tagged in this post"
└── idx_forum_post_awards_user_award_id
    └─ Speed up: "Which posts use this award"

Query Strategy:
├── Use Supabase joins (award_types)
│   └─ Avoid N+1 queries
├── Client-side caching (React state)
│   └─ Don't refetch unless necessary
└── Pagination (AwardShowcase maxDisplay)
    └─ Don't render hundreds of badges
```

## Error Handling Flow

```
Award Grant Attempt
        │
        ├─ Award type not found?
        │  └─ Log warning, continue (submission succeeds)
        │
        ├─ User not found?
        │  └─ Log warning, continue (submission succeeds)
        │
        ├─ Award already exists?
        │  └─ UNIQUE constraint ignored (idempotent)
        │
        └─ Database error?
           └─ Log error, continue (submission succeeds)

Philosophy: Never fail submission because award failed
           (awards are "nice to have", submissions are critical)
```

## Integration Points

```
Component Tree Integration:

app/profile/[id]/page.tsx
└── <UserProfile userId={id} />
    ├── Existing profile sections
    └── <UserAwardsProfile userId={id} /> ← NEW


app/forum/thread/[id]/page.tsx
└── <ThreadView thread={thread} />
    ├── <ForumPost post={post} />
    │   └── <PostAwards postId={post.id} /> ← NEW
    └── <ForumReplyForm threadId={id} />
        └── <AwardTags userId={userId} /> ← NEW


API Route Updates:
├── app/api/cam-submit/route.ts
│   └── Added: Award grant logic
├── app/api/cylinder-heads/submit/route.ts
│   └── Added: Award grant logic
├── app/api/forum/new/route.ts
│   └── Updated: Accept tagged_awards in body
├── app/api/forum/reply/route.ts
│   └── Updated: Accept tagged_awards in body
└── app/api/profile/awards/route.ts ← NEW
    └── GET/POST for award management
```

---

## Quick Reference: Table Relationships

```
User (from auth.users)
  ├─ creates: forum_threads
  ├─ creates: forum_posts
  ├─ submits: cse_cam_submissions_table
  ├─ submits: cylinder_heads
  └─ earns: user_awards
      ├─ of_type: award_types
      ├─ for: cse_cam_submissions_table (submission_id)
      ├─ or_for: cylinder_heads (submission_id)
      └─ tagged_in: forum_post_awards (via forum_posts)
```
