import React from 'react'
import { useAppStore } from '../store/appStore'
import { FileSystemItem } from '../../../shared/types'

const Sidebar: React.FC = () => {
  const { currentProject, fileTree, openFileInTab } = useAppStore()

  const handleFileClick = (item: FileSystemItem) => {
    if (!item.isDirectory) {
      openFileInTab(item.path)
    }
  }

  const getFileIcon = (item: FileSystemItem) => {
    if (item.isDirectory) {
      return '📁'
    }
    
    const ext = item.name.split('.').pop()?.toLowerCase()
    const iconMap: Record<string, string> = {
      'js': '📄',
      'jsx': '⚛️',
      'ts': '📘',
      'tsx': '⚛️',
      'py': '🐍',
      'java': '☕',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'md': '📝',
      'txt': '📄',
    }
    
    return iconMap[ext || ''] || '📄'
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-800 flex flex-col">
      {/* 标题栏 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          文件浏览器
        </h2>
        {currentProject && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {currentProject.name}
          </p>
        )}
      </div>

      {/* 文件树 */}
      <div className="flex-1 overflow-auto">
        {currentProject ? (
          <div className="p-2">
            {fileTree.length > 0 ? (
              <ul className="space-y-1">
                {fileTree.map((item) => (
                  <li key={item.path}>
                    <button
                      className="w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center space-x-2"
                      onClick={() => handleFileClick(item)}
                    >
                      <span>{getFileIcon(item)}</span>
                      <span className="truncate">{item.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <p className="text-sm">文件夹为空</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-sm">未打开项目</p>
              <p className="text-xs mt-1">
                使用 Cmd/Ctrl + O 打开文件夹
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar 