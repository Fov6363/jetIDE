# 📁 基础文件操作功能设计

> **功能优先级**: 最高  
> **预计开发时间**: Day 1-2  
> **依赖**: 无

## 📋 功能概述

实现 JetIDE 的核心文件管理功能，包括文件/文件夹的创建、删除、重命名等基础操作。这是整个编辑器的基础功能，必须优先实现以支持后续的开发和测试。

## 🎯 功能需求

### 核心功能

- [ ] 右键菜单显示
- [ ] 新建文件
- [ ] 新建文件夹
- [ ] 删除文件/文件夹
- [ ] 重命名文件/文件夹
- [ ] 复制文件路径到剪贴板
- [ ] 在系统文件管理器中显示

### 用户体验

- [ ] 内联编辑支持
- [ ] 操作确认对话框
- [ ] 加载状态指示
- [ ] 错误提示
- [ ] 操作成功反馈

## 🏗️ 架构设计

### 整体架构

```
┌─────────────────┐
│   UI 层 (React)  │  ← 右键菜单、文件树组件、对话框
├─────────────────┤
│ 渲染进程业务层    │  ← 文件操作逻辑、状态管理、验证
├─────────────────┤
│   IPC 通信层     │  ← preload 脚本安全桥接
├─────────────────┤
│ 主进程文件系统层  │  ← Node.js fs 模块、系统集成
└─────────────────┘
```

### 数据流

```
用户右键 → 显示菜单 → 选择操作 → 验证输入 → IPC调用 → 主进程处理 → 返回结果 → 更新UI → 刷新文件树
```

## 🎨 用户交互设计

### 右键菜单设计

#### 文件右键菜单

```
📄 文件名.txt
├── ✏️ 重命名
├── 🗑️ 删除
├── 📋 复制路径
└── 🔍 在文件管理器中显示
```

#### 文件夹右键菜单

```
📁 文件夹名
├── 📄 新建文件
├── 📁 新建文件夹
├── ✏️ 重命名
├── 🗑️ 删除
├── 📋 复制路径
├── 🔍 在文件管理器中显示
└── 🔄 刷新
```

#### 空白区域右键菜单

```
📁 当前目录
├── 📄 新建文件
├── 📁 新建文件夹
└── 🔄 刷新
```

### 交互流程

#### 新建文件/文件夹流程

1. 用户右键选择"新建文件"或"新建文件夹"
2. 在文件树中显示内联编辑器，默认名称为"新建文件.txt"或"新建文件夹"
3. 用户输入名称，按 Enter 确认或 Esc 取消
4. 验证文件名合法性
5. 检查是否存在同名文件，如存在则提示用户
6. 创建文件/文件夹并刷新文件树
7. 高亮显示新创建的项目

#### 重命名流程

1. 用户右键选择"重命名"
2. 当前文件名变为可编辑状态，文本被选中
3. 用户修改名称，按 Enter 确认或 Esc 取消
4. 验证新文件名合法性
5. 检查是否存在同名文件
6. 执行重命名操作并刷新文件树

#### 删除流程

1. 用户右键选择"删除"
2. 显示确认对话框："确定要删除 [文件名] 吗？"
3. 用户确认后执行删除操作
4. 如果删除的文件当前在编辑器中打开，则关闭对应标签页
5. 刷新文件树

## 🔧 技术实现

### 类型定义

```typescript
// src/shared/types.ts

interface FileOperationResult {
  success: boolean
  error?: string
  data?: any
}

interface CreateFileRequest {
  parentPath: string
  fileName: string
  isDirectory: boolean
}

interface RenameRequest {
  oldPath: string
  newPath: string
}

interface DeleteRequest {
  path: string
  isDirectory: boolean
}

interface ContextMenuPosition {
  x: number
  y: number
}

interface ContextMenuItem {
  id: string
  label: string
  icon: string
  disabled?: boolean
  separator?: boolean
}
```

### IPC 接口设计

```typescript
// src/main/ipc/fileOperations.ts

export const fileOperationHandlers = {
  'file:create': async (
    event,
    request: CreateFileRequest
  ): Promise<FileOperationResult> => {
    // 实现文件创建逻辑
  },

  'file:delete': async (
    event,
    request: DeleteRequest
  ): Promise<FileOperationResult> => {
    // 实现文件删除逻辑
  },

  'file:rename': async (
    event,
    request: RenameRequest
  ): Promise<FileOperationResult> => {
    // 实现文件重命名逻辑
  },

  'file:copy-path': async (event, path: string): Promise<void> => {
    // 复制路径到剪贴板
  },

  'file:show-in-explorer': async (event, path: string): Promise<void> => {
    // 在系统文件管理器中显示
  },
}
```

