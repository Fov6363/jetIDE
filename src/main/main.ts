import { app, BrowserWindow } from 'electron'
import { createWindow } from './window/createWindow'
import { createMenu } from './menu/menuTemplate'
import { registerAllIpcHandlers, unregisterAllIpcHandlers } from './ipc'

// 应用准备就绪时的处理
app.whenReady().then(() => {
  console.log('🚀 JetIDE is starting...')

  try {
    // 创建主窗口
    createWindow()
    console.log('✓ Main window created')

    // 创建应用菜单
    createMenu()
    console.log('✓ Application menu created')

    // 注册所有 IPC 处理器
    registerAllIpcHandlers()
    console.log('✓ IPC handlers registered')

    console.log('🎉 JetIDE started successfully!')
  } catch (error) {
    console.error('❌ Failed to start JetIDE:', error)
    app.quit()
  }
})

// 所有窗口关闭时的处理
app.on('window-all-closed', () => {
  console.log('All windows closed, cleaning up...')

  // 清理 IPC 处理器
  unregisterAllIpcHandlers()

  // 在 macOS 上，应用通常保持活跃状态，即使没有打开的窗口
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用激活时的处理（macOS）
app.on('activate', () => {
  // 在 macOS 上，当点击 dock 图标且没有其他窗口打开时，
  // 通常会重新创建一个窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
    createMenu()
  }
})

// 应用退出前的处理
app.on('before-quit', () => {
  console.log('JetIDE is shutting down...')
  unregisterAllIpcHandlers()
})

// 处理未捕获的异常
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
