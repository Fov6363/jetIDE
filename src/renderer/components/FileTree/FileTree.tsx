import React, { useEffect, useCallback, useMemo } from 'react'
import { useFileTree } from '../../hooks/useFileTree'
import { useAppStore } from '../../store/appStore'
import { FileTreeNode as FileTreeNodeType } from '../../../shared/types'
import FileTreeNode from './FileTreeNode'
import FileTreeToolbar from './FileTreeToolbar'

interface FileTreeProps {
  rootPath?: string
  onFileSelect?: (filePath: string) => void
  className?: string
}

const FileTree: React.FC<FileTreeProps> = ({
  rootPath,
  onFileSelect,
  className = '',
}) => {
  const { openFileInTab } = useAppStore()
  const {
    // 状态
    nodes,
    rootPaths,
    selectedNodes,
    isLoading,
    searchQuery,
    sortBy,
    sortOrder,

    // 操作方法
    loadDirectory,
    selectNode,
    expandNode,
    collapseNode,
    createFile,
    createDirectory,
    deleteNode,
    renameNode,
    copyPath,
    showInFileManager,
    setSearchQuery,
    toggleSortOrder,
    refreshAll,

    // 工具方法
    getNodeById,
    isNodeExpanded,
    isNodeSelected,
  } = useFileTree()

  // 初始化加载
  useEffect(() => {
    if (rootPath) {
      // 直接调用 loadDirectory，避免依赖循环
      const loadRootDirectory = async () => {
        try {
          await loadDirectory(rootPath)
        } catch (error) {
          console.error('Failed to load root directory:', error)
        }
      }

      loadRootDirectory()
    }
  }, [rootPath]) // 只依赖 rootPath

  // 获取根节点
  const rootNodes = useMemo(() => {
    return Object.values(nodes).filter(node => node.depth === 0)
  }, [nodes])

  // 处理展开/折叠
  const handleToggleExpand = useCallback(
    (nodeId: string) => {
      if (isNodeExpanded(nodeId)) {
        collapseNode(nodeId)
      } else {
        expandNode(nodeId)
      }
    },
    [isNodeExpanded, expandNode, collapseNode]
  )

  // 渲染节点树
  const renderNodes = useCallback(
    (nodeList: FileTreeNodeType[], level = 0): React.ReactNode => {
      return nodeList.map(node => {
        const isSelected = isNodeSelected(node.id)
        const isExpanded = isNodeExpanded(node.id)
        const isDirectory = node.type === 'directory'
        const children = Object.values(nodes).filter(n => n.parent === node.id)

        return (
          <React.Fragment key={node.id}>
            <FileTreeNode
              node={node}
              level={level}
              isSelected={isSelected}
              isExpanded={isExpanded}
              onToggleExpand={handleToggleExpand}
              onSelect={selectNode}
              onRename={renameNode}
              onDelete={deleteNode}
              onCreateFile={(parentId: string) =>
                createFile(getNodeById(parentId)?.path || '', 'new-file.txt')
              }
              onCreateFolder={(parentId: string) =>
                createDirectory(getNodeById(parentId)?.path || '', 'new-folder')
              }
              onCopyPath={copyPath}
              onShowInFileManager={showInFileManager}
              onDoubleClick={handleFileDoubleClick}
            />

            {/* 递归渲染子节点 */}
            {isExpanded && isDirectory && children.length > 0 && (
              <div>{renderNodes(children, level + 1)}</div>
            )}
          </React.Fragment>
        )
      })
    },
    [
      nodes,
      isNodeSelected,
      isNodeExpanded,
      handleToggleExpand,
      selectNode,
      renameNode,
      deleteNode,
      createFile,
      createDirectory,
      copyPath,
      showInFileManager,
      getNodeById,
    ]
  )

  // 处理文件双击
  const handleFileDoubleClick = useCallback(
    (node: FileTreeNodeType) => {
      if (node.type === 'file') {
        // 打开文件到编辑器
        openFileInTab(node.path)

        // 调用外部回调
        onFileSelect?.(node.path)
      }
    },
    [openFileInTab, onFileSelect]
  )

  // 处理根目录新建文件
  const handleCreateFile = useCallback(() => {
    if (rootPath) {
      createFile(rootPath, 'new-file.txt')
    }
  }, [rootPath, createFile])

  // 处理根目录新建文件夹
  const handleCreateFolder = useCallback(() => {
    if (rootPath) {
      createDirectory(rootPath, 'new-folder')
    }
  }, [rootPath, createDirectory])

  // 处理刷新
  const handleRefresh = useCallback(() => {
    refreshAll()
  }, [refreshAll])

  // 处理排序切换
  const handleToggleSort = useCallback(() => {
    toggleSortOrder()
  }, [toggleSortOrder])

  // 如果没有根路径，显示空状态
  if (!rootPath) {
    return (
      <div
        className={`flex flex-col h-full bg-gray-50 dark:bg-gray-800 ${className}`}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-sm">未打开项目</p>
            <p className="text-xs mt-1">使用 Cmd/Ctrl + O 打开文件夹</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col h-full bg-gray-50 dark:bg-gray-800 ${className}`}
    >
      {/* 工具栏 */}
      <FileTreeToolbar
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
        onRefresh={handleRefresh}
        onSearch={setSearchQuery}
        onToggleSort={handleToggleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        isLoading={isLoading}
        searchQuery={searchQuery}
      />

      {/* 文件树内容 */}
      <div className="flex-1 overflow-auto">
        {isLoading && rootNodes.length === 0 ? (
          // 加载状态
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <svg
                className="w-4 h-4 animate-spin"
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
              <span className="text-sm">加载中...</span>
            </div>
          </div>
        ) : rootNodes.length === 0 ? (
          // 空状态
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">📂</div>
              <p className="text-sm">
                {searchQuery ? '未找到匹配的文件' : '文件夹为空'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-blue-500 hover:text-blue-600 mt-1"
                >
                  清除搜索
                </button>
              )}
            </div>
          </div>
        ) : (
          // 文件树
          <div className="py-1">{renderNodes(rootNodes)}</div>
        )}
      </div>

      {/* 状态栏 */}
      <div className="border-t border-gray-200 dark:border-gray-600 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700">
        <div className="flex justify-between items-center">
          <span>
            {rootNodes.length} 项目
            {selectedNodes.length > 0 && ` · ${selectedNodes.length} 已选择`}
          </span>
          {searchQuery && <span>搜索: "{searchQuery}"</span>}
        </div>
      </div>
    </div>
  )
}

export default FileTree
