# 文件管理 IPC 通信层

这一层负责在渲染进程中封装对主进程文件操作的调用，提供错误处理、重试机制和加载状态管理。

## 架构概览

```
UI 层 (React 组件)
    ↓
渲染进程业务层 (useFileOperations Hook)
    ↓
IPC 通信层 (FileOperationService) ← 当前层
    ↓
主进程文件系统层 (已完成)
```

## 核心组件

### 1. FileOperationService

文件操作服务类，封装所有文件操作的 IPC 调用。

```typescript
import { fileOperationService } from '@/renderer/services'

// 创建文件
const result = await fileOperationService.createFile(
  '/path/to/parent',
  'newFile.txt'
)

// 创建文件夹
const result = await fileOperationService.createDirectory(
  '/path/to/parent',
  'newFolder'
)

// 删除文件
const result = await fileOperationService.deleteItem('/path/to/file.txt')

// 重命名
const result = await fileOperationService.renameItem(
  '/old/path.txt',
  '/new/path.txt'
)
```

### 2. useFileOperations Hook

React Hook，提供加载状态管理和错误处理。

```typescript
import { useFileOperations } from '@/renderer/hooks'

function FileManager() {
  const {
    createFile,
    deleteItem,
    operationStates,
    getOperationState
  } = useFileOperations()

  const handleCreateFile = async () => {
    const result = await createFile('/workspace', 'newFile.txt')
    if (result.success) {
      console.log('文件创建成功')
    }
  }

  return (
    <button onClick={handleCreateFile}>
      创建文件
    </button>
  )
}
```

### 3. NotificationService

全局通知服务，显示操作结果。

```typescript
import { notificationService } from '@/renderer/services'

// 显示成功通知
notificationService.success('操作成功', '文件已创建')

// 显示错误通知
notificationService.error('操作失败', '权限不足')

// 监听通知
const unsubscribe = notificationService.addListener(notification => {
  console.log('收到通知:', notification)
})
```

### 4. ErrorHandler

统一错误处理工具。

```typescript
import { ErrorHandler } from '@/renderer/utils/errorHandler'

try {
  await someOperation()
} catch (error) {
  const appError = ErrorHandler.handleWithNotification(error, '文件操作')
  console.log('错误类型:', appError.type)
  console.log('用户消息:', appError.userMessage)
}
```

## 功能特性

### ✅ 已实现的功能

1. **基础文件操作**

   - 创建文件/文件夹
   - 删除文件/文件夹
   - 重命名文件/文件夹
   - 复制路径到剪贴板
   - 在文件管理器中显示

2. **错误处理**

   - 自动重试机制（最多3次）
   - 用户友好的错误消息
   - 错误类型分类
   - 全局错误处理

3. **状态管理**

   - 加载状态跟踪
   - 操作结果反馈
   - 批量操作支持

4. **通知系统**

   - 成功/失败通知
   - 自动过期清理
   - 可自定义持续时间

5. **工具功能**
   - 文件名验证
   - 唯一文件名生成
   - 批量删除

### 🔄 重试机制

所有文件操作都支持自动重试：

```typescript
// 配置重试参数
class FileOperationService {
  private maxRetries = 3 // 最大重试次数
  private retryDelay = 1000 // 重试延迟（毫秒）
}
```

### 📝 文件名验证

内置文件名验证规则：

```typescript
const validation = fileOperationService.validateFileName('myFile.txt')
if (!validation.valid) {
  console.log('验证失败:', validation.error)
}
```

验证规则：

- 不能为空
- 不能包含非法字符：`< > : " / \ | ? *`
- 不能使用系统保留名称：`CON`, `PRN`, `AUX` 等
- 长度不能超过 255 个字符

### 🔄 批量操作

支持批量删除文件：

```typescript
const result = await deleteMultipleItems([
  '/path/file1.txt',
  '/path/file2.txt',
  '/path/folder',
])

console.log('成功删除:', result.successful)
console.log('删除失败:', result.failed)
```

## 使用示例

