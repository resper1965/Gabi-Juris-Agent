import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { User } from '../types'

// =============================================================================
// MIDDLEWARE DE LOGGING
// =============================================================================

export class LogMiddleware {
  // =============================================================================
  // CONFIGURAÇÃO
  // =============================================================================

  private static readonly LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  } as const

  // =============================================================================
  // MIDDLEWARES PRINCIPAIS
  // =============================================================================

  /**
   * Middleware para logging de requisições
   */
  static logRequest(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now()
    const traceId = uuidv4()
    const requestId = uuidv4()

    // Adiciona IDs à requisição
    ;(req as any).traceId = traceId
    ;(req as any).requestId = requestId
    ;(req as any).startTime = startTime

    // Log da requisição
    this.logToLoki({
      level: this.LOG_LEVELS.INFO,
      message: 'HTTP Request',
      traceId,
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.id,
      timestamp: new Date().toISOString()
    })

    // Intercepta resposta
    const originalSend = res.send
    res.send = function(data) {
      const endTime = Date.now()
      const duration = endTime - startTime

      // Log da resposta
      LogMiddleware.logToLoki({
        level: LogMiddleware.LOG_LEVELS.INFO,
        message: 'HTTP Response',
        traceId,
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        responseSize: data?.length || 0,
        userId: (req as any).user?.id,
        timestamp: new Date().toISOString()
      })

      return originalSend.call(this, data)
    }

    next()
  }

  /**
   * Middleware para logging de erros
   */
  static logError(error: Error, req: Request, res: Response, next: NextFunction): void {
    const traceId = (req as any).traceId || uuidv4()
    const requestId = (req as any).requestId || uuidv4()
    const user = (req as any).user as User

    // Log do erro
    this.logToLoki({
      level: this.LOG_LEVELS.ERROR,
      message: 'Application Error',
      traceId,
      requestId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      request: {
        method: req.method,
        url: req.url,
        body: req.body,
        params: req.params,
        query: req.query
      },
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role
      } : null,
      timestamp: new Date().toISOString()
    })

    next(error)
  }

  /**
   * Middleware para logging de performance
   */
  static logPerformance(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now()
    const traceId = (req as any).traceId || uuidv4()

    // Intercepta resposta para medir performance
    const originalSend = res.send
    res.send = function(data) {
      const endTime = Date.now()
      const duration = endTime - startTime

      // Log de performance se demorar mais de 1 segundo
      if (duration > 1000) {
        LogMiddleware.logToLoki({
          level: LogMiddleware.LOG_LEVELS.WARN,
          message: 'Slow Request',
          traceId,
          method: req.method,
          url: req.url,
          duration,
          threshold: 1000,
          userId: (req as any).user?.id,
          timestamp: new Date().toISOString()
        })
      }

      return originalSend.call(this, data)
    }

    next()
  }

  // =============================================================================
  // LOGGING ESPECÍFICO
  // =============================================================================

  /**
   * Log de autenticação
   */
  static logAuth(action: 'login' | 'logout' | 'refresh', user: User, success: boolean, details?: any): void {
    this.logToLoki({
      level: success ? this.LOG_LEVELS.INFO : this.LOG_LEVELS.WARN,
      message: `Auth ${action}`,
      action,
      success,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      details,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log de chat
   */
  static logChat(data: {
    userId: string
    sessionId: string
    agentId: string
    message: string
    response: string
    latency: number
    tokens: number
    bases?: string[]
  }): void {
    // Log para Loki
    this.logToLoki({
      level: this.LOG_LEVELS.INFO,
      message: 'Chat Interaction',
      userId: data.userId,
      sessionId: data.sessionId,
      agentId: data.agentId,
      latency: data.latency,
      tokens: data.tokens,
      bases: data.bases,
      timestamp: new Date().toISOString()
    })

    // Log para Langfuse
    this.logToLangfuse({
      userId: data.userId,
      sessionId: data.sessionId,
      input: data.message,
      output: data.response,
      metadata: {
        agentId: data.agentId,
        bases: data.bases,
        latency: data.latency,
        tokens: data.tokens
      }
    })
  }

  /**
   * Log de acesso a recursos
   */
  static logResourceAccess(action: string, resource: string, user: User, success: boolean, details?: any): void {
    this.logToLoki({
      level: success ? this.LOG_LEVELS.INFO : this.LOG_LEVELS.WARN,
      message: 'Resource Access',
      action,
      resource,
      success,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      details,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log de operações administrativas
   */
  static logAdminAction(action: string, admin: User, target?: any, details?: any): void {
    this.logToLoki({
      level: this.LOG_LEVELS.INFO,
      message: 'Admin Action',
      action,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      },
      target,
      details,
      timestamp: new Date().toISOString()
    })
  }

  // =============================================================================
  // DESTINOS DE LOG
  // =============================================================================

  /**
   * Log para Loki
   */
  private static async logToLoki(data: any): Promise<void> {
    try {
      // Em produção, enviar para Loki
      // const response = await axios.post(process.env.LOKI_URL, {
      //   streams: [{
      //     stream: {
      //       level: data.level,
      //       service: 'gabi-gateway'
      //     },
      //     values: [[
      //       (Date.now() * 1000000).toString(),
      //       JSON.stringify(data)
      //     ]]
      //   }]
      // })

      // Por enquanto, apenas console
      console.log(`[${data.level.toUpperCase()}] ${data.message}:`, data)
    } catch (error) {
      console.error('Erro ao enviar log para Loki:', error)
    }
  }

  /**
   * Log para Langfuse
   */
  private static async logToLangfuse(data: any): Promise<void> {
    try {
      // Em produção, enviar para Langfuse
      // const response = await axios.post(process.env.LANGFUSE_URL, {
      //   trace: {
      //     id: data.sessionId,
      //     name: 'Chat Interaction',
      //     userId: data.userId,
      //     metadata: data.metadata
      //   },
      //   span: {
      //     id: uuidv4(),
      //     traceId: data.sessionId,
      //     name: 'Chat Response',
      //     input: data.input,
      //     output: data.output
      //   }
      // })

      // Por enquanto, apenas console
      console.log('[LANGFUSE] Chat interaction:', {
        sessionId: data.sessionId,
        userId: data.userId,
        tokens: data.metadata.tokens,
        latency: data.metadata.latency
      })
    } catch (error) {
      console.error('Erro ao enviar log para Langfuse:', error)
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  /**
   * Gera trace ID único
   */
  static generateTraceId(): string {
    return uuidv4()
  }

  /**
   * Gera request ID único
   */
  static generateRequestId(): string {
    return uuidv4()
  }

  /**
   * Formata dados para log
   */
  static formatLogData(level: keyof typeof LogMiddleware.LOG_LEVELS, message: string, data?: any): any {
    return {
      level: this.LOG_LEVELS[level],
      message,
      timestamp: new Date().toISOString(),
      service: 'gabi-gateway',
      version: process.env.npm_package_version || '1.0.0',
      ...data
    }
  }

  /**
   * Sanitiza dados sensíveis
   */
  static sanitizeData(data: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization']
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data }
      
      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]'
        }
      }
      
      return sanitized
    }
    
    return data
  }

  // =============================================================================
  // MIDDLEWARES COMPOSTOS
  // =============================================================================

  /**
   * Middleware completo de logging
   */
  static complete = [
    this.logRequest,
    this.logPerformance
  ]

  /**
   * Middleware de logging básico
   */
  static basic = [
    this.logRequest
  ]
} 