### 主进程文件服务

```typescript
// src/main/services/fileService.ts

import * as fs from 'fs/promises'
import * as path from 'path'
import { shell, clipboard } from 'electron'

export class FileService {
  async createFile(
    parentPath: string,
    fileName: string
  ): Promise<FileOperationResult> {
    try {
      const fullPath = path.join(parentPath, fileName)

      // 检查文件是否已存在
      if (await this.exists(fullPath)) {
        return { success: false, error: '文件已存在' }
      }

      // 创建文件
      await fs.writeFile(fullPath, '', 'utf8')

      return { success: true, data: { path: fullPath } }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async createDirectory(
    parentPath: string,
    dirName: string
  ): Promise<FileOperationResult> {
    try {
      const fullPath = path.join(parentPath, dirName)

      if (await this.exists(fullPath)) {
        return { success: false, error: '文件夹已存在' }
      }

      await fs.mkdir(fullPath, { recursive: true })

      return { success: true, data: { path: fullPath } }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async deleteItem(itemPath: string): Promise<FileOperationResult> {
    try {
      const stats = await fs.stat(itemPath)

      if (stats.isDirectory()) {
        await fs.rmdir(itemPath, { recursive: true })
      } else {
        await fs.unlink(itemPath)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async renameItem(
    oldPath: string,
    newPath: string
  ): Promise<FileOperationResult> {
    try {
      if (await this.exists(newPath)) {
        return { success: false, error: '目标文件已存在' }
      }

      await fs.rename(oldPath, newPath)

      return { success: true, data: { newPath } }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async copyPathToClipboard(itemPath: string): Promise<void> {
    clipboard.writeText(itemPath)
  }

  async showInFileManager(itemPath: string): Promise<void> {
    shell.showItemInFolder(itemPath)
  }

  private async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path)
      return true
    } catch {
      return false
    }
  }
}
```

### 状态管理

```typescript
// src/renderer/store/fileOperationStore.ts

import { create } from 'zustand'

interface FileOperationState {
  // 状态
  isLoading: boolean
  currentOperation: string | null
  error: string | null

  // UI 状态
  contextMenu: {
    visible: boolean
    x: number
    y: number
    target: FileSystemItem | null
  }

  editingItem: string | null

  // Actions
  showContextMenu: (x: number, y: number, target: FileSystemItem) => void
  hideContextMenu: () => void

  startEditing: (path: string) => void
  stopEditing: () => void

  createFile: (parentPath: string, fileName: string) => Promise<void>
  createDirectory: (parentPath: string, dirName: string) => Promise<void>
  deleteItem: (path: string) => Promise<void>
  renameItem: (oldPath: string, newPath: string) => Promise<void>
  copyPath: (path: string) => Promise<void>
  showInExplorer: (path: string) => Promise<void>
}

export const useFileOperationStore = create<FileOperationState>((set, get) => ({
  // 初始状态
  isLoading: false,
  currentOperation: null,
  error: null,
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    target: null,
  },
  editingItem: null,

  // UI Actions
  showContextMenu: (x, y, target) => {
    set({
      contextMenu: { visible: true, x, y, target },
    })
  },

  hideContextMenu: () => {
    set({
      contextMenu: { visible: false, x: 0, y: 0, target: null },
    })
  },

  startEditing: path => {
    set({ editingItem: path })
  },

  stopEditing: () => {
    set({ editingItem: null })
  },

  // 文件操作 Actions
  createFile: async (parentPath, fileName) => {
    set({ isLoading: true, currentOperation: 'creating-file', error: null })

    try {
      const result = await window.electronAPI.invoke('file:create', {
        parentPath,
        fileName,
        isDirectory: false,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      // 刷新文件树
      await useAppStore.getState().loadFileTree(parentPath)
    } catch (error) {
      set({ error: error.message })
    } finally {
      set({ isLoading: false, currentOperation: null })
    }
  },

  // ... 其他操作类似实现
}))
```

### UI 组件

#### 右键菜单组件

