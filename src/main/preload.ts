import { contextBridge, ipcRenderer } from 'electron'
import type {
  CreateFileRequest,
  DeleteRequest,
  RenameRequest,
  FileOperationResult,
  FileSystemItem,
} from '../shared/types'

// 定义暴露给渲染进程的 API
const electronAPI = {
  // 文件操作 API
  fileOperations: {
    // 创建文件或文件夹
    create: (request: CreateFileRequest): Promise<FileOperationResult> =>
      ipcRenderer.invoke('file:create', request),

    // 删除文件或文件夹
    delete: (request: DeleteRequest): Promise<FileOperationResult> =>
      ipcRenderer.invoke('file:delete', request),

    // 重命名文件或文件夹
    rename: (request: RenameRequest): Promise<FileOperationResult> =>
      ipcRenderer.invoke('file:rename', request),

    // 复制路径到剪贴板
    copyPath: (path: string): Promise<FileOperationResult> =>
      ipcRenderer.invoke('file:copy-path', path),

    // 在文件管理器中显示
    showInExplorer: (path: string): Promise<FileOperationResult> =>
      ipcRenderer.invoke('file:show-in-explorer', path),

    // 检查文件是否存在
    exists: (path: string): Promise<boolean> =>
      ipcRenderer.invoke('file:exists', path),

    // 获取文件信息
    getInfo: (path: string): Promise<FileOperationResult> =>
      ipcRenderer.invoke('file:get-info', path),
  },

  // 文件系统操作 API
  fileSystem: {
    // 读取目录
    readDirectory: (path: string): Promise<FileSystemItem[]> =>
      ipcRenderer.invoke('read-directory', path),

    // 读取文件内容
    readFile: (path: string): Promise<string> =>
      ipcRenderer.invoke('read-file', path),

    // 写入文件内容
    writeFile: (path: string, content: string): Promise<boolean> =>
      ipcRenderer.invoke('write-file', path, content),

    // 检查文件是否存在
    fileExists: (path: string): Promise<boolean> =>
      ipcRenderer.invoke('file-exists', path),

    // 获取文件信息
    getFileInfo: (path: string): Promise<FileSystemItem | null> =>
      ipcRenderer.invoke('get-file-info', path),
  },

  // 事件监听 API
  events: {
    // 监听文件夹打开事件
    onFolderOpened: (callback: (folderPath: string) => void) => {
      ipcRenderer.on('folder-opened', (_, folderPath) => callback(folderPath))
    },

    // 监听新建文件事件
    onNewFile: (callback: () => void) => {
      ipcRenderer.on('new-file', callback)
    },

    // 监听保存文件事件
    onSaveFile: (callback: () => void) => {
      ipcRenderer.on('save-file', callback)
    },

    // 监听文件打开事件
    onFileOpened: (callback: (filePath: string) => void) => {
      ipcRenderer.on('file-opened', (_, filePath) => callback(filePath))
    },

    // 监听另存为事件
    onSaveAsFile: (callback: (filePath: string) => void) => {
      ipcRenderer.on('save-as-file', (_, filePath) => callback(filePath))
    },

    // 监听查找事件
    onShowFind: (callback: () => void) => {
      ipcRenderer.on('show-find', callback)
    },

    // 监听替换事件
    onShowReplace: (callback: () => void) => {
      ipcRenderer.on('show-replace', callback)
    },

    // 监听侧边栏切换事件
    onToggleSidebar: (callback: () => void) => {
      ipcRenderer.on('toggle-sidebar', callback)
    },

    // 监听快速打开事件
    onShowQuickOpen: (callback: () => void) => {
      ipcRenderer.on('show-quick-open', callback)
    },

    // 监听跳转到行事件
    onShowGoToLine: (callback: () => void) => {
      ipcRenderer.on('show-go-to-line', callback)
    },

    // 监听关于对话框事件
    onShowAbout: (callback: () => void) => {
      ipcRenderer.on('show-about', callback)
    },

    // 监听快捷键帮助事件
    onShowShortcuts: (callback: () => void) => {
      ipcRenderer.on('show-shortcuts', callback)
    },

    // 移除事件监听器
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel)
    },
  },
}

// 安全地暴露 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI)
