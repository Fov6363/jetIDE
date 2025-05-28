# 状态管理 (Stores)

本目录包含 JetIDE 渲染进程的状态管理实现，使用 Zustand 进行状态管理。

## 文件结构

```
stores/
├── fileTreeStore.ts    # 文件树状态管理
├── index.ts           # 统一导出
└── README.md          # 本文档
```

## 文件树状态管理 (FileTreeStore)

### 概述

`fileTreeStore.ts` 实现了文件树的完整状态管理，包括：

- 节点数据管理
- 展开/折叠状态
- 选择状态
- 加载状态
- 搜索和过滤
- 排序配置
- 文件监听事件处理

### 核心功能

#### 1. 节点管理

```typescript
// 设置节点
store.setNodes(nodes: FileTreeNode[])

// 添加节点
store.addNode(node: FileTreeNode)

// 更新节点
store.updateNode(id: string, updates: Partial<FileTreeNode>)

// 删除节点（递归删除子节点）
store.removeNode(id: string)
```

#### 2. 展开/折叠操作

```typescript
// 展开节点
store.expandNode(nodeId: string)

// 折叠节点
store.collapseNode(nodeId: string)

// 切换节点状态
store.toggleNode(nodeId: string)

// 展开所有目录
store.expandAll()

// 折叠所有节点
store.collapseAll()
```

#### 3. 选择操作

```typescript
// 选择单个节点
store.selectNode(nodeId: string, multiSelect?: boolean)

// 选择多个节点
store.selectNodes(nodeIds: string[])

// 清除选择
store.clearSelection()

// 全选
store.selectAll()
```

#### 4. 搜索和过滤

```typescript
// 设置搜索查询
store.setSearchQuery(query: string)

// 手动过滤节点
store.filterNodes(query: string)

// 清除过滤
store.clearFilter()
```

#### 5. 排序

```typescript
// 排序节点
store.sortNodes(
  sortBy: 'name' | 'type' | 'size' | 'modified',
  sortOrder: 'asc' | 'desc'
)
```

#### 6. 配置管理

```typescript
// 更新配置
store.updateConfig({
  showHiddenFiles: true,
  sortBy: 'name',
  sortOrder: 'asc',
  maxDepth: 10,
  autoExpand: false,
  enableVirtualization: true,
})
```

#### 7. 文件监听

```typescript
// 处理文件系统事件
store.handleFileWatchEvent({
  type: 'created' | 'modified' | 'deleted' | 'renamed',
  path: string,
  oldPath?: string,
  stats?: FileStats,
})
```

### 工具方法

```typescript
// 获取节点
const node = store.getNodeById(id: string)
const nodes = store.getNodesByPath(path: string)
const parent = store.getParentNode(nodeId: string)
const children = store.getChildNodes(nodeId: string)

// 状态检查
const isExpanded = store.isNodeExpanded(nodeId: string)
const isSelected = store.isNodeSelected(nodeId: string)
const isLoading = store.isNodeLoading(nodeId: string)
```

### 状态结构

```typescript
interface FileTreeState {
  nodes: Record<string, FileTreeNode> // 节点映射
  rootPaths: string[] // 根路径列表
  selectedNodes: string[] // 选中的节点ID
  expandedNodes: string[] // 展开的节点ID
  loadingNodes: string[] // 加载中的节点ID
  searchQuery: string // 搜索查询
  filteredNodes: string[] // 过滤后的节点ID
}

interface FileTreeConfig {
  showHiddenFiles: boolean // 显示隐藏文件
  sortBy: 'name' | 'type' | 'size' | 'modified' // 排序字段
  sortOrder: 'asc' | 'desc' // 排序顺序
  maxDepth: number // 最大深度
  autoExpand: boolean // 自动展开
  enableVirtualization: boolean // 启用虚拟化
}
```

### 使用示例

```typescript
import { useFileTreeStore } from '@/renderer/stores'

function FileTreeComponent() {
  const store = useFileTreeStore()

  // 获取状态
  const { nodes, selectedNodes, expandedNodes } = store

  // 操作节点
  const handleNodeClick = (nodeId: string) => {
    store.selectNode(nodeId)
  }

  const handleNodeToggle = (nodeId: string) => {
    store.toggleNode(nodeId)
  }

  // 搜索
  const handleSearch = (query: string) => {
    store.setSearchQuery(query)
  }

  return (
    <div>
      {/* 渲染文件树 */}
    </div>
  )
}
```

## 最佳实践

### 1. 性能优化

- 使用 `React.memo()` 包装文件树组件
- 使用 `useCallback()` 缓存事件处理函数
- 启用虚拟化处理大量节点
- 合理使用缓存机制

### 2. 状态管理

- 避免直接修改状态，使用提供的方法
- 使用 DevTools 进行调试
- 合理设置缓存过期时间
- 及时清理不需要的状态

### 3. 错误处理

- 监听状态变化，处理异常情况
- 提供用户友好的错误提示
- 实现状态恢复机制
- 记录关键操作日志

### 4. 类型安全

- 使用 TypeScript 严格模式
- 定义完整的类型接口
- 避免使用 `any` 类型
- 提供类型守卫函数

## 扩展指南

### 添加新的状态

1. 在 `FileTreeState` 接口中添加新字段
2. 在初始状态中设置默认值
3. 添加对应的操作方法
4. 更新类型定义
5. 编写单元测试

### 添加新的操作

1. 在 store 中添加新方法
2. 更新接口定义
3. 实现业务逻辑
4. 添加错误处理
5. 编写测试用例

### 性能优化

1. 使用 `immer` 处理复杂状态更新
2. 实现状态持久化
3. 添加状态压缩
4. 优化内存使用
5. 实现增量更新

## 调试技巧

### 1. 使用 Zustand DevTools

```typescript
import { devtools } from 'zustand/middleware'

export const useFileTreeStore = create<FileTreeStore>()(
  devtools(
    (set, get) => ({
      // store implementation
    }),
    {
      name: 'file-tree-store',
    }
  )
)
```

### 2. 状态日志

```typescript
// 在开发环境中启用状态日志
if (process.env.NODE_ENV === 'development') {
  useFileTreeStore.subscribe(state => {
    console.log('FileTree state changed:', state)
  })
}
```

### 3. 性能监控

```typescript
// 监控状态更新性能
const startTime = performance.now()
store.setNodes(nodes)
const endTime = performance.now()
console.log(`setNodes took ${endTime - startTime} ms`)
```

## 相关文档

- [文件树服务](../services/README.md#文件树服务)
- [文件树 Hook](../hooks/README.md#文件树-hook)
- [文件树组件](../components/README.md#文件树组件)
- [类型定义](../../shared/types.ts)
