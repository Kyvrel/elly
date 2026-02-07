import { BrowserWindow, clipboard, ipcMain, shell } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { toolService } from '../services/ToolService'
import { PERMISSION_EVENTS, permissionManager } from '../services/PermissionManager'

export function setupIPCHandlers(mainWindow: BrowserWindow): void {
  // window control
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, (): { success: boolean } => {
    mainWindow.minimize()
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, (): { success: boolean } => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, (): { success: boolean } => {
    mainWindow.close()
    return { success: true }
  })

  // clipboard
  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_READ_TEXT, (): string => {
    return clipboard.readText()
  })

  ipcMain.handle(
    IPC_CHANNELS.CLIPBOARD_WRITE_TEXT,
    (_event, text: string): { success: boolean } => {
      clipboard.writeText(text)
      return { success: true }
    }
  )

  // external url
  ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL_URL, (_event, url: string): { success: boolean } => {
    shell.openExternal(url)
    return { success: true }
  })

  // tool
  ipcMain.handle(IPC_CHANNELS.TOOL_CALL, async (_event, name, args): Promise<any> => {
    return toolService.callTool(name, args)
  })

  permissionManager.on(PERMISSION_EVENTS.REQUIRED, (request): void => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send(IPC_CHANNELS.TOOL_PERMISSION_REQUIRED, request)
    })
  })

  ipcMain.handle(IPC_CHANNELS.TOOL_PERMISSION_DECISION, (_event, { requestId, decision }): void => {
    permissionManager.handleDecision(requestId, decision)
  })

  ipcMain.handle(IPC_CHANNELS.TOOL_PERMISSION_PENDING, (): any => {
    return permissionManager.getLatestPendingRequest()
  })
}
