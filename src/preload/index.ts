import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '../shared/ipc-channels'

// Custom APIs for renderer
const api = {
  // window
  windowMinimize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
  windowMaximize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
  windowClose: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),

  // clipboard
  clipboardWriteText: (text: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_WRITE_TEXT, text),
  clipboardReadText: () => ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_READ_TEXT),

  // external url
  openExternalUrl: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL_URL, url),

  // tool permissions
  onPermissionRequired: (callback: (request: any) => void) => {
    const listener = (_: any, request: any) => callback(request)
    ipcRenderer.on('tool:permission-required', listener)
    return () => ipcRenderer.removeListener('tool:permission-required', listener)
  },
  sendPermissionDecision: (requestId: string, decision: string) =>
    ipcRenderer.invoke('tool:permission-decision', { requestId, decision })
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
