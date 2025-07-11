import { Request, Response, NextFunction } from 'express'
import { AuthRequest, UserRole } from '../types/oauth'
import { supabaseService } from '../services/supabase'
import { getLocalizedMessage } from '../utils/i18n'

// =============================================================================
// MIDDLEWARE RBAC (ROLE-BASED ACCESS CONTROL)
// =============================================================================

export class RBACMiddleware {
  // =============================================================================
  // VERIFICAÇÃO DE ROLE
  // =============================================================================

  static requireRole(roles: UserRole[]) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const authReq = req as AuthRequest
        const user = authReq.user
        const lang = req.headers['x-lang'] as string || 'pt-BR'

        if (!user) {
          const message = getLocalizedMessage('errors.unauthorized', lang)
          return res.status(401).json({
            success: false,
            error: message,
            timestamp: new Date()
          })
        }

        // Verifica se o usuário tem uma das roles necessárias
        if (!roles.includes(user.role)) {
          const message = getLocalizedMessage('errors.insufficient_permissions', lang)
          return res.status(403).json({
            success: false,
            error: message,
            timestamp: new Date()
          })
        }

        // Log da ação
        await logRBACAction({
          userId: user.id,
          action: 'role_check',
          resource: req.path,
          details: {
            requiredRoles: roles,
            userRole: user.role,
            method: req.method
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || ''
        })

        next()
      } catch (error) {
        console.error('Erro no middleware RBAC:', error)
        const message = getLocalizedMessage('errors.internal_server', req.headers['x-lang'] as string || 'pt-BR')
        return res.status(500).json({
          success: false,
          error: message,
          timestamp: new Date()
        })
      }
    }
  }

  // =============================================================================
  // VERIFICAÇÃO DE ADMIN
  // =============================================================================

  static requireAdmin(req: Request, res: Response, next: NextFunction): void {
    return RBACMiddleware.requireRole(['admin'])(req, res, next)
  }

  // =============================================================================
  // VERIFICAÇÃO DE USUÁRIO OU ADMIN
  // =============================================================================

  static requireUserOrAdmin(req: Request, res: Response, next: NextFunction): void {
    return RBACMiddleware.requireRole(['user', 'admin'])(req, res, next)
  }

  // =============================================================================
  // VERIFICAÇÃO DE AUDITOR OU ADMIN
  // =============================================================================

  static requireAuditorOrAdmin(req: Request, res: Response, next: NextFunction): void {
    return RBACMiddleware.requireRole(['auditor', 'admin'])(req, res, next)
  }

  // =============================================================================
  // VERIFICAÇÃO DE PROPRIEDADE DE RECURSO
  // =============================================================================

  static requireOwnership(resourceType: string, resourceIdField: string = 'id') {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const authReq = req as AuthRequest
        const user = authReq.user
        const lang = req.headers['x-lang'] as string || 'pt-BR'

        if (!user) {
          const message = getLocalizedMessage('errors.unauthorized', lang)
          return res.status(401).json({
            success: false,
            error: message,
            timestamp: new Date()
          })
        }

        // Admins podem acessar qualquer recurso
        if (user.role === 'admin') {
          return next()
        }

        const resourceId = req.params[resourceIdField] || req.body[resourceIdField]
        
        if (!resourceId) {
          const message = getLocalizedMessage('errors.resource_id_required', lang)
          return res.status(400).json({
            success: false,
            error: message,
            timestamp: new Date()
          })
        }

        // Verifica se o recurso pertence ao usuário
        const isOwner = await checkResourceOwnership(resourceType, resourceId, user.id)
        
        if (!isOwner) {
          const message = getLocalizedMessage('errors.resource_not_owned', lang)
          return res.status(403).json({
            success: false,
            error: message,
            timestamp: new Date()
          })
        }

        // Log da ação
        await logRBACAction({
          userId: user.id,
          action: 'ownership_check',
          resource: `${resourceType}:${resourceId}`,
          details: {
            resourceType,
            resourceId,
            userRole: user.role
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || ''
        })

        next()
      } catch (error) {
        console.error('Erro na verificação de propriedade:', error)
        const message = getLocalizedMessage('errors.internal_server', req.headers['x-lang'] as string || 'pt-BR')
        return res.status(500).json({
          success: false,
          error: message,
          timestamp: new Date()
        })
      }
    }
  }

  // =============================================================================
  // VERIFICAÇÃO DE PERMISSÃO ESPECÍFICA
  // =============================================================================

  static requirePermission(permission: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const authReq = req as AuthRequest
        const user = authReq.user
        const lang = req.headers['x-lang'] as string || 'pt-BR'

        if (!user) {
          const message = getLocalizedMessage('errors.unauthorized', lang)
          return res.status(401).json({
            success: false,
            error: message,
            timestamp: new Date()
          })
        }

        // Verifica se o usuário tem a permissão específica
        const hasPermission = await checkUserPermission(user.id, permission)
        
        if (!hasPermission) {
          const message = getLocalizedMessage('errors.insufficient_permissions', lang)
          return res.status(403).json({
            success: false,
            error: message,
            timestamp: new Date()
          })
        }

        // Log da ação
        await logRBACAction({
          userId: user.id,
          action: 'permission_check',
          resource: req.path,
          details: {
            permission,
            userRole: user.role
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || ''
        })

        next()
      } catch (error) {
        console.error('Erro na verificação de permissão:', error)
        const message = getLocalizedMessage('errors.internal_server', req.headers['x-lang'] as string || 'pt-BR')
        return res.status(500).json({
          success: false,
          error: message,
          timestamp: new Date()
        })
      }
    }
  }
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

async function checkResourceOwnership(resourceType: string, resourceId: string, userId: string): Promise<boolean> {
  try {
    switch (resourceType) {
      case 'document':
        const { data: document } = await supabaseService.supabase
          .from('documents')
          .select('userId')
          .eq('id', resourceId)
          .single()
        return document?.userId === userId

      case 'oauth_token':
        const { data: token } = await supabaseService.supabase
          .from('oauth_tokens')
          .select('userId')
          .eq('id', resourceId)
          .single()
        return token?.userId === userId

      default:
        return false
    }
  } catch (error) {
    console.error('Erro ao verificar propriedade do recurso:', error)
    return false
  }
}

async function checkUserPermission(userId: string, permission: string): Promise<boolean> {
  try {
    // Implementar verificação de permissões específicas
    // Por enquanto, retorna true para usuários autenticados
    return true
  } catch (error) {
    console.error('Erro ao verificar permissão do usuário:', error)
    return false
  }
}

async function logRBACAction(data: {
  userId: string
  action: string
  resource: string
  details: any
  ipAddress: string
  userAgent: string
}): Promise<void> {
  try {
    await supabaseService.supabase
      .from('supabase_logs')
      .insert({
        user_id: data.userId,
        action: data.action,
        resource: data.resource,
        details: data.details,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        timestamp: new Date()
      })
  } catch (error) {
    console.error('Erro ao logar ação RBAC:', error)
  }
} 