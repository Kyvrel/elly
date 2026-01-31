# TODO:

- **Features**:
  - Implement "Markdown Rendering" with syntax highlighting for code blocks.
  - Implement "New Chat" logic (currently just an alert).
  - Add "Delete Thread" functionality.
- **State & Data**:
  - Migrate to global state management (e.g., Zustand or Context API).
  - Deepen SWR/React Query integration for caching and optimistic updates.
- **UI/UX (shadcn/ui)**:
  - Replace simple components with shadcn/ui for a polished look.
  - Add loading skeletons and toast notifications (e.g., sonner).
  - Add framer-motion animations for transitions.
- **Reliability & Security**:
  - Add React Error Boundaries.
  - Move hardcoded URLs to environment variables.
  - Audit IPC security in preload scripts.

# DONE

- Refactor: Split App.tsx into Sidebar.tsx, ChatThread.tsx, and Input.tsx.
