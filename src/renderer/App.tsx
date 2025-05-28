import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import TabBar from './components/TabBar'
import StatusBar from './components/StatusBar'
import { useAppStore } from './store/appStore'

function App() {
  const { theme, currentProject, tabs, activeTabId } = useAppStore()
  const [sidebarWidth, setSidebarWidth] = useState(250)

  useEffect(() => {
    // 设置主题
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    // 监听 Electron 事件
    if (window.electronAPI) {
      window.electronAPI.events.onFolderOpened((folderPath: string) => {
        useAppStore.getState().openProject(folderPath)
      })

      window.electronAPI.events.onNewFile(() => {
        useAppStore.getState().createNewTab()
      })

      window.electronAPI.events.onSaveFile(() => {
        const activeTab = tabs.find(tab => tab.id === activeTabId)
        if (activeTab) {
          useAppStore.getState().saveTab(activeTab.id)
        }
      })
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.events.removeAllListeners('folder-opened')
        window.electronAPI.events.removeAllListeners('new-file')
        window.electronAPI.events.removeAllListeners('save-file')
      }
    }
  }, [tabs, activeTabId])

  const handleSidebarResize = (newWidth: number) => {
    setSidebarWidth(Math.max(200, Math.min(400, newWidth)))
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 侧边栏 */}
      <div
        className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700"
        style={{ width: sidebarWidth }}
      >
        <Sidebar />
      </div>

      {/* 调整大小的分隔条 */}
      <div
        className="w-1 bg-gray-200 dark:bg-gray-700 cursor-col-resize hover:bg-primary-500 transition-colors"
        onMouseDown={e => {
          const startX = e.clientX
          const startWidth = sidebarWidth

          const handleMouseMove = (e: MouseEvent) => {
            const newWidth = startWidth + (e.clientX - startX)
            handleSidebarResize(newWidth)
          }

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
          }

          document.addEventListener('mousemove', handleMouseMove)
          document.addEventListener('mouseup', handleMouseUp)
        }}
      />

      {/* 主编辑区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 标签栏 */}
        <TabBar />

        {/* 编辑器 */}
        <div className="flex-1">
          {tabs.length > 0 ? (
            <Editor />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h1 className="text-2xl font-bold mb-2">欢迎使用 JetIDE</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  一款轻量、高性能、支持 AI 辅助的现代代码编辑器
                </p>
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-500">
                  <p>
                    按{' '}
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                      Cmd/Ctrl + O
                    </kbd>{' '}
                    打开文件夹
                  </p>
                  <p>
                    按{' '}
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                      Cmd/Ctrl + N
                    </kbd>{' '}
                    新建文件
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 状态栏 */}
        <StatusBar />
      </div>
    </div>
  )
}

export default App
