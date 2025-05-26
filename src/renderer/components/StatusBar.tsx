import React from 'react'
import { useAppStore } from '../store/appStore'

const StatusBar: React.FC = () => {
  const { tabs, activeTabId, theme, setTheme } = useAppStore()
  
  const activeTab = tabs.find(tab => tab.id === activeTabId)

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="h-6 bg-primary-600 text-white text-xs flex items-center justify-between px-3">
      {/* 左侧信息 */}
      <div className="flex items-center space-x-4">
        {activeTab && (
          <>
            <span>{activeTab.language}</span>
            <span>UTF-8</span>
            {activeTab.isDirty && (
              <span className="text-orange-300">● 未保存</span>
            )}
          </>
        )}
      </div>

      {/* 右侧信息 */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleTheme}
          className="hover:bg-primary-700 px-2 py-1 rounded transition-colors"
        >
          {theme === 'dark' ? '🌙' : '☀️'} {theme === 'dark' ? '暗色' : '亮色'}
        </button>
        
        <span>JetIDE v0.1.0</span>
      </div>
    </div>
  )
}

export default StatusBar 