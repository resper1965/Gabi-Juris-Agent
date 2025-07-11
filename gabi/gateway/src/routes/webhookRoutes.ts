import { Router, Request, Response } from 'express'
import { WebhookService } from '../services/webhookService'
import { 
  webhookAuthMiddleware, 
  validateWebhookPayload, 
  webhookRateLimit, 
  webhookLogging, 
  webhookErrorHandler,
  AuthenticatedRequest 
} from '../middleware/authMiddleware'

// =============================================================================
// ROTAS DE WEBHOOK PARA DOCUMENTOS - GABI
// =============================================================================

const router = Router()
const webhookService = new WebhookService()

// =============================================================================
// MIDDLEWARE GLOBAL PARA WEBHOOKS
// =============================================================================

// Aplicar middlewares globais para todas as rotas de webhook
router.use(webhookLogging)
router.use(webhookRateLimit(60000, 100)) // 100 requests por minuto
router.use(webhookAuthMiddleware)

// =============================================================================
// ENDPOINT PRINCIPAL DE WEBHOOK
// =============================================================================

/**
 * POST /api/webhook/documents
 * Recebe notificações de documentos do n8n
 */
router.post('/documents', validateWebhookPayload, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = req.webhookPayload!
    const ipAddress = req.ip || 'unknown'
    const userAgent = req.get('User-Agent') || 'unknown'

    console.info('📥 Webhook recebido', {
      source: payload.source,
      event: payload.event,
      file_id: payload.file_id,
      filename: payload.filename,
      base_id: payload.base_id,
      ip: ipAddress,
      timestamp: new Date().toISOString()
    })

    // Processar webhook
    const result = await webhookService.processWebhook(payload, ipAddress, userAgent)

    // Retornar resposta
    return res.status(200).json(result)

  } catch (error) {
    console.error('❌ Erro no endpoint de webhook:', error)
    
    // Retornar 200 OK mesmo em caso de erro (conforme especificação)
    return res.status(200).json({
      success: false,
      message: 'Erro interno processado',
      timestamp: new Date().toISOString()
    })
  }
})

// =============================================================================
// ENDPOINT DE STATUS E SAÚDE
// =============================================================================

/**
 * GET /api/webhook/health
 * Verifica a saúde do serviço de webhook
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const stats = await webhookService.getWebhookStats()
    
    return res.status(200).json({
      success: true,
      message: 'Serviço de webhook funcionando',
      data: {
        status: 'healthy',
        stats,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Erro ao verificar saúde do webhook:', error)
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar saúde do serviço',
      timestamp: new Date().toISOString()
    })
  }
})

// =============================================================================
// ENDPOINT DE ESTATÍSTICAS
// =============================================================================

/**
 * GET /api/webhook/stats
 * Retorna estatísticas dos webhooks processados
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await webhookService.getWebhookStats()
    
    return res.status(200).json({
      success: true,
      message: 'Estatísticas obtidas com sucesso',
      data: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error)
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas',
      timestamp: new Date().toISOString()
    })
  }
})

// =============================================================================
// ENDPOINT DE TESTE
// =============================================================================

/**
 * POST /api/webhook/test
 * Endpoint para testar webhooks (apenas em desenvolvimento)
 */
router.post('/test', validateWebhookPayload, async (req: AuthenticatedRequest, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      message: 'Endpoint de teste não disponível em produção',
      timestamp: new Date().toISOString()
    })
  }

  try {
    const payload = req.webhookPayload!
    
    console.info('🧪 Teste de webhook', {
      source: payload.source,
      event: payload.event,
      file_id: payload.file_id,
      filename: payload.filename,
      base_id: payload.base_id,
      timestamp: new Date().toISOString()
    })

    // Simular processamento sem persistir
    const mockResult = {
      success: true,
      message: 'Teste de webhook executado com sucesso',
      data: {
        document_id: `test_${Date.now()}`,
        status: 'test',
        vector_id: payload.event !== 'deleted' ? `test_vector_${Date.now()}` : undefined
      },
      timestamp: new Date().toISOString()
    }

    return res.status(200).json(mockResult)

  } catch (error) {
    console.error('❌ Erro no teste de webhook:', error)
    
    return res.status(200).json({
      success: false,
      message: 'Erro no teste de webhook',
      timestamp: new Date().toISOString()
    })
  }
})

// =============================================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// =============================================================================

// Aplicar middleware de tratamento de erros
router.use(webhookErrorHandler)

export default router 