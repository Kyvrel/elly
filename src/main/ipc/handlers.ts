import { BrowserWindow, clipboard, ipcMain, shell } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

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
}
