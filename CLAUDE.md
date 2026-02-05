# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Elly is an Electron desktop application that provides an AI chat interface with file system tools. It features a React frontend with shadcn/ui components, an Express API server, WebSocket real-time communication, and SQLite database using Drizzle ORM. The AI SDK from Vercel powers chat completions with support for multiple providers (OpenAI, Anthropic, Google).

## Development Commands

### Core Development

```bash
# Start dev environment (AI SDK devtools + Electron app)
pnpm dev

# Start only the Electron app
pnpm dev:app

# Start only AI SDK devtools
pnpm devtools

# Start API server standalone (development mode)
pnpm dev:api
```

### Code Quality

```bash
# Run linting
pnpm lint

# Format code with Prettier
pnpm format

# Type checking
pnpm typecheck          # Check both Node and web
pnpm typecheck:node     # Check main process only
pnpm typecheck:web      # Check renderer process only
```

### Testing

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Database Operations

```bash
# Generate migrations from schema changes
pnpm db:generate

# Run pending migrations
pnpm db:migrate

# Push schema directly to database (no migration files)
pnpm db:push

# Open Drizzle Studio (visual database browser)
pnpm db:studio

# Seed test data
pnpm db:seed
```

### Building

```bash
# Build the application
pnpm build

# Build and package (unpacked)
pnpm build:unpack

# Platform-specific builds
pnpm build:mac
pnpm build:win
pnpm build:linux
```

## Architecture

### Process Structure

**Electron Main Process** (`src/main/`):

- Entry point: `src/main/index.ts`
- Initializes database, Express API server, WebSocket server
- Manages workspace and IPC handlers
- Runs on Node.js with access to file system and native APIs

**Electron Renderer Process** (`src/renderer/`):

- React application with shadcn/ui components
- Communicates via HTTP API and WebSocket for real-time updates
- Path alias: `@` and `@renderer` point to `src/renderer/src`

**Preload Scripts** (`src/preload/`):

- Bridge between main and renderer processes
- Exposes safe IPC channels to renderer

**Shared Code** (`src/shared/`):

- Type definitions and constants used by both main and renderer
- Files: `types.ts`, `types-websocket.ts`, `types-tools.ts`, `ipc-channels.ts`

### Key Services (Main Process)

**AIProviderFactory** (`services/AIProviderFactory.ts`):

- Creates language model instances from provider configuration
- Supports OpenAI, Anthropic, and Google providers

**ChatService** (`services/ChatService.ts`):

- Manages streaming chat completions using AI SDK
- Registers WebSocket clients per thread
- Streams updates (token, tool calls, finish) to connected clients
- Uses tool registry for file system operations

**DBService** (`services/DBService.ts`):

- CRUD operations for threads, messages, providers, and workspaces
- Wraps Drizzle ORM queries

**ToolService** (`services/ToolService.ts`):

- Provides tool definitions to AI models
- Tools are registered in `tools/registry.ts`

**PermissionManager** (`services/PermissionManager.ts`):

- Handles permission requests for dangerous operations
- Sends IPC requests to renderer for user approval

**WorkspaceManager** (`services/WorkspaceManager.ts`):

- Manages workspace paths and active workspace
- Database is workspace-scoped (stored in workspace directory)

**WebSocketService** (`services/WebSocketService.ts`):

- WebSocket server on port 3001
- Broadcasts AI streaming updates to frontend

### AI Tools

Tool registry at `src/main/tools/registry.ts` includes:

- **read-file**: Read file contents
- **write-file**: Create or overwrite files
- **edit-file**: Apply line-based diffs to existing files
- **bash**: Execute shell commands (requires permission)
- **glob**: Find files by pattern
- **grep**: Search file contents

Each tool implements the `ToolDefinition` interface from `shared/types-tools.ts`.

### Database Schema

Location: `src/main/db/schema.ts`

Tables:

