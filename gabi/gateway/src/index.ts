import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import dotenv from 'dotenv'

// Carrega variáveis de ambiente
dotenv.config()

// Importa configurações
import { serverConfig } from './config'

// Importa middlewares
import { AuthMiddleware } from './middleware/auth'
import { RBACMiddleware } from './middleware/rbac'
import { LogMiddleware } from './middleware/log'

// Importa rotas
import authRoutes from './routes/auth'
import chatRoutes from './routes/chat'
import personalizationRoutes from './routes/personalization'
import oauthRoutes from './routes/oauth'
import documentRoutes from './routes/documents'
import reindexRoutes from './routes/reindex'

// Importa serviços
import { supabaseService } from './services/supabase'
import { mcpService } from './services/mcpClient'
import { ragService } from './services/ragService'
import { evoaiService } from './services/evoai'

// =============================================================================
// CONFIGURAÇÃO DO SERVIDOR
// =============================================================================

const app = express()

// =============================================================================
// MIDDLEWARES DE SEGURANÇA
// =============================================================================

// Helmet para headers de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}))

// CORS
app.use(cors({
  origin: serverConfig.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite por IP
  message: {
    success: false,
    error: 'Muitas requisições, tente novamente em alguns minutos',
    timestamp: new Date()
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', limiter)

// Rate limiting específico para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de login
  message: {
    success: false,
    error: 'Muitas tentativas de login, tente novamente em alguns minutos',
    timestamp: new Date()
  }
})

app.use('/api/auth/login', authLimiter)

// =============================================================================
// MIDDLEWARES DE PROCESSAMENTO
// =============================================================================

// Compressão
app.use(compression())

// Parsing de JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging
app.use(morgan('combined'))
app.use(LogMiddleware.logRequest)
app.use(LogMiddleware.logPerformance)

// =============================================================================
// ROTAS DE SAÚDE
// =============================================================================

app.get('/health', async (req, res) => {
  try {
    const healthChecks = {
      server: true,
      supabase: await supabaseService.healthCheck(),
      mcp: await mcpService.healthCheck(),
      rag: await ragService.healthCheck(),
      evoai: await evoaiService.healthCheck()
    }

    const isHealthy = Object.values(healthChecks).every(check => check === true)

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        checks: healthChecks,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      }
    })
  } catch (error) {
    console.error('Erro no health check:', error)
    
    res.status(503).json({
      success: false,
      error: 'Erro no health check',
      timestamp: new Date()
    })
  }
})

app.get('/ready', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor pronto',
    timestamp: new Date().toISOString()
  })
})

// =============================================================================
// ROTAS DA API
// =============================================================================

// Prefixo da API
const apiPrefix = '/api/v1'

// Rotas de autenticação
app.use(`${apiPrefix}/auth`, authRoutes)

// Rotas de chat (requerem autenticação)
app.use(`${apiPrefix}/chat`, AuthMiddleware.requireAuth, chatRoutes)

// Rotas de personalização (requerem autenticação)
app.use(`${apiPrefix}/personalization`, AuthMiddleware.requireAuth, personalizationRoutes)

// Rotas de OAuth (públicas para callbacks, privadas para gerenciamento)
app.use(`${apiPrefix}/auth`, oauthRoutes)

// Rotas de documentos (requerem autenticação)
app.use(`${apiPrefix}/docs`, documentRoutes)

// Rotas de reindexação (requerem autenticação)
app.use(`${apiPrefix}/reindex`, reindexRoutes)

// =============================================================================
// ROTAS DE ADMINISTRAÇÃO
// =============================================================================

// Middleware para rotas administrativas
const adminRoutes = express.Router()

