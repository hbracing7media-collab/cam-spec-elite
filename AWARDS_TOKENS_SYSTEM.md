# 🎯 Achievement Tokens System - Image-Based Awards

## Overview

The awards system has been upgraded to use beautiful, professional neon-style token images instead of emojis. Each token is a visual representation of achievement in the HB Racing community.

---

## 🎨 Available Tokens

### 1. **Cam Contributor** 🏎️
- **Image:** `/tokens/cam_contributor.png`
- **Type:** Submission
- **Rarity:** Common
- **Awarded For:** Submitting camshaft data and specifications
- **Grant Mode:** Automatic
- **Color Theme:** Red/Neon Purple

### 2. **Head Contributor** 🔧
- **Image:** `/tokens/head_contributor.png`
- **Type:** Submission
- **Rarity:** Common
- **Awarded For:** Submitting cylinder head data and flow specifications
- **Grant Mode:** Automatic
- **Color Theme:** Teal/Cyan

### 3. **Dyno King** 🏆
- **Image:** `/tokens/dyno_king.png`
- **Type:** Submission
- **Rarity:** Rare
- **Awarded For:** Exceptional dyno sheet submissions or performance wins
- **Grant Mode:** Automatic
- **Threshold:** 5 dyno submissions
- **Color Theme:** Gold

### 4. **Submission Streak** 🔥
- **Image:** `/tokens/submission_streak.png`
- **Type:** Achievement
- **Rarity:** Epic
- **Awarded For:** Consecutive approved submissions
- **Grant Mode:** Automatic
- **Threshold:** 10 consecutive submissions
- **Color Theme:** Magenta/Neon Pink

### 5. **Car Guru** 🧠
- **Image:** `/tokens/car_guru.png`
- **Type:** Forum
- **Rarity:** Epic
- **Awarded For:** High forum engagement and community reputation
- **Grant Mode:** Automatic
- **Threshold:** 50 forum points/engagement
- **Color Theme:** Cyan/Blue

### 6. **Admin Award** 👑
- **Image:** `/tokens/admin_award.png`
- **Type:** Special
- **Rarity:** Legendary
- **Awarded For:** Special contributions or community service
- **Grant Mode:** Manual (admins only)
- **Color Theme:** Gold

---

## 📁 File Structure

```
public/
├── tokens/
│   ├── cam_contributor.png
│   ├── head_contributor.png
│   ├── dyno_king.png
│   ├── submission_streak.png
│   ├── car_guru.png
│   └── admin_award.png
└── awards-config.json
```

---

## ⚙️ Configuration

### `/public/awards-config.json`

The central configuration file that maps tokens to metadata:

```json
{
  "awards": [
    {
      "token_id": "cam_contributor",
      "slug": "camshaft_contributor",
      "label": "Cam Contributor",
      "description": "Awarded for submitting camshaft data...",
      "icon": "/tokens/cam_contributor.png",
      "type": "submission",
      "grant_mode": "automatic",
      "rarity": "common",
      "badge_color": "#FF6B6B"
    },
    // ... more awards
  ],
  "rarity_colors": {
    "common": "#4CAF50",
    "rare": "#2196F3",
    "epic": "#9C27B0",
    "legendary": "#FFD700"
  }
}
```

---

## 🔧 Utilities

### `lib/utils/awardsConfig.ts`

Helper functions to load and query award configurations:

```typescript
// Load all awards config
const config = await loadAwardsConfig();

// Get specific award
const award = await getAwardByTokenId("cam_contributor");
const award = await getAwardBySlug("camshaft_contributor");

// Get awards by type
const submissionAwards = await getAwardsByType("submission");
const automaticAwards = await getAutomaticAwards();

// Get rarity colors
const colors = await getRarityColors();
const color = await getRarityColor("epic");

// Group awards
const grouped = await getAwardsGroupedByType();
// {
//   submission: [...],
//   achievement: [...],
//   forum: [...],
//   special: [...]
// }
```

---

## 🎨 Rarity Tiers