- **providers**: AI provider configurations (API keys, base URLs)
- **chat_threads**: Conversation threads with model and workspace info
- **chat_messages**: Individual messages with parent-child relationships (stores `UIMessage` from AI SDK)
- **app_settings**: Application settings as JSON
- **workspaces**: Workspace paths and active status

Database file: `elly.db` in project root (SQLite).

Model format in threads/messages: `"providerId/modelName"` (e.g., `"openai/gpt-4o"`).

### API Server

Express server on port 3000 (`src/main/api/server.ts`):

- CORS enabled for renderer origin
- Routes for threads, messages, chat completion
- Integrates with DBService and ChatService

### Frontend Structure

Main components:

- **App.tsx**: Root component, layout container
- **Sidebar.tsx**: Thread list navigation
- **ChatThread.tsx**: Message display with streaming
- **ChatInput.tsx**: Message input with model selection
- **PermissionDialog.tsx**: Permission approval UI

UI Components: shadcn/ui library in `src/renderer/src/components/ui/`

Utilities:

- **lib/api.ts**: API client functions
- **lib/utils.ts**: shadcn/ui utility (cn for class merging)

### Configuration Files

**components.json**: shadcn/ui configuration

- Style: new-york
- Path aliases: `@renderer/components`, `@renderer/lib/utils`, etc.
- Icon library: lucide-react

**electron.vite.config.ts**: Vite config for Electron

- Renderer uses React + Tailwind CSS v4 (via `@tailwindcss/vite`)
- Path aliases: `@` and `@renderer` for renderer source

**drizzle.config.ts**: Drizzle Kit configuration

- Schema: `./src/main/db/schema.ts`
- Migrations output: `./drizzle`
- Database: `./elly.db`

**vitest.config.ts**: Test configuration

- Node environment
- Coverage: v8 provider with text/json/html reporters

## Important Patterns

### Package Manager

Always use `pnpm` for dependencies and scripts. The project is configured with `pnpm.onlyBuiltDependencies` for native modules.

### Path Aliases

- Renderer code: Use `@` or `@renderer` imports (e.g., `import { Button } from '@/components/ui/button'`)
- Main/preload code: Use relative imports

### Database Migrations

After modifying `src/main/db/schema.ts`:

1. Run `pnpm db:generate` to create migration
2. Run `pnpm db:migrate` to apply it
3. Or use `pnpm db:push` for direct schema push without migration files

### Permission Flow

Dangerous tools (e.g., bash) call `permissionManager.requestPermission()` which:

1. Sends IPC event to renderer
2. Shows dialog in PermissionDialog component
3. Awaits user approval/denial
4. Returns result to tool

### WebSocket Message Format

Streaming updates use types from `shared/types-websocket.ts`:

- `WSServerMessageUpdate`: Token chunks, tool calls
- `WSServerDoneMessage`: Completion event
- `WSServerErrorMessage`: Error event

### AI SDK Integration

- Uses `streamText` from AI SDK with custom tools
- Messages stored as `UIMessage` type in database
- `convertToModelMessages` converts UI messages to provider format
- `readUIMessageStream` processes streaming responses

## Important Notes

### shadcn/ui + Tailwind v4 Configuration

When using shadcn/ui with Tailwind CSS v4, the `components.json` must have an **empty** `tailwind.config` field:

```json
{
  "tailwind": {
    "config": "" // Must be empty for Tailwind v4!
  }
}
```

If `config` points to a file (e.g., `"tailwind.config.ts"`), the shadcn CLI will pull **Tailwind v3 components**, causing issues like:

- Sidebar overlapping main content
- CSS variables like `w-[--sidebar-width]` not working
- Layout breaking

**Fix:** Ensure `config` is empty, then reinstall components:

```bash
pnpm dlx shadcn@latest add sidebar --overwrite
```

Reference: [GitHub Issue #8447](https://github.com/shadcn-ui/ui/issues/8447)

## Current Development Focus

See `TODO.md` for planned features:

- Markdown rendering with syntax highlighting
- Global state management (Zustand/Context)
- More shadcn/ui components
- Error boundaries
- Environment variable configuration
