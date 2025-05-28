import React, { useState, useRef, useCallback } from 'react'
import { FileTreeNode as FileTreeNodeType } from '../../../shared/types'

interface FileTreeNodeProps {
  node: FileTreeNodeType
  level: number
  isSelected: boolean
  isExpanded: boolean
  onToggleExpand: (nodeId: string) => void
  onSelect: (nodeId: string, isMultiSelect?: boolean) => void
  onRename: (nodeId: string, newName: string) => void
  onDelete: (nodeId: string) => void
  onCreateFile: (parentId: string) => void
  onCreateFolder: (parentId: string) => void
  onCopyPath: (nodeId: string) => void
  onShowInFileManager: (nodeId: string) => void
  onDoubleClick: (node: FileTreeNodeType) => void
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  level,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelect,
  onRename,
  onDelete,
  onCreateFile,
  onCreateFolder,
  onCopyPath,
  onShowInFileManager,
  onDoubleClick,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(node.name)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const nodeRef = useRef<HTMLDivElement>(null)

  const isDirectory = node.type === 'directory'

  // 获取文件图标
  const getFileIcon = useCallback(
    (fileName: string, isDirectory: boolean): string => {
      if (isDirectory) {
        return isExpanded ? '📂' : '📁'
      }

      const ext = fileName.split('.').pop()?.toLowerCase()
      const iconMap: Record<string, string> = {
        js: '📄',
        jsx: '⚛️',
        ts: '📘',
        tsx: '⚛️',
        py: '🐍',
        java: '☕',
        html: '🌐',
        css: '🎨',
        scss: '🎨',
        less: '🎨',
        json: '📋',
        md: '📝',
        txt: '📄',
        xml: '📄',
        yml: '⚙️',
        yaml: '⚙️',
        gitignore: '🚫',
        env: '🔧',
        config: '⚙️',
        lock: '🔒',
        log: '📊',
        zip: '📦',
        tar: '📦',
        gz: '📦',
        pdf: '📕',
        doc: '📘',
        docx: '📘',
        xls: '📗',
        xlsx: '📗',
        ppt: '📙',
        pptx: '📙',
        png: '🖼️',
        jpg: '🖼️',
        jpeg: '🖼️',
        gif: '🖼️',
        svg: '🖼️',
        ico: '🖼️',
        mp3: '🎵',
        mp4: '🎬',
        avi: '🎬',
        mov: '🎬',
      }

      return iconMap[ext || ''] || '📄'
    },
    [isExpanded]
  )

  // 处理点击事件
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      const isMultiSelect = e.ctrlKey || e.metaKey
      onSelect(node.id, isMultiSelect)
    },
    [node.id, onSelect]
  )

  // 处理双击事件
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isDirectory) {
        onToggleExpand(node.id)
      } else {
        onDoubleClick(node)
      }
    },
    [isDirectory, onToggleExpand, onDoubleClick, node.id]
  )

  // 处理展开/折叠
  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isDirectory) {
        onToggleExpand(node.id)
      }
    },
    [isDirectory, onToggleExpand, node.id]
  )

  // 处理右键菜单
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setContextMenuPosition({ x: e.clientX, y: e.clientY })
      setShowContextMenu(true)
      onSelect(node.id) // 右键时选中节点
    },
    [node.id, onSelect]
  )

  // 处理重命名
  const handleRename = useCallback(() => {
    setIsEditing(true)
    setEditValue(node.name)
    setShowContextMenu(false)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }, [node.name])

  // 确认重命名
  const handleRenameConfirm = useCallback(() => {
    if (editValue.trim() && editValue !== node.name) {
      onRename(node.id, editValue.trim())
    }
    setIsEditing(false)
  }, [editValue, node.id, node.name, onRename])

  // 取消重命名
  const handleRenameCancel = useCallback(() => {
    setIsEditing(false)
    setEditValue(node.name)
  }, [node.name])

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleRenameConfirm()
      } else if (e.key === 'Escape') {
        handleRenameCancel()
      }
    },
    [handleRenameConfirm, handleRenameCancel]
  )

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setShowContextMenu(false)
  }, [])

  // 右键菜单项
  const contextMenuItems = [
    ...(isDirectory
      ? [
          { label: '新建文件', action: () => onCreateFile(node.id) },
          { label: '新建文件夹', action: () => onCreateFolder(node.id) },
          { type: 'separator' as const },
        ]
      : []),
    { label: '重命名', action: handleRename },
    { label: '删除', action: () => onDelete(node.id), danger: true },
    { type: 'separator' as const },
    { label: '复制路径', action: () => onCopyPath(node.id) },
    { label: '在文件管理器中显示', action: () => onShowInFileManager(node.id) },
  ]

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <>
      <div
        ref={nodeRef}
        className={`
          flex items-center px-2 py-1 text-sm cursor-pointer select-none
          hover:bg-gray-100 dark:hover:bg-gray-700
          ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {/* 展开/折叠按钮 */}
        <button
          onClick={handleToggle}
          className={`
            w-4 h-4 flex items-center justify-center text-xs
            ${isDirectory ? 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200' : 'invisible'}
          `}
          disabled={!isDirectory}
        >
          {isDirectory && (
            <span
              className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            >
              ▶
            </span>
          )}
        </button>

        {/* 文件图标 */}
        <span className="text-sm mr-2">
          {getFileIcon(node.name, isDirectory)}
        </span>

        {/* 文件名 */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleRenameConfirm}
            onKeyDown={handleKeyDown}
            className="flex-1 px-1 py-0 text-sm bg-white dark:bg-gray-800 border border-blue-500 rounded outline-none"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate">{node.name}</span>
        )}

        {/* 文件大小和修改时间 */}
        {!isDirectory && node.size !== undefined && (
          <span className="text-xs text-gray-500 ml-2">
            {formatFileSize(node.size)}
          </span>
        )}
      </div>

      {/* 右键菜单 */}
      {showContextMenu && (
        <>
          {/* 背景遮罩 */}
          <div className="fixed inset-0 z-40" onClick={closeContextMenu} />

          {/* 菜单内容 */}
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg py-1 min-w-48"
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
            }}
          >
            {contextMenuItems.map((item, index) => (
              <div key={index}>
                {item.type === 'separator' ? (
                  <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                ) : (
                  <button
                    className={`
                      w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700
                      ${item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
                    `}
                    onClick={() => {
                      item.action()
                      closeContextMenu()
                    }}
                  >
                    {item.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

export default FileTreeNode
