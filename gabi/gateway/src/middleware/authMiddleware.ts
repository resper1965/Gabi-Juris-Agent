import { Request, Response, NextFunction } from 'express'

// =============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO PARA WEBHOOKS - GABI
// =============================================================================

export interface AuthenticatedRequest extends Request {
  webhookSource?: 'google' | 'sharepoint'
  webhookPayload?: any
}

export const webhookAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Verificar se a API key está presente
    const apiKey = req.headers['x-api-key'] as string

    if (!apiKey) {
      console.warn('⚠️ Tentativa de acesso sem API key', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      })

      return res.status(401).json({
        success: false,
        message: 'API key é obrigatória',
        timestamp: new Date().toISOString()
      })
    }

    // Verificar se a API key é válida
    const validApiKey = process.env.N8N_WEBHOOK_API_KEY || 'n8n-secret'

    if (apiKey !== validApiKey) {
      console.warn('⚠️ API key inválida', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        providedKey: apiKey.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      })

      return res.status(403).json({
        success: false,
        message: 'API key inválida',
        timestamp: new Date().toISOString()
      })
    }

    // Log de acesso autorizado
    console.info('🔐 Acesso autorizado ao webhook', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    })

    next()
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error)
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno de autenticação',
      timestamp: new Date().toISOString()
    })
  }
}

// =============================================================================
// MIDDLEWARE DE VALIDAÇÃO DE PAYLOAD
// =============================================================================

export const validateWebhookPayload = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const payload = req.body

    // Verificar se o payload está presente
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Payload é obrigatório e deve ser um objeto JSON',
        timestamp: new Date().toISOString()
      })
    }

    // Verificar campos obrigatórios básicos
    const requiredFields = ['source', 'filename', 'file_id', 'last_modified', 'base_id', 'event']
    const missingFields = requiredFields.filter(field => !payload[field])

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        timestamp: new Date().toISOString()
      })
    }

    // Validar tipos básicos
    if (!['google', 'sharepoint'].includes(payload.source)) {
      return res.status(400).json({
        success: false,
        message: 'source deve ser "google" ou "sharepoint"',
        timestamp: new Date().toISOString()
      })
    }

    if (!['created', 'modified', 'deleted'].includes(payload.event)) {
      return res.status(400).json({
        success: false,
        message: 'event deve ser "created", "modified" ou "deleted"',
        timestamp: new Date().toISOString()
      })
    }

    // Validar data ISO
    const lastModified = new Date(payload.last_modified)
    if (isNaN(lastModified.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'last_modified deve ser uma data ISO válida',
        timestamp: new Date().toISOString()
      })
    }

    // Armazenar payload validado na request
    req.webhookPayload = payload
    req.webhookSource = payload.source

    console.info('✅ Payload validado com sucesso', {
      source: payload.source,
      event: payload.event,
      file_id: payload.file_id,
      filename: payload.filename,
      base_id: payload.base_id,
      timestamp: new Date().toISOString()
    })

    next()
  } catch (error) {
    console.error('❌ Erro na validação do payload:', error)
    
    return res.status(400).json({
      success: false,
      message: 'Erro na validação do payload',
      timestamp: new Date().toISOString()
    })
  }
}

// =============================================================================
// MIDDLEWARE DE RATE LIMITING
// =============================================================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export const webhookRateLimit = (windowMs: number = 60000, maxRequests: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown'
    const now = Date.now()
    
    // Limpar entradas expiradas
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key)
      }
    }

    // Verificar limite para o IP
    const current = rateLimitStore.get(ip)
    
    if (!current) {
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }

    if (current.count >= maxRequests) {
      console.warn('⚠️ Rate limit excedido', {
        ip,
        count: current.count,
        maxRequests,
        resetTime: new Date(current.resetTime).toISOString()
      })

      return res.status(429).json({
        success: false,
        message: 'Muitas requisições. Tente novamente em breve.',
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
        timestamp: new Date().toISOString()
      })
    }

    current.count++
    next()
  }
}

// =============================================================================
// MIDDLEWARE DE LOGGING
// =============================================================================

export const webhookLogging = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  const originalSend = res.send

  // Interceptar resposta para logar tempo de processamento
  res.send = function(data) {
    const processingTime = Date.now() - startTime
    
    console.info('📊 Requisição processada', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    })

    return originalSend.call(this, data)
  }

  next()
}

// =============================================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// =============================================================================

export const webhookErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Erro não tratado no webhook:', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString()
  })

  // Retornar 200 OK mesmo em caso de erro (conforme especificação)
  return res.status(200).json({
    success: false,
    message: 'Erro interno processado',
    timestamp: new Date().toISOString()
  })
} 