import * as fs from 'fs/promises'
import * as path from 'path'
import { FileService } from '../services/fileService'

// Mock electron modules
jest.mock('electron', () => ({
  shell: {
    showItemInFolder: jest.fn(),
  },
  clipboard: {
    writeText: jest.fn(),
  },
}))

describe('FileService', () => {
  let fileService: FileService
  let testDir: string

  beforeEach(async () => {
    fileService = new FileService()
    testDir = path.join(__dirname, 'test-files')

    // 创建测试目录
    try {
      await fs.mkdir(testDir, { recursive: true })
    } catch (error) {
      // 目录可能已存在
    }
  })

  afterEach(async () => {
    // 清理测试文件
    try {
      await fs.rmdir(testDir, { recursive: true })
    } catch (error) {
      // 目录可能不存在
    }
  })

  describe('createFile', () => {
    it('应该成功创建文件', async () => {
      const fileName = 'test.txt'
      const result = await fileService.createFile(testDir, fileName)

      expect(result.success).toBe(true)
      expect(result.data?.path).toBe(path.join(testDir, fileName))

      // 验证文件确实被创建
      const exists = await fileService.exists(path.join(testDir, fileName))
      expect(exists).toBe(true)
    })

    it('应该拒绝创建已存在的文件', async () => {
      const fileName = 'existing.txt'
      const filePath = path.join(testDir, fileName)

      // 先创建文件
      await fs.writeFile(filePath, 'content')

      const result = await fileService.createFile(testDir, fileName)

      expect(result.success).toBe(false)
      expect(result.error).toBe('文件已存在')
    })
  })

  describe('createDirectory', () => {
    it('应该成功创建目录', async () => {
      const dirName = 'test-dir'
      const result = await fileService.createDirectory(testDir, dirName)

      expect(result.success).toBe(true)
      expect(result.data?.path).toBe(path.join(testDir, dirName))

      // 验证目录确实被创建
      const exists = await fileService.exists(path.join(testDir, dirName))
      expect(exists).toBe(true)
    })
  })

  describe('deleteItem', () => {
    it('应该成功删除文件', async () => {
      const fileName = 'to-delete.txt'
      const filePath = path.join(testDir, fileName)

      // 先创建文件
      await fs.writeFile(filePath, 'content')

      const result = await fileService.deleteItem(filePath)

      expect(result.success).toBe(true)
      expect(result.data?.deletedPath).toBe(filePath)
      expect(result.data?.isDirectory).toBe(false)

      // 验证文件确实被删除
      const exists = await fileService.exists(filePath)
      expect(exists).toBe(false)
    })

    it('应该拒绝删除不存在的文件', async () => {
      const nonExistentPath = path.join(testDir, 'non-existent.txt')
      const result = await fileService.deleteItem(nonExistentPath)

      expect(result.success).toBe(false)
      expect(result.error).toBe('文件或文件夹不存在')
    })
  })

  describe('renameItem', () => {
    it('应该成功重命名文件', async () => {
      const oldName = 'old-name.txt'
      const newName = 'new-name.txt'
      const oldPath = path.join(testDir, oldName)
      const newPath = path.join(testDir, newName)

      // 先创建文件
      await fs.writeFile(oldPath, 'content')

      const result = await fileService.renameItem(oldPath, newPath)

      expect(result.success).toBe(true)
      expect(result.data?.oldPath).toBe(oldPath)
      expect(result.data?.newPath).toBe(newPath)

      // 验证重命名成功
      const oldExists = await fileService.exists(oldPath)
      const newExists = await fileService.exists(newPath)
      expect(oldExists).toBe(false)
      expect(newExists).toBe(true)
    })
  })

  describe('getItemInfo', () => {
    it('应该返回文件信息', async () => {
      const fileName = 'info-test.txt'
      const filePath = path.join(testDir, fileName)

      // 先创建文件
      await fs.writeFile(filePath, 'content')

      const result = await fileService.getItemInfo(filePath)

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe(fileName)
      expect(result.data?.path).toBe(filePath)
      expect(result.data?.isDirectory).toBe(false)
      expect(typeof result.data?.size).toBe('number')
    })
  })
})
