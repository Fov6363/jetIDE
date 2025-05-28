import { describe, it, expect, beforeEach } from 'vitest'
import { useFileTreeStore } from '../../stores/fileTreeStore'
import type { FileTreeNode, FileWatchEvent } from '@/shared/types'

// 模拟节点数据
const mockNodes: FileTreeNode[] = [
  {
    id: 'root',
    name: 'project',
    path: '/project',
    type: 'directory',
    depth: 0,
    children: [],
    isExpanded: false,
    isLoading: false,
  },
  {
    id: 'src',
    name: 'src',
    path: '/project/src',
    type: 'directory',
    depth: 1,
    parent: 'root',
    children: [],
    isExpanded: false,
    isLoading: false,
  },
  {
    id: 'file1',
    name: 'index.ts',
    path: '/project/src/index.ts',
    type: 'file',
    size: 1024,
    lastModified: Date.now(),
    depth: 2,
    parent: 'src',
  },
]

describe('FileTreeStore', () => {
  beforeEach(() => {
    // 重置状态
    useFileTreeStore.getState().resetState()
  })

  describe('基础操作', () => {
    it('应该能设置节点', () => {
      const store = useFileTreeStore.getState()

      store.setNodes(mockNodes)

      expect(Object.keys(store.nodes)).toHaveLength(3)
      expect(store.nodes['root']).toBeDefined()
      expect(store.nodes['src']).toBeDefined()
      expect(store.nodes['file1']).toBeDefined()
      expect(store.rootPaths).toContain('/project')
    })

    it('应该能添加节点', () => {
      const store = useFileTreeStore.getState()
      const newNode: FileTreeNode = {
        id: 'new-file',
        name: 'new.ts',
        path: '/project/new.ts',
        type: 'file',
        depth: 1,
        parent: 'root',
      }

      store.addNode(newNode)

      expect(store.nodes['new-file']).toEqual(newNode)
    })

    it('应该能更新节点', () => {
      const store = useFileTreeStore.getState()
      store.setNodes(mockNodes)

      store.updateNode('file1', { size: 2048 })

      expect(store.nodes['file1'].size).toBe(2048)
    })

    it('应该能删除节点及其子节点', () => {
      const store = useFileTreeStore.getState()
      store.setNodes(mockNodes)

      store.removeNode('src')

      expect(store.nodes['src']).toBeUndefined()
      expect(store.nodes['file1']).toBeUndefined() // 子节点也应该被删除
      expect(store.nodes['root']).toBeDefined() // 父节点应该保留
    })
  })

  describe('展开/折叠操作', () => {
    beforeEach(() => {
      const store = useFileTreeStore.getState()
      store.setNodes(mockNodes)
    })

    it('应该能展开节点', () => {
      const store = useFileTreeStore.getState()

      store.expandNode('src')

      expect(store.expandedNodes).toContain('src')
      expect(store.isNodeExpanded('src')).toBe(true)
    })

    it('应该能折叠节点', () => {
      const store = useFileTreeStore.getState()
      store.expandNode('src')

      store.collapseNode('src')

      expect(store.expandedNodes).not.toContain('src')
      expect(store.isNodeExpanded('src')).toBe(false)
    })

    it('应该能切换节点状态', () => {
      const store = useFileTreeStore.getState()

      // 第一次切换：展开
      store.toggleNode('src')
      expect(store.isNodeExpanded('src')).toBe(true)

      // 第二次切换：折叠
      store.toggleNode('src')
      expect(store.isNodeExpanded('src')).toBe(false)
    })

    it('应该能展开所有目录节点', () => {
      const store = useFileTreeStore.getState()

      store.expandAll()

      expect(store.expandedNodes).toContain('root')
      expect(store.expandedNodes).toContain('src')
      expect(store.expandedNodes).not.toContain('file1') // 文件不应该被展开
    })

    it('应该能折叠所有节点', () => {
      const store = useFileTreeStore.getState()
      store.expandAll()

      store.collapseAll()

      expect(store.expandedNodes).toHaveLength(0)
    })
  })

  describe('选择操作', () => {
    beforeEach(() => {
      const store = useFileTreeStore.getState()
      store.setNodes(mockNodes)
    })

    it('应该能选择单个节点', () => {
      const store = useFileTreeStore.getState()

      store.selectNode('file1')

      expect(store.selectedNodes).toEqual(['file1'])
      expect(store.isNodeSelected('file1')).toBe(true)
    })

    it('应该能多选节点', () => {
      const store = useFileTreeStore.getState()

      store.selectNode('file1')
      store.selectNode('src', true) // 多选

      expect(store.selectedNodes).toContain('file1')
      expect(store.selectedNodes).toContain('src')
      expect(store.selectedNodes).toHaveLength(2)
    })

    it('应该能取消选择节点（多选模式）', () => {
      const store = useFileTreeStore.getState()
      store.selectNode('file1')
      store.selectNode('src', true)

      store.selectNode('file1', true) // 再次选择应该取消选择

      expect(store.selectedNodes).not.toContain('file1')
      expect(store.selectedNodes).toContain('src')
    })

    it('应该能选择多个节点', () => {
      const store = useFileTreeStore.getState()

      store.selectNodes(['file1', 'src'])

      expect(store.selectedNodes).toEqual(['file1', 'src'])
    })

    it('应该能清除选择', () => {
      const store = useFileTreeStore.getState()
      store.selectNodes(['file1', 'src'])

      store.clearSelection()

      expect(store.selectedNodes).toHaveLength(0)
    })

    it('应该能全选', () => {
      const store = useFileTreeStore.getState()

      store.selectAll()

      expect(store.selectedNodes).toHaveLength(3)
      expect(store.selectedNodes).toContain('root')
      expect(store.selectedNodes).toContain('src')
      expect(store.selectedNodes).toContain('file1')
    })
  })

  describe('加载状态', () => {
    beforeEach(() => {
      const store = useFileTreeStore.getState()
      store.setNodes(mockNodes)
    })

    it('应该能设置加载状态', () => {
      const store = useFileTreeStore.getState()

      store.setLoading('src', true)

      expect(store.loadingNodes).toContain('src')
      expect(store.isNodeLoading('src')).toBe(true)
      expect(store.nodes['src'].isLoading).toBe(true)
    })

    it('应该能取消加载状态', () => {
      const store = useFileTreeStore.getState()
      store.setLoading('src', true)

      store.setLoading('src', false)

      expect(store.loadingNodes).not.toContain('src')
      expect(store.isNodeLoading('src')).toBe(false)
      expect(store.nodes['src'].isLoading).toBe(false)
    })
  })

  describe('搜索和过滤', () => {
    beforeEach(() => {
      const store = useFileTreeStore.getState()
      store.setNodes(mockNodes)
    })

    it('应该能设置搜索查询', () => {
      const store = useFileTreeStore.getState()

      store.setSearchQuery('index')

      expect(store.searchQuery).toBe('index')
      expect(store.filteredNodes).toContain('file1')
    })

    it('应该能过滤节点', () => {
      const store = useFileTreeStore.getState()

      store.filterNodes('src')

      expect(store.filteredNodes).toContain('src')
      expect(store.filteredNodes).not.toContain('file1')
    })

    it('应该能清除过滤', () => {
      const store = useFileTreeStore.getState()
      store.setSearchQuery('test')

      store.clearFilter()

      expect(store.searchQuery).toBe('')
      expect(store.filteredNodes).toHaveLength(0)
    })
  })

  describe('排序', () => {
    beforeEach(() => {
      const store = useFileTreeStore.getState()
      store.setNodes(mockNodes)
    })

    it('应该能按名称排序', () => {
      const store = useFileTreeStore.getState()

      store.sortNodes('name', 'asc')

      expect(store.config.sortBy).toBe('name')
      expect(store.config.sortOrder).toBe('asc')
    })

    it('应该能按大小排序', () => {
      const store = useFileTreeStore.getState()

      store.sortNodes('size', 'desc')

      expect(store.config.sortBy).toBe('size')
      expect(store.config.sortOrder).toBe('desc')
    })
  })

  describe('配置更新', () => {
    it('应该能更新配置', () => {
      const store = useFileTreeStore.getState()

      store.updateConfig({
        showHiddenFiles: true,
        maxDepth: 5,
      })

      expect(store.config.showHiddenFiles).toBe(true)
      expect(store.config.maxDepth).toBe(5)
    })
  })

  describe('文件监听事件处理', () => {
    beforeEach(() => {
      const store = useFileTreeStore.getState()
      store.setNodes(mockNodes)
    })

    it('应该能处理文件创建事件', () => {
      const store = useFileTreeStore.getState()
      const createEvent: FileWatchEvent = {
        type: 'created',
        path: '/project/new-file.ts',
        stats: {
          isDirectory: false,
          size: 512,
          lastModified: Date.now(),
        },
      }

      store.handleFileWatchEvent(createEvent)

      const nodeId = btoa(encodeURIComponent('/project/new-file.ts')).replace(
        /[+/=]/g,
        ''
      )
      expect(store.nodes[nodeId]).toBeDefined()
      expect(store.nodes[nodeId].name).toBe('new-file.ts')
      expect(store.nodes[nodeId].type).toBe('file')
    })

    it('应该能处理文件修改事件', () => {
      const store = useFileTreeStore.getState()
      const modifyEvent: FileWatchEvent = {
        type: 'modified',
        path: '/project/src/index.ts',
        stats: {
          isDirectory: false,
          size: 2048,
          lastModified: Date.now(),
        },
      }

      store.handleFileWatchEvent(modifyEvent)

      expect(store.nodes['file1'].size).toBe(2048)
    })

    it('应该能处理文件删除事件', () => {
      const store = useFileTreeStore.getState()
      const deleteEvent: FileWatchEvent = {
        type: 'deleted',
        path: '/project/src/index.ts',
      }

      store.handleFileWatchEvent(deleteEvent)

      expect(store.nodes['file1']).toBeUndefined()
    })

    it('应该能处理文件重命名事件', () => {
      const store = useFileTreeStore.getState()
      const renameEvent: FileWatchEvent = {
        type: 'renamed',
        path: '/project/src/main.ts',
        oldPath: '/project/src/index.ts',
      }

      store.handleFileWatchEvent(renameEvent)

      expect(store.nodes['file1']).toBeUndefined()
      const newNodeId = btoa(
        encodeURIComponent('/project/src/main.ts')
      ).replace(/[+/=]/g, '')
      expect(store.nodes[newNodeId]).toBeDefined()
      expect(store.nodes[newNodeId].name).toBe('main.ts')
    })
  })

  describe('工具方法', () => {
    beforeEach(() => {
      const store = useFileTreeStore.getState()
      store.setNodes(mockNodes)
    })

    it('应该能根据ID获取节点', () => {
      const store = useFileTreeStore.getState()

      const node = store.getNodeById('file1')

      expect(node).toBeDefined()
      expect(node?.name).toBe('index.ts')
    })

    it('应该能根据路径获取节点', () => {
      const store = useFileTreeStore.getState()

      const nodes = store.getNodesByPath('/project/src')

      expect(nodes).toHaveLength(2) // src 目录和 index.ts 文件
      expect(nodes.some(node => node.name === 'src')).toBe(true)
      expect(nodes.some(node => node.name === 'index.ts')).toBe(true)
    })

    it('应该能获取父节点', () => {
      const store = useFileTreeStore.getState()

      const parent = store.getParentNode('file1')

      expect(parent).toBeDefined()
      expect(parent?.id).toBe('src')
    })

    it('应该能获取子节点', () => {
      const store = useFileTreeStore.getState()

      const children = store.getChildNodes('src')

      expect(children).toHaveLength(0) // 初始状态下没有设置子节点
    })
  })

  describe('状态重置', () => {
    it('应该能重置状态', () => {
      const store = useFileTreeStore.getState()
      store.setNodes(mockNodes)
      store.selectAll()
      store.expandAll()
      store.setSearchQuery('test')

      store.resetState()

      expect(Object.keys(store.nodes)).toHaveLength(0)
      expect(store.selectedNodes).toHaveLength(0)
      expect(store.expandedNodes).toHaveLength(0)
      expect(store.searchQuery).toBe('')
      expect(store.filteredNodes).toHaveLength(0)
    })
  })
})
