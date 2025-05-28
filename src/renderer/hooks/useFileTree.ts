import { useCallback, useEffect, useMemo } from 'react'
import { generateNodeId, useFileTreeStore } from '../stores/fileTreeStore'
import { fileTreeService } from '../services/fileTreeService'
import { notificationService } from '../services/notificationService'
import type { FileTreeNode, FileTreeConfig } from '@/shared/types'

/**
 * 文件树 Hook 返回类型
 */
export interface UseFileTreeReturn {
  // 状态
  nodes: Record<string, FileTreeNode>
  rootPaths: string[]
  selectedNodes: string[]
  expandedNodes: string[]
  loadingNodes: string[]
  searchQuery: string
  filteredNodes: string[]
  config: FileTreeConfig
  isLoading: boolean
  sortBy: FileTreeConfig['sortBy']
  sortOrder: FileTreeConfig['sortOrder']

  // 基础操作
  loadDirectory: (path: string, useCache?: boolean) => Promise<void>
  refreshDirectory: (path: string) => Promise<void>
  refreshAll: () => Promise<void>
  refresh: (path?: string) => Promise<void>

  // 节点操作
  createFile: (parentPath: string, name: string) => Promise<FileTreeNode | null>
  createDirectory: (
    parentPath: string,
    name: string
  ) => Promise<FileTreeNode | null>
  deleteNode: (nodeId: string) => Promise<boolean>
  deleteSelectedNodes: () => Promise<void>
  renameNode: (nodeId: string, newName: string) => Promise<FileTreeNode | null>

  // 展开/折叠
  expandNode: (nodeId: string) => Promise<void>
  collapseNode: (nodeId: string) => void
  toggleNode: (nodeId: string) => Promise<void>
  toggleExpand: (nodeId: string) => Promise<void>
  expandAll: () => void
  collapseAll: () => void

  // 选择操作
  selectNode: (nodeId: string, multiSelect?: boolean) => void
  selectNodes: (nodeIds: string[]) => void
  clearSelection: () => void
  selectAll: () => void

  // 搜索和过滤
  search: (query: string) => void
  setSearchQuery: (query: string) => void
  clearFilter: () => void

  // 排序
  sortNodes: (
    sortBy: FileTreeConfig['sortBy'],
    sortOrder: FileTreeConfig['sortOrder']
  ) => void
  setSortBy: (sortBy: FileTreeConfig['sortBy']) => void
  toggleSortOrder: () => void

  // 配置
  updateConfig: (config: Partial<FileTreeConfig>) => void

  // 工具方法
  getNodeById: (id: string) => FileTreeNode | undefined
  getSelectedNodes: () => FileTreeNode[]
  copyPath: (nodeId: string) => Promise<boolean>
  showInFileManager: (nodeId: string) => Promise<boolean>
  getVisibleNodes: () => FileTreeNode[]

  // 统计信息
  stats: {
    totalFiles: number
    totalDirectories: number
    totalSize: number
    fileTypes: Record<string, number>
  }

  // 格式化工具
  formatFileSize: (bytes: number) => string
  formatTime: (timestamp: number) => string

  // 状态检查
  isNodeExpanded: (nodeId: string) => boolean
  isNodeSelected: (nodeId: string) => boolean
  isNodeLoading: (nodeId: string) => boolean
}

/**
 * 文件树 Hook
 * 使用 Zustand 选择器模式来避免依赖循环问题
 */