| Rarity | Color | Meaning |
|--------|-------|---------|
| **Common** | 🟢 Green (#4CAF50) | Easy to earn, frequently awarded |
| **Rare** | 🔵 Blue (#2196F3) | Requires dedication, rarer |
| **Epic** | 🟣 Purple (#9C27B0) | Challenging achievement |
| **Legendary** | 🟡 Gold (#FFD700) | Highest honor, very exclusive |

---

## 📊 Award Types

| Type | Trigger | Grant Mode | Example |
|------|---------|-----------|---------|
| **submission** | Data submission | Automatic | Cam Contributor |
| **achievement** | Milestone reached | Automatic | Submission Streak |
| **forum** | Community engagement | Automatic | Car Guru |
| **special** | Admin action | Manual | Admin Award |

---

## 💻 Component Usage

### Display Token Badge

```tsx
import { AwardBadge } from '@/components/AwardBadge';

<AwardBadge 
  award={award}
  size="lg"  // sm | md | lg
/>
```

### Display Multiple Tokens

```tsx
import { AwardShowcase } from '@/components/AwardBadge';

<AwardShowcase 
  awards={userAwards}
  size="md"
  maxDisplay={12}
/>
```

### Show User's Tokens

```tsx
import { UserAwardsProfile } from '@/components/UserAwardsProfile';

<UserAwardsProfile userId={userId} isOwnProfile={true} />
```

---

## 🔄 How Tokens are Awarded

### Automatic Tokens

Granted automatically when conditions are met:

1. **Cam Contributor**: First camshaft submission
   ```typescript
   // In cam-submit endpoint
   await grantAward(userId, "camshaft_contributor", submissionId);
   ```

2. **Head Contributor**: First cylinder head submission
   ```typescript
   // In cylinder-heads submit endpoint
   await grantAward(userId, "cylinder_head_contributor", submissionId);
   ```

3. **Dyno King**: After 5 dyno submissions
   ```typescript
   // Check count before granting
   const count = await countUserDynoSubmissions(userId);
   if (count >= 5) await grantAward(userId, "dyno_king");
   ```

4. **Submission Streak**: After 10 consecutive approved submissions
   ```typescript
   // Track consecutive streak, grant when reached
   const streak = await getUserSubmissionStreak(userId);
   if (streak >= 10) await grantAward(userId, "submission_streak");
   ```

5. **Car Guru**: After 50 forum engagement points
   ```typescript
   // Track forum activity, grant when threshold reached
   const points = await getUserForumEngagement(userId);
   if (points >= 50) await grantAward(userId, "car_guru");
   ```

### Manual Tokens

Granted by administrators:

- **Admin Award**: Special recognition
  ```typescript
  // Admin-only endpoint
  POST /api/admin/award
  {
    user_id: "uuid",
    award_type: "admin_award",
    reason: "Outstanding contribution"
  }
  ```

---

## 📝 Database Schema Updates

The `award_types` table now includes:

```sql
CREATE TABLE award_types (
  id uuid PRIMARY KEY,
  slug text UNIQUE,
  name text,
  description text,
  icon_emoji text,           -- Fallback: 🏎️
  icon_path text,            -- New: /tokens/cam_contributor.png
  badge_color text,
  rarity text,               -- New: common, rare, epic, legendary
  grant_mode text,           -- New: automatic, manual
  award_type text,           -- New: submission, achievement, forum, special
  created_at timestamptz
);
```

---

## 🎯 Adding New Tokens

To add a new achievement token:

### 1. Add Image to `/public/tokens/`
Place your PNG image in the tokens directory

### 2. Update `public/awards-config.json`
```json
{
  "token_id": "my_token",
  "slug": "my_unique_slug",
  "label": "My Token",
  "description": "What this token represents",
  "icon": "/tokens/my_token.png",
  "type": "achievement",
  "grant_mode": "automatic",
  "rarity": "epic",
  "badge_color": "#00FF00",
  "threshold": 100
}
```

### 3. Update Database Migration
```sql
INSERT INTO award_types (slug, name, icon_path, rarity, grant_mode, award_type)
VALUES ('my_unique_slug', 'My Token', '/tokens/my_token.png', 'epic', 'automatic', 'achievement');
```

### 4. Add Grant Logic (if automatic)
In relevant API endpoint:
```typescript
// Check threshold and grant
if (meetsCondition) {
  await supabase.from('user_awards').insert({
    user_id,
    award_type_id: awardTypeId,
    earned_at: new Date()
  });
}
```

---

## 🎨 Token Styling

Tokens are displayed with:
- **Image**: High-quality PNG (512x512px recommended)
- **Glow Effect**: Shadow effects for depth
- **Rarity Badge**: Color-coded rarity indicator
- **Responsive Sizes**:
  - `sm`: 48px (sidebars, lists)
  - `md`: 56px (default)
  - `lg`: 80px (profile showcase)

---

## 📊 Statistics Tracked

User awards profile shows:

- **Total Tokens**: Count of all earned tokens
- **By Type**: Breakdown by submission/achievement/forum/special
- **By Rarity**: Count of common/rare/epic/legendary tokens
- **Recent**: Most recently earned tokens
- **Display**: Showcase with rarity indicators

---

## 🔐 Permissions

- ✅ Public read access to all user awards
- ✅ Users can tag tokens in their own forum posts
- ✅ Admins can manually grant admin awards
- ✅ System can automatically grant tokens
- ❌ Users cannot create/modify awards
- ❌ Users cannot grant awards to others

---

## 🚀 Integration Checklist

- [x] Images saved to `/public/tokens/`
- [x] Configuration file created (`/public/awards-config.json`)
- [x] Database migration updated with image paths
- [x] Components updated to display images
- [x] Utility functions created for config loading
- [x] UserAwardsProfile updated with rarity stats
- [ ] Auto-grant logic updated for new token types
- [ ] Admin endpoint created for manual awards
- [ ] Forum integration updated for token tagging
- [ ] Documentation updated

---

## 🎊 Result

Users now see professional, visually stunning achievement tokens that:
- 🎨 Look amazing in their profiles
- 🏆 Show community recognition
- 💪 Motivate participation
- 🌟 Display expertise in forum posts

---

**Token System v2.0 - Live! 🚀**
