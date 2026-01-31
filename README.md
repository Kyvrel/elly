# elly

**elly** is an Electron-based desktop application that provides a powerful AI agent interface. It allows users to interact with various AI models (Claude, GPT, Gemini) to perform complex tasks, including file operations, shell command execution, and code editing within a local workspace.

## Features

- **Multi-Model Support**: Integrates with major AI providers via the Vercel AI SDK.
- **Tool-Augmented Chat**: Equipped with local tools for Bash execution, file I/O, and codebase searching.
- **Workspace Management**: Organize work into specific directories, with AI operations scoped to the active workspace.
- **Local Persistence**: Stores chat history and configurations locally using SQLite.
- **Human-in-the-loop**: Requires user approval for sensitive actions like executing commands or modifying files.

## Project Structure

- `src/main`: Electron main process, services, and AI tools.
- `src/renderer`: React-based frontend UI.
- `src/shared`: Shared types and constants.
- `drizzle`: Database migrations and schemas.

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- [pnpm](https://pnpm.io/)

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Initialize the local database:
   ```bash
   pnpm run db:generate
   pnpm run db:migrate
   ```

### Development

Start the application in development mode:
```bash
pnpm run dev
```

### Build

```bash
# For windows
pnpm build:win

# For macOS
pnpm build:mac

# For Linux
pnpm build:linux
```

## Tech Stack

- **Framework**: Electron, React, TypeScript
- **AI Integration**: Vercel AI SDK
- **Database**: SQLite, Drizzle ORM
- **Styling**: Tailwind CSS
