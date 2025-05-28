import { create } from 'zustand'
import {
  EditorTab,
  FileSystemItem,
  AppSettings,
  Project,
} from '../../shared/types'

interface AppState {
  // 主题和设置
  theme: 'light' | 'dark'
  settings: AppSettings

  // 项目和文件
  currentProject: Project | null
  fileTree: FileSystemItem[]

  // 编辑器标签
  tabs: EditorTab[]
  activeTabId: string | null

  // UI 状态
  sidebarVisible: boolean

  // Actions
  setTheme: (theme: 'light' | 'dark') => void
  updateSettings: (settings: Partial<AppSettings>) => void

  // 项目操作
  openProject: (projectPath: string) => Promise<void>
  loadFileTree: (dirPath: string) => Promise<void>

  // 标签操作
  createNewTab: () => void
  openFileInTab: (filePath: string) => Promise<void>
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabContent: (tabId: string, content: string) => void
  saveTab: (tabId: string) => Promise<void>

  // UI 操作
  toggleSidebar: () => void
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono',
  tabSize: 2,
  insertSpaces: true,
  wordWrap: false,
  minimap: true,
  ai: {
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
  },
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  theme: 'dark',
  settings: defaultSettings,
  currentProject: null,
  fileTree: [],
  tabs: [],
  activeTabId: null,
  sidebarVisible: true,

  // Actions
  setTheme: theme => {
    set({ theme })
    // 同时更新设置
    const settings = get().settings
    set({ settings: { ...settings, theme } })
  },

  updateSettings: newSettings => {
    const settings = get().settings
    set({ settings: { ...settings, ...newSettings } })
  },

  openProject: async projectPath => {
    const project: Project = {
      name: projectPath.split('/').pop() || 'Unknown',
      path: projectPath,
      lastOpened: new Date(),
      recentFiles: [],
    }

    set({ currentProject: project })
    await get().loadFileTree(projectPath)
  },

  loadFileTree: async dirPath => {
    try {
      if (window.electronAPI) {
        const items = await window.electronAPI.fileSystem.readDirectory(dirPath)
        set({ fileTree: items })
      }
    } catch (error) {
      console.error('Failed to load file tree:', error)
    }
  },

  createNewTab: () => {
    const newTab: EditorTab = {
      id: `tab-${Date.now()}`,
      title: 'Untitled',
      filePath: '',
      content: '',
      isDirty: false,
      language: 'plaintext',
    }

    const tabs = [...get().tabs, newTab]
    set({ tabs, activeTabId: newTab.id })
  },

  openFileInTab: async filePath => {
    // 检查文件是否已经打开
    const existingTab = get().tabs.find(tab => tab.filePath === filePath)
    if (existingTab) {
      set({ activeTabId: existingTab.id })
      return
    }

    try {
      if (window.electronAPI) {
        const content = await window.electronAPI.fileSystem.readFile(filePath)
        const fileName = filePath.split('/').pop() || 'Unknown'
        const language = getLanguageFromFileName(fileName)

        const newTab: EditorTab = {
          id: `tab-${Date.now()}`,
          title: fileName,
          filePath,
          content,
          isDirty: false,
          language,
        }

        const tabs = [...get().tabs, newTab]
        set({ tabs, activeTabId: newTab.id })
      }
    } catch (error) {
      console.error('Failed to open file:', error)
    }
  },

  closeTab: tabId => {
    const tabs = get().tabs.filter(tab => tab.id !== tabId)
    const activeTabId = get().activeTabId

    let newActiveTabId = activeTabId
    if (activeTabId === tabId) {
      newActiveTabId = tabs.length > 0 ? tabs[tabs.length - 1].id : null
    }

    set({ tabs, activeTabId: newActiveTabId })
  },

  setActiveTab: tabId => {
    set({ activeTabId: tabId })
  },

  updateTabContent: (tabId, content) => {
    const tabs = get().tabs.map(tab =>
      tab.id === tabId ? { ...tab, content, isDirty: true } : tab
    )
    set({ tabs })
  },

  saveTab: async tabId => {
    const tab = get().tabs.find(t => t.id === tabId)
    if (!tab || !tab.filePath) return

    try {
      if (window.electronAPI) {
        await window.electronAPI.fileSystem.writeFile(tab.filePath, tab.content)

        const tabs = get().tabs.map(t =>
          t.id === tabId ? { ...t, isDirty: false } : t
        )
        set({ tabs })
      }
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  },

  toggleSidebar: () => {
    set({ sidebarVisible: !get().sidebarVisible })
  },
}))

// 辅助函数：根据文件名获取语言
function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()

  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
  }

  return languageMap[ext || ''] || 'plaintext'
}
