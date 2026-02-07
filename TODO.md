# TODO:

- **Features**:
  - Implement "Markdown Rendering" with syntax highlighting for code blocks.
  - Implement "New Chat" logic (currently just an alert).
  - Add "Delete Thread" functionality.
  - Hardcoded model everywhere — 'google/gemini-2.5-flash'
- **State & Data**:
  - Migrate to global state management (e.g., Zustand or Context API).
  - Deepen SWR/React Query integration for caching and optimistic updates.
- **UI/UX (shadcn/ui)**:
  - Replace simple components with shadcn/ui for a polished look.
  - Add loading skeletons and toast notifications (e.g., sonner).
  - Add framer-motion animations for transitions.
  1. ChatInput (easiest) → 2 components
  2. Sidebar (simple) → multiple buttons
  3. PermissionDialog (medium) → needs Dialog component
  4. ChatThread (complex) → uses migrated ChatInput
- **Reliability & Security**:
  - Add React Error Boundaries.
  - Move hardcoded URLs to environment variables.
  - Audit IPC security in preload scripts.

## Bugs (from code review)

### CRITICAL

- [ ] `bash-tool.ts` — Dangerous pattern filtering is easy to bypass (use allowlist, add command chaining protection)

### HIGH

- [ ] `ChatService.ts:50` — Remove `console.log` with `JSON.stringify(messages)` (leaks sensitive content)
- [ ] `ChatService.ts:26-35` — Only one WebSocket per thread (multi-window broken)
- [ ] `PermissionManager.ts` — Fix timeout: add `resolve(false)` and remove unused `TIMEOUT` import
- [ ] `server.ts` — Add try-catch and input validation to API routes

### MEDIUM

- [ ] `WorkspaceManager.ts` — Fix `.env` regex: `/\.env\..$/` → `/\.env\..+$/`, add more sensitive patterns
- [ ] `ChatThread.tsx` — Add try-catch around `api.messages.send()`
- [ ] `ChatThread.tsx` — Hardcoded WebSocket port `8765` (should be configurable)
- [ ] `ChatThread.tsx` — WebSocket cleanup issue on connection failure

# DONE

- Refactor: Split App.tsx into Sidebar.tsx, ChatThread.tsx, and Input.tsx.
- Fix: `write-file-tool.ts` security logic inverted
- Fix: `App.tsx` crash on empty thread list
- Fix: Typo "worksapce" in read-file-tool.ts
- Fix: Typo "messsage" in DBService.ts
- Fix: `any[]` type in App.tsx → `ChatThreadType[]`
