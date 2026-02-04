# Elly

Elly is an Electron desktop app.
It is an AI chat app.
It streams replies in real time.
It can also run local tools (read/write files, run shell commands) with your approval.

## Features

- Chat threads and message history (SQLite)
- Streaming assistant output (WebSocket)
- Multiple AI providers (OpenAI, Anthropic, Google) via Vercel AI SDK
- Tool calling with a permission popup:
  - `read_file` / `write_file` / `edit_file`
  - `bash`
  - `glob` / `grep`
- Workspace sandbox for tools:
  - Tools can only access files inside the active workspace
  - Sensitive files are blocked (like `.env` and `.ssh`)

## Tech stack

- Electron + electron-vite
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Express (local HTTP API) + ws (WebSocket)
- SQLite (better-sqlite3) + Drizzle ORM
- Vitest

## Ports

- HTTP API: `http://localhost:23001`
- WebSocket: `ws://localhost:8765`

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+

If you do not have pnpm:

```bash
corepack enable
corepack prepare pnpm@9 --activate
```

### Install

```bash
pnpm install
```

### Run (dev)

Start the Electron app.
This also starts AI SDK DevTools.

```bash
pnpm dev
```

Start only the app (no DevTools):

```bash
pnpm dev:app
```

Start only the API server:

```bash
pnpm dev:api
```

### Test / lint / format

```bash
pnpm test
pnpm lint
pnpm format
```

TypeScript typecheck:

```bash
pnpm typecheck
# or
pnpm typecheck:node
pnpm typecheck:web
```

## AI provider setup

The app reads providers from the local database table `providers`.
The UI currently uses the model string `google/gemini-2.5-flash`.
So you need a provider row with id `google`.

1. Start the app (or at least the API server).
2. Create a provider by calling the API:

```bash
curl -X POST http://localhost:23001/api/providers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "google",
    "name": "Google",
    "type": "google",
    "apiKey": "YOUR_API_KEY",
    "baseUrl": "",
    "enabled": true
  }'
```

Notes:
- Your API key is stored in SQLite.
- Set `baseUrl` to an empty string (`""`) to use the default API URL.
- Do not commit or share your `elly.db` file.

## Database (Drizzle + SQLite)

- Dev database file: `./elly.db`
- Prod database file: Electron `userData/elly.db` (fallback: `~/.elly/elly.db`)

Migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

Seed demo data (fake keys, for UI testing):

```bash
pnpm db:seed
```

Open Drizzle Studio:

```bash
pnpm db:studio
```

## Tool permissions

Some tools need your approval before they run.
The renderer shows a popup.

See `docs/tool-call.md` for the flow.

Sensitive files are blocked by default:

- `.env` and `.env.*`
- `.git/config`
- `id_rsa`
- `.ssh/`

## Project structure

- `src/main/`: Electron main process (DB, API server, tools, IPC)
- `src/preload/`: Preload bridge (`window.api`)
- `src/renderer/`: React UI
- `src/shared/`: Shared types (IPC and WebSocket messages)
- `docs/`: Developer docs

## Build

Electron Builder config is in `electron-builder.yml`.

```bash
pnpm build:mac
pnpm build:win
pnpm build:linux
```

## Troubleshooting

- API not reachable: check port `23001`
- No streaming output: check WebSocket `8765`
- DB errors:
  1. Close the running Electron app.
  2. Run `pnpm db:migrate`.