```typescript
// src/renderer/components/ContextMenu.tsx

import React, { useEffect, useRef } from 'react'
import { useFileOperationStore } from '../store/fileOperationStore'

export const ContextMenu: React.FC = () => {
  const menuRef = useRef<HTMLDivElement>(null)
  const {
    contextMenu,
    hideContextMenu,
    createFile,
    createDirectory,
    deleteItem,
    startEditing,
    copyPath,
    showInExplorer
  } = useFileOperationStore()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideContextMenu()
      }
    }

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [contextMenu.visible, hideContextMenu])

  if (!contextMenu.visible || !contextMenu.target) {
    return null
  }

  const { target, x, y } = contextMenu

  const menuItems = getMenuItems(target)

  const handleAction = async (actionId: string) => {
    hideContextMenu()

    switch (actionId) {
      case 'new-file':
        await createFile(target.path, '新建文件.txt')
        break
      case 'new-folder':
        await createDirectory(target.path, '新建文件夹')
        break
      case 'rename':
        startEditing(target.path)
        break
      case 'delete':
        if (confirm(`确定要删除 ${target.name} 吗？`)) {
          await deleteItem(target.path)
        }
        break
      case 'copy-path':
        await copyPath(target.path)
        break
      case 'show-in-explorer':
        await showInExplorer(target.path)
        break
    }
  }

  return (
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-50"
      style={{ left: x, top: y }}
    >
      {menuItems.map((item, index) => (
        item.separator ? (
          <div key={index} className="border-t border-gray-200 dark:border-gray-700 my-1" />
        ) : (
          <button
            key={item.id}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            onClick={() => handleAction(item.id)}
            disabled={item.disabled}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      ))}
    </div>
  )
}

function getMenuItems(target: FileSystemItem): ContextMenuItem[] {
  if (target.isDirectory) {
    return [
      { id: 'new-file', label: '新建文件', icon: '📄' },
      { id: 'new-folder', label: '新建文件夹', icon: '📁' },
      { separator: true },
      { id: 'rename', label: '重命名', icon: '✏️' },
      { id: 'delete', label: '删除', icon: '🗑️' },
      { separator: true },
      { id: 'copy-path', label: '复制路径', icon: '📋' },
      { id: 'show-in-explorer', label: '在文件管理器中显示', icon: '🔍' },
      { separator: true },
      { id: 'refresh', label: '刷新', icon: '🔄' }
    ]
  } else {
    return [
      { id: 'rename', label: '重命名', icon: '✏️' },
      { id: 'delete', label: '删除', icon: '🗑️' },
      { separator: true },
      { id: 'copy-path', label: '复制路径', icon: '📋' },
      { id: 'show-in-explorer', label: '在文件管理器中显示', icon: '🔍' }
    ]
  }
}
```

#### 内联编辑组件

```typescript
// src/renderer/components/InlineEditor.tsx

import React, { useState, useRef, useEffect } from 'react'

interface InlineEditorProps {
  initialValue: string
  onSave: (newValue: string) => Promise<void>
  onCancel: () => void
  placeholder?: string
}

export const InlineEditor: React.FC<InlineEditorProps> = ({
  initialValue,
  onSave,
  onCancel,
  placeholder = ''
}) => {
  const [value, setValue] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const handleSave = async () => {
    if (!value.trim()) {
      onCancel()
      return
    }

    if (value === initialValue) {
      onCancel()
      return
    }

    setIsLoading(true)
    try {
      await onSave(value.trim())
    } catch (error) {
      console.error('保存失败:', error)
      // 这里可以显示错误提示
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleSave}
      placeholder={placeholder}
      disabled={isLoading}
      className="w-full px-1 py-0 text-sm bg-white dark:bg-gray-800 border border-blue-500 rounded focus:outline-none"
    />
  )
}
```

## 🛡️ 错误处理和验证

### 文件名验证

```typescript
// src/renderer/utils/fileValidation.ts

export const validateFileName = (name: string): string | null => {
  if (!name.trim()) {
    return '文件名不能为空'
  }

  if (name.trim() !== name) {
    return '文件名不能以空格开头或结尾'
  }

  // Windows 和 macOS 都不允许的字符
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(name)) {
    return '文件名不能包含以下字符: < > : " / \\ | ? *'
  }

  // Windows 保留名称
  const reservedNames = [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9',
  ]
  if (reservedNames.includes(name.toUpperCase())) {
    return '文件名不能使用系统保留名称'
  }

  if (name.length > 255) {
    return '文件名过长（最多255个字符）'
  }

  return null
}

export const generateUniqueFileName = async (
  basePath: string,
  fileName: string
): Promise<string> => {
  let counter = 1
  let newName = fileName

  while (
    await window.electronAPI.invoke('file:exists', path.join(basePath, newName))
  ) {
    const ext = path.extname(fileName)
    const nameWithoutExt = path.basename(fileName, ext)
    newName = `${nameWithoutExt} (${counter})${ext}`
    counter++
  }

  return newName
}
```

