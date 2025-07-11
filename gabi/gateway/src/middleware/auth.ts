import { Request, Response, NextFunction } from 'express'
import { AuthRequest, User, UserRole } from '../types'
import { supabaseService } from '../services/supabase'

// =============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// =============================================================================

export class AuthMiddleware {
  // =============================================================================
  // VERIFICAÇÃO DE TOKEN
  // =============================================================================

  static async verifyToken(token: string): Promise<User | null> {
    return await supabaseService.verifyJWT(token)
  }

  // =============================================================================
  // MIDDLEWARE DE AUTENTICAÇÃO OBRIGATÓRIA
  // =============================================================================

  static requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Token de autenticação não fornecido',
          timestamp: new Date()
        })
      }

      const token = authHeader.substring(7) // Remove 'Bearer '

      supabaseService.verifyJWT(token)
        .then(user => {
          if (!user) {
            return res.status(401).json({
              success: false,
              error: 'Token inválido ou expirado',
              timestamp: new Date()
            })
          }

          req.user = user
          req.token = token
          next()
        })
        .catch(error => {
          console.error('Erro na verificação do token:', error)
          return res.status(401).json({
            success: false,
            error: 'Erro na verificação do token',
            timestamp: new Date()
          })
        })
    } catch (error) {
      console.error('Erro no middleware de autenticação:', error)
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date()
      })
    }
  }

  // =============================================================================
  // MIDDLEWARE DE AUTORIZAÇÃO POR ROLE
  // =============================================================================

  static requireRole(roles: UserRole[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Usuário não autenticado',
            timestamp: new Date()
          })
        }

        if (!roles.includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: 'Acesso negado. Permissões insuficientes.',
            timestamp: new Date()
          })
        }

        next()
      } catch (error) {
        console.error('Erro no middleware de autorização:', error)
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          timestamp: new Date()
        })
      }
    }
  }

  // =============================================================================
  // MIDDLEWARE DE AUTENTICAÇÃO OPCIONAL
  // =============================================================================

  static optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next() // Continua sem usuário autenticado
      }

      const token = authHeader.substring(7)

      supabaseService.verifyJWT(token)
        .then(user => {
          if (user) {
            req.user = user
            req.token = token
          }
          next()
        })
        .catch(() => {
          // Token inválido, mas continua sem usuário
          next()
        })
    } catch (error) {
      console.error('Erro no middleware de autenticação opcional:', error)
      next() // Continua mesmo com erro
    }
  }

  // =============================================================================
  // MIDDLEWARE DE VERIFICAÇÃO DE PROPRIEDADE
  // =============================================================================

  static requireOwnership(resourceType: string, resourceIdField: string = 'id') {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Usuário não autenticado',
            timestamp: new Date()
          })
        }

        // Admins podem acessar qualquer recurso
        if (req.user.role === 'admin') {
          return next()
        }

        const resourceId = req.params[resourceIdField] || req.body[resourceIdField]
        
        if (!resourceId) {
          return res.status(400).json({
            success: false,
            error: `ID do ${resourceType} não fornecido`,
            timestamp: new Date()
          })
        }

        // Verifica se o recurso pertence ao usuário
        // Esta lógica pode ser customizada por tipo de recurso
        if (resourceType === 'session') {
          // Para sessões, verifica se o usuário é o dono
          supabaseService.getSession(resourceId)
            .then(session => {
              if (!session) {
                return res.status(404).json({
                  success: false,
                  error: `${resourceType} não encontrado`,
                  timestamp: new Date()
                })
              }

              if (session.user_id !== req.user!.id) {
                return res.status(403).json({
                  success: false,
                  error: 'Acesso negado. Recurso não pertence ao usuário.',
                  timestamp: new Date()
                })
              }

              next()
            })
            .catch(error => {
              console.error(`Erro ao verificar propriedade do ${resourceType}:`, error)
              return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                timestamp: new Date()
              })
            })
        } else {
          // Para outros tipos, implementar lógica específica
          next()
        }
      } catch (error) {
        console.error('Erro no middleware de verificação de propriedade:', error)
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          timestamp: new Date()
        })
      }
    }
  }

  // =============================================================================
  // MIDDLEWARE DE RATE LIMITING POR USUÁRIO
  // =============================================================================

  static rateLimitByUser(maxRequests: number, windowMs: number) {
    const userRequests = new Map<string, { count: number; resetTime: number }>()

    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Usuário não autenticado',
            timestamp: new Date()
          })
        }

        const userId = req.user.id
        const now = Date.now()
        const userData = userRequests.get(userId)

        if (!userData || now > userData.resetTime) {
          // Primeira requisição ou janela expirada
          userRequests.set(userId, {
            count: 1,
            resetTime: now + windowMs
          })
          return next()
        }

        if (userData.count >= maxRequests) {
          return res.status(429).json({
            success: false,
            error: 'Limite de requisições excedido',
            timestamp: new Date()
          })
        }

        userData.count++
        next()
      } catch (error) {
        console.error('Erro no middleware de rate limiting:', error)
        next()
      }
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  static isAdmin(user: User): boolean {
    return user.role === 'admin'
  }

  static isAdvogado(user: User): boolean {
    return user.role === 'advogado' || user.role === 'admin'
  }

  static isEstagiario(user: User): boolean {
    return user.role === 'estagiario' || user.role === 'advogado' || user.role === 'admin'
  }

  static canAccessResource(user: User, resourceOwnerId: string): boolean {
    return user.id === resourceOwnerId || this.isAdmin(user)
  }
} 