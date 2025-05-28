import { BrowserWindow } from 'electron'
import * as path from 'path'

let mainWindow: BrowserWindow | null = null

export const createWindow = (): BrowserWindow => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  })

  // 加载应用内容
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'))
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // 窗口关闭时清理引用
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}

export const getMainWindow = (): BrowserWindow | null => {
  return mainWindow
}

export const closeMainWindow = (): void => {
  if (mainWindow) {
    mainWindow.close()
    mainWindow = null
  }
}
