# Short Blocks Ecosystem Guide

## Overview

The short blocks ecosystem is a global state management system that makes user engine specifications (`user_short_blocks` table) accessible throughout the entire app ecosystem. It provides:

- **Global Context**: Single source of truth for all user short blocks
- **Query Methods**: Filter blocks by make, family, displacement, or ID
- **Auto-Loading**: Blocks are loaded once on app startup
- **Easy Access**: Simple hooks for accessing blocks from any component
- **Reactive Updates**: Components using hooks automatically re-render when blocks change

## Architecture

### 1. **ShortBlocksContext** (`lib/context/ShortBlocksContext.tsx`)
   - Manages global state for user's short blocks
   - Loads blocks from `/api/profile/short-blocks` on app initialization
   - Provides query methods and state management functions
   - Wrapped in `ShortBlocksProvider` at root layout

### 2. **ShortBlocksProvider** (included in Context)
   - Client component that provides context to entire app
   - Automatically fetches blocks on mount
   - Handles loading/error states

### 3. **Hooks** (`lib/hooks/useShortBlocks.ts`)
   - `useAllShortBlocks()` - Get all blocks
   - `useShortBlockById(id)` - Get single block by ID
   - `useShortBlocksByMake(make)` - Get blocks by engine make
   - `useShortBlocksByFamily(family)` - Get blocks by engine family
   - `useShortBlocksByMakeAndFamily(make, family)` - Get blocks by both
   - `useShortBlocksByDisplacement(displacement)` - Get blocks by displacement
   - `useShortBlocksLoaded()` - Check if blocks are initialized

### 4. **Query API** (`app/api/short-blocks/query/route.ts`)
   - Endpoint: `GET /api/short-blocks/query?make=Ford&family=Windsor&displacement=302`
   - Parameters: `make`, `family`, `displacement` (all optional)
   - Returns filtered user blocks matching criteria

## Usage Examples

### Example 1: Get all blocks in a component
```typescript
'use client';

import { useAllShortBlocks } from '@/lib/hooks/useShortBlocks';

export default function MyComponent() {
  const blocks = useAllShortBlocks();
  
  return (
    <div>
      {blocks.map(block => (
        <div key={block.id}>{block.block_name}</div>
      ))}
    </div>
  );
}
```

### Example 2: Get block by ID
```typescript
import { useShortBlockById } from '@/lib/hooks/useShortBlocks';

export default function BlockDetail({ blockId }) {
  const block = useShortBlockById(blockId);
  
  return (
    <div>
      <h2>{block?.block_name}</h2>
      <p>Bore: {block?.bore}</p>
      <p>Stroke: {block?.stroke}</p>
    </div>
  );
}
```

### Example 3: Filter by engine specs
```typescript
import { useShortBlocksByMakeAndFamily } from '@/lib/hooks/useShortBlocks';

export default function CompatibleBlocks() {
  const blocks = useShortBlocksByMakeAndFamily('Ford', 'Windsor');
  
  return (
    <select>
      {blocks.map(block => (
        <option key={block.id} value={block.id}>
          {block.block_name} ({block.displacement})
        </option>
      ))}
    </select>
  );
}
```

### Example 4: Check if blocks are loaded before rendering
```typescript
import { useShortBlocksLoaded, useAllShortBlocks } from '@/lib/hooks/useShortBlocks';

export default function BlockList() {
  const blocks = useAllShortBlocks();
  const isReady = useShortBlocksLoaded();
  
  if (!isReady) return <div>Loading blocks...</div>;
  
  return (
    <div>
      {blocks.length > 0 ? (
        blocks.map(block => <div key={block.id}>{block.block_name}</div>)
      ) : (
        <div>No short blocks created yet</div>
      )}
    </div>
  );
}
```

