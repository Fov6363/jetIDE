import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  FileTreeNode,
  FileTreeState,
  FileTreeConfig,
  FileWatchEvent,
} from '@/shared/types'

/**
 * 文件树状态管理接口
 */
interface FileTreeStore extends FileTreeState {
  // 配置
  config: FileTreeConfig

  // 基础操作
  setNodes: (nodes: FileTreeNode[]) => void
  addNode: (node: FileTreeNode) => void
  updateNode: (id: string, updates: Partial<FileTreeNode>) => void
  removeNode: (id: string) => void

  // 展开/折叠操作
  expandNode: (nodeId: string) => void
  collapseNode: (nodeId: string) => void
  toggleNode: (nodeId: string) => void
  expandAll: () => void
  collapseAll: () => void

  // 选择操作
  selectNode: (nodeId: string, multiSelect?: boolean) => void
  selectNodes: (nodeIds: string[]) => void
  clearSelection: () => void
  selectAll: () => void

  // 加载状态
  setLoading: (nodeId: string, loading: boolean) => void

  // 搜索和过滤
  setSearchQuery: (query: string) => void
  filterNodes: (query: string) => void
  clearFilter: () => void

  // 排序
  sortNodes: (
    sortBy: FileTreeConfig['sortBy'],
    sortOrder: FileTreeConfig['sortOrder']
  ) => void

  // 配置更新
  updateConfig: (config: Partial<FileTreeConfig>) => void

  // 文件监听事件处理
  handleFileWatchEvent: (event: FileWatchEvent) => void

  // 工具方法
  getNodeById: (id: string) => FileTreeNode | undefined
  getNodesByPath: (path: string) => FileTreeNode[]
  getParentNode: (nodeId: string) => FileTreeNode | undefined
  getChildNodes: (nodeId: string) => FileTreeNode[]
  getSelectedNodes: () => FileTreeNode[]
  copyNodePath: (nodeId: string) => Promise<boolean>
  showInFileManager: (nodeId: string) => Promise<boolean>

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

  // 重置状态
  resetState: () => void

  // 状态检查方法
  isNodeExpanded: (nodeId: string) => boolean
  isNodeSelected: (nodeId: string) => boolean
  isNodeLoading: (nodeId: string) => boolean
}

/**
 * 默认配置
 */
const defaultConfig: FileTreeConfig = {
  showHiddenFiles: false,
  sortBy: 'name',
  sortOrder: 'asc',
  maxDepth: 10,
  autoExpand: false,
  enableVirtualization: true,
}

/**
 * 初始状态
 */
const initialState: FileTreeState = {
  nodes: {},
  rootPaths: [],
  selectedNodes: [],
  expandedNodes: [],
  loadingNodes: [],
  searchQuery: '',
  filteredNodes: [],
}

/**
 * 生成节点ID
 */
const generateNodeId = (path: string): string => {
  return btoa(encodeURIComponent(path)).replace(/[+/=]/g, '')
}

/**
 * 排序节点
 */
const sortNodesByConfig = (
  nodes: FileTreeNode[],
  sortBy: FileTreeConfig['sortBy'],
  sortOrder: FileTreeConfig['sortOrder']
): FileTreeNode[] => {
  return [...nodes].sort((a, b) => {
    let comparison = 0

    // 目录优先
    if (a.type !== b.type) {
      comparison = a.type === 'directory' ? -1 : 1
    } else {
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'zh-CN', { numeric: true })
          break
        case 'type':
          comparison =
            a.name
              .split('.')
              .pop()
              ?.localeCompare(b.name.split('.').pop() || '') || 0
          break
        case 'size':
          comparison = (a.size || 0) - (b.size || 0)
          break
        case 'modified':
          comparison = (a.lastModified || 0) - (b.lastModified || 0)
          break
      }
    }

    return sortOrder === 'desc' ? -comparison : comparison
  })
}

/**
 * 过滤节点
 */