### 权限检查

```typescript
// src/main/utils/permissions.ts

import * as fs from 'fs/promises'

export const checkPermissions = async (
  path: string,
  operation: 'read' | 'write' | 'delete'
): Promise<{ hasPermission: boolean; error?: string }> => {
  try {
    await fs.access(path, fs.constants.F_OK)

    switch (operation) {
      case 'read':
        await fs.access(path, fs.constants.R_OK)
        break
      case 'write':
        await fs.access(path, fs.constants.W_OK)
        break
      case 'delete':
        const parentDir = path.dirname(path)
        await fs.access(parentDir, fs.constants.W_OK)
        break
    }

    return { hasPermission: true }
  } catch (error) {
    return {
      hasPermission: false,
      error: `没有${operation === 'read' ? '读取' : operation === 'write' ? '写入' : '删除'}权限`,
    }
  }
}
```

## 🧪 测试用例

### 单元测试

```typescript
// src/main/services/__tests__/fileService.test.ts

describe('FileService', () => {
  let fileService: FileService
  let tempDir: string

  beforeEach(async () => {
    fileService = new FileService()
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jetide-test-'))
  })

  afterEach(async () => {
    await fs.rmdir(tempDir, { recursive: true })
  })

  describe('createFile', () => {
    it('should create a new file successfully', async () => {
      const result = await fileService.createFile(tempDir, 'test.txt')

      expect(result.success).toBe(true)
      expect(result.data.path).toBe(path.join(tempDir, 'test.txt'))

      const exists = await fs
        .access(path.join(tempDir, 'test.txt'))
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(true)
    })

    it('should fail when file already exists', async () => {
      await fs.writeFile(path.join(tempDir, 'existing.txt'), '')

      const result = await fileService.createFile(tempDir, 'existing.txt')

      expect(result.success).toBe(false)
      expect(result.error).toBe('文件已存在')
    })
  })

  // ... 更多测试用例
})
```

### 集成测试场景

1. **正常操作流程**：创建 → 重命名 → 删除
2. **错误处理**：权限不足、文件名冲突、磁盘空间不足
3. **边界情况**：超长文件名、特殊字符、系统保留名称
4. **并发操作**：同时进行多个文件操作

## 📈 性能考虑

### 优化策略

1. **批量操作**：支持多选文件进行批量删除
2. **异步处理**：所有文件操作都是异步的，不阻塞 UI
3. **缓存机制**：缓存文件树状态，减少重复读取
4. **懒加载**：大文件夹延迟加载子项

### 性能指标

- 单个文件操作响应时间 < 100ms
- 批量操作（100个文件）< 5s
- UI 响应时间 < 50ms

## 🚀 实施计划

### Day 1: 基础架构

- [ ] 设计并实现 IPC 接口
- [ ] 创建主进程文件服务
- [ ] 实现基础的文件操作（创建、删除、重命名）

### Day 2: UI 组件和集成

- [ ] 实现右键菜单组件
- [ ] 实现内联编辑组件
- [ ] 集成到文件树组件
- [ ] 添加错误处理和用户反馈

## 🎯 验收标准

### 功能验收

- [ ] 能够通过右键菜单创建文件和文件夹
- [ ] 能够重命名文件和文件夹
- [ ] 能够删除文件和文件夹
- [ ] 所有操作都有适当的错误处理
- [ ] 文件树能够实时更新

### 用户体验验收

- [ ] 操作响应迅速（< 100ms）
- [ ] 错误提示清晰友好
- [ ] 支持键盘操作（Enter 确认，Esc 取消）
- [ ] 视觉反馈明确（加载状态、成功提示）

### 代码质量验收

- [ ] 代码有完整的 TypeScript 类型注解
- [ ] 关键功能有单元测试覆盖
- [ ] 遵循项目的代码规范
- [ ] 有适当的错误边界处理

---

**下一步**: 实现文件搜索和导航功能 → [02-file-search.md](./02-file-search.md)
