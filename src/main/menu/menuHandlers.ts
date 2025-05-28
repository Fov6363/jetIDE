import { dialog } from 'electron'
import { getMainWindow } from '../window/createWindow'

export const menuHandlers = {
  // 打开文件夹
  openFolder: async () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: '选择项目文件夹',
    })

    if (!result.canceled && result.filePaths.length > 0) {
      mainWindow.webContents.send('folder-opened', result.filePaths[0])
    }
  },

  // 新建文件
  newFile: () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return

    mainWindow.webContents.send('new-file')
  },

  // 保存文件
  saveFile: () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return

    mainWindow.webContents.send('save-file')
  },

  // 打开文件
  openFile: async () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      title: '打开文件',
      filters: [
        { name: '所有文件', extensions: ['*'] },
        {
          name: '文本文件',
          extensions: ['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx'],
        },
        { name: 'JavaScript', extensions: ['js', 'jsx'] },
        { name: 'TypeScript', extensions: ['ts', 'tsx'] },
        { name: 'Markdown', extensions: ['md', 'markdown'] },
      ],
    })

    if (!result.canceled && result.filePaths.length > 0) {
      mainWindow.webContents.send('file-opened', result.filePaths[0])
    }
  },

  // 另存为
  saveAsFile: async () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return

    const result = await dialog.showSaveDialog(mainWindow, {
      title: '另存为',
      filters: [
        { name: '所有文件', extensions: ['*'] },
        { name: '文本文件', extensions: ['txt'] },
        { name: 'JavaScript', extensions: ['js'] },
        { name: 'TypeScript', extensions: ['ts'] },
        { name: 'Markdown', extensions: ['md'] },
      ],
    })

    if (!result.canceled && result.filePath) {
      mainWindow.webContents.send('save-as-file', result.filePath)
    }
  },

  // 退出应用
  quit: () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.close()
    }
  },
}