const filterNodesByQuery = (
  nodes: Record<string, FileTreeNode>,
  query: string
): string[] => {
  if (!query.trim()) return []

  const filtered: string[] = []
  const lowerQuery = query.toLowerCase()

  Object.values(nodes).forEach(node => {
    if (node.name.toLowerCase().includes(lowerQuery)) {
      filtered.push(node.id)
    }
  })

  return filtered
}

/**
 * 创建文件树状态管理
 */
export const useFileTreeStore = create<FileTreeStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      ...initialState,
      config: defaultConfig,

      // 基础操作
      setNodes: (nodes: FileTreeNode[]) => {
        const nodesMap: Record<string, FileTreeNode> = {}
        const rootPaths: string[] = []

        nodes.forEach(node => {
          nodesMap[node.id] = node
          if (node.depth === 0) {
            rootPaths.push(node.path)
          }
        })

        set({ nodes: nodesMap, rootPaths })
      },

      addNode: (node: FileTreeNode) => {
        set(state => ({
          nodes: { ...state.nodes, [node.id]: node },
          rootPaths:
            node.depth === 0
              ? [...state.rootPaths, node.path]
              : state.rootPaths,
        }))
      },

      updateNode: (id: string, updates: Partial<FileTreeNode>) => {
        set(state => ({
          nodes: {
            ...state.nodes,
            [id]: { ...state.nodes[id], ...updates },
          },
        }))
      },

      removeNode: (id: string) => {
        set(state => {
          const newNodes = { ...state.nodes }
          const node = newNodes[id]

          if (node) {
            // 递归删除子节点
            const deleteChildren = (nodeId: string) => {
              const nodeToDelete = newNodes[nodeId]
              if (nodeToDelete?.children) {
                nodeToDelete.children.forEach(child => deleteChildren(child.id))
              }
              delete newNodes[nodeId]
            }

            deleteChildren(id)
          }

          return {
            nodes: newNodes,
            selectedNodes: state.selectedNodes.filter(nodeId => nodeId !== id),
            expandedNodes: state.expandedNodes.filter(nodeId => nodeId !== id),
            loadingNodes: state.loadingNodes.filter(nodeId => nodeId !== id),
            rootPaths:
              node?.depth === 0
                ? state.rootPaths.filter(path => path !== node.path)
                : state.rootPaths,
          }
        })
      },

      // 展开/折叠操作
      expandNode: (nodeId: string) => {
        set(state => ({
          expandedNodes: state.expandedNodes.includes(nodeId)
            ? state.expandedNodes
            : [...state.expandedNodes, nodeId],
        }))
      },

      collapseNode: (nodeId: string) => {
        set(state => ({
          expandedNodes: state.expandedNodes.filter(id => id !== nodeId),
        }))
      },

      toggleNode: (nodeId: string) => {
        const { expandedNodes } = get()
        if (expandedNodes.includes(nodeId)) {
          get().collapseNode(nodeId)
        } else {
          get().expandNode(nodeId)
        }
      },

      expandAll: () => {
        set(state => ({
          expandedNodes: Object.keys(state.nodes).filter(
            id => state.nodes[id].type === 'directory'
          ),
        }))
      },

      collapseAll: () => {
        set({ expandedNodes: [] })
      },

      // 选择操作
      selectNode: (nodeId: string, multiSelect = false) => {
        set(state => {
          if (multiSelect) {
            const isSelected = state.selectedNodes.includes(nodeId)
            return {
              selectedNodes: isSelected
                ? state.selectedNodes.filter(id => id !== nodeId)
                : [...state.selectedNodes, nodeId],
            }
          } else {
            return { selectedNodes: [nodeId] }
          }
        })
      },

      selectNodes: (nodeIds: string[]) => {
        set({ selectedNodes: nodeIds })
      },

      clearSelection: () => {
        set({ selectedNodes: [] })
      },

      selectAll: () => {
        set(state => ({
          selectedNodes: Object.keys(state.nodes),
        }))
      },

      // 加载状态
      setLoading: (nodeId: string, loading: boolean) => {
        set(state => ({
          loadingNodes: loading
            ? state.loadingNodes.includes(nodeId)
              ? state.loadingNodes
              : [...state.loadingNodes, nodeId]
            : state.loadingNodes.filter(id => id !== nodeId),
        }))

        // 同时更新节点的加载状态
        get().updateNode(nodeId, { isLoading: loading })
      },

      // 搜索和过滤
      setSearchQuery: (query: string) => {
        set({ searchQuery: query })
        get().filterNodes(query)
      },

      filterNodes: (query: string) => {
        const { nodes } = get()
        const filteredNodes = filterNodesByQuery(nodes, query)
        set({ filteredNodes })
      },

      clearFilter: () => {
        set({ searchQuery: '', filteredNodes: [] })
      },

      // 排序
      sortNodes: (
        sortBy: FileTreeConfig['sortBy'],
        sortOrder: FileTreeConfig['sortOrder']
      ) => {
        set(state => {
          const newConfig = { ...state.config, sortBy, sortOrder }
          const sortedNodes = { ...state.nodes }

          // 对每个父节点的子节点进行排序
          Object.values(sortedNodes).forEach(node => {
            if (node.children && node.children.length > 0) {
              node.children = sortNodesByConfig(
                node.children,
                sortBy,
                sortOrder
              )
            }
          })

          return {
            config: newConfig,
            nodes: sortedNodes,
          }
        })
      },

      // 配置更新
      updateConfig: (configUpdates: Partial<FileTreeConfig>) => {
        set(state => ({
          config: { ...state.config, ...configUpdates },
        }))
      },

      // 文件监听事件处理
      handleFileWatchEvent: (event: FileWatchEvent) => {
        const { nodes } = get()
        const nodeId = generateNodeId(event.path)

        switch (event.type) {
          case 'created':
            if (event.stats) {
              const pathParts = event.path.split('/')
              const name = pathParts[pathParts.length - 1]
              const parentPath = pathParts.slice(0, -1).join('/')
              const parentId = generateNodeId(parentPath)

              const newNode: FileTreeNode = {
                id: nodeId,
                name,
                path: event.path,
                type: event.stats.isDirectory ? 'directory' : 'file',
                size: event.stats.size,
                lastModified: event.stats.lastModified,
                parent: parentId,
                depth: pathParts.length - 1,
                children: event.stats.isDirectory ? [] : undefined,
              }

              get().addNode(newNode)
            }
            break

          case 'modified':
            if (event.stats && nodes[nodeId]) {
              get().updateNode(nodeId, {
                size: event.stats.size,
                lastModified: event.stats.lastModified,
              })
            }
            break

          case 'deleted':
            if (nodes[nodeId]) {
              get().removeNode(nodeId)
            }
            break

          case 'renamed':
            if (event.oldPath && nodes[generateNodeId(event.oldPath)]) {
              const oldNodeId = generateNodeId(event.oldPath)
              const oldNode = nodes[oldNodeId]

              if (oldNode) {
                // 删除旧节点
                get().removeNode(oldNodeId)

                // 添加新节点
                const pathParts = event.path.split('/')
                const name = pathParts[pathParts.length - 1]

                const newNode: FileTreeNode = {
                  ...oldNode,
                  id: nodeId,
                  name,
                  path: event.path,
                }

                get().addNode(newNode)
              }
            }
            break
        }
      },

      // 工具方法
      getNodeById: (id: string) => {
        return get().nodes[id]
      },

      getNodesByPath: (path: string) => {
        const { nodes } = get()
        return Object.values(nodes).filter(node => node.path === path)
      },

      getParentNode: (nodeId: string) => {
        const { nodes } = get()
        const node = nodes[nodeId]
        return node?.parent ? nodes[node.parent] : undefined
      },

      getChildNodes: (nodeId: string) => {
        const { nodes } = get()
        const node = nodes[nodeId]
        return node?.children || []
      },

      getSelectedNodes: () => {
        const { nodes, selectedNodes } = get()
        return selectedNodes
          .map(id => nodes[id])
          .filter((node): node is FileTreeNode => node !== undefined)
      },

      copyNodePath: async (nodeId: string) => {
        const node = get().getNodeById(nodeId)
        if (!node) return false

        try {
          if (window.electronAPI) {
            const result = await window.electronAPI.fileOperations.copyPath(
              node.path
            )
            return result.success
          } else {
            // 浏览器环境的降级方案
            await navigator.clipboard.writeText(node.path)
            return true
          }
        } catch (error) {
          console.error('复制路径失败:', error)
          return false
        }
      },

      showInFileManager: async (nodeId: string) => {
        const node = get().getNodeById(nodeId)
        if (!node) return false

        try {
          if (window.electronAPI) {
            const result =
              await window.electronAPI.fileOperations.showInExplorer(node.path)
            return result.success
          } else {
            // 浏览器环境无法实现此功能
            console.warn('在浏览器环境中无法打开文件管理器')
            return false
          }
        } catch (error) {
          console.error('打开文件管理器失败:', error)
          return false
        }
      },

      // 统计信息
      get stats() {
        const { nodes } = get()
        const nodeList = Object.values(nodes)

        const totalFiles = nodeList.filter(node => node.type === 'file').length
        const totalDirectories = nodeList.filter(
          node => node.type === 'directory'
        ).length
        const totalSize = nodeList
          .filter(node => node.type === 'file' && node.size)
          .reduce((sum, node) => sum + (node.size || 0), 0)

        const fileTypes: Record<string, number> = {}
        nodeList
          .filter(node => node.type === 'file')
          .forEach(node => {
            const ext = node.name.split('.').pop()?.toLowerCase() || 'unknown'
            fileTypes[ext] = (fileTypes[ext] || 0) + 1
          })

        return {
          totalFiles,
          totalDirectories,
          totalSize,
          fileTypes,
        }
      },

      // 格式化工具
      formatFileSize: (bytes: number) => {
        if (bytes === 0) return '0 B'

        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      },

      formatTime: (timestamp: number) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now.getTime() - date.getTime()

        // 小于1分钟
        if (diff < 60000) {
          return '刚刚'
        }

        // 小于1小时
        if (diff < 3600000) {
          const minutes = Math.floor(diff / 60000)
          return `${minutes}分钟前`
        }

        // 小于1天
        if (diff < 86400000) {
          const hours = Math.floor(diff / 3600000)
          return `${hours}小时前`
        }

        // 小于1周
        if (diff < 604800000) {
          const days = Math.floor(diff / 86400000)
          return `${days}天前`
        }

        // 超过1周，显示具体日期
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      },

      isNodeExpanded: (nodeId: string) => {
        return get().expandedNodes.includes(nodeId)
      },

      isNodeSelected: (nodeId: string) => {
        return get().selectedNodes.includes(nodeId)
      },

      isNodeLoading: (nodeId: string) => {
        return get().loadingNodes.includes(nodeId)
      },

      // 重置状态
      resetState: () => {
        set({
          nodes: {},
          rootPaths: [],
          expandedNodes: [],
          selectedNodes: [],
          loadingNodes: [],
          searchQuery: '',
          filteredNodes: [],
          config: {
            showHiddenFiles: false,
            sortBy: 'name',
            sortOrder: 'asc',
            maxDepth: 10,
            autoExpand: false,
            enableVirtualization: true,
          },
        })
      },
    }),
    {
      name: 'file-tree-store',
      version: 1,
    }
  )
)

// 导出工具函数
export { generateNodeId, sortNodesByConfig, filterNodesByQuery }
