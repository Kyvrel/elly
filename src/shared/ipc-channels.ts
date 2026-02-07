export const IPC_CHANNELS = {
  // Window control
  WINDOW_MINIMIZE: 'window-minimize',
  WINDOW_MAXIMIZE: 'window-maximize',
  WINDOW_CLOSE: 'window-close',

  // Clipboard
  CLIPBOARD_READ_TEXT: 'clipboard-read-text',
  CLIPBOARD_WRITE_TEXT: 'clipboard-write-text',

  // External
  OPEN_EXTERNAL_URL: 'open-external-url',

  // Tool
  TOOL_CALL: 'tool:call',
  TOOL_PERMISSION_REQUIRED: 'tool:permission-required',
  TOOL_PERMISSION_DECISION: 'tool:permission-decision',
  TOOL_PERMISSION_PENDING: 'tool:permission-pending'
} as const

export type IPCChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
