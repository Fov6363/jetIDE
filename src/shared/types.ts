// 文件系统相关类型
export interface FileSystemItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: Date
}

// 编辑器相关类型
export interface EditorTab {
  id: string
  title: string
  filePath: string
  content: string
  isDirty: boolean
  language?: string
}

// AI 助手相关类型
export interface AIConfig {
  apiKey: string
  model: 'gpt-3.5-turbo' | 'gpt-4'
  temperature: number
  maxTokens: number
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface AIConversation {
  id: string
  messages: AIMessage[]
  createdAt: Date
  updatedAt: Date
}

// 应用设置类型
export interface AppSettings {
  theme: 'light' | 'dark'
  fontSize: number
  fontFamily: string
  tabSize: number
  insertSpaces: boolean
  wordWrap: boolean
  minimap: boolean
  ai: AIConfig
}

// 项目相关类型
export interface Project {
  name: string
  path: string
  lastOpened: Date
  recentFiles: string[]
}

// 文件操作相关类型
export interface FileOperationResult {
  success: boolean
  error?: string
  data?: any
}

export interface CreateFileRequest {
  parentPath: string
  fileName: string
  isDirectory: boolean
}

export interface RenameRequest {
  oldPath: string
  newPath: string
}

export interface DeleteRequest {
  path: string
  isDirectory: boolean
}

export interface ContextMenuPosition {
  x: number
  y: number
}

export interface ContextMenuItem {
  id: string
  label: string
  icon: string
  disabled?: boolean
  separator?: boolean
}

// Electron API 类型定义
declare global {
  interface Window {
    electronAPI: {
      // 文件操作 API
      fileOperations: {
        create: (request: CreateFileRequest) => Promise<FileOperationResult>
        delete: (request: DeleteRequest) => Promise<FileOperationResult>
        rename: (request: RenameRequest) => Promise<FileOperationResult>
        copyPath: (path: string) => Promise<FileOperationResult>
        showInExplorer: (path: string) => Promise<FileOperationResult>
        exists: (path: string) => Promise<boolean>
        getInfo: (path: string) => Promise<FileOperationResult>
      }
      // 文件系统操作 API
      fileSystem: {
        readDirectory: (path: string) => Promise<FileSystemItem[]>
        readFile: (path: string) => Promise<string>
        writeFile: (path: string, content: string) => Promise<boolean>
        fileExists: (path: string) => Promise<boolean>
        getFileInfo: (path: string) => Promise<FileSystemItem | null>
      }
      // 事件监听 API
      events: {
        onFolderOpened: (callback: (folderPath: string) => void) => void
        onNewFile: (callback: () => void) => void
        onSaveFile: (callback: () => void) => void
        onFileOpened: (callback: (filePath: string) => void) => void
        onSaveAsFile: (callback: (filePath: string) => void) => void
        onShowFind: (callback: () => void) => void
        onShowReplace: (callback: () => void) => void
        onToggleSidebar: (callback: () => void) => void
        onShowQuickOpen: (callback: () => void) => void
        onShowGoToLine: (callback: () => void) => void
        onShowAbout: (callback: () => void) => void
        onShowShortcuts: (callback: () => void) => void
        removeAllListeners: (channel: string) => void
      }
    }
  }
}

// 文件树节点类型
export interface FileTreeNode {
  id: string
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  lastModified?: number
  children?: FileTreeNode[]
  isExpanded?: boolean
  isLoading?: boolean
  parent?: string
  depth: number
}

// 文件树状态
export interface FileTreeState {
  nodes: Record<string, FileTreeNode>
  rootPaths: string[]
  selectedNodes: string[]
  expandedNodes: string[]
  loadingNodes: string[]
  searchQuery: string
  filteredNodes: string[]
}

// 文件树操作类型
export type FileTreeAction =
  | { type: 'SET_NODES'; payload: FileTreeNode[] }
  | { type: 'ADD_NODE'; payload: FileTreeNode }
  | {
      type: 'UPDATE_NODE'
      payload: { id: string; updates: Partial<FileTreeNode> }
    }
  | { type: 'REMOVE_NODE'; payload: string }
  | { type: 'SET_EXPANDED'; payload: { nodeId: string; expanded: boolean } }
  | { type: 'SET_SELECTED'; payload: string[] }
  | { type: 'SET_LOADING'; payload: { nodeId: string; loading: boolean } }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTERED_NODES'; payload: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'RESET_STATE' }

// 文件监听事件类型
export interface FileWatchEvent {
  type: 'created' | 'modified' | 'deleted' | 'renamed'
  path: string
  oldPath?: string
  stats?: {
    size: number
    lastModified: number
    isDirectory: boolean
  }
}

// 文件树配置
export interface FileTreeConfig {
  showHiddenFiles: boolean
  sortBy: 'name' | 'type' | 'size' | 'modified'
  sortOrder: 'asc' | 'desc'
  maxDepth: number
  autoExpand: boolean
  enableVirtualization: boolean
}
