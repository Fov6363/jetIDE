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