import React, { useState, useRef, useCallback } from 'react'

interface FileTreeToolbarProps {
  onCreateFile: () => void
  onCreateFolder: () => void
  onRefresh: () => void
  onSearch: (query: string) => void
  onToggleSort: () => void
  sortBy: 'name' | 'type' | 'size' | 'modified'
  sortOrder: 'asc' | 'desc'
  isLoading: boolean
  searchQuery: string
}

const FileTreeToolbar: React.FC<FileTreeToolbarProps> = ({
  onCreateFile,
  onCreateFolder,
  onRefresh,
  onSearch,
  onToggleSort,
  sortBy,
  sortOrder,
  isLoading,
  searchQuery,
}) => {
  const [showSearch, setShowSearch] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 切换搜索框显示
  const toggleSearch = useCallback(() => {
    setShowSearch(!showSearch)
    if (!showSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 0)
    } else {
      onSearch('')
    }
  }, [showSearch, onSearch])

  // 处理搜索输入
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearch(e.target.value)
    },
    [onSearch]
  )

  // 处理搜索键盘事件
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleSearch()
      }
    },
    [toggleSearch]
  )

  // 获取排序图标
  const getSortIcon = useCallback(() => {
    const icons = {
      name: '🔤',
      type: '📁',
      size: '📏',
      modified: '🕒',
    }
    return icons[sortBy]
  }, [sortBy])

  // 排序选项
  const sortOptions = [
    { key: 'name' as const, label: '按名称排序', icon: '🔤' },
    { key: 'type' as const, label: '按类型排序', icon: '📁' },
    { key: 'size' as const, label: '按大小排序', icon: '📏' },
    { key: 'modified' as const, label: '按修改时间排序', icon: '🕒' },
  ]

  return (
    <div className="flex flex-col border-b border-gray-200 dark:border-gray-700">
      {/* 主工具栏 */}
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center space-x-1">
          {/* 新建文件 */}
          <button
            onClick={onCreateFile}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="新建文件"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>

          {/* 新建文件夹 */}
          <button
            onClick={onCreateFolder}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="新建文件夹"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </button>

          {/* 刷新 */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
            title="刷新"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-1">
          {/* 搜索 */}
          <button
            onClick={toggleSearch}
            className={`p-1.5 rounded transition-colors ${
              showSearch
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="搜索文件"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* 排序 */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title={`当前排序: ${sortOptions.find(opt => opt.key === sortBy)?.label}`}
            >
              <div className="flex items-center space-x-1">
                <span className="text-xs">{getSortIcon()}</span>
                <svg
                  className={`w-3 h-3 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </div>
            </button>

            {/* 排序菜单 */}
            {showSortMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg py-1 min-w-40">
                  {sortOptions.map(option => (
                    <button
                      key={option.key}
                      className={`
                        w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2
                        ${sortBy === option.key ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                      `}
                      onClick={() => {
                        if (sortBy === option.key) {
                          onToggleSort()
                        } else {
                          // 这里需要调用设置排序方式的函数
                          // 暂时使用 onToggleSort，实际应该有 onSetSort 函数
                          onToggleSort()
                        }
                        setShowSortMenu(false)
                      }}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                      {sortBy === option.key && (
                        <span className="ml-auto">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 搜索框 */}
      {showSearch && (
        <div className="px-2 pb-2">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="搜索文件和文件夹..."
              className="w-full px-3 py-1.5 pl-8 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => onSearch('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileTreeToolbar
