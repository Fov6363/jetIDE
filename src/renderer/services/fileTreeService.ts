import { fileOperationService } from './fileOperationService'
import { notificationService } from './notificationService'
import { ErrorHandler } from '../utils/errorHandler'
import type { FileTreeNode, FileTreeConfig } from '@/shared/types'
import { generateNodeId } from '../stores/fileTreeStore'

/**
 * 文件树业务逻辑服务
 * 负责文件系统操作和数据转换
 */
export class FileTreeService {
  private cache = new Map<string, FileTreeNode[]>()
  private cacheExpiry = new Map<string, number>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now > expiry) {
        this.cache.delete(key)
        this.cacheExpiry.delete(key)
      }
    }
  }

  /**
   * 获取缓存的文件树节点
   */
  private getCachedNodes(path: string): FileTreeNode[] | null {
    this.cleanExpiredCache()
    return this.cache.get(path) || null
  }

  /**
   * 设置缓存
   */
  private setCachedNodes(path: string, nodes: FileTreeNode[]): void {
    this.cache.set(path, nodes)
    this.cacheExpiry.set(path, Date.now() + this.CACHE_DURATION)
  }

  /**
   * 清除指定路径的缓存
   */
  private clearCache(path: string): void {
    this.cache.delete(path)
    this.cacheExpiry.delete(path)
  }

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    this.cache.clear()
    this.cacheExpiry.clear()
  }

  /**
   * 读取目录内容
   */
  async readDirectory(
    dirPath: string,
    config: FileTreeConfig,
    useCache: boolean = true
  ): Promise<FileTreeNode[]> {
    try {
      // 检查缓存
      if (useCache) {
        const cached = this.getCachedNodes(dirPath)
        if (cached) {
          return cached
        }
      }

      // 检查目录是否存在
      const exists = await fileOperationService.fileExists(dirPath)
      if (!exists) {
        throw new Error(`目录不存在: ${dirPath}`)
      }

      // 获取目录信息
      const dirInfo = await fileOperationService.getFileInfo(dirPath)
      if (!dirInfo.success || !dirInfo.data) {
        throw new Error(`无法读取目录信息: ${dirPath}`)
      }

      // 这里需要实现实际的目录读取逻辑
      // 由于当前的 fileOperationService 没有 readDirectory 方法
      // 我们需要在主进程中添加这个功能
      const nodes = await this._readDirectory(dirPath, config)

      // 缓存结果
      if (useCache) {
        this.setCachedNodes(dirPath, nodes)
      }

      return nodes
    } catch (error) {
      throw ErrorHandler.handle(error, `读取目录 ${dirPath}`)
    }
  }

  /**
   * 模拟读取目录（临时实现）
   * TODO: 在主进程中实现真正的目录读取功能
   */
  private async _readDirectory(
    dirPath: string,
    config: FileTreeConfig
  ): Promise<FileTreeNode[]> {
    // 这是一个临时的模拟实现
    // 实际应该调用主进程的目录读取功能
    const nodes = await fileOperationService.readDirectory(dirPath)

    const pathParts = dirPath.split('/').filter(Boolean)
    const depth = pathParts.length

    return nodes
      .filter(file => {
        // 过滤隐藏文件
        if (!config.showHiddenFiles && file.name.startsWith('.')) {
          return false
        }
        return true
      })
      .map(file => {
        const fullPath = `${dirPath}/${file.name}`.replace(/\/+/g, '/')
        return {
          id: generateNodeId(fullPath),
          name: file.name,
          path: fullPath,
          type: file.isDirectory ? 'directory' : 'file',
          size: file.size,
          lastModified: file.modified.getTime(),
          depth,
          parent: generateNodeId(dirPath),
          children: file.isDirectory ? [] : undefined,
          isExpanded: false,
          isLoading: false,
        }
      })
  }

  /**
   * 加载文件树节点的子节点
   */
  async loadChildren(
    node: FileTreeNode,
    config: FileTreeConfig,
    useCache: boolean = true
  ): Promise<FileTreeNode[]> {
    if (node.type !== 'directory') {
      return []
    }

    try {
      const children = await this.readDirectory(node.path, config, useCache)
      return children
    } catch (error) {
      notificationService.error(
        '加载失败',
        `无法加载 ${node.name} 的内容: ${error instanceof Error ? error.message : '未知错误'}`
      )
      return []
    }
  }

  /**
   * 创建文件树节点
   */
  async createNode(
    parentPath: string,
    name: string,
    type: 'file' | 'directory',
    config: FileTreeConfig
  ): Promise<FileTreeNode | null> {
    try {
      // 验证文件名
      const validation = fileOperationService.validateFileName(name)
      if (!validation.valid) {
        notificationService.error('文件名无效', validation.error)
        return null
      }

      // 创建文件或目录
      const result =
        type === 'directory'
          ? await fileOperationService.createDirectory(parentPath, name)
          : await fileOperationService.createFile(parentPath, name)

      if (!result.success) {
        throw new Error(result.error || '创建失败')
      }

      // 清除父目录缓存
      this.clearCache(parentPath)

      // 创建节点对象
      const fullPath = `${parentPath}/${name}`.replace(/\/+/g, '/')
      const pathParts = fullPath.split('/').filter(Boolean)

      const newNode: FileTreeNode = {
        id: generateNodeId(fullPath),
        name,
        path: fullPath,
        type,
        size: 0,
        lastModified: Date.now(),
        depth: pathParts.length,
        parent: generateNodeId(parentPath),
        children: type === 'directory' ? [] : undefined,
        isExpanded: false,
        isLoading: false,
      }

      notificationService.success(
        '创建成功',
        `${type === 'directory' ? '文件夹' : '文件'} "${name}" 已创建`
      )

      return newNode
    } catch (error) {
      ErrorHandler.handleWithNotification(
        error,
        `创建${type === 'directory' ? '文件夹' : '文件'}`
      )
      return null
    }
  }

  /**
   * 删除文件树节点
   */
  async deleteNode(node: FileTreeNode): Promise<boolean> {
    try {
      const result = await fileOperationService.deleteItem(
        node.path,
        node.type === 'directory'
      )

      if (!result.success) {
        throw new Error(result.error || '删除失败')
      }

      // 清除相关缓存
      this.clearCache(node.path)
      if (node.parent) {
        const parentPath = node.path.substring(0, node.path.lastIndexOf('/'))
        this.clearCache(parentPath)
      }

      notificationService.success(
        '删除成功',
        `${node.type === 'directory' ? '文件夹' : '文件'} "${node.name}" 已删除`
      )

      return true
    } catch (error) {
      ErrorHandler.handleWithNotification(error, '删除文件')
      return false
    }
  }

  /**
   * 重命名文件树节点
   */
  async renameNode(
    node: FileTreeNode,
    newName: string
  ): Promise<FileTreeNode | null> {
    try {
      // 验证新文件名
      const validation = fileOperationService.validateFileName(newName)
      if (!validation.valid) {
        notificationService.error('文件名无效', validation.error)
        return null
      }

      // 构建新路径
      const pathParts = node.path.split('/')
      pathParts[pathParts.length - 1] = newName
      const newPath = pathParts.join('/')

      // 执行重命名
      const result = await fileOperationService.renameItem(node.path, newPath)
      if (!result.success) {
        throw new Error(result.error || '重命名失败')
      }

      // 清除相关缓存
      this.clearCache(node.path)
      this.clearCache(newPath)
      if (node.parent) {
        const parentPath = node.path.substring(0, node.path.lastIndexOf('/'))
        this.clearCache(parentPath)
      }

      // 创建新节点对象
      const renamedNode: FileTreeNode = {
        ...node,
        id: generateNodeId(newPath),
        name: newName,
        path: newPath,
        lastModified: Date.now(),
      }

      notificationService.success(
        '重命名成功',
        `"${node.name}" 已重命名为 "${newName}"`
      )

      return renamedNode
    } catch (error) {
      ErrorHandler.handleWithNotification(error, '重命名文件')
      return null
    }
  }

  /**
   * 批量删除节点
   */
  async deleteMultipleNodes(nodes: FileTreeNode[]): Promise<{
    successful: FileTreeNode[]
    failed: Array<{ node: FileTreeNode; error: string }>
  }> {
    const successful: FileTreeNode[] = []
    const failed: Array<{ node: FileTreeNode; error: string }> = []

    // 并发执行删除操作
    const deletePromises = nodes.map(async node => {
      try {
        const success = await this.deleteNode(node)
        if (success) {
          successful.push(node)
        } else {
          failed.push({ node, error: '删除失败' })
        }
      } catch (error) {
        failed.push({
          node,
          error: error instanceof Error ? error.message : '未知错误',
        })
      }
    })

    await Promise.all(deletePromises)

    // 显示批量操作结果
    if (successful.length > 0) {
      notificationService.success(
        '批量删除完成',
        `成功删除 ${successful.length} 个项目`
      )
    }

    if (failed.length > 0) {
      notificationService.error(
        '部分删除失败',
        `${failed.length} 个项目删除失败`
      )
    }

    return { successful, failed }
  }

  /**
   * 复制节点路径到剪贴板
   */
  async copyNodePath(node: FileTreeNode): Promise<boolean> {
    try {
      const result = await fileOperationService.copyPathToClipboard(node.path)
      if (result.success) {
        notificationService.success('路径已复制', `已复制: ${node.path}`)
        return true
      } else {
        throw new Error(result.error || '复制失败')
      }
    } catch (error) {
      ErrorHandler.handleWithNotification(error, '复制路径')
      return false
    }
  }

  /**
   * 在文件管理器中显示节点
   */
  async showNodeInFileManager(node: FileTreeNode): Promise<boolean> {
    try {
      const result = await fileOperationService.showInFileManager(node.path)
      if (result.success) {
        notificationService.success('已打开', `在文件管理器中显示 ${node.name}`)
        return true
      } else {
        throw new Error(result.error || '打开失败')
      }
    } catch (error) {
      ErrorHandler.handleWithNotification(error, '打开文件管理器')
      return false
    }
  }

  /**
   * 搜索文件树节点
   */
  searchNodes(
    nodes: Record<string, FileTreeNode>,
    query: string,
    config: FileTreeConfig
  ): FileTreeNode[] {
    if (!query.trim()) {
      return []
    }

    const lowerQuery = query.toLowerCase()
    const results: FileTreeNode[] = []

    Object.values(nodes).forEach(node => {
      // 文件名匹配
      if (node.name.toLowerCase().includes(lowerQuery)) {
        results.push(node)
        return
      }

      // 路径匹配
      if (node.path.toLowerCase().includes(lowerQuery)) {
        results.push(node)
        return
      }

      // 文件扩展名匹配（仅对文件）
      if (node.type === 'file') {
        const extension = node.name.split('.').pop()?.toLowerCase()
        if (extension && extension.includes(lowerQuery)) {
          results.push(node)
        }
      }
    })

    // 按相关性排序
    return results.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().indexOf(lowerQuery)
      const bNameMatch = b.name.toLowerCase().indexOf(lowerQuery)

      // 文件名开头匹配优先
      if (aNameMatch === 0 && bNameMatch !== 0) return -1
      if (bNameMatch === 0 && aNameMatch !== 0) return 1

      // 文件名匹配优先于路径匹配
      if (aNameMatch !== -1 && bNameMatch === -1) return -1
      if (bNameMatch !== -1 && aNameMatch === -1) return 1

      // 按文件名字母顺序
      return a.name.localeCompare(b.name, 'zh-CN', { numeric: true })
    })
  }

  /**
   * 获取节点统计信息
   */
  getNodeStats(nodes: Record<string, FileTreeNode>): {
    totalFiles: number
    totalDirectories: number
    totalSize: number
    fileTypes: Record<string, number>
  } {
    let totalFiles = 0
    let totalDirectories = 0
    let totalSize = 0
    const fileTypes: Record<string, number> = {}

    Object.values(nodes).forEach(node => {
      if (node.type === 'file') {
        totalFiles++
        totalSize += node.size || 0

        // 统计文件类型
        const extension = node.name.split('.').pop()?.toLowerCase() || 'unknown'
        fileTypes[extension] = (fileTypes[extension] || 0) + 1
      } else {
        totalDirectories++
      }
    })

    return {
      totalFiles,
      totalDirectories,
      totalSize,
      fileTypes,
    }
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
  }

  /**
   * 格式化时间
   */
  formatTime(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // 小于1分钟
    if (diff < 60 * 1000) {
      return '刚刚'
    }

    // 小于1小时
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000))
      return `${minutes}分钟前`
    }

    // 小于1天
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      return `${hours}小时前`
    }

    // 小于1周
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      return `${days}天前`
    }

    // 显示具体日期
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
}

// 创建单例实例
export const fileTreeService = new FileTreeService()
