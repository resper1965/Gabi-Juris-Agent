import { Router, Request, Response } from 'express'
import { DocumentIndexingService } from '../services/documentIndexingService'
import { authMiddleware } from '../middlewares/authMiddleware'
import { rbacMiddleware } from '../middlewares/rbacMiddleware'
import { rateLimit } from 'express-rate-limit'
import { i18n } from '../utils/i18n'

// =============================================================================
// ROTAS PARA DOCUMENTOS INDEXADOS
// =============================================================================

const router = Router()
const documentService = new DocumentIndexingService()

// Rate limiting para endpoints de documentos
const documentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: {
    error: 'Too many requests from this IP',
    message: 'Rate limit exceeded. Please try again later.'
  }
})

// =============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO PARA N8N
// =============================================================================

const validateN8nApiKey = (req: Request, res: Response, next: Function) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
  
  if (!apiKey || apiKey !== process.env.N8N_API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid API key'
    })
  }
  
  next()
}

// =============================================================================
// ENDPOINT PARA ATUALIZAÇÃO DE DOCUMENTOS (N8N)
// =============================================================================

router.post('/update', validateN8nApiKey, documentRateLimit, async (req: Request, res: Response) => {
  try {
    const { origin, docId, filename, userId, lang, content, knowledgeBases } = req.body
    const apiKey = req.headers['x-api-key'] as string || req.headers['authorization']?.replace('Bearer ', '') as string

    // Validação dos campos obrigatórios
    if (!origin || !docId || !filename || !userId || !lang || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'origin, docId, filename, userId, lang, and content are required'
      })
    }

    // Validar origem
    if (!['google', 'sharepoint', 'manual'].includes(origin)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid origin',
        message: 'origin must be one of: google, sharepoint, manual'
      })
    }

    const result = await documentService.updateDocument({
      origin,
      docId,
      filename,
      userId,
      lang,
      content,
      knowledgeBases
    }, apiKey)

    res.status(200).json(result)
  } catch (error) {
    console.error('Erro no endpoint /update:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// =============================================================================
// ENDPOINT PARA STATUS DE DOCUMENTOS
// =============================================================================

router.get('/status', authMiddleware, rbacMiddleware(['user', 'admin']), documentRateLimit, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      })
    }

    // Parâmetros de filtro
    const filters = {
      origin: req.query.origin as 'google' | 'sharepoint' | 'manual' | undefined,
      status: req.query.status as 'pending' | 'indexed' | 'error' | undefined,
      knowledgeBase: req.query.knowledgeBase as string | undefined,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      search: req.query.search as string | undefined
    }

    const documents = await documentService.getDocumentStatus(userId, filters)

    res.status(200).json({
      success: true,
      data: documents,
      message: i18n.t('documents.status.retrieved', { count: documents.length })
    })
  } catch (error) {
    console.error('Erro no endpoint /status:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// =============================================================================
// ENDPOINT PARA REINDEXAÇÃO MANUAL
// =============================================================================

router.post('/reindex/:docId', authMiddleware, rbacMiddleware(['user', 'admin']), documentRateLimit, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const { docId } = req.params
    const { priority = 'normal' } = req.body

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      })
    }

    if (!docId) {
      return res.status(400).json({
        success: false,
        error: 'Missing document ID',
        message: 'Document ID is required'
      })
    }

    // Validar prioridade
    if (!['low', 'normal', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid priority',
        message: 'priority must be one of: low, normal, high'
      })
    }

    const result = await documentService.reindexDocument(docId, userId, priority)

    res.status(200).json(result)
  } catch (error) {
    console.error('Erro no endpoint /reindex:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// =============================================================================
// ENDPOINT PARA ESTATÍSTICAS DE DOCUMENTOS
// =============================================================================

router.get('/stats', authMiddleware, rbacMiddleware(['user', 'admin']), documentRateLimit, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      })
    }

    const stats = await documentService.getDocumentStats(userId)

    res.status(200).json({
      success: true,
      data: stats,
      message: i18n.t('documents.stats.retrieved')
    })
  } catch (error) {
    console.error('Erro no endpoint /stats:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// =============================================================================
// ENDPOINT PARA DETALHES DE UM DOCUMENTO ESPECÍFICO
// =============================================================================

router.get('/:docId', authMiddleware, rbacMiddleware(['user', 'admin']), documentRateLimit, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const { docId } = req.params

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      })
    }

    if (!docId) {
      return res.status(400).json({
        success: false,
        error: 'Missing document ID',
        message: 'Document ID is required'
      })
    }

    // Buscar documento específico
    const documents = await documentService.getDocumentStatus(userId, {})
    const document = documents.find(doc => doc.docId === docId)

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        message: 'Document not found or access denied'
      })
    }

    res.status(200).json({
      success: true,
      data: document,
      message: i18n.t('documents.details.retrieved')
    })
  } catch (error) {
    console.error('Erro no endpoint /:docId:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// =============================================================================
// ENDPOINT PARA EXCLUSÃO DE DOCUMENTO
// =============================================================================

router.delete('/:docId', authMiddleware, rbacMiddleware(['admin']), documentRateLimit, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const { docId } = req.params

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      })
    }

    if (!docId) {
      return res.status(400).json({
        success: false,
        error: 'Missing document ID',
        message: 'Document ID is required'
      })
    }

    // Implementar lógica de exclusão
    // Por enquanto, apenas retornar sucesso
    res.status(200).json({
      success: true,
      message: i18n.t('documents.delete.success')
    })
  } catch (error) {
    console.error('Erro no endpoint DELETE /:docId:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router 