export const useFileTree = (): UseFileTreeReturn => {
  // 使用选择器分别订阅需要的状态
  const nodes = useFileTreeStore(state => state.nodes)
  const rootPaths = useFileTreeStore(state => state.rootPaths)
  const selectedNodes = useFileTreeStore(state => state.selectedNodes)
  const expandedNodes = useFileTreeStore(state => state.expandedNodes)
  const loadingNodes = useFileTreeStore(state => state.loadingNodes)
  const searchQuery = useFileTreeStore(state => state.searchQuery)
  const filteredNodes = useFileTreeStore(state => state.filteredNodes)
  const config = useFileTreeStore(state => state.config)

  // 获取稳定的方法引用（这些方法在 Zustand 中是稳定的）
  const setNodes = useFileTreeStore(state => state.setNodes)
  const addNode = useFileTreeStore(state => state.addNode)
  const updateNode = useFileTreeStore(state => state.updateNode)
  const removeNode = useFileTreeStore(state => state.removeNode)
  const expandNodeInStore = useFileTreeStore(state => state.expandNode)
  const collapseNodeInStore = useFileTreeStore(state => state.collapseNode)
  const selectNodeInStore = useFileTreeStore(state => state.selectNode)
  const selectNodesInStore = useFileTreeStore(state => state.selectNodes)
  const clearSelectionInStore = useFileTreeStore(state => state.clearSelection)
  const selectAllInStore = useFileTreeStore(state => state.selectAll)
  const setLoading = useFileTreeStore(state => state.setLoading)
  const setSearchQueryInStore = useFileTreeStore(state => state.setSearchQuery)
  const clearFilterInStore = useFileTreeStore(state => state.clearFilter)
  const sortNodesInStore = useFileTreeStore(state => state.sortNodes)
  const updateConfigInStore = useFileTreeStore(state => state.updateConfig)
  const expandAllInStore = useFileTreeStore(state => state.expandAll)
  const collapseAllInStore = useFileTreeStore(state => state.collapseAll)
  const getNodeById = useFileTreeStore(state => state.getNodeById)
  const getSelectedNodesFromStore = useFileTreeStore(
    state => state.getSelectedNodes
  )
  const copyNodePath = useFileTreeStore(state => state.copyNodePath)
  const showInFileManager = useFileTreeStore(state => state.showInFileManager)
  const isNodeExpanded = useFileTreeStore(state => state.isNodeExpanded)
  const isNodeSelected = useFileTreeStore(state => state.isNodeSelected)
  const isNodeLoading = useFileTreeStore(state => state.isNodeLoading)
  const stats = useFileTreeStore(state => state.stats)
  const formatFileSize = useFileTreeStore(state => state.formatFileSize)
  const formatTime = useFileTreeStore(state => state.formatTime)

  // 计算派生状态
  const isLoading = useMemo(() => loadingNodes.length > 0, [loadingNodes])
  const sortBy = useMemo(() => config.sortBy, [config.sortBy])
  const sortOrder = useMemo(() => config.sortOrder, [config.sortOrder])

  // 加载目录 - 使用稳定的依赖
  const loadDirectory = useCallback(
    async (path: string, useCache = true) => {
      try {
        // 设置加载状态
        const nodeId = getNodeById(path)?.id
        if (nodeId) {
          setLoading(nodeId, true)
        }

        // 读取目录内容
        const nodes = await fileTreeService.readDirectory(
          path,
          config,
          useCache
        )

        // 更新状态
        setNodes(nodes)

        // 如果是根目录，添加到根路径列表
        if (!rootPaths.includes(path)) {
          addNode({
            id: generateNodeId(path),
            name: path.split('/').pop() || path,
            path,
            type: 'directory',
            depth: 0,
            children: nodes,
            isExpanded: true,
            isLoading: false,
          })
        }
      } catch (error) {
        notificationService.error(
          '加载失败',
          `无法加载目录 ${path}: ${error instanceof Error ? error.message : '未知错误'}`
        )
      } finally {
        const nodeId = getNodeById(path)?.id
        if (nodeId) {
          setLoading(nodeId, false)
        }
      }
    },
    [setNodes, addNode, setLoading, getNodeById, config, rootPaths]
  )

  // 刷新目录
  const refreshDirectory = useCallback(
    async (path: string) => {
      fileTreeService.clearAllCache()
      await loadDirectory(path, false)
    },
    [loadDirectory]
  )

  // 刷新所有
  const refreshAll = useCallback(async () => {
    fileTreeService.clearAllCache()
    const promises = rootPaths.map(path => loadDirectory(path, false))
    await Promise.all(promises)
  }, [rootPaths, loadDirectory])

  // 通用刷新方法
  const refresh = useCallback(
    async (path?: string) => {
      if (path) {
        await refreshDirectory(path)
      } else {
        await refreshAll()
      }
    },
    [refreshDirectory, refreshAll]
  )

  // 创建文件
  const createFile = useCallback(
    async (parentPath: string, name: string) => {
      const node = await fileTreeService.createNode(
        parentPath,
        name,
        'file',
        config
      )
      if (node) {
        addNode(node)
      }
      return node
    },
    [addNode, config]
  )

  // 创建目录
  const createDirectory = useCallback(
    async (parentPath: string, name: string) => {
      const node = await fileTreeService.createNode(
        parentPath,
        name,
        'directory',
        config
      )
      if (node) {
        addNode(node)
      }
      return node
    },
    [addNode, config]
  )

  // 删除节点
  const deleteNode = useCallback(
    async (nodeId: string) => {
      const node = getNodeById(nodeId)
      if (!node) return false

      const success = await fileTreeService.deleteNode(node)
      if (success) {
        removeNode(nodeId)
      }
      return success
    },
    [getNodeById, removeNode]
  )

  // 删除选中的节点
  const deleteSelectedNodes = useCallback(async () => {
    const selectedNodesData = selectedNodes
      .map(id => getNodeById(id))
      .filter((node): node is FileTreeNode => node !== undefined)

    if (selectedNodesData.length === 0) {
      notificationService.warning('没有选中项', '请先选择要删除的文件或文件夹')
      return
    }

    // 确认删除
    const confirmed = confirm(
      `确定要删除 ${selectedNodesData.length} 个项目吗？此操作不可撤销。`
    )
    if (!confirmed) return

    const result = await fileTreeService.deleteMultipleNodes(selectedNodesData)

    // 从状态中移除成功删除的节点
    result.successful.forEach(node => {
      removeNode(node.id)
    })

    // 清除选择
    clearSelectionInStore()
  }, [selectedNodes, getNodeById, removeNode, clearSelectionInStore])

  // 重命名节点
  const renameNode = useCallback(
    async (nodeId: string, newName: string) => {
      const node = getNodeById(nodeId)
      if (!node) return null

      const renamedNode = await fileTreeService.renameNode(node, newName)
      if (renamedNode) {
        removeNode(nodeId)
        addNode(renamedNode)
      }
      return renamedNode
    },
    [getNodeById, removeNode, addNode]
  )

  // 展开节点
  const expandNode = useCallback(
    async (nodeId: string) => {
      const node = getNodeById(nodeId)
      if (!node || node.type !== 'directory') return

      // 如果已经展开，直接返回
      if (isNodeExpanded(nodeId)) return

      try {
        // 设置加载状态
        setLoading(nodeId, true)

        // 加载子节点
        const children = await fileTreeService.loadChildren(node, config)

        // 更新节点的子节点
        updateNode(nodeId, { children })

        // 添加子节点到状态
        children.forEach(child => addNode(child))

        // 展开节点
        expandNodeInStore(nodeId)
      } catch (error) {
        notificationService.error(
          '展开失败',
          `无法展开 ${node.name}: ${error instanceof Error ? error.message : '未知错误'}`
        )
      } finally {
        setLoading(nodeId, false)
      }
    },
    [
      getNodeById,
      isNodeExpanded,
      setLoading,
      updateNode,
      addNode,
      expandNodeInStore,
      config,
    ]
  )

  // 折叠节点
  const collapseNode = useCallback(
    (nodeId: string) => {
      collapseNodeInStore(nodeId)
    },
    [collapseNodeInStore]
  )

  // 切换节点展开状态
  const toggleNode = useCallback(
    async (nodeId: string) => {
      if (isNodeExpanded(nodeId)) {
        collapseNode(nodeId)
      } else {
        await expandNode(nodeId)
      }
    },
    [isNodeExpanded, collapseNode, expandNode]
  )

  // 展开所有节点
  const expandAll = useCallback(() => {
    expandAllInStore()
  }, [expandAllInStore])

  // 折叠所有节点
  const collapseAll = useCallback(() => {
    collapseAllInStore()
  }, [collapseAllInStore])

  // 选择节点
  const selectNode = useCallback(
    (nodeId: string, multiSelect?: boolean) => {
      selectNodeInStore(nodeId, multiSelect)
    },
    [selectNodeInStore]
  )

  // 选择多个节点
  const selectNodes = useCallback(
    (nodeIds: string[]) => {
      selectNodesInStore(nodeIds)
    },
    [selectNodesInStore]
  )

  // 清除选择
  const clearSelection = useCallback(() => {
    clearSelectionInStore()
  }, [clearSelectionInStore])

  // 选择所有节点
  const selectAll = useCallback(() => {
    selectAllInStore()
  }, [selectAllInStore])

  // 设置搜索查询
  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryInStore(query)
    },
    [setSearchQueryInStore]
  )

  // 清除过滤
  const clearFilter = useCallback(() => {
    clearFilterInStore()
  }, [clearFilterInStore])

  // 排序节点
  const sortNodes = useCallback(
    (
      sortBy: FileTreeConfig['sortBy'],
      sortOrder: FileTreeConfig['sortOrder']
    ) => {
      sortNodesInStore(sortBy, sortOrder)
    },
    [sortNodesInStore]
  )

  // 设置排序方式
  const setSortBy = useCallback(
    (sortBy: FileTreeConfig['sortBy']) => {
      sortNodesInStore(sortBy, config.sortOrder)
    },
    [sortNodesInStore, config.sortOrder]
  )

  // 切换排序顺序
  const toggleSortOrder = useCallback(() => {
    const newOrder = config.sortOrder === 'asc' ? 'desc' : 'asc'
    sortNodesInStore(config.sortBy, newOrder)
  }, [sortNodesInStore, config.sortBy, config.sortOrder])

  // 更新配置
  const updateConfig = useCallback(
    (configUpdates: Partial<FileTreeConfig>) => {
      updateConfigInStore(configUpdates)
    },
    [updateConfigInStore]
  )

  // 获取选中的节点
  const getSelectedNodes = useCallback(() => {
    return getSelectedNodesFromStore()
  }, [getSelectedNodesFromStore])

  // 获取可见节点
  const getVisibleNodes = useCallback(() => {
    if (filteredNodes.length > 0) {
      return filteredNodes.map(id => nodes[id]).filter(Boolean)
    }
    return Object.values(nodes)
  }, [nodes, filteredNodes])

  // 搜索功能
  const search = useCallback(
    (query: string) => {
      setSearchQuery(query)
    },
    [setSearchQuery]
  )

  // 创建文件到目录
  const createFileInDirectory = useCallback(
    async (parentPath: string, name: string) => {
      return await createFile(parentPath, name)
    },
    [createFile]
  )

  // 创建文件夹到目录
  const createFolderInDirectory = useCallback(
    async (parentPath: string, name: string) => {
      return await createDirectory(parentPath, name)
    },
    [createDirectory]
  )

  // 通过 ID 删除节点
  const deleteNodeById = useCallback(
    async (nodeId: string) => {
      return await deleteNode(nodeId)
    },
    [deleteNode]
  )

  // 通过 ID 重命名节点
  const renameNodeById = useCallback(
    async (nodeId: string, newName: string) => {
      return await renameNode(nodeId, newName)
    },
    [renameNode]
  )

  // 切换展开状态
  const toggleExpand = useCallback(
    async (nodeId: string) => {
      return await toggleNode(nodeId)
    },
    [toggleNode]
  )

  // 复制路径
  const copyPath = useCallback(
    async (nodeId: string) => {
      return await copyNodePath(nodeId)
    },
    [copyNodePath]
  )

  return {
    // 状态
    nodes,
    rootPaths,
    selectedNodes,
    expandedNodes,
    loadingNodes,
    searchQuery,
    filteredNodes,
    config,
    isLoading,
    sortBy,
    sortOrder,

    // 基础操作
    loadDirectory,
    refreshDirectory,
    refreshAll,
    refresh,

    // 节点操作
    createFile: createFileInDirectory,
    createDirectory: createFolderInDirectory,
    deleteNode: deleteNodeById,
    deleteSelectedNodes,
    renameNode: renameNodeById,

    // 展开/折叠
    expandNode,
    collapseNode,
    toggleNode,
    toggleExpand,
    expandAll,
    collapseAll,

    // 选择操作
    selectNode,
    selectNodes,
    clearSelection,
    selectAll,

    // 搜索和过滤
    search,
    setSearchQuery,
    clearFilter,

    // 排序
    sortNodes,
    setSortBy,
    toggleSortOrder,

    // 配置
    updateConfig,

    // 工具方法
    getNodeById,
    getSelectedNodes,
    copyPath,
    showInFileManager,
    getVisibleNodes,

    // 统计信息
    stats,

    // 格式化工具
    formatFileSize,
    formatTime,

    // 状态检查
    isNodeExpanded,
    isNodeSelected,
    isNodeLoading,
  }
}
