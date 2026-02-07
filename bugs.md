# Code Review - Bug List

## CRITICAL

### 1. `write-file-tool.ts:27` — Security logic inverted

The workspace boundary check is backwards. It blocks files *inside* the workspace and allows files *outside*.

```typescript
// Current (WRONG):
if (workspaceManager.isPathInWorkspace(absolutePath, workspace.id)) {
  return { success: false, error: 'File outside workspace' }
}

// Should be:
if (!workspaceManager.isPathInWorkspace(absolutePath, workspace.id)) {
  return { success: false, error: 'File outside workspace' }
}
```

**Impact:** AI can write files anywhere on the system, bypassing workspace isolation.

---

### 2. `bash-tool.ts:15-22` — Dangerous pattern filtering is easy to bypass

Blocklist patterns are weak:
- Extra spaces bypass: `rm  -rf  /`
- Command chaining bypasses: `; rm -rf /`, `&& rm -rf /`, `| rm -rf /`
- Variable expansion bypasses: `$(rm -rf /)`

**Recommendation:** Use allowlist instead of blocklist; add command chaining protection.

---

### 3. `App.tsx:16` — Crash on empty thread list

```typescript
setActiveThreadId(data[data.length-1].threadId)
```

If `data` is empty, this crashes. Need a guard:

```typescript
if (data.length > 0) {
  setActiveThreadId(data[data.length - 1].threadId)
}
```

---

## HIGH

### 4. Hardcoded model everywhere

`'google/gemini-2.5-flash'` is hardcoded in:
- `ChatThread.tsx:62`
- `App.tsx:25`

Users cannot select a different model. Should use thread's stored model.

---

### 5. `ChatService.ts:50` — Messages logged with JSON.stringify

```typescript
console.log('[sendMessage] messages: ', JSON.stringify(messages))
```

Could leak sensitive content to console logs.

---

### 6. `ChatService.ts:26-35` — Only one WebSocket per thread

```typescript
private wsClients = new Map<string, WebSocket>()
```

Second connection overwrites the first. Multi-window/tab support is broken.

---

### 7. `PermissionManager.ts:47-63` — No timeout on permission promise

If the user closes the dialog without responding, the promise hangs forever. Chat is stuck.

**Fix:** Add a timeout (e.g., 60 seconds) that rejects or resolves to `false`.

---

### 8. `server.ts` — No try-catch, no input validation

API routes pass `req.body` directly to database without validation. Database errors cause requests to hang.

```typescript
// Current:
app.post('/api/providers', (req, res) => {
  dbService.provider.upsertProviders(req.body)  // No validation
  res.status(201).json({ success: true })       // No try-catch
})
```

---

## MEDIUM

### 9. `WorkspaceManager.ts:8-14` — Sensitive file regex bug

```typescript
/\.env\..$/  // Only matches .env.X (single char)
```

Should be `/\.env\..+$/` to match `.env.local`, `.env.production`, etc.

Also missing patterns: `.aws/credentials`, `.kube/config`, `*.pem`, `*.key`

---

### 10. `ChatThread.tsx:48-67` — No error handling on API call

```typescript
await api.messages.send({...})  // No try-catch
```

Network errors crash the component.

---

### 11. No React Error Boundary

One component crash takes down the whole app. Need to wrap components with `<ErrorBoundary>`.

---

### 12. Hardcoded WebSocket port

`ws://localhost:8765` is hardcoded in `ChatThread.tsx:72`. Not configurable; port conflicts fail silently.

---

### 13. `ChatThread.tsx:69-99` — WebSocket cleanup issue

If WebSocket connection fails during connect, cleanup may not work properly. Potential memory leak.

---

## LOW

### 14. Typo in `read-file-tool.ts:28`

```typescript
'File outside worksapce'  // Should be "workspace"
```

---

### 15. Typo in `DBService.ts:130`

```typescript
const messsage = { ... }  // Should be "message"
```

---

### 16. `App.tsx:9` — Using `any` type

```typescript
const [threads, setThreads] = useState<any[]>([])
```

Should use a proper type like `Thread[]`.

---

## Quick Reference

| Priority | Count | Estimated Fix Time |
|----------|-------|-------------------|
| CRITICAL | 3 | 15 min |
| HIGH | 5 | 30 min |
| MEDIUM | 5 | 45 min |
| LOW | 3 | 5 min |