### 基础用法

```typescript
import { useFileOperations } from '@/renderer/hooks'

function FileOperationsExample() {
  const {
    createFile,
    createDirectory,
    deleteItem,
    renameItem,
    validateFileName
  } = useFileOperations()

  const handleCreateFile = async () => {
    // 验证文件名
    const validation = validateFileName('newFile.txt')
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    // 创建文件
    const result = await createFile('/workspace', 'newFile.txt')
    if (result.success) {
      console.log('文件创建成功:', result.data)
    } else {
      console.error('创建失败:', result.error)
    }
  }

  return (
    <div>
      <button onClick={handleCreateFile}>创建文件</button>
    </div>
  )
}
```

### 高级用法

```typescript
import { useFileOperations, ErrorHandler } from '@/renderer/hooks'
import { notificationService } from '@/renderer/services'

function AdvancedFileOperations() {
  const {
    deleteMultipleItems,
    generateUniqueFileName,
    getOperationState
  } = useFileOperations()

  const handleBatchDelete = async () => {
    const filesToDelete = [
      '/workspace/file1.txt',
      '/workspace/file2.txt',
      '/workspace/folder'
    ]

    try {
      const result = await deleteMultipleItems(filesToDelete)

      if (result.data?.failed.length > 0) {
        // 显示部分失败的详细信息
        const failedFiles = result.data.failed.map(f => f.path).join(', ')
        notificationService.warning(
          '部分文件删除失败',
          `无法删除: ${failedFiles}`
        )
      }
    } catch (error) {
      ErrorHandler.handleWithNotification(error, '批量删除')
    }
  }

  const handleCreateUniqueFile = async () => {
    try {
      // 生成唯一文件名
      const uniqueName = await generateUniqueFileName(
        '/workspace',
        'document',
        '.txt'
      )

      if (uniqueName.success && uniqueName.data) {
        // 使用生成的唯一名称创建文件
        await createFile('/workspace', uniqueName.data)
      }
    } catch (error) {
      ErrorHandler.handleWithNotification(error, '创建文件')
    }
  }

  return (
    <div>
      <button onClick={handleBatchDelete}>批量删除</button>
      <button onClick={handleCreateUniqueFile}>创建唯一文件</button>
    </div>
  )
}
```

## 错误处理

### 错误类型

```typescript
enum ErrorType {
  NETWORK = 'network', // 网络错误
  PERMISSION = 'permission', // 权限错误
  FILE_NOT_FOUND = 'file_not_found', // 文件不存在
  INVALID_INPUT = 'invalid_input', // 输入无效
  UNKNOWN = 'unknown', // 未知错误
}
```

### 自定义错误处理

```typescript
import { ErrorHandler, AppError } from '@/renderer/utils/errorHandler'

try {
  await fileOperation()
} catch (error) {
  if (error instanceof AppError) {
    // 已处理的应用错误
    console.log('错误类型:', error.type)
    console.log('用户消息:', error.userMessage)
  } else {
    // 未处理的错误
    const appError = ErrorHandler.handle(error, '文件操作')
    console.log('处理后的错误:', appError)
  }
}
```

## 测试

运行测试：

```bash
npm test src/renderer/__tests__/services/fileOperationService.test.ts
```

测试覆盖：

- ✅ 基础文件操作
- ✅ 错误处理
- ✅ 重试机制
- ✅ 文件名验证
- ✅ 批量操作
- ✅ API 可用性检查

## 下一步

IPC 通信层已完成，接下来需要实现：

1. **渲染进程业务层** - 文件树状态管理
2. **UI 层** - 文件树组件和操作界面
3. **集成测试** - 端到端功能测试

## 注意事项

1. **安全性**: 所有文件操作都通过安全的 IPC 通道进行
2. **性能**: 批量操作使用并发执行提高效率
3. **用户体验**: 提供实时的加载状态和操作反馈
4. **错误恢复**: 自动重试机制处理临时性错误
5. **类型安全**: 完整的 TypeScript 类型定义
