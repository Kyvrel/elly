# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- **Install**: `pnpm install`
- **Development**: `pnpm dev`
- **Build**: `pnpm build` (Runs typecheck and electron-vite build)
- **Platform Builds**: `pnpm build:win`, `pnpm build:mac`, `pnpm build:linux`
- **Test**: `pnpm test`
- **Test (Watch)**: `pnpm test:watch`
- **Lint**: `pnpm lint`
- **Format**: `pnpm format`
- **Typecheck**: `pnpm typecheck`
- **Database**:
    - `pnpm db:generate`: Generate migrations (Drizzle)
    - `pnpm db:migrate`: Apply migrations
    - `pnpm db:push`: Push schema changes to database
    - `pnpm db:seed`: Seed test data
- **AI Devtools**: `pnpm devtools`

## Architecture & Structure
This is an Electron application built with React, TypeScript, and Vite (electron-vite).

### Project Layout
- `src/main/`: Electron main process logic.
    - `src/main/db/`: Database schema (Drizzle ORM) and SQLite initialization (better-sqlite3).
    - `src/main/ipc/`: Inter-Process Communication handlers.
    - `src/main/api/`: Local API server (Express) used for AI integration.
- `src/renderer/`: Frontend React application.
    - `src/renderer/src/components/`: UI components (Sidebar, ChatThread, Input).
    - `src/renderer/src/hooks/`: Custom React hooks for data fetching and state.
- `src/preload/`: Scripts bridging main and renderer processes.
- `src/shared/`: Shared types and IPC channel constants.
- `scripts/`: Development and release utility scripts.

### Key Technologies
- **Frontend**: React 19, Tailwind CSS 4, Radix UI.
- **Backend**: Electron, Drizzle ORM, better-sqlite3, Express.
- **AI**: Vercel AI SDK (@ai-sdk) for multi-provider integration (Anthropic, Google, OpenAI).
- **Tooling**: Vite, Vitest, ESLint, Prettier.
