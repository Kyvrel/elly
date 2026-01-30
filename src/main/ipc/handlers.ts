import { BrowserWindow, clipboard, ipcMain, shell } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { toolService, ToolService } from '../services/ToolService'
import { permissionManager } from '../services/PermissionManager'

export function setupIPCHandlers(mainWindow: BrowserWindow) {
  // window control
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow.minimize()
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow.close()
    return { success: true }
  })

  // clipboard
  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_READ_TEXT, () => {
    return clipboard.readText()
  })

  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_WRITE_TEXT, (_, text: string) => {
    clipboard.writeText(text)
    return { success: true }
  })

  // external url
  ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL_URL, (_, url: string) => {
    shell.openExternal(url)
    return { success: true }
  })

  // tool
  ipcMain.handle('tool:call', async (_, name, args) => {
    return toolService.callTool(name, args)
  })

  permissionManager.on('permission-required', (request) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('tool:permission-required', request)
    })
  })

  ipcMain.handle('tool:permission-decision', (_, { requestId, decision }) => {
    permissionManager.handleDecision(requestId, decision)
  })
}
