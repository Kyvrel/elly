import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  windowMinimize: () => Promise<{ success: boolean }>
  windowMaximize: () => Promise<{ success: boolean }>
  windowClose: () => Promise<{ success: boolean }>
  clipboardWriteText: (text: string) => Promise<{ success: boolean }>
  clipboardReadText: () => Promise<string>
  openExternalUrl: (url: string) => Promise<{ success: boolean }>
  onPermissionRequired: (callback: (request: any) => void) => () => void
  sendPermissionDecision: (requestId: string, decision: string) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
