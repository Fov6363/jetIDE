import { contextBridge, ipcRenderer } from 'electron'

export interface FileSystemItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: Date
}

// 暴露给渲染进程的 API
const electronAPI = {
  // 文件系统操作
  readDirectory: (dirPath: string): Promise<FileSystemItem[]> =>
    ipcRenderer.invoke('read-directory', dirPath),
  
  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('read-file', filePath),
  
  writeFile: (filePath: string, content: string): Promise<boolean> =>
    ipcRenderer.invoke('write-file', filePath, content),

  // 监听主进程事件
  onFolderOpened: (callback: (folderPath: string) => void) => {
    ipcRenderer.on('folder-opened', (_, folderPath) => callback(folderPath))
  },

  onNewFile: (callback: () => void) => {
    ipcRenderer.on('new-file', () => callback())
  },

  onSaveFile: (callback: () => void) => {
    ipcRenderer.on('save-file', () => callback())
  },

  // 移除监听器
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
}

// 将 API 暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// 类型声明
declare global {
  interface Window {
    electronAPI: typeof electronAPI
  }
} 