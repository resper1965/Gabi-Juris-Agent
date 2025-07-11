import { useState, useEffect } from 'react'
import { 
  login, 
  logout, 
  getCurrentUser, 
  getAuthToken, 
  setupTokenRefresh,
  LoginCredentials,
  LoginResponse
} from '@/lib/api'

interface User {
  id: string
  email: string
  role: string
  name?: string
  avatar_url?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false
  })

  useEffect(() => {
    // Configurar renovação automática de token
    setupTokenRefresh()
    
    // Verificar autenticação inicial
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false
        }))
        return
      }

      // Validar token com o backend
      const response = await getCurrentUser()
      if (response.success) {
        setAuthState({
          user: response.data,
          isLoading: false,
          error: null,
          isAuthenticated: true
        })
      } else {
        // Token inválido
        setAuthState({
          user: null,
          isLoading: false,
          error: null,
          isAuthenticated: false
        })
      }
    } catch (error) {
      setAuthState({
        user: null,
        isLoading: false,
        error: 'Erro ao verificar autenticação',
        isAuthenticated: false
      })
    }
  }

  const loginUser = async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response: LoginResponse = await login(credentials)
      
      if (response.success) {
        setAuthState({
          user: response.data.user,
          isLoading: false,
          error: null,
          isAuthenticated: true
        })
        return true
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.message || 'Erro no login'
        }))
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro de conexão'
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      return false
    }
  }

  const logoutUser = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Erro no logout:', error)
    } finally {
      setAuthState({
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: false
      })
    }
  }

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }))
  }

  return {
    ...authState,
    login: loginUser,
    logout: logoutUser,
    clearError,
    checkAuth
  }
} 