### Example 5: Use in Calculator (already implemented)
```typescript
import { useAllShortBlocks } from '@/lib/hooks/useShortBlocks';

export default function CamSpecEliteCalculator() {
  const userShortBlocks = useAllShortBlocks();
  const [selectedBlockId, setSelectedBlockId] = useState('');
  
  function handleLoadBlock(blockId) {
    const block = userShortBlocks.find(b => b.id === blockId);
    if (!block) return;
    
    // Update calculator fields from block
    setEngine({
      bore: parseFloat(block.bore),
      stroke: parseFloat(block.stroke),
      rod: parseFloat(block.rod_length),
      // ... etc
    });
  }
  
  return (
    <select onChange={e => handleLoadBlock(e.target.value)}>
      {userShortBlocks.map(block => (
        <option key={block.id} value={block.id}>
          {block.block_name}
        </option>
      ))}
    </select>
  );
}
```

## Data Flow

1. **App Load**: Root layout wraps content with `ShortBlocksProvider`
2. **Provider Init**: Provider mounts → calls `/api/profile/short-blocks`
3. **Context Update**: Blocks loaded into global context
4. **Component Access**: Any component can use hooks to access blocks
5. **Re-rendering**: When blocks change, all components using hooks re-render

## Adding Blocks to Other Features

To add short block access to a new feature:

1. **Import the hook** you need:
   ```typescript
   import { useAllShortBlocks, useShortBlocksByMakeAndFamily } from '@/lib/hooks/useShortBlocks';
   ```

2. **Call the hook** in your component:
   ```typescript
   const blocks = useAllShortBlocks();
   // or
   const compatibleBlocks = useShortBlocksByMakeAndFamily('Ford', 'Windsor');
   ```

3. **Use the blocks**:
   ```typescript
   blocks.map(block => (
     <option key={block.id} value={block.id}>{block.block_name}</option>
   ))
   ```

## Updating Blocks

When a user creates, updates, or deletes a block via the profile page:

1. **API updates database** (`/api/profile/short-blocks` endpoints)
2. **Component calls** `loadBlocks()` to refresh context
3. **All components** using hooks automatically see the new data

Example after creating a block:
```typescript
const { loadBlocks } = useShortBlocks();

const handleCreateBlock = async () => {
  // Create block via API
  // Then refresh context
  await loadBlocks();
};
```

## Available Fields

Each short block contains:
- `id` - UUID
- `user_id` - Owner's ID
- `block_name` - User-friendly name (e.g., "Street 302")
- `engine_make` - e.g., "Ford"
- `engine_family` - e.g., "Windsor"
- `displacement` - e.g., "302 ci"
- `bore` - e.g., "4.00"
- `stroke` - e.g., "3.00"
- `deck_height` - e.g., "9.000"
- `piston_dome_dish` - e.g., "-14cc Dish"
- `head_gasket_bore` - e.g., "4.06"
- `head_gasket_compressed_thickness` - e.g., "0.04"
- `rod_length` - e.g., "5.956"
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Current Implementations

### Already Using Global Blocks:
- ✅ **Calculator** (`app/components/CamSpecEliteCalculator.tsx`) - Loads and populates engine specs
- ✅ **Profile Page** (`app/profile/page.tsx`) - Lists and manages blocks

### Ready to Integrate:
- Forum features (link builds to forum posts)
- Calculators (cylinder head selector, etc.)
- Comparison tools
- Export/sharing features
- Historical tracking

## Performance Notes

- Blocks are loaded **once** on app startup
- **No repeated API calls** (unless explicitly refreshing)
- Filtering happens **in-memory** (very fast)
- All hooks use **React Context** (optimal performance)
- Perfect for apps with <10k blocks per user (typical use)

## Troubleshooting

**Blocks not appearing?**
- Check if user is authenticated
- Verify blocks exist in database
- Check browser console for errors

**Old blocks showing?**
- Call `loadBlocks()` after creating/updating/deleting
- Check if `isInitialized` is true before rendering

**Component not updating?**
- Ensure component is a client component (`'use client'`)
- Ensure parent is wrapped with `ShortBlocksProvider` (done in root layout)
- Check that you're using a hook (not direct context)
