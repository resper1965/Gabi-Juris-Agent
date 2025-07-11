import { Router, Request, Response } from 'express'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { AuthMiddleware } from '../middleware/auth'
import { supabaseService } from '../services/supabase'
import { APIResponse, User } from '../types'
import { supabaseConfig } from '../config'

const router = Router()

// =============================================================================
// ROTAS DE AUTENTICAÇÃO
// =============================================================================

/**
 * @route   POST /auth/login
 * @desc    Login com Supabase Auth REST + JWT local
 * @access  Public
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
        timestamp: new Date()
      })
    }

    // Autenticação via Supabase Auth REST
    const authResponse = await axios.post(`${supabaseConfig.url}/auth/v1/token?grant_type=password`, {
      email,
      password
    }, {
      headers: {
        'apikey': supabaseConfig.anonKey,
        'Content-Type': 'application/json'
      }
    })

    const { access_token, user: supabaseUser } = authResponse.data

    if (!supabaseUser) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
        timestamp: new Date()
      })
    }

    // Busca ou cria usuário no banco local
    let user = await supabaseService.getUserById(supabaseUser.id)
    
    if (!user) {
      // Cria usuário se não existir
      user = await supabaseService.createUser({
        id: supabaseUser.id,
        email: supabaseUser.email,
        role: 'estagiario', // Role padrão
        name: supabaseUser.user_metadata?.name,
        avatar_url: supabaseUser.user_metadata?.avatar_url
      })
    }

    // Gera JWT local com payload customizado
    const jwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenant: user.metadata?.tenant || 'default',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    }

    const localJWT = jwt.sign(jwtPayload, supabaseConfig.jwtSecret)

    const response: APIResponse<{
      token: string
      user: User
      expiresIn: number
    }> = {
      success: true,
      data: {
        token: localJWT,
        user,
        expiresIn: 24 * 60 * 60
      },
      message: 'Login realizado com sucesso',
      timestamp: new Date()
    }

    res.json(response)
  } catch (error: any) {
    console.error('Erro no login:', error)
    
    let errorMessage = 'Erro interno do servidor'
    let statusCode = 500

    if (error.response?.status === 400) {
      errorMessage = 'Credenciais inválidas'
      statusCode = 401
    } else if (error.response?.status === 422) {
      errorMessage = 'Dados de entrada inválidos'
      statusCode = 400
    }
    
    const response: APIResponse = {
      success: false,
      error: errorMessage,
      timestamp: new Date()
    }
    
    res.status(statusCode).json(response)
  }
})

/**
 * @route   GET /auth/me
 * @desc    Obtém informações do usuário autenticado
 * @access  Private
 */
router.get('/me', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user as User

    const response: APIResponse<User> = {
      success: true,
      data: user,
      timestamp: new Date()
    }

    res.json(response)
  } catch (error) {
    console.error('Erro ao obter usuário:', error)
    
    const response: APIResponse = {
      success: false,
      error: 'Erro interno do servidor',
      timestamp: new Date()
    }
    
    res.status(500).json(response)
  }
})

/**
 * @route   PUT /auth/profile
 * @desc    Atualiza perfil do usuário
 * @access  Private
 */
router.put('/profile', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user as User
    const { name, avatar_url, metadata } = req.body

    const updatedUser = await supabaseService.updateUser(user.id, {
      name,
      avatar_url,
      metadata
    })

    const response: APIResponse<User> = {
      success: true,
      data: updatedUser,
      message: 'Perfil atualizado com sucesso',
      timestamp: new Date()
    }

    res.json(response)
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    
    const response: APIResponse = {
      success: false,
      error: 'Erro ao atualizar perfil',
      timestamp: new Date()
    }
    
    res.status(500).json(response)
  }
})

/**
 * @route   POST /auth/refresh
 * @desc    Renova token de autenticação
 * @access  Private
 */
router.post('/refresh', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user as User

    // Gera novo JWT local
    const jwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenant: user.metadata?.tenant || 'default',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    }

    const newToken = jwt.sign(jwtPayload, supabaseConfig.jwtSecret)
    
    const response: APIResponse<{ token: string; user: User }> = {
      success: true,
      data: {
        token: newToken,
        user
      },
      message: 'Token renovado com sucesso',
      timestamp: new Date()
    }

    res.json(response)
  } catch (error) {
    console.error('Erro ao renovar token:', error)
    
    const response: APIResponse = {
      success: false,
      error: 'Erro ao renovar token',
      timestamp: new Date()
    }
    
    res.status(500).json(response)
  }
})

