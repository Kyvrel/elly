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

