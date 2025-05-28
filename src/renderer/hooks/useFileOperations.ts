import { useState, useCallback } from 'react'
import { fileOperationService } from '../services/fileOperationService'
import { notificationService } from '../services/notificationService'
import type { FileOperationResult } from '@/shared/types'

/**
 * 操作状态类型
 */
export interface OperationState {
  loading: boolean
  error: string | null
  success: boolean
}

/**
 * 文件操作结果类型
 */
export interface FileOperationHookResult<T = any> {
  data: T | null
  loading: boolean
  error: string | null
  success: boolean
}

/**
 * 文件操作 Hook
 * 提供加载状态管理、错误处理和成功反馈
 */
export const useFileOperations = () => {
  const [operationStates, setOperationStates] = useState<
    Record<string, OperationState>
  >({})

  /**
   * 更新操作状态
   */
  const updateOperationState = useCallback(
    (operationId: string, state: Partial<OperationState>) => {
      setOperationStates(prev => ({
        ...prev,
        [operationId]: { ...prev[operationId], ...state },
      }))
    },
    []
  )

  /**
   * 获取操作状态
   */
  const getOperationState = useCallback(
    (operationId: string): OperationState => {
      return (
        operationStates[operationId] || {
          loading: false,
          error: null,
          success: false,
        }
      )
    },
    [operationStates]
  )

  /**
   * 通用操作执行器
   */
  const executeOperation = useCallback(
    async <T>(
      operationId: string,
      operation: () => Promise<T>,
      successMessage?: string,
      showNotification: boolean = true
    ): Promise<FileOperationHookResult<T>> => {
      // 开始操作
      updateOperationState(operationId, {
        loading: true,
        error: null,
        success: false,
      })

      try {
        const result = await operation()

        // 操作成功
        updateOperationState(operationId, {
          loading: false,
          error: null,
          success: true,
        })

        // 显示成功通知
        if (showNotification && successMessage) {
          notificationService.success(successMessage)
        }

        return {
          data: result,
          loading: false,
          error: null,
          success: true,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '操作失败'

        // 操作失败
        updateOperationState(operationId, {
          loading: false,
          error: errorMessage,
          success: false,
        })

        // 显示错误通知
        if (showNotification) {
          notificationService.error('操作失败', errorMessage)
        }

        return {
          data: null,
          loading: false,
          error: errorMessage,
          success: false,
        }
      }
    },
    [updateOperationState]
  )

  /**
   * 创建文件
   */
  const createFile = useCallback(
    async (
      parentPath: string,
      fileName: string,
      showNotification: boolean = true
    ): Promise<FileOperationHookResult<FileOperationResult>> => {
      const operationId = `create-file-${Date.now()}`

      return executeOperation(
        operationId,
        () => fileOperationService.createFile(parentPath, fileName),
        `文件 "${fileName}" 创建成功`,
        showNotification
      )
    },
    [executeOperation]
  )

  /**
   * 创建文件夹
   */
  const createDirectory = useCallback(
    async (
      parentPath: string,
      dirName: string,
      showNotification: boolean = true
    ): Promise<FileOperationHookResult<FileOperationResult>> => {
      const operationId = `create-dir-${Date.now()}`

      return executeOperation(
        operationId,
        () => fileOperationService.createDirectory(parentPath, dirName),
        `文件夹 "${dirName}" 创建成功`,
        showNotification
      )
    },
    [executeOperation]
  )

  /**
   * 删除文件或文件夹
   */
  const deleteItem = useCallback(
    async (
      path: string,
      isDirectory: boolean = false,
      showNotification: boolean = true
    ): Promise<FileOperationHookResult<FileOperationResult>> => {
      const operationId = `delete-${Date.now()}`
      const itemType = isDirectory ? '文件夹' : '文件'
      const fileName = path.split('/').pop() || path

      return executeOperation(
        operationId,
        () => fileOperationService.deleteItem(path, isDirectory),
        `${itemType} "${fileName}" 删除成功`,
        showNotification
      )
    },
    [executeOperation]
  )

  /**
   * 重命名文件或文件夹
   */
  const renameItem = useCallback(
    async (
      oldPath: string,
      newPath: string,
      showNotification: boolean = true
    ): Promise<FileOperationHookResult<FileOperationResult>> => {
      const operationId = `rename-${Date.now()}`
      const oldName = oldPath.split('/').pop() || oldPath
      const newName = newPath.split('/').pop() || newPath

      return executeOperation(
        operationId,
        () => fileOperationService.renameItem(oldPath, newPath),
        `"${oldName}" 重命名为 "${newName}" 成功`,
        showNotification
      )
    },
    [executeOperation]
  )

  /**
   * 复制路径到剪贴板
   */
  const copyPathToClipboard = useCallback(
    async (
      path: string,
      showNotification: boolean = true
    ): Promise<FileOperationHookResult<FileOperationResult>> => {
      const operationId = `copy-path-${Date.now()}`

      return executeOperation(
        operationId,
        () => fileOperationService.copyPathToClipboard(path),
        '路径已复制到剪贴板',
        showNotification
      )
    },
    [executeOperation]
  )

  /**
   * 在文件管理器中显示
   */
  const showInFileManager = useCallback(
    async (
      path: string,
      showNotification: boolean = true
    ): Promise<FileOperationHookResult<FileOperationResult>> => {
      const operationId = `show-in-explorer-${Date.now()}`

      return executeOperation(
        operationId,
        () => fileOperationService.showInFileManager(path),
        '已在文件管理器中打开',
        showNotification
      )
    },
    [executeOperation]
  )

  /**
   * 检查文件是否存在
   */
  const checkFileExists = useCallback(
    async (
      path: string,
      showNotification: boolean = false
    ): Promise<FileOperationHookResult<boolean>> => {
      const operationId = `check-exists-${Date.now()}`

      return executeOperation(
        operationId,
        () => fileOperationService.fileExists(path),
        undefined,
        showNotification
      )
    },
    [executeOperation]
  )

  /**
   * 获取文件信息
   */
  const getFileInfo = useCallback(
    async (
      path: string,
      showNotification: boolean = false
    ): Promise<FileOperationHookResult<FileOperationResult>> => {
      const operationId = `get-info-${Date.now()}`

      return executeOperation(
        operationId,
        () => fileOperationService.getFileInfo(path),
        undefined,
        showNotification
      )
    },
    [executeOperation]
  )

  /**
   * 批量删除文件
   */
  const deleteMultipleItems = useCallback(
    async (
      paths: string[],
      showNotification: boolean = true
    ): Promise<
      FileOperationHookResult<{
        successful: string[]
        failed: Array<{ path: string; error: string }>
      }>
    > => {
      const operationId = `batch-delete-${Date.now()}`

      return executeOperation(
        operationId,
        async () => {
          const result = await fileOperationService.deleteMultipleItems(paths)

          // 显示详细的批量操作结果
          if (showNotification) {
            if (result.successful.length > 0) {
              notificationService.success(
                `成功删除 ${result.successful.length} 个项目`,
                result.successful.length < 5
                  ? result.successful.map(p => p.split('/').pop()).join(', ')
                  : `包括 ${result.successful[0].split('/').pop()} 等`
              )
            }

            if (result.failed.length > 0) {
              notificationService.error(
                `${result.failed.length} 个项目删除失败`,
                result.failed[0].error
              )
            }
          }

          return result
        },
        undefined,
        false // 不使用默认通知，因为我们自定义了通知
      )
    },
    [executeOperation]
  )

  /**
   * 验证文件名
   */
  const validateFileName = useCallback((fileName: string) => {
    return fileOperationService.validateFileName(fileName)
  }, [])

  /**
   * 生成唯一文件名
   */
  const generateUniqueFileName = useCallback(
    async (
      parentPath: string,
      baseName: string,
      extension: string = '',
      showNotification: boolean = false
    ): Promise<FileOperationHookResult<string>> => {
      const operationId = `generate-unique-name-${Date.now()}`

      return executeOperation(
        operationId,
        () =>
          fileOperationService.generateUniqueFileName(
            parentPath,
            baseName,
            extension
          ),
        undefined,
        showNotification
      )
    },
    [executeOperation]
  )

  /**
   * 清除操作状态
   */
  const clearOperationState = useCallback((operationId: string) => {
    setOperationStates(prev => {
      const newStates = { ...prev }
      delete newStates[operationId]
      return newStates
    })
  }, [])

  /**
   * 清除所有操作状态
   */
  const clearAllOperationStates = useCallback(() => {
    setOperationStates({})
  }, [])

  return {
    // 操作方法
    createFile,
    createDirectory,
    deleteItem,
    renameItem,
    copyPathToClipboard,
    showInFileManager,
    checkFileExists,
    getFileInfo,
    deleteMultipleItems,

    // 工具方法
    validateFileName,
    generateUniqueFileName,

    // 状态管理
    getOperationState,
    clearOperationState,
    clearAllOperationStates,

    // 所有操作状态
    operationStates,
  }
}