/**
 * @route   POST /auth/logout
 * @desc    Faz logout do usuário
 * @access  Private
 */
router.post('/logout', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    // Aqui você pode implementar lógica de logout
    // Por exemplo, invalidar tokens, limpar sessões, etc.
    
    const response: APIResponse = {
      success: true,
      message: 'Logout realizado com sucesso',
      timestamp: new Date()
    }

    res.json(response)
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
    
    const response: APIResponse = {
      success: false,
      error: 'Erro ao fazer logout',
      timestamp: new Date()
    }
    
    res.status(500).json(response)
  }
})

// =============================================================================
// ROTAS ADMINISTRATIVAS (APENAS ADMIN)
// =============================================================================

/**
 * @route   GET /auth/users
 * @desc    Lista todos os usuários (apenas admin)
 * @access  Private/Admin
 */
router.get('/users', 
  AuthMiddleware.requireAuth, 
  AuthMiddleware.requireRole(['admin']), 
  async (req: Request, res: Response) => {
    try {
      // Implementar listagem de usuários
      // Por enquanto, retorna lista vazia
      
      const response: APIResponse<User[]> = {
        success: true,
        data: [],
        timestamp: new Date()
      }

      res.json(response)
    } catch (error) {
      console.error('Erro ao listar usuários:', error)
      
      const response: APIResponse = {
        success: false,
        error: 'Erro ao listar usuários',
        timestamp: new Date()
      }
      
      res.status(500).json(response)
    }
  }
)

/**
 * @route   GET /auth/users/:id
 * @desc    Obtém usuário específico (apenas admin)
 * @access  Private/Admin
 */
router.get('/users/:id', 
  AuthMiddleware.requireAuth, 
  AuthMiddleware.requireRole(['admin']), 
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const user = await supabaseService.getUserById(id)

      if (!user) {
        const response: APIResponse = {
          success: false,
          error: 'Usuário não encontrado',
          timestamp: new Date()
        }
        return res.status(404).json(response)
      }

      const response: APIResponse<User> = {
        success: true,
        data: user,
        timestamp: new Date()
      }

      res.json(response)
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      
      const response: APIResponse = {
        success: false,
        error: 'Erro ao buscar usuário',
        timestamp: new Date()
      }
      
      res.status(500).json(response)
    }
  }
)

/**
 * @route   PUT /auth/users/:id
 * @desc    Atualiza usuário específico (apenas admin)
 * @access  Private/Admin
 */
router.put('/users/:id', 
  AuthMiddleware.requireAuth, 
  AuthMiddleware.requireRole(['admin']), 
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { name, email, role, avatar_url, metadata } = req.body

      const updatedUser = await supabaseService.updateUser(id, {
        name,
        email,
        role,
        avatar_url,
        metadata
      })

      const response: APIResponse<User> = {
        success: true,
        data: updatedUser,
        message: 'Usuário atualizado com sucesso',
        timestamp: new Date()
      }

      res.json(response)
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      
      const response: APIResponse = {
        success: false,
        error: 'Erro ao atualizar usuário',
        timestamp: new Date()
      }
      
      res.status(500).json(response)
    }
  }
)

/**
 * @route   DELETE /auth/users/:id
 * @desc    Remove usuário específico (apenas admin)
 * @access  Private/Admin
 */
router.delete('/users/:id', 
  AuthMiddleware.requireAuth, 
  AuthMiddleware.requireRole(['admin']), 
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      await supabaseService.deleteUser(id)

      const response: APIResponse = {
        success: true,
        message: 'Usuário removido com sucesso',
        timestamp: new Date()
      }

      res.json(response)
    } catch (error) {
      console.error('Erro ao remover usuário:', error)
      
      const response: APIResponse = {
        success: false,
        error: 'Erro ao remover usuário',
        timestamp: new Date()
      }
      
      res.status(500).json(response)
    }
  }
)

// =============================================================================
// ROTAS DE HEALTH CHECK
// =============================================================================

/**
 * @route   GET /auth/health
 * @desc    Verifica saúde do serviço de autenticação
 * @access  Public
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await supabaseService.healthCheck()

    const response: APIResponse<{ status: string; timestamp: Date }> = {
      success: isHealthy,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date()
      },
      timestamp: new Date()
    }

    res.status(isHealthy ? 200 : 503).json(response)
  } catch (error) {
    console.error('Erro no health check:', error)
    
    const response: APIResponse = {
      success: false,
      error: 'Erro no health check',
      timestamp: new Date()
    }
    
    res.status(503).json(response)
  }
})

export default router 