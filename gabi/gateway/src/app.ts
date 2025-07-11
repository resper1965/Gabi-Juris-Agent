import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config()

// Importar rotas
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'
import documentRoutes from './routes/documentRoutes'
import webhookRoutes from './routes/webhookRoutes'

// =============================================================================
// CONFIGURAÇÃO DO EXPRESS
// =============================================================================

const app = express()

// =============================================================================
// MIDDLEWARES DE SEGURANÇA E PERFORMANCE
// =============================================================================

// Helmet para segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}))

// Compressão
app.use(compression())

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite por IP
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em breve.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)

// =============================================================================
// MIDDLEWARES DE PARSING
// =============================================================================

// Parse JSON
app.use(express.json({ 
  limit: '10mb' // Limite para webhooks com metadados grandes
}))

// Parse URL encoded
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}))

// =============================================================================
// MIDDLEWARE DE LOGGING
// =============================================================================

app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`)
  })
  
  next()
})

// =============================================================================
// ROTAS
// =============================================================================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GABI Gateway funcionando',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// Rotas de autenticação
app.use('/api/auth', authRoutes)

// Rotas de usuário
app.use('/api/users', userRoutes)

// Rotas de documentos
app.use('/api/documents', documentRoutes)

// Rotas de webhook (com autenticação específica)
app.use('/api/webhook', webhookRoutes)

// =============================================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// =============================================================================

// 404 - Rota não encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  })
})

// Tratamento de erros global
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro não tratado:', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString()
  })

  res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : error.message,
    timestamp: new Date().toISOString()
  })
})

// =============================================================================
// CONFIGURAÇÃO DE PORTA
// =============================================================================

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.info('🚀 GABI Gateway iniciado', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  })
})

export default app 