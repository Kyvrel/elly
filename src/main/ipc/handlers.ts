import { BrowserWindow, ipcMain } from 'electron'

export function setupIPCHandlers(mainWindow: BrowserWindow) {
  // window control
  ipcMain.handle('window-minimize', () => {
    mainWindow.minimize()
    return { success: true }
  })

  ipcMain.handle('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
    return { success: true }
  })

  ipcMain.handle('window-close', () => {
    mainWindow.close()
    return { success: true }
  })
}
