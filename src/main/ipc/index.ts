import {
  registerFileOperationHandlers,
  unregisterFileOperationHandlers,
} from './fileOperations'
import {
  registerFileSystemHandlers,
  unregisterFileSystemHandlers,
} from './fileSystem'

/**
 * 注册所有 IPC 处理器
 */
export const registerAllIpcHandlers = (): void => {
  console.log('Registering IPC handlers...')

  try {
    // 注册文件操作处理器
    registerFileOperationHandlers()
    console.log('✓ File operation handlers registered')

    // 注册文件系统处理器
    registerFileSystemHandlers()
    console.log('✓ File system handlers registered')

    console.log('All IPC handlers registered successfully')
  } catch (error) {
    console.error('Failed to register IPC handlers:', error)
    throw error
  }
}

/**
 * 注销所有 IPC 处理器
 */
export const unregisterAllIpcHandlers = (): void => {
  console.log('Unregistering IPC handlers...')

  try {
    // 注销文件操作处理器
    unregisterFileOperationHandlers()
    console.log('✓ File operation handlers unregistered')

    // 注销文件系统处理器
    unregisterFileSystemHandlers()
    console.log('✓ File system handlers unregistered')

    console.log('All IPC handlers unregistered successfully')
  } catch (error) {
    console.error('Failed to unregister IPC handlers:', error)
  }
}

/**
 * 重新加载所有 IPC 处理器
 */
export const reloadAllIpcHandlers = (): void => {
  console.log('Reloading IPC handlers...')
  unregisterAllIpcHandlers()
  registerAllIpcHandlers()
  console.log('IPC handlers reloaded successfully')
}
