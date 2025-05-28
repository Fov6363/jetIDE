import * as fs from 'fs/promises'
import * as path from 'path'
import { shell, clipboard } from 'electron'
import type { FileOperationResult } from '../../shared/types'
import {
  checkPermissions,
  checkFileExists,
  isDirectory,
} from '../utils/permissions'

export class FileService {
  /**
   * 创建文件
   */
  async createFile(
    parentPath: string,
    fileName: string
  ): Promise<FileOperationResult> {
    try {
      // 验证父目录权限
      const parentPermission = await checkPermissions(parentPath, 'write')
      if (!parentPermission.hasPermission) {
        return { success: false, error: parentPermission.error }
      }

      const fullPath = path.join(parentPath, fileName)

      // 检查文件是否已存在
      if (await checkFileExists(fullPath)) {
        return { success: false, error: '文件已存在' }
      }

      // 创建文件
      await fs.writeFile(fullPath, '', 'utf8')

      return { success: true, data: { path: fullPath } }
    } catch (error) {
      return {
        success: false,
        error: `创建文件失败: ${error instanceof Error ? error.message : '未知错误'}`,
      }
    }
  }

  /**
   * 创建文件夹
   */
  async createDirectory(
    parentPath: string,
    dirName: string
  ): Promise<FileOperationResult> {
    try {
      // 验证父目录权限
      const parentPermission = await checkPermissions(parentPath, 'write')
      if (!parentPermission.hasPermission) {
        return { success: false, error: parentPermission.error }
      }

      const fullPath = path.join(parentPath, dirName)

      // 检查目录是否已存在
      if (await checkFileExists(fullPath)) {
        return { success: false, error: '文件夹已存在' }
      }

      // 创建目录
      await fs.mkdir(fullPath, { recursive: true })

      return { success: true, data: { path: fullPath } }
    } catch (error) {
      return {
        success: false,
        error: `创建文件夹失败: ${error instanceof Error ? error.message : '未知错误'}`,
      }
    }
  }

  /**
   * 删除文件或文件夹
   */
  async deleteItem(itemPath: string): Promise<FileOperationResult> {
    try {
      // 检查文件/目录是否存在
      if (!(await checkFileExists(itemPath))) {
        return { success: false, error: '文件或文件夹不存在' }
      }

      // 验证删除权限
      const deletePermission = await checkPermissions(itemPath, 'delete')
      if (!deletePermission.hasPermission) {
        return { success: false, error: deletePermission.error }
      }

      // 判断是文件还是目录
      const isDir = await isDirectory(itemPath)

      if (isDir) {
        // 删除目录（递归删除）
        await fs.rmdir(itemPath, { recursive: true })
      } else {
        // 删除文件
        await fs.unlink(itemPath)
      }

      return {
        success: true,
        data: { deletedPath: itemPath, isDirectory: isDir },
      }
    } catch (error) {
      return {
        success: false,
        error: `删除失败: ${error instanceof Error ? error.message : '未知错误'}`,
      }
    }
  }

  /**
   * 重命名文件或文件夹
   */
  async renameItem(
    oldPath: string,
    newPath: string
  ): Promise<FileOperationResult> {
    try {
      // 检查源文件是否存在
      if (!(await checkFileExists(oldPath))) {
        return { success: false, error: '源文件不存在' }
      }

      // 检查目标文件是否已存在
      if (await checkFileExists(newPath)) {
        return { success: false, error: '目标文件已存在' }
      }

      // 验证源文件的写权限（重命名需要写权限）
      const sourcePermission = await checkPermissions(oldPath, 'write')
      if (!sourcePermission.hasPermission) {
        return { success: false, error: sourcePermission.error }
      }

      // 验证目标目录的写权限
      const targetDir = path.dirname(newPath)
      const targetPermission = await checkPermissions(targetDir, 'write')
      if (!targetPermission.hasPermission) {
        return { success: false, error: `目标目录${targetPermission.error}` }
      }

      // 执行重命名
      await fs.rename(oldPath, newPath)

      return { success: true, data: { oldPath, newPath } }
    } catch (error) {
      return {
        success: false,
        error: `重命名失败: ${error instanceof Error ? error.message : '未知错误'}`,
      }
    }
  }

  /**
   * 复制文件路径到剪贴板
   */
  async copyPathToClipboard(itemPath: string): Promise<FileOperationResult> {
    try {
      // 检查文件是否存在
      if (!(await checkFileExists(itemPath))) {
        return { success: false, error: '文件或文件夹不存在' }
      }

      // 复制到剪贴板
      clipboard.writeText(itemPath)

      return { success: true, data: { copiedPath: itemPath } }
    } catch (error) {
      return {
        success: false,
        error: `复制路径失败: ${error instanceof Error ? error.message : '未知错误'}`,
      }
    }
  }

  /**
   * 在系统文件管理器中显示文件
   */
  async showInFileManager(itemPath: string): Promise<FileOperationResult> {
    try {
      // 检查文件是否存在
      if (!(await checkFileExists(itemPath))) {
        return { success: false, error: '文件或文件夹不存在' }
      }

      // 在文件管理器中显示
      shell.showItemInFolder(itemPath)

      return { success: true, data: { shownPath: itemPath } }
    } catch (error) {
      return {
        success: false,
        error: `打开文件管理器失败: ${error instanceof Error ? error.message : '未知错误'}`,
      }
    }
  }

  /**
   * 检查文件是否存在（公共方法）
   */
  async exists(filePath: string): Promise<boolean> {
    return checkFileExists(filePath)
  }

  /**
   * 获取文件/目录信息
   */
  async getItemInfo(itemPath: string): Promise<FileOperationResult> {
    try {
      if (!(await checkFileExists(itemPath))) {
        return { success: false, error: '文件或文件夹不存在' }
      }

      const stats = await fs.stat(itemPath)
      const isDir = stats.isDirectory()

      return {
        success: true,
        data: {
          path: itemPath,
          name: path.basename(itemPath),
          isDirectory: isDir,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          accessed: stats.atime,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `获取文件信息失败: ${error instanceof Error ? error.message : '未知错误'}`,
      }
    }
  }
}
