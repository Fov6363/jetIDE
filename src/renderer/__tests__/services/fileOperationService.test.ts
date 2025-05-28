import { FileOperationService } from '../../services/fileOperationService'

// Mock window.electronAPI
const mockElectronAPI = {
  fileOperations: {
    create: jest.fn(),
    delete: jest.fn(),
    rename: jest.fn(),
    copyPath: jest.fn(),
    showInExplorer: jest.fn(),
    exists: jest.fn(),
    getInfo: jest.fn(),
  },
}

// 设置全局 mock
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
})

describe('FileOperationService', () => {
  let service: FileOperationService

  beforeEach(() => {
    service = new FileOperationService()
    jest.clearAllMocks()
  })

  describe('createFile', () => {
    it('应该成功创建文件', async () => {
      const mockResult = { success: true, path: '/test/file.txt' }
      mockElectronAPI.fileOperations.create.mockResolvedValue(mockResult)

      const result = await service.createFile('/test', 'file.txt')

      expect(mockElectronAPI.fileOperations.create).toHaveBeenCalledWith({
        parentPath: '/test',
        fileName: 'file.txt',
        isDirectory: false,
      })
      expect(result).toEqual(mockResult)
    })

    it('应该处理创建文件失败的情况', async () => {
      const mockResult = { success: false, error: '权限不足' }
      mockElectronAPI.fileOperations.create.mockResolvedValue(mockResult)

      await expect(service.createFile('/test', 'file.txt')).rejects.toThrow(
        '权限不足'
      )
    })
  })

  describe('createDirectory', () => {
    it('应该成功创建文件夹', async () => {
      const mockResult = { success: true, path: '/test/folder' }
      mockElectronAPI.fileOperations.create.mockResolvedValue(mockResult)

      const result = await service.createDirectory('/test', 'folder')

      expect(mockElectronAPI.fileOperations.create).toHaveBeenCalledWith({
        parentPath: '/test',
        fileName: 'folder',
        isDirectory: true,
      })
      expect(result).toEqual(mockResult)
    })
  })

  describe('deleteItem', () => {
    it('应该成功删除文件', async () => {
      const mockResult = { success: true }
      mockElectronAPI.fileOperations.delete.mockResolvedValue(mockResult)

      const result = await service.deleteItem('/test/file.txt')

      expect(mockElectronAPI.fileOperations.delete).toHaveBeenCalledWith({
        path: '/test/file.txt',
        isDirectory: false,
      })
      expect(result).toEqual(mockResult)
    })
  })

  describe('renameItem', () => {
    it('应该成功重命名文件', async () => {
      const mockResult = { success: true }
      mockElectronAPI.fileOperations.rename.mockResolvedValue(mockResult)

      const result = await service.renameItem('/test/old.txt', '/test/new.txt')

      expect(mockElectronAPI.fileOperations.rename).toHaveBeenCalledWith({
        oldPath: '/test/old.txt',
        newPath: '/test/new.txt',
      })
      expect(result).toEqual(mockResult)
    })
  })

  describe('fileExists', () => {
    it('应该检查文件是否存在', async () => {
      mockElectronAPI.fileOperations.exists.mockResolvedValue(true)

      const result = await service.fileExists('/test/file.txt')

      expect(mockElectronAPI.fileOperations.exists).toHaveBeenCalledWith(
        '/test/file.txt'
      )
      expect(result).toBe(true)
    })
  })

  describe('validateFileName', () => {
    it('应该验证合法的文件名', () => {
      const result = service.validateFileName('valid-file.txt')
      expect(result.valid).toBe(true)
    })

    it('应该拒绝空文件名', () => {
      const result = service.validateFileName('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('文件名不能为空')
    })

    it('应该拒绝包含非法字符的文件名', () => {
      const result = service.validateFileName('file<name>.txt')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('非法字符')
    })

    it('应该拒绝系统保留名称', () => {
      const result = service.validateFileName('CON')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('保留名称')
    })

    it('应该拒绝过长的文件名', () => {
      const longName = 'a'.repeat(256)
      const result = service.validateFileName(longName)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('过长')
    })
  })

  describe('generateUniqueFileName', () => {
    it('应该生成唯一文件名', async () => {
      // 第一次检查文件存在
      mockElectronAPI.fileOperations.exists
        .mockResolvedValueOnce(true) // file.txt 存在
        .mockResolvedValueOnce(false) // file (1).txt 不存在

      const result = await service.generateUniqueFileName(
        '/test',
        'file',
        '.txt'
      )

      expect(result).toBe('file (1).txt')
      expect(mockElectronAPI.fileOperations.exists).toHaveBeenCalledTimes(2)
    })
  })

  describe('deleteMultipleItems', () => {
    it('应该批量删除文件', async () => {
      const paths = ['/test/file1.txt', '/test/file2.txt']

      mockElectronAPI.fileOperations.delete
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: '权限不足' })

      const result = await service.deleteMultipleItems(paths)

      expect(result.successful).toEqual(['/test/file1.txt'])
      expect(result.failed).toEqual([
        { path: '/test/file2.txt', error: '权限不足' },
      ])
    })
  })

  describe('重试机制', () => {
    it('应该在失败时重试操作', async () => {
      mockElectronAPI.fileOperations.create
        .mockRejectedValueOnce(new Error('临时错误'))
        .mockRejectedValueOnce(new Error('临时错误'))
        .mockResolvedValueOnce({ success: true, path: '/test/file.txt' })

      const result = await service.createFile('/test', 'file.txt')

      expect(mockElectronAPI.fileOperations.create).toHaveBeenCalledTimes(3)
      expect(result.success).toBe(true)
    })

    it('应该在达到最大重试次数后抛出错误', async () => {
      mockElectronAPI.fileOperations.create.mockRejectedValue(
        new Error('持续错误')
      )

      await expect(service.createFile('/test', 'file.txt')).rejects.toThrow(
        '创建文件失败，已重试 3 次'
      )
    })
  })

  describe('Electron API 不可用', () => {
    it('应该在 Electron API 不可用时抛出错误', async () => {
      // 临时移除 electronAPI
      const originalAPI = window.electronAPI
      delete (window as any).electronAPI

      await expect(service.createFile('/test', 'file.txt')).rejects.toThrow(
        'Electron API 不可用'
      )

      // 恢复 API
      window.electronAPI = originalAPI
    })
  })
})