// Health checks detalhados
adminRoutes.get('/health/detailed', 
  AuthMiddleware.requireAuth, 
  RBACMiddleware.requireAdmin,
  async (req, res) => {
    try {
      const detailedChecks = {
        supabase: {
          connection: await supabaseService.healthCheck(),
          users: await supabaseService.getUserCount()
        },
        mcp: {
          connection: await mcpService.healthCheck(),
          servers: await mcpService.listServers()
        },
        rag: {
          connection: await ragService.healthCheck(),
          bases: ['jurisprudencia-stf', 'jurisprudencia-stj', 'legislacao-federal']
        },
        evoai: {
          connection: await evoaiService.healthCheck(),
          workflows: await evoaiService.listWorkflows()
        }
      }

      res.json({
        success: true,
        data: detailedChecks,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Erro no health check detalhado:', error)
      
      res.status(500).json({
        success: false,
        error: 'Erro no health check detalhado',
        timestamp: new Date()
      })
    }
  }
)

// Teste de agente MCP
adminRoutes.post('/test/mcp', 
  AuthMiddleware.requireAuth, 
  RBACMiddleware.requireAdmin,
  async (req, res) => {
    try {
      const { agentId } = req.body
      
      if (!agentId) {
        return res.status(400).json({
          success: false,
          error: 'agentId é obrigatório',
          timestamp: new Date()
        })
      }

      const testResponse = await mcpService.testJurisprudenciaAgent()

      res.json({
        success: true,
        data: testResponse,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Erro no teste MCP:', error)
      
      res.status(500).json({
        success: false,
        error: 'Erro no teste MCP',
        timestamp: new Date()
      })
    }
  }
)

// Teste de busca RAG
adminRoutes.post('/test/rag', 
  AuthMiddleware.requireAuth, 
  RBACMiddleware.requireAdmin,
  async (req, res) => {
    try {
      const { query, baseIds } = req.body
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'query é obrigatório',
          timestamp: new Date()
        })
      }

      const ragResult = await ragService.search({
        query,
        baseIds: baseIds || ['jurisprudencia-stf'],
        limit: 3
      })

      res.json({
        success: true,
        data: ragResult,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Erro no teste RAG:', error)
      
      res.status(500).json({
        success: false,
        error: 'Erro no teste RAG',
        timestamp: new Date()
      })
    }
  }
)

// Teste de workflow EvoAI
adminRoutes.post('/test/workflow', 
  AuthMiddleware.requireAuth, 
  RBACMiddleware.requireAdmin,
  async (req, res) => {
    try {
      const { workflowId, input } = req.body
      
      if (!workflowId) {
        return res.status(400).json({
          success: false,
          error: 'workflowId é obrigatório',
          timestamp: new Date()
        })
      }

      const workflowResult = await evoaiService.executeWorkflow(workflowId, input || {})

      res.json({
        success: true,
        data: workflowResult,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Erro no teste workflow:', error)
      
      res.status(500).json({
        success: false,
        error: 'Erro no teste workflow',
        timestamp: new Date()
      })
    }
  }
)

// Aplica rotas administrativas
app.use(`${apiPrefix}/admin`, adminRoutes)

// =============================================================================
// ROTAS DE DOCUMENTAÇÃO
// =============================================================================

app.get(`${apiPrefix}/docs`, (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Gabi Gateway API',
      version: '1.0.0',
      description: 'API Gateway para o sistema Gabi - Assistente Jurídico',
      endpoints: {
        auth: {
          'POST /login': 'Autenticação com Supabase',
          'GET /me': 'Informações do usuário',
          'PUT /profile': 'Atualizar perfil',
          'POST /refresh': 'Renovar token',
          'POST /logout': 'Logout'
        },
        chat: {
          'POST /': 'Enviar mensagem para agente',
          'GET /agents': 'Listar agentes disponíveis',
          'GET /bases': 'Listar bases de conhecimento',
          'GET /sessions/:sessionId': 'Histórico de sessão'
        },
        personalization: {
          'GET /config': 'Configurações de personalização',
          'GET /assistant': 'Configuração atual da assistente',
          'PUT /assistant': 'Atualizar personalização',
          'DELETE /assistant': 'Remover personalização',
          'GET /templates': 'Templates disponíveis',
          'POST /apply-template': 'Aplicar template',
          'POST /avatar/upload': 'Upload de avatar'
        },
        oauth: {
          'GET /google': 'Redirecionamento para Google OAuth',
          'GET /google/callback': 'Callback Google OAuth',
          'GET /microsoft': 'Redirecionamento para Microsoft OAuth',
          'GET /microsoft/callback': 'Callback Microsoft OAuth',
          'GET /tokens': 'Listar tokens OAuth do usuário',
          'DELETE /revoke': 'Revogar acesso OAuth',
          'POST /refresh': 'Atualizar token OAuth'
        },
        documents: {
          'GET /list': 'Listar documentos do Google Drive e SharePoint',
          'POST /extract': 'Extrair texto de documentos',
          'POST /index': 'Indexar conteúdo no MCP Server',
          'POST /sync': 'Sincronizar documentos',
          'GET /:docId/metadata': 'Metadados de documento específico',
          'DELETE /:docId': 'Excluir documento'
        },
        admin: {
          'GET /health/detailed': 'Health check detalhado',
          'POST /test/mcp': 'Testar agente MCP',
          'POST /test/rag': 'Testar busca RAG',
          'POST /test/workflow': 'Testar workflow EvoAI'
        }
      },
      authentication: 'Bearer Token (JWT)',
      rateLimiting: '100 requests per 15 minutes',
      cors: 'Enabled for configured origins',
      personalization: 'Customizable assistant name, avatar, and personality'
    },
    timestamp: new Date().toISOString()
  })
})

// =============================================================================
// MIDDLEWARE DE ERRO
// =============================================================================

// Middleware para capturar erros
app.use(LogMiddleware.logError)

// Middleware para erros 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date()
  })
})

// Middleware global de erro
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro global:', error)
  
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    timestamp: new Date()
  })
})

// =============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// =============================================================================

const PORT = serverConfig.port

app.listen(PORT, () => {
  console.log(`🚀 Gabi Gateway iniciado na porta ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`📚 API Docs: http://localhost:${PORT}/api/v1/docs`)
  console.log(`🔧 Admin: http://localhost:${PORT}/api/v1/admin`)
  console.log(`🎨 Personalização: http://localhost:${PORT}/api/v1/personalization`)
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`)
  console.log(`⏰ Iniciado em: ${new Date().toISOString()}`)
})

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...')
  process.exit(0)
})

// =============================================================================
// EXPORTAÇÃO PARA TESTES
// =============================================================================

export default app 