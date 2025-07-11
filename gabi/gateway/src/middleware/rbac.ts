import { Request, Response, NextFunction } from 'express'
import { User } from '../types'

// =============================================================================
// MIDDLEWARE RBAC (ROLE-BASED ACCESS CONTROL)
// =============================================================================

export class RBACMiddleware {
  // =============================================================================
  // ROLES E PERMISSÕES
  // =============================================================================

  private static readonly ROLES = {
    ADMIN: 'admin',
    ADVOGADO: 'advogado',
    ESTAGIARIO: 'estagiario'
  } as const

  private static readonly PERMISSIONS = {
    // Usuários
    'users:read': [this.ROLES.ADMIN],
    'users:write': [this.ROLES.ADMIN],
    'users:delete': [this.ROLES.ADMIN],
    
    // Chat
    'chat:read': [this.ROLES.ADMIN, this.ROLES.ADVOGADO, this.ROLES.ESTAGIARIO],
    'chat:write': [this.ROLES.ADMIN, this.ROLES.ADVOGADO, this.ROLES.ESTAGIARIO],
    
    // Agentes
    'agents:read': [this.ROLES.ADMIN, this.ROLES.ADVOGADO, this.ROLES.ESTAGIARIO],
    'agents:write': [this.ROLES.ADMIN],
    'agents:delete': [this.ROLES.ADMIN],
    
    // Bases de conhecimento
    'bases:read': [this.ROLES.ADMIN, this.ROLES.ADVOGADO, this.ROLES.ESTAGIARIO],
    'bases:write': [this.ROLES.ADMIN, this.ROLES.ADVOGADO],
    'bases:delete': [this.ROLES.ADMIN],
    
    // Workflows
    'workflows:read': [this.ROLES.ADMIN, this.ROLES.ADVOGADO],
    'workflows:write': [this.ROLES.ADMIN, this.ROLES.ADVOGADO],
    'workflows:delete': [this.ROLES.ADMIN],
    'workflows:execute': [this.ROLES.ADMIN, this.ROLES.ADVOGADO, this.ROLES.ESTAGIARIO],
    
    // Relatórios
    'reports:read': [this.ROLES.ADMIN, this.ROLES.ADVOGADO],
    'reports:write': [this.ROLES.ADMIN],
    
    // Configurações
    'settings:read': [this.ROLES.ADMIN],
    'settings:write': [this.ROLES.ADMIN]
  } as const

  // =============================================================================
  // MIDDLEWARES PRINCIPAIS
  // =============================================================================

