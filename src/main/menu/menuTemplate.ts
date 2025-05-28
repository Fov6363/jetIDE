import { Menu, MenuItemConstructorOptions } from 'electron'
import { menuHandlers } from './menuHandlers'

export const createMenu = (): void => {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: menuHandlers.openFolder,
        },
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: menuHandlers.openFile,
        },
        { type: 'separator' },
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: menuHandlers.newFile,
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: menuHandlers.saveFile,
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: menuHandlers.saveAsFile,
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: menuHandlers.quit,
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            // 发送查找事件到渲染进程
            const { getMainWindow } = require('../window/createWindow')
            const mainWindow = getMainWindow()
            if (mainWindow) {
              mainWindow.webContents.send('show-find')
            }
          },
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            // 发送替换事件到渲染进程
            const { getMainWindow } = require('../window/createWindow')
            const mainWindow = getMainWindow()
            if (mainWindow) {
              mainWindow.webContents.send('show-replace')
            }
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            const { getMainWindow } = require('../window/createWindow')
            const mainWindow = getMainWindow()
            if (mainWindow) {
              mainWindow.webContents.send('toggle-sidebar')
            }
          },
        },
      ],
    },
    {
      label: 'Go',
      submenu: [
        {
          label: 'Go to File...',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            const { getMainWindow } = require('../window/createWindow')
            const mainWindow = getMainWindow()
            if (mainWindow) {
              mainWindow.webContents.send('show-quick-open')
            }
          },
        },
        {
          label: 'Go to Line...',
          accelerator: 'CmdOrCtrl+G',
          click: () => {
            const { getMainWindow } = require('../window/createWindow')
            const mainWindow = getMainWindow()
            if (mainWindow) {
              mainWindow.webContents.send('show-go-to-line')
            }
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About JetIDE',
          click: () => {
            const { getMainWindow } = require('../window/createWindow')
            const mainWindow = getMainWindow()
            if (mainWindow) {
              mainWindow.webContents.send('show-about')
            }
          },
        },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+K CmdOrCtrl+S',
          click: () => {
            const { getMainWindow } = require('../window/createWindow')
            const mainWindow = getMainWindow()
            if (mainWindow) {
              mainWindow.webContents.send('show-shortcuts')
            }
          },
        },
      ],
    },
  ]

  // macOS 特殊处理
  if (process.platform === 'darwin') {
    template.unshift({
      label: 'JetIDE',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    })

    // 移除 File 菜单中的 Quit（macOS 中在应用菜单里）
    const fileMenu = template.find(item => item.label === 'File')
    if (fileMenu && Array.isArray(fileMenu.submenu)) {
      fileMenu.submenu = fileMenu.submenu.filter(
        item => typeof item === 'object' && item.label !== 'Quit'
      )
    }
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
