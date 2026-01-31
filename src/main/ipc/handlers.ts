import { BrowserWindow, clipboard, ipcMain, shell } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { toolService } from '../services/ToolService'
import { permissionManager } from '../services/PermissionManager'

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
  ipcMain.handle(
    IPC_CHANNELS.OPEN_EXTERNAL_URL,
    (_event, url: string): { success: boolean } => {
      shell.openExternal(url)
      return { success: true }
    }
  )

  // tool
  ipcMain.handle('tool:call', async (_event, name, args): Promise<any> => {
    return toolService.callTool(name, args)
  })

  permissionManager.on('permission-required', (request): void => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('tool:permission-required', request)
    })
  })

  ipcMain.handle('tool:permission-decision', (_event, { requestId, decision }): void => {
    permissionManager.handleDecision(requestId, decision)
  })
}
