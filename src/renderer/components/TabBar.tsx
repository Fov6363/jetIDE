import React from 'react'
import { useAppStore } from '../store/appStore'

const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab } = useAppStore()

  if (tabs.length === 0) {
    return null
  }

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`
            flex items-center px-3 py-2 border-r border-gray-200 dark:border-gray-700 min-w-0 max-w-48 group cursor-pointer
            ${tab.id === activeTabId 
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
          onClick={() => setActiveTab(tab.id)}
        >
          {/* 文件名 */}
          <span className="truncate text-sm">
            {tab.title}
            {tab.isDirty && <span className="text-orange-500 ml-1">●</span>}
          </span>

          {/* 关闭按钮 */}
          <button
            className="ml-2 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              closeTab(tab.id)
            }}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

export default TabBar 