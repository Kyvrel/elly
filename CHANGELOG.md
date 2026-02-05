## v0.0.17 (2026-02-04)

- [#20](https://github.com/Kyvrel/elly/pull/20) feat: Setup Shadcn UI. Add components.json, deps, Button/Input/utils,

## v0.0.16 (2026-02-01)

## Summary

- **ESLint Configuration**: Switched from `eslint/config`'s `defineConfig` to `typescript-eslint`'s `tseslint.config` in `eslint.config.mjs`.
- **Dependencies**: Added `typescript-eslint` to `devDependencies`.
- **Bug Fix**: Resolved the type mismatch error where `@electron-toolkit/eslint-config-ts` returned an array that was incompatible with the standard ESLint `defineConfig` helper.

* [#19](https://github.com/Kyvrel/elly/pull/19) fix: resolve typescript error in eslint configuration

## v0.0.15 (2026-01-31)

## Summary

- **Configuration**: Added `src/shared/**/*` to `tsconfig.web.json` to resolve the TS6307 error where shared types were not included in the web build context.
- **Renderer**: Updated `formatMessages.ts` to use a more robust mapping for message parts, fixing a potential type error when accessing `part.text`.
- **Main**: Applied minor formatting improvements to `DBService.ts` for better readability.

- [#18](https://github.com/Kyvrel/elly/pull/18) fix: resolve TS6307 error and improve message formatting

## v0.0.14 (2026-01-31)

## Summary

- **DBService Refactoring**: Reorganized `DBService` by grouping operations into logical namespaces: `workspace`, `provider`, `thread`, `message`, and `settings`. This improves code organization and discoverability of database operations.
- **Service Updates**: Updated `ChatService` and `WorkspaceManager` to consume the new namespaced API.
- **API Server Updates**: Refactored `src/main/api/server.ts` to use the namespaced calls for all REST endpoints.
- **Tool Updates**: Updated all filesystem and shell tools (`bash`, `edit`, `glob`, `grep`, `read`, `write`) to use `dbService.workspace.getActiveWorkspace()` for path resolution.

- [#17](https://github.com/Kyvrel/elly/pull/17) refactor: namespace DBService operations

## v0.0.13 (2026-01-31)

## Summary

This PR refactors the database interaction layer by renaming `WorkspaceService` to `DBService` and centralizing all database-related operations within it. This improves the separation of concerns and simplifies the API and service layers.

- [#16](https://github.com/Kyvrel/elly/pull/16) refactor: rename WorkspaceService to DBService and centralize database operations

## v0.0.12 (2026-01-31)

## Summary

- **Chat Threads & DB**: Fixed workspace references and renamed database tables for consistency (`workspace` → `workspaces`).
- **Tools Refinement**:
  - Added `edit_file` and `grep` tools with workspace path validation.
  - Improved `grep` tool performance by integrating `ripgrep`.
  - Refactored tool parameters to camelCase and updated all tool descriptions for better AI interaction.
  - Fixed a critical bug in `edit_file` where replacement slicing used the wrong string length.
- **Code Quality & Refactoring**:
  - Renamed `needPermission` to `needsApproval` throughout the application.
  - Added explicit return types and refactored message formatting logic.
  - Cleaned up unused API parameters, deleted obsolete tests, and updated ESLint configurations.
- **UI & IPC**: Updated `ChatThread`, `Sidebar`, and IPC handlers to align with the new thread and workspace structure.

- [#15](https://github.com/Kyvrel/elly/pull/15) feat: improve chat threads, refactor tools, and enhance codebase consistency

## v0.0.11 (2026-01-30)

- What
  - Move stored chat messages to UIMessage (AI SDK) format.
  - Stream assistant output as UIMessage.parts and update the same DB row during streaming.
  - Switch WebSocket streaming payload to message_update with full parts and add shared WS types.
  - Standardize tool failures by throwing errors (instead of returning “success: false” shapes).
  - Improve dev command: pnpm dev runs devtools + app; pnpm dev:app runs app only.
- Why
  - Keep one message format across DB, main process, WebSocket, and renderer.
  - Make streaming UI and tool-call related parts easier to support.
- How to test
  - Run pnpm dev.
  - Open a chat and send a message; confirm the assistant text streams live.
  - Confirm UI updates come from WS message_update and final refresh happens on done.
  - Try a tool action (glob/read/write/bash) and confirm errors show as errors when they fail.
- Notes / Risk
  - Old saved messages may not have message.parts. Existing local DB data may need a reset or migration.

- [#14](https://github.com/Kyvrel/elly/pull/14) Adopt `UIMessage` from `ai` for chat messages, updating schema,

## v0.0.10 (2026-01-30)

1. Core Tool System
   Standardization: Established unified tool interface definitions to support dynamic registration.
   Base Capabilities:
   File Reading: Allows AI to read content within the active workspace.
   File Writing: Allows AI to create new files or modify existing code.
   Command Execution: Allows AI to execute shell commands.
   File Search: Allows AI to find files using Glob patterns.
2. Workspace Security
   Sandbox Isolation: Forces all file operations to be confined to the active workspace directory, preventing unauthorized access to system files.
   Sensitive Data Guard: Built-in filters automatically intercept requests to read sensitive files (such as .env, .git, or private keys).
3. Permission Control System
   IPC Bridge: Established a secure communication bridge between the main process and the renderer for permission requests.
   Interception Flow: Implemented a "Request-Pause-Decide" flow. When the AI attempts to use a tool, execution is automatically paused until user confirmation is received.
   Decision Strategies: Supports "Deny", "Allow Once", and "Always Allow" (for the current session).
4. Frontend UI
   Global Permission Dialog: Implemented a high-priority, interruptive modal dialog.
   Real-time Review: The dialog displays the specific tool being requested along with its parameters (e.g., the code content to be written) for user review.
5. Intelligent Execution Engine
   Manual Tool Loop: Refactored the Chat Service message handling logic.
   Execution Integration:
   AI initiates a tool call.
   System intercepts and checks permissions.
   Executes the tool upon approval and captures output.
   Returns results to the AI for subsequent reasoning.
   State Synchronization: Real-time push of tool start, result, and error states to the frontend via WebSocket.

- [#13](https://github.com/Kyvrel/elly/pull/13) feat: implement tool system and permission controls

## v0.0.9 (2026-01-26)

Enhance auto-bump-tag workflow: include PR body in changelog & release notes.

- [#12](https://github.com/Kyvrel/elly/pull/12) Enhance auto-bump-tag workflow: include PR body in changelog & releas…

## v0.0.8 (2026-01-26)

- [#11](https://github.com/Kyvrel/elly/pull/11) Feat: Implement smart auto-scroll for chat thread

## v0.0.7 (2026-01-26)

- [#10](https://github.com/Kyvrel/elly/pull/10) feat: Automate CHANGELOG.md updates in release workflow; add CHANGELOG
