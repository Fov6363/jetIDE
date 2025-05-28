import type {
  CreateFileRequest,
  DeleteRequest,
  RenameRequest,
  FileOperationResult,
  FileSystemItem,
} from '@/shared/types'

/**
 * 文件操作服务类
 * 封装与主进程的 IPC 通信，提供错误处理和重试机制
 */
export class FileOperationService {
  private maxRetries = 3
  private retryDelay = 1000 // 1秒

  /**
   * 检查 Electron API 是否可用
   */
  private checkElectronAPI(): void {
    if (!window.electronAPI?.fileOperations) {
      throw new Error('Electron API 不可用，请确保应用在 Electron 环境中运行')
    }
  }

  /**
   * 通用重试机制
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt === this.maxRetries) {
          throw new Error(
            `${operationName}失败，已重试 ${this.maxRetries} 次: ${lastError.message}`
          )
        }

        // 等待后重试
        await new Promise(resolve =>
          setTimeout(resolve, this.retryDelay * attempt)
        )
      }
    }

    throw lastError
  }

  /**
   * 创建文件或文件夹
   */
  async createItem(request: CreateFileRequest): Promise<FileOperationResult> {
    this.checkElectronAPI()

    return this.withRetry(async () => {
      const result = await window.electronAPI.fileOperations.create(request)

      if (!result.success && result.error) {
        throw new Error(result.error)
      }

      return result
    }, '创建文件')
  }

  /**
   * 创建文件
   */
  async createFile(
    parentPath: string,
    fileName: string
  ): Promise<FileOperationResult> {
    return this.createItem({
      parentPath,
      fileName,
      isDirectory: false,
    })
  }

  /**
   * 创建文件夹
   */
  async createDirectory(
    parentPath: string,
    dirName: string
  ): Promise<FileOperationResult> {
    return this.createItem({
      parentPath,
      fileName: dirName,
      isDirectory: true,
    })
  }

  /**
   * 删除文件或文件夹
   */
  async deleteItem(
    path: string,
    isDirectory: boolean = false
  ): Promise<FileOperationResult> {
    this.checkElectronAPI()

    return this.withRetry(async () => {
      const result = await window.electronAPI.fileOperations.delete({
        path,
        isDirectory,
      })

      if (!result.success && result.error) {
        throw new Error(result.error)
      }

      return result
    }, '删除文件')
  }

  /**
   * 重命名文件或文件夹
   */
  async renameItem(
    oldPath: string,
    newPath: string
  ): Promise<FileOperationResult> {
    this.checkElectronAPI()

    return this.withRetry(async () => {
      const result = await window.electronAPI.fileOperations.rename({
        oldPath,
        newPath,
      })

      if (!result.success && result.error) {
        throw new Error(result.error)
      }

      return result
    }, '重命名文件')
  }

  /**
   * 复制文件路径到剪贴板
   */
  async copyPathToClipboard(path: string): Promise<FileOperationResult> {
    this.checkElectronAPI()

    return this.withRetry(async () => {
      const result = await window.electronAPI.fileOperations.copyPath(path)

      if (!result.success && result.error) {
        throw new Error(result.error)
      }

      return result
    }, '复制路径')
  }

  /**
   * 在系统文件管理器中显示文件
   */
  async showInFileManager(path: string): Promise<FileOperationResult> {
    this.checkElectronAPI()

    return this.withRetry(async () => {
      const result =
        await window.electronAPI.fileOperations.showInExplorer(path)

      if (!result.success && result.error) {
        throw new Error(result.error)
      }

      return result
    }, '打开文件管理器')
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(path: string): Promise<boolean> {
    this.checkElectronAPI()

    return this.withRetry(async () => {
      return await window.electronAPI.fileOperations.exists(path)
    }, '检查文件存在性')
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(path: string): Promise<FileOperationResult> {
    this.checkElectronAPI()

    return this.withRetry(async () => {
      const result = await window.electronAPI.fileOperations.getInfo(path)

      if (!result.success && result.error) {
        throw new Error(result.error)
      }

      return result
    }, '获取文件信息')
  }

  /**
   * 批量操作：删除多个文件
   */
  async deleteMultipleItems(paths: string[]): Promise<{
    successful: string[]
    failed: Array<{ path: string; error: string }>
  }> {
    const successful: string[] = []
    const failed: Array<{ path: string; error: string }> = []

    // 并发执行删除操作
    const deletePromises = paths.map(async path => {
      try {
        const result = await this.deleteItem(path)
        if (result.success) {
          successful.push(path)
        } else {
          failed.push({ path, error: result.error || '未知错误' })
        }
      } catch (error) {
        failed.push({
          path,
          error: error instanceof Error ? error.message : '未知错误',
        })
      }
    })

    await Promise.all(deletePromises)

    return { successful, failed }
  }

  /**
   * 验证文件名是否合法
   */
  validateFileName(fileName: string): { valid: boolean; error?: string } {
    if (!fileName || fileName.trim() === '') {
      return { valid: false, error: '文件名不能为空' }
    }

    // 检查非法字符
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(fileName)) {
      return { valid: false, error: '文件名包含非法字符: < > : " / \\ | ? *' }
    }

    // 检查保留名称 (Windows)
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
    if (reservedNames.test(fileName)) {
      return { valid: false, error: '文件名不能使用系统保留名称' }
    }

    // 检查长度
    if (fileName.length > 255) {
      return { valid: false, error: '文件名过长，最多255个字符' }
    }

    return { valid: true }
  }

  /**
   * 生成唯一文件名（如果文件已存在）
   */
  async generateUniqueFileName(
    parentPath: string,
    baseName: string,
    extension: string = ''
  ): Promise<string> {
    let counter = 1
    let fileName = baseName + extension

    while (await this.fileExists(`${parentPath}/${fileName}`)) {
      fileName = `${baseName} (${counter})${extension}`
      counter++
    }

    return fileName
  }

  async readDirectory(path: string): Promise<FileSystemItem[]> {
    this.checkElectronAPI()

    return this.withRetry(async () => {
      return await window.electronAPI.fileSystem.readDirectory(path)
    }, '读取目录')
  }
}

// 创建单例实例
export const fileOperationService = new FileOperationService()
