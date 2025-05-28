import { ipcMain } from 'electron'
import type {
  CreateFileRequest,
  DeleteRequest,
  RenameRequest,
  FileOperationResult,
} from '../../shared/types'
import { FileService } from '../services/fileService'

// 创建文件服务实例
const fileService = new FileService()

export const registerFileOperationHandlers = () => {
  // 创建文件
  ipcMain.handle(
    'file:create',
    async (event, request: CreateFileRequest): Promise<FileOperationResult> => {
      const { parentPath, fileName, isDirectory } = request

      if (isDirectory) {
        return await fileService.createDirectory(parentPath, fileName)
      } else {
        return await fileService.createFile(parentPath, fileName)
      }
    }
  )

  // 删除文件/文件夹
  ipcMain.handle(
    'file:delete',
    async (event, request: DeleteRequest): Promise<FileOperationResult> => {
      return await fileService.deleteItem(request.path)
    }
  )

  // 重命名文件/文件夹
  ipcMain.handle(
    'file:rename',
    async (event, request: RenameRequest): Promise<FileOperationResult> => {
      return await fileService.renameItem(request.oldPath, request.newPath)
    }
  )

  // 复制路径到剪贴板
  ipcMain.handle(
    'file:copy-path',
    async (event, path: string): Promise<FileOperationResult> => {
      return await fileService.copyPathToClipboard(path)
    }
  )

  // 在文件管理器中显示
  ipcMain.handle(
    'file:show-in-explorer',
    async (event, path: string): Promise<FileOperationResult> => {
      return await fileService.showInFileManager(path)
    }
  )

  // 检查文件是否存在
  ipcMain.handle(
    'file:exists',
    async (event, path: string): Promise<boolean> => {
      return await fileService.exists(path)
    }
  )

  // 获取文件信息
  ipcMain.handle(
    'file:get-info',
    async (event, path: string): Promise<FileOperationResult> => {
      return await fileService.getItemInfo(path)
    }
  )
}

export const unregisterFileOperationHandlers = () => {
  // 清理所有文件操作相关的 IPC 处理器
  const handlers = [
    'file:create',
    'file:delete',
    'file:rename',
    'file:copy-path',
    'file:show-in-explorer',
    'file:exists',
    'file:get-info',
  ]

  handlers.forEach(handler => {
    ipcMain.removeAllListeners(handler)
  })
}
