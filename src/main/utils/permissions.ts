import * as fs from 'fs/promises'
import * as path from 'path'

export const checkPermissions = async (
  filePath: string,
  operation: 'read' | 'write' | 'delete'
): Promise<{ hasPermission: boolean; error?: string }> => {
  try {
    // 检查文件/目录是否存在
    await fs.access(filePath, fs.constants.F_OK)

    switch (operation) {
      case 'read':
        await fs.access(filePath, fs.constants.R_OK)
        break
      case 'write':
        await fs.access(filePath, fs.constants.W_OK)
        break
      case 'delete':
        // 删除操作需要检查父目录的写权限
        const parentDir = path.dirname(filePath)
        await fs.access(parentDir, fs.constants.W_OK)
        break
    }

    return { hasPermission: true }
  } catch (error) {
    const operationText = {
      read: '读取',
      write: '写入',
      delete: '删除',
    }[operation]

    return {
      hasPermission: false,
      error: `没有${operationText}权限`,
    }
  }
}

export const checkFileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

export const isDirectory = async (filePath: string): Promise<boolean> => {
  try {
    const stats = await fs.stat(filePath)
    return stats.isDirectory()
  } catch {
    return false
  }
}