  /**
   * Verifica se o usuário tem a permissão necessária
   */
  static requirePermission(permission: keyof typeof RBACMiddleware.PERMISSIONS) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const authReq = req as any
        const user = authReq.user as User

        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'Usuário não autenticado',
            timestamp: new Date()
          })
        }

        const hasPermission = this.checkPermission(user.role, permission)

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: 'Permissão insuficiente',
            details: {
              required: permission,
              userRole: user.role,
              userId: user.id
            },
            timestamp: new Date()
          })
        }

        next()
      } catch (error) {
        console.error('Erro no middleware RBAC:', error)
        
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          timestamp: new Date()
        })
      }
    }
  }

  /**
   * Verifica se o usuário tem uma das roles especificadas
   */
  static requireRole(roles: Array<keyof typeof RBACMiddleware.ROLES>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const authReq = req as any
        const user = authReq.user as User

        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'Usuário não autenticado',
            timestamp: new Date()
          })
        }

        const hasRole = roles.includes(user.role as keyof typeof RBACMiddleware.ROLES)

        if (!hasRole) {
          return res.status(403).json({
            success: false,
            error: 'Role insuficiente',
            details: {
              required: roles,
              userRole: user.role,
              userId: user.id
            },
            timestamp: new Date()
          })
        }

        next()
      } catch (error) {
        console.error('Erro no middleware RBAC:', error)
        
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          timestamp: new Date()
        })
      }
    }
  }

  /**
   * Verifica se o usuário é dono do recurso ou tem permissão de admin
   */
  static requireOwnership(resourceType: string, idParam: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const authReq = req as any
        const user = authReq.user as User
        const resourceId = req.params[idParam]

        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'Usuário não autenticado',
            timestamp: new Date()
          })
        }

        // Admin pode acessar qualquer recurso
        if (user.role === this.ROLES.ADMIN) {
          return next()
        }

        // Verifica se o usuário é dono do recurso
        const isOwner = this.checkResourceOwnership(user, resourceType, resourceId)

        if (!isOwner) {
          return res.status(403).json({
            success: false,
            error: 'Acesso negado ao recurso',
            details: {
              resourceType,
              resourceId,
              userId: user.id,
              userRole: user.role
            },
            timestamp: new Date()
          })
        }

        next()
      } catch (error) {
        console.error('Erro no middleware de ownership:', error)
        
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          timestamp: new Date()
        })
      }
    }
  }

  /**
   * Verifica se o usuário tem acesso ao tenant
   */
  static requireTenantAccess(tenantParam: string = 'tenantId') {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const authReq = req as any
        const user = authReq.user as User
        const requestedTenant = req.params[tenantParam] || req.body.tenantId

        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'Usuário não autenticado',
            timestamp: new Date()
          })
        }

        // Admin pode acessar qualquer tenant
        if (user.role === this.ROLES.ADMIN) {
          return next()
        }

        const userTenant = user.metadata?.tenant || 'default'

        if (userTenant !== requestedTenant) {
          return res.status(403).json({
            success: false,
            error: 'Acesso negado ao tenant',
            details: {
              userTenant,
              requestedTenant,
              userId: user.id
            },
            timestamp: new Date()
          })
        }

        next()
      } catch (error) {
        console.error('Erro no middleware de tenant:', error)
        
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          timestamp: new Date()
        })
      }
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  /**
   * Verifica se uma role tem determinada permissão
   */
  private static checkPermission(userRole: string, permission: keyof typeof RBACMiddleware.PERMISSIONS): boolean {
    const allowedRoles = this.PERMISSIONS[permission]
    
    if (!allowedRoles) {
      return false
    }

    return allowedRoles.includes(userRole as keyof typeof RBACMiddleware.ROLES)
  }

  /**
   * Verifica se o usuário é dono de um recurso
   */
  private static checkResourceOwnership(user: User, resourceType: string, resourceId: string): boolean {
    // Implementação específica por tipo de recurso
    switch (resourceType) {
      case 'session':
        // Sessões são sempre do usuário que as criou
        return true
        
      case 'chat':
        // Chats podem ser compartilhados entre usuários do mesmo tenant
        return true
        
      case 'document':
        // Documentos podem ter donos específicos
        return true
        
      case 'workflow':
        // Workflows podem ser compartilhados
        return true
        
      default:
        // Por padrão, permite acesso
        return true
    }
  }

  /**
   * Obtém todas as permissões de uma role
   */
  static getRolePermissions(role: string): string[] {
    const permissions: string[] = []
    
    Object.entries(this.PERMISSIONS).forEach(([permission, allowedRoles]) => {
      if (allowedRoles.includes(role as keyof typeof RBACMiddleware.ROLES)) {
        permissions.push(permission)
      }
    })
    
    return permissions
  }

  /**
   * Verifica se uma role existe
   */
  static isValidRole(role: string): boolean {
    return Object.values(this.ROLES).includes(role as keyof typeof RBACMiddleware.ROLES)
  }

  /**
   * Obtém todas as roles disponíveis
   */
  static getAllRoles(): string[] {
    return Object.values(this.ROLES)
  }

  /**
   * Obtém todas as permissões disponíveis
   */
  static getAllPermissions(): string[] {
    return Object.keys(this.PERMISSIONS)
  }

  // =============================================================================
  // MIDDLEWARES ESPECÍFICOS
  // =============================================================================

  /**
   * Middleware para endpoints de administração
   */
  static requireAdmin = this.requireRole([this.ROLES.ADMIN])

  /**
   * Middleware para endpoints de advogados e admin
   */
  static requireAdvogadoOrAdmin = this.requireRole([this.ROLES.ADMIN, this.ROLES.ADVOGADO])

  /**
   * Middleware para endpoints de chat
   */
  static requireChatAccess = this.requirePermission('chat:read')

  /**
   * Middleware para endpoints de agentes
   */
  static requireAgentAccess = this.requirePermission('agents:read')

  /**
   * Middleware para endpoints de bases
   */
  static requireBaseAccess = this.requirePermission('bases:read')

  /**
   * Middleware para endpoints de workflows
   */
  static requireWorkflowAccess = this.requirePermission('workflows:read')
} 