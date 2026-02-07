# Tool Call Flow

## Main Flow

```
Renderer                          Main Process
────────                          ────────────

User sends message
       │
       │  HTTP POST /api/chat/completions
       │  (src/main/api/server.ts:123)
       ▼
                                  chatService.sendMessage()
                                  (src/main/services/ChatService.ts:55)
                                         │
                                         │  streamText() with tools
                                         ▼
                                  AI decides to call bash
                                         │
                                         │  registry execute()
                                         │  (src/main/tools/registry.ts:36-48)
                                         ▼
                                  permissionManager.requestPermission()
                                  (src/main/services/PermissionManager.ts:28-63)
                                         │
                                         │  emit('permission-required')
                                         │  (src/main/services/PermissionManager.ts:45)
                                         ▼
                                  IPC handler forwards to renderer
                                  (src/main/ipc/handlers.ts:51-54)
                                         │
       ┌─────────────────────────────────┘
       │  ipcRenderer.on('tool:permission-required')
       │  (src/preload/index.ts:26)
       ▼
PermissionDialog shows
(src/renderer/src/components/PermissionDialog.tsx:22-24)
       │
       │  User clicks Allow / Deny
       │  (src/renderer/src/components/PermissionDialog.tsx:44-46)
       │
       │  ipcRenderer.invoke('tool:permission-decision')
       │  (src/preload/index.ts:31-32)
       │
       └─────────────────────────────────┐
                                         ▼
                                  handleDecision()
                                  (src/main/services/PermissionManager.ts:67-68)
                                         │
                                  ┌──────┴──────┐
                                  │             │
                               Approved      Denied
                                  │             │
                           tool.execute()  throw Error
                           (src/main/tools/registry.ts:46)(src/main/tools/registry.ts:41)
                                  │
                                  ▼
                           Result streams back
                           via WebSocket to Renderer
```

## Catch-up Path (if UI not ready)

```
Renderer                          Main Process
────────                          ────────────

PermissionDialog mounts
(src/renderer/src/components/PermissionDialog.tsx:18-20)
       │
       │  getPendingPermission()
       │  (src/preload/index.ts:33)
       │
       └─────────────────────────────────┐
                                         ▼
                                  getLatestPendingRequest()
                                  (src/main/services/PermissionManager.ts:71-73)
                                         │
       ┌─────────────────────────────────┘
       ▼
Dialog shows with pending request
```

## Mermaid Diagram

```mermaid
sequenceDiagram
    autonumber

    participant R as 👤 Renderer
    participant API as 🌐 API Server
    participant Chat as 💬 ChatService
    participant Reg as 🛠️ Tool Registry
    participant PM as 👮 PermissionManager
    participant IPC as 🔌 IPC Bridge

    Note over R, IPC: Main Flow

    R->>API: POST /api/chat/completions (src/main/api/server.ts:123)
    API->>Chat: sendMessage() (src/main/services/ChatService.ts:55)
    Chat->>Chat: streamText() - AI decides to call tool
    Chat->>Reg: execute() (src/main/tools/registry.ts:36-48)
    Reg->>PM: requestPermission() (src/main/services/PermissionManager.ts:28)
    activate PM

    PM->>PM: emit('permission-required') (src/main/services/PermissionManager.ts:45)
    PM->>IPC: forward to renderer (src/main/ipc/handlers.ts:51-54)
    IPC->>R: 🔔 Dialog shows (src/renderer/src/components/PermissionDialog.tsx:22-24)

    Note right of R: System PAUSES here ⏸️

    R->>IPC: User clicks Allow/Deny (src/renderer/src/components/PermissionDialog.tsx:44-46)
    IPC->>PM: handleDecision() (src/main/services/PermissionManager.ts:67-68)

    alt Approved
        PM-->>Reg: resolve(true)
        Reg->>Reg: tool.execute() (src/main/tools/registry.ts:46)
        Reg-->>Chat: result
    else Denied
        PM-->>Reg: resolve(false)
        Reg-->>Chat: throw Error (src/main/tools/registry.ts:41)
    end
    deactivate PM

    Note over R, IPC: Catch-up Path (UI not ready)

    R->>IPC: getPendingPermission() (src/preload/index.ts:33)
    IPC->>PM: getLatestPendingRequest() (src/main/services/PermissionManager.ts:71-73)
    PM-->>IPC: pending request
    IPC-->>R: Dialog shows
```
