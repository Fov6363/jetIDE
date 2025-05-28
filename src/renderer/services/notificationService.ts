/**
 * 通知类型
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

/**
 * 通知消息接口
 */
export interface NotificationMessage {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  timestamp: number
}

/**
 * 通知监听器类型
 */
export type NotificationListener = (notification: NotificationMessage) => void

/**
 * 通知服务类
 * 提供全局通知功能，支持成功、错误、警告和信息通知
 */
export class NotificationService {
  private listeners: Set<NotificationListener> = new Set()
  private notifications: NotificationMessage[] = []
  private maxNotifications = 5

  /**
   * 添加通知监听器
   */
  addListener(listener: NotificationListener): () => void {
    this.listeners.add(listener)

    // 返回取消监听的函数
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * 移除通知监听器
   */
  removeListener(listener: NotificationListener): void {
    this.listeners.delete(listener)
  }

  /**
   * 触发通知
   */
  private notify(notification: NotificationMessage): void {
    // 添加到通知列表
    this.notifications.unshift(notification)

    // 限制通知数量
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications)
    }

    // 通知所有监听器
    this.listeners.forEach(listener => {
      try {
        listener(notification)
      } catch (error) {
        console.error('通知监听器执行失败:', error)
      }
    })
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 显示成功通知
   */
  success(title: string, message?: string, duration: number = 3000): string {
    const notification: NotificationMessage = {
      id: this.generateId(),
      type: 'success',
      title,
      message,
      duration,
      timestamp: Date.now(),
    }

    this.notify(notification)
    return notification.id
  }

  /**
   * 显示错误通知
   */
  error(title: string, message?: string, duration: number = 5000): string {
    const notification: NotificationMessage = {
      id: this.generateId(),
      type: 'error',
      title,
      message,
      duration,
      timestamp: Date.now(),
    }

    this.notify(notification)
    return notification.id
  }

  /**
   * 显示警告通知
   */
  warning(title: string, message?: string, duration: number = 4000): string {
    const notification: NotificationMessage = {
      id: this.generateId(),
      type: 'warning',
      title,
      message,
      duration,
      timestamp: Date.now(),
    }

    this.notify(notification)
    return notification.id
  }

  /**
   * 显示信息通知
   */
  info(title: string, message?: string, duration: number = 3000): string {
    const notification: NotificationMessage = {
      id: this.generateId(),
      type: 'info',
      title,
      message,
      duration,
      timestamp: Date.now(),
    }

    this.notify(notification)
    return notification.id
  }

  /**
   * 获取所有通知
   */
  getNotifications(): NotificationMessage[] {
    return [...this.notifications]
  }

  /**
   * 清除指定通知
   */
  clearNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id)
  }

  /**
   * 清除所有通知
   */
  clearAllNotifications(): void {
    this.notifications = []
  }

  /**
   * 清除过期通知
   */
  clearExpiredNotifications(): void {
    const now = Date.now()
    this.notifications = this.notifications.filter(notification => {
      if (!notification.duration) return true
      return now - notification.timestamp < notification.duration
    })
  }
}

// 创建全局通知服务实例
export const notificationService = new NotificationService()

// 定期清理过期通知
setInterval(() => {
  notificationService.clearExpiredNotifications()
}, 1000)
