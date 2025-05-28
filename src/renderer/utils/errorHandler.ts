import { notificationService } from '../services/notificationService'

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK = 'network',
  PERMISSION = 'permission',
  FILE_NOT_FOUND = 'file_not_found',
  INVALID_INPUT = 'invalid_input',
  UNKNOWN = 'unknown',
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly userMessage: string
  public readonly originalError?: Error

  constructor(
    type: ErrorType,
    message: string,
    userMessage: string,
    originalError?: Error
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.userMessage = userMessage
    this.originalError = originalError
  }
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  /**
   * 解析错误类型
   */
  private static parseErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase()

    if (message.includes('permission') || message.includes('权限')) {
      return ErrorType.PERMISSION
    }

    if (
      message.includes('not found') ||
      message.includes('不存在') ||
      message.includes('找不到')
    ) {
      return ErrorType.FILE_NOT_FOUND
    }

    if (
      message.includes('network') ||
      message.includes('网络') ||
      message.includes('连接')
    ) {
      return ErrorType.NETWORK
    }

    if (
      message.includes('invalid') ||
      message.includes('非法') ||
      message.includes('无效')
    ) {
      return ErrorType.INVALID_INPUT
    }

    return ErrorType.UNKNOWN
  }

  /**
   * 生成用户友好的错误消息
   */
  private static generateUserMessage(
    type: ErrorType,
    originalMessage: string
  ): string {
    switch (type) {
      case ErrorType.PERMISSION:
        return '权限不足，请检查文件或文件夹的访问权限'

      case ErrorType.FILE_NOT_FOUND:
        return '文件或文件夹不存在，可能已被删除或移动'

      case ErrorType.NETWORK:
        return '网络连接失败，请检查网络设置'

      case ErrorType.INVALID_INPUT:
        return '输入的内容无效，请检查后重试'

      case ErrorType.UNKNOWN:
      default:
        return originalMessage || '发生未知错误，请稍后重试'
    }
  }

  /**
   * 处理错误
   */
  static handle(error: unknown, context?: string): AppError {
    let appError: AppError

    if (error instanceof AppError) {
      appError = error
    } else if (error instanceof Error) {
      const type = this.parseErrorType(error)
      const userMessage = this.generateUserMessage(type, error.message)
      appError = new AppError(type, error.message, userMessage, error)
    } else {
      const message = String(error)
      appError = new AppError(
        ErrorType.UNKNOWN,
        message,
        this.generateUserMessage(ErrorType.UNKNOWN, message)
      )
    }

    // 记录错误日志
    console.error(`[ErrorHandler] ${context || 'Unknown context'}:`, {
      type: appError.type,
      message: appError.message,
      userMessage: appError.userMessage,
      originalError: appError.originalError,
      stack: appError.stack,
    })

    return appError
  }

  /**
   * 处理错误并显示通知
   */
  static handleWithNotification(
    error: unknown,
    context?: string,
    showNotification: boolean = true
  ): AppError {
    const appError = this.handle(error, context)

    if (showNotification) {
      notificationService.error(context || '操作失败', appError.userMessage)
    }

    return appError
  }

  /**
   * 创建特定类型的错误
   */
  static createPermissionError(
    message: string,
    originalError?: Error
  ): AppError {
    return new AppError(
      ErrorType.PERMISSION,
      message,
      '权限不足，请检查文件或文件夹的访问权限',
      originalError
    )
  }

  static createFileNotFoundError(
    message: string,
    originalError?: Error
  ): AppError {
    return new AppError(
      ErrorType.FILE_NOT_FOUND,
      message,
      '文件或文件夹不存在，可能已被删除或移动',
      originalError
    )
  }

  static createNetworkError(message: string, originalError?: Error): AppError {
    return new AppError(
      ErrorType.NETWORK,
      message,
      '网络连接失败，请检查网络设置',
      originalError
    )
  }

  static createInvalidInputError(
    message: string,
    originalError?: Error
  ): AppError {
    return new AppError(
      ErrorType.INVALID_INPUT,
      message,
      '输入的内容无效，请检查后重试',
      originalError
    )
  }
}

/**
 * 异步操作错误处理装饰器
 */
export function handleAsyncError<T extends any[], R>(
  target: any,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
) {
  const method = descriptor.value!

  descriptor.value = async function (...args: T): Promise<R> {
    try {
      return await method.apply(this, args)
    } catch (error) {
      throw ErrorHandler.handle(
        error,
        `${target.constructor.name}.${propertyName}`
      )
    }
  }

  return descriptor
}

/**
 * 重试机制
 */
export class RetryHandler {
  /**
   * 带重试的异步操作执行
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context?: string
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt === maxRetries) {
          throw ErrorHandler.handle(
            new Error(
              `${context || '操作'}失败，已重试 ${maxRetries} 次: ${lastError.message}`
            ),
            context
          )
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }

    throw lastError
  }

  /**
   * 指数退避重试
   */
  static async withExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    context?: string
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt === maxRetries) {
          throw ErrorHandler.handle(
            new Error(
              `${context || '操作'}失败，已重试 ${maxRetries} 次: ${lastError.message}`
            ),
            context
          )
        }

        // 指数退避延迟
        const delay = baseDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }
}
