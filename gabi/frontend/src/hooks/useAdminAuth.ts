import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import { checkAdminAccess, getCurrentUser, User } from '@/services/adminService'

// =============================================================================
// HOOK DE AUTENTICAÇÃO ADMINISTRATIVA - GABI
// =============================================================================

interface UseAdminAuthReturn {
  user: User | null
  loading: boolean
  isAdmin: boolean
  checkAuth: () => Promise<boolean>
  logout: () => void
}

export const useAdminAuth = (): UseAdminAuthReturn => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  // =============================================================================
  // VERIFICAÇÃO DE AUTENTICAÇÃO
  // =============================================================================

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true)

      // Verificar se há token no localStorage
      const token = localStorage.getItem('gabi_token')
      if (!token) {
        setUser(null)
        setIsAdmin(false)
        return false
      }

      // Verificar se o usuário tem permissão de admin
      const hasAdminAccess = await checkAdminAccess()
      if (!hasAdminAccess) {
        setUser(null)
        setIsAdmin(false)
        toast.error('Acesso negado. Apenas administradores podem acessar esta página.')
        return false
      }

      // Obter dados do usuário atual
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        setUser(null)
        setIsAdmin(false)
        return false
      }

      setUser(currentUser)
      setIsAdmin(currentUser.role === 'admin')
      return true

    } catch (error) {
      console.error('Erro na verificação de autenticação:', error)
      setUser(null)
      setIsAdmin(false)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // =============================================================================
  // LOGOUT
  // =============================================================================

  const logout = useCallback(() => {
    localStorage.removeItem('gabi_token')
    setUser(null)
    setIsAdmin(false)
    toast.success('Logout realizado com sucesso')
    router.push('/login')
  }, [router])

  // =============================================================================
  // EFEITO INICIAL
  // =============================================================================

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // =============================================================================
  // EFEITO DE REDIRECIONAMENTO
  // =============================================================================

  useEffect(() => {
    if (!loading && !isAdmin && router.pathname.startsWith('/admin')) {
      toast.error('Acesso negado. Redirecionando...')
      router.push('/')
    }
  }, [loading, isAdmin, router])

  return {
    user,
    loading,
    isAdmin,
    checkAuth,
    logout
  }
}

// =============================================================================
// HOOK PARA PROTEGER ROTAS ADMINISTRATIVAS
// =============================================================================

export const useAdminRoute = () => {
  const { user, loading, isAdmin } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/')
    }
  }, [loading, isAdmin, router])

  return {
    user,
    loading,
    isAdmin
  }
}

// =============================================================================
// HOOK PARA VERIFICAR PERMISSÕES ESPECÍFICAS
// =============================================================================

export const useAdminPermissions = () => {
  const { user } = useAdminAuth()

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false

    // Permissões baseadas no role
    const permissions = {
      admin: [
        'documents:read',
        'documents:write',
        'documents:delete',
        'users:read',
        'users:write',
        'users:delete',
        'system:config',
        'system:stats',
        'logs:read',
        'logs:export'
      ],
      moderator: [
        'documents:read',
        'documents:write',
        'users:read',
        'system:stats',
        'logs:read'
      ],
      user: [
        'documents:read'
      ]
    }

    return permissions[user.role as keyof typeof permissions]?.includes(permission) || false
  }, [user])

  const canManageDocuments = useCallback(() => {
    return hasPermission('documents:write')
  }, [hasPermission])

  const canDeleteDocuments = useCallback(() => {
    return hasPermission('documents:delete')
  }, [hasPermission])

  const canManageUsers = useCallback(() => {
    return hasPermission('users:write')
  }, [hasPermission])

  const canViewSystemStats = useCallback(() => {
    return hasPermission('system:stats')
  }, [hasPermission])

  const canViewLogs = useCallback(() => {
    return hasPermission('logs:read')
  }, [hasPermission])

  return {
    hasPermission,
    canManageDocuments,
    canDeleteDocuments,
    canManageUsers,
    canViewSystemStats,
    canViewLogs
  }
} 