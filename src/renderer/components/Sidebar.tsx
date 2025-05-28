import React from 'react'
import { useAppStore } from '../store/appStore'
import { FileTree } from './FileTree'

const Sidebar: React.FC = () => {
  const { currentProject } = useAppStore()

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
      <div className="flex-1">
        <FileTree
          rootPath={currentProject?.path}
          onFileSelect={filePath => {
            // 文件选择回调，可以在这里添加额外的逻辑
            console.log('文件已选择:', filePath)
          }}
        />
      </div>
    </div>
  )
}

export default Sidebar
