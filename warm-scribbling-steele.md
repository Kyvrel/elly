# Shadcn UI Migration Plan

## Strategy: Bottom-Up Migration (Small → Large)

**Recommended Order:**
1. **ChatInput.tsx** (smallest, 28 lines) ✅ Start here
2. **Sidebar.tsx** (simple, 33 lines)
3. **PermissionDialog.tsx** (medium, 55 lines, needs Dialog component)
4. **ChatThread.tsx** (largest, 144 lines, uses ChatInput)

### Why Bottom-Up?

1. **Low Risk**: Small components = small changes = easy to verify
2. **Build Confidence**: See immediate results with buttons/inputs
3. **Dependency Order**: Child components (ChatInput) before parents (ChatThread)
4. **Easy Rollback**: If something breaks, less code to debug

---

## Current State

### Already Installed (✅)
- `src/renderer/src/components/ui/button.tsx`
- `src/renderer/src/components/ui/input.tsx`
- `src/renderer/src/lib/utils.ts` (cn helper)
- `src/renderer/src/styles/globals.css` (CSS variables)

### Component Dependencies
```
App.tsx
├── Sidebar.tsx (independent)
├── ChatThread.tsx
│   └── ChatInput.tsx
└── PermissionDialog.tsx (independent)
```

---

## Phase 1: ChatInput.tsx (EASIEST)

**File**: `src/renderer/src/components/ChatInput.tsx`

**Current Code**:
- 1 `<input type="text">` → Replace with shadcn Input
- 1 `<button>` → Replace with shadcn Button

**Changes**:
```tsx
// Before
<input
  type="text"
  className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
/>
<button className="px-4 py-2 bg-blue-500 text-white rounded-md">
  Send
</button>

// After
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'

<Input
  className="flex-1"
  // other props
/>
<Button>Send</Button>
```

**Verification**:
- Type in chat input
- Click Send button
- Check styling matches theme

---

## Phase 2: Sidebar.tsx

**File**: `src/renderer/src/components/Sidebar.tsx`

**Current Code**:
- 1 "New Chat" `<button>` → shadcn Button
- Multiple thread item `<button>` elements → shadcn Button with `variant="ghost"`

**Changes**:
```tsx
// Before
<button className="w-full px-4 py-2 bg-blue-500 text-white rounded-md">
  New Chat
</button>

// After
import { Button } from '@renderer/components/ui/button'

<Button className="w-full">New Chat</Button>

// Thread items with active state
<Button
  variant={thread.id === activeThreadId ? "secondary" : "ghost"}
  className="w-full justify-start"
>
  {thread.title}
</Button>
```

**Verification**:
- Click "New Chat" button
- Click thread items
- Check active state highlighting

---

## Phase 3: PermissionDialog.tsx (Requires New Component)

**File**: `src/renderer/src/components/PermissionDialog.tsx`

**Prerequisite**: Install shadcn Dialog component
```bash
pnpm dlx shadcn@latest add dialog
```

**Current Code**:
- Custom modal overlay → shadcn Dialog
- 3 action buttons → shadcn Button with variants

**Changes**:
```tsx
// Before
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg">
    <h3>Permission Required</h3>
    <button>Deny</button>
    <button>Allow Once</button>
    <button>Always Allow</button>
  </div>
</div>

// After
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'

<Dialog open={permissionRequest !== null}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Permission Required</DialogTitle>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={handleDeny}>Deny</Button>
      <Button variant="secondary" onClick={handleAllowOnce}>Allow Once</Button>
      <Button onClick={handleAlwaysAllow}>Always Allow</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Verification**:
- Trigger permission dialog (via IPC)
- Click each button (Deny, Allow Once, Always Allow)
- Check dialog closes properly
- Check backdrop click behavior

---

## Phase 4: ChatThread.tsx (Optional Enhancement)

**File**: `src/renderer/src/components/ChatThread.tsx`

**Changes**:
- ChatInput already migrated in Phase 1 ✅
- Optional: Wrap message bubbles in shadcn Card

**Optional Card Migration**:
```bash
pnpm dlx shadcn@latest add card
```

```tsx
// Before
<div className="max-w-[80%] p-3 rounded-lg bg-gray-100">
  {message.content}
</div>

// After (optional)
import { Card } from '@renderer/components/ui/card'

<Card className="max-w-[80%]">
  {message.content}
</Card>
```

**Verification**:
- Send messages
- Check message bubbles render correctly
- Check scrolling behavior

---

## Critical Files

1. `src/renderer/src/components/ChatInput.tsx` - Phase 1
2. `src/renderer/src/components/Sidebar.tsx` - Phase 2
3. `src/renderer/src/components/PermissionDialog.tsx` - Phase 3
4. `src/renderer/src/components/ChatThread.tsx` - Phase 4 (optional)

---

## Install Commands

```bash
# Already installed
# ✅ button, input, utils, globals.css

# Need to install
pnpm dlx shadcn@latest add dialog

# Optional
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add scroll-area
```

---

## Testing Strategy

After each phase:
1. Run dev server: `pnpm dev`
2. Test all UI interactions manually
3. Check browser console for errors
4. Verify styling matches design system

Final verification:
- Create new chat
- Send messages
- Switch between threads
- Trigger permission dialog
- Check responsive behavior

---

## Benefits of This Approach

✅ **Incremental**: Each phase is independent
✅ **Testable**: Verify after each small change
✅ **Safe**: Easy to rollback if issues arise
✅ **Learning**: Build familiarity with shadcn patterns
✅ **Consistent**: All components use same design system
