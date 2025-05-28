import { ipcMain } from 'electron'
import { readdir, stat, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { FileSystemItem } from '../../shared/types'

// 注册文件系统相关的 IPC 处理器
export const registerFileSystemHandlers = (): void => {
  // 读取目录
  ipcMain.handle(
    'read-directory',
    async (_, dirPath: string): Promise<FileSystemItem[]> => {
      try {
        const items = await readdir(dirPath)
        const result: FileSystemItem[] = []

        for (const item of items) {
          // 跳过隐藏文件和系统文件
          if (item.startsWith('.') && !item.startsWith('.git')) {
            continue
          }

          const fullPath = join(dirPath, item)
          try {
            const stats = await stat(fullPath)
            result.push({
              name: item,
              path: fullPath,
              isDirectory: stats.isDirectory(),
              size: stats.size,
              modified: stats.mtime,
            })
          } catch (error) {
            // 跳过无法访问的文件
            console.warn(`Cannot access ${fullPath}:`, error)
            continue
          }
        }

        // 排序：文件夹在前，然后按名称排序
        result.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1
          if (!a.isDirectory && b.isDirectory) return 1
          return a.name.localeCompare(b.name, undefined, { numeric: true })
        })

        return result
      } catch (error) {
        console.error('Failed to read directory:', error)
        throw new Error(`Failed to read directory: ${error}`)
      }
    }
  )

  // 读取文件内容
  ipcMain.handle('read-file', async (_, filePath: string): Promise<string> => {
    try {
      const content = await readFile(filePath, 'utf-8')
      return content
    } catch (error) {
      console.error('Failed to read file:', error)
      throw new Error(`Failed to read file: ${error}`)
    }
  })

  // 写入文件内容
  ipcMain.handle(
    'write-file',
    async (_, filePath: string, content: string): Promise<boolean> => {
      try {
        await writeFile(filePath, content, 'utf-8')
        return true
      } catch (error) {
        console.error('Failed to write file:', error)
        throw new Error(`Failed to write file: ${error}`)
      }
    }
  )

  // 检查文件是否存在
  ipcMain.handle(
    'file-exists',
    async (_, filePath: string): Promise<boolean> => {
      try {
        await stat(filePath)
        return true
      } catch {
        return false
      }
    }
  )

  // 获取文件信息
  ipcMain.handle(
    'get-file-info',
    async (_, filePath: string): Promise<FileSystemItem | null> => {
      try {
        const stats = await stat(filePath)
        const name =
          filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown'

        return {
          name,
          path: filePath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime,
        }
      } catch (error) {
        console.error('Failed to get file info:', error)
        return null
      }
    }
  )
}

// 注销文件系统相关的 IPC 处理器
export const unregisterFileSystemHandlers = (): void => {
  ipcMain.removeHandler('read-directory')
  ipcMain.removeHandler('read-file')
  ipcMain.removeHandler('write-file')
  ipcMain.removeHandler('file-exists')
  ipcMain.removeHandler('get-file-info')
}
