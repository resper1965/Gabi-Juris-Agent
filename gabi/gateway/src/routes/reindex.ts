import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/authMiddleware'
import { RBACMiddleware } from '../middleware/rbacMiddleware'
import { N8NService } from '../services/n8nService'
import { DocumentService } from '../services/documentService'
import { getLocalizedMessage, getSuccessMessage } from '../utils/i18n'

const router = Router()

// =============================================================================
// ROTA DE REINDEXAÇÃO INDIVIDUAL
// =============================================================================

/**
 * @route   POST /reindex/:documentId
 * @desc    Reindexa um documento específico
 * @access  Private
 */
router.post('/:documentId', authenticate, RBACMiddleware.requireUserOrAdmin, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user
    const { documentId } = req.params
    const lang = req.headers['x-lang'] as string || 'pt-BR'

    const n8nService = new N8NService()
    const documentService = new DocumentService()

    // Verificar se o documento existe e pertence ao usuário
    const document = await documentService.getDocumentMetadata(user.id, documentId)
    if (!document) {
      const message = getLocalizedMessage('document_not_found', lang)
      return res.status(404).json({
        success: false,
        error: message,
        timestamp: new Date()
      })
    }

    // Adicionar à fila de processamento
    const job = await n8nService.addToProcessingQueue(
      documentId,
      user.id,
      document.source,
      'normal'
    )

    // Disparar processamento imediato
    const execution = await n8nService.triggerDocumentProcessing(
      documentId,
      document.source,
      {
        originalName: document.name,
        fileSize: document.size,
        mimeType: document.type,
        userId: user.id
      }
    )

    const successMessage = getSuccessMessage('reindex_started', lang)

    res.json({
      success: true,
      data: {
        jobId: job.id,
        executionId: execution.id,
        status: 'processing',
        document: {
          id: document.id,
          name: document.name,
          source: document.source
        }
      },
      message: successMessage,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Erro na reindexação:', error)
    const message = getLocalizedMessage('reindex_failed', req.headers['x-lang'] as string || 'pt-BR')
    res.status(500).json({
      success: false,
      error: message,
      timestamp: new Date()
    })
  }
})

// =============================================================================
// ROTA DE REINDEXAÇÃO EM LOTE
// =============================================================================

/**
 * @route   POST /reindex/batch
 * @desc    Reindexa múltiplos documentos
 * @access  Private
 */
router.post('/batch', authenticate, RBACMiddleware.requireUserOrAdmin, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user
    const { source, documentIds } = req.body
    const lang = req.headers['x-lang'] as string || 'pt-BR'

    const n8nService = new N8NService()

    // Validação dos parâmetros
    if (source && !['google', 'sharepoint', 'all'].includes(source)) {
      const message = getLocalizedMessage('invalid_request', lang)
      return res.status(400).json({
        success: false,
        error: message,
        timestamp: new Date()
      })
    }

    // Reindexação em lote
    const result = await n8nService.reindexDocuments(user.id, source)

    const successMessage = getSuccessMessage('batch_reindex_started', lang)

    res.json({
      success: true,
      data: {
        total: result.total,
        processed: result.processed,
        failed: result.failed,
        jobs: result.jobs.map(job => ({
          id: job.id,
          documentId: job.documentId,
          status: job.status,
          priority: job.priority
        }))
      },
      message: successMessage,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Erro na reindexação em lote:', error)
    const message = getLocalizedMessage('batch_reindex_failed', req.headers['x-lang'] as string || 'pt-BR')
    res.status(500).json({
      success: false,
      error: message,
      timestamp: new Date()
    })
  }
})

// =============================================================================
// ROTA DE STATUS DE PROCESSAMENTO
// =============================================================================

/**
 * @route   GET /reindex/status/:jobId
 * @desc    Obtém status de um job de processamento
 * @access  Private
 */
router.get('/status/:jobId', authenticate, RBACMiddleware.requireUserOrAdmin, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user
    const { jobId } = req.params
    const lang = req.headers['x-lang'] as string || 'pt-BR'

    const n8nService = new N8NService()

    // Buscar jobs do usuário
    const jobs = await n8nService.getProcessingQueue(user.id)
    const job = jobs.find(j => j.id === jobId)

    if (!job) {
      const message = getLocalizedMessage('job_not_found', lang)
      return res.status(404).json({
        success: false,
        error: message,
        timestamp: new Date()
      })
    }

    // Se o job está processando, verificar status no n8n
    let executionStatus = null
    if (job.status === 'processing') {
      try {
        executionStatus = await n8nService.getExecutionStatus(job.workflowId)
      } catch (error) {
        console.error('Erro ao obter status da execução:', error)
      }
    }

    res.json({
      success: true,
      data: {
        job: {
          id: job.id,
          documentId: job.documentId,
          status: job.status,
          priority: job.priority,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          completedAt: job.completedAt,
          error: job.error
        },
        execution: executionStatus
      },
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Erro ao obter status do job:', error)
    const message = getLocalizedMessage('internal_server', req.headers['x-lang'] as string || 'pt-BR')
    res.status(500).json({
      success: false,
      error: message,
      timestamp: new Date()
    })
  }
})

// =============================================================================
// ROTA DE FILA DE PROCESSAMENTO
// =============================================================================

/**
 * @route   GET /reindex/queue
 * @desc    Lista jobs na fila de processamento
 * @access  Private
 */
router.get('/queue', authenticate, RBACMiddleware.requireUserOrAdmin, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user
    const { status, limit = 50 } = req.query

    const n8nService = new N8NService()

    // Buscar jobs do usuário
    let jobs = await n8nService.getProcessingQueue(user.id)

    // Filtrar por status se especificado
    if (status) {
      jobs = jobs.filter(job => job.status === status)
    }

    // Limitar resultados
    jobs = jobs.slice(0, parseInt(limit as string))

    res.json({
      success: true,
      data: {
        jobs: jobs.map(job => ({
          id: job.id,
          documentId: job.documentId,
          status: job.status,
          priority: job.priority,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          completedAt: job.completedAt
        })),
        total: jobs.length
      },
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Erro ao listar fila de processamento:', error)
    const message = getLocalizedMessage('internal_server', req.headers['x-lang'] as string || 'pt-BR')
    res.status(500).json({
      success: false,
      error: message,
      timestamp: new Date()
    })
  }
})

// =============================================================================
// ROTA DE ESTATÍSTICAS
// =============================================================================

/**
 * @route   GET /reindex/stats
 * @desc    Obtém estatísticas de processamento
 * @access  Private
 */
router.get('/stats', authenticate, RBACMiddleware.requireUserOrAdmin, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user

    const n8nService = new N8NService()
    const stats = await n8nService.getProcessingStats(user.id)

    res.json({
      success: true,
      data: {
        ...stats,
        averageProcessingTimeMinutes: Math.round(stats.averageProcessingTime / 60000)
      },
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)
    const message = getLocalizedMessage('internal_server', req.headers['x-lang'] as string || 'pt-BR')
    res.status(500).json({
      success: false,
      error: message,
      timestamp: new Date()
    })
  }
})

// =============================================================================
// ROTA DE CANDIDATOS PARA REINDEXAÇÃO
// =============================================================================

/**
 * @route   GET /reindex/candidates
 * @desc    Lista documentos candidatos para reindexação
 * @access  Private
 */
router.get('/candidates', authenticate, RBACMiddleware.requireUserOrAdmin, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user
    const { source, limit = 100 } = req.query

    const documentService = new DocumentService()

    // Buscar documentos que precisam de reindexação
    const { data: documents, error } = await documentService.supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_indexed', false)
      .limit(parseInt(limit as string))

    if (error) throw error

    // Filtrar por fonte se especificado
    let candidates = documents
    if (source && source !== 'all') {
      candidates = documents.filter(doc => doc.source === source)
    }

    res.json({
      success: true,
      data: {
        candidates: candidates.map(doc => ({
          id: doc.id,
          name: doc.name,
          source: doc.source,
          type: doc.type,
          lastModified: doc.last_modified,
          size: doc.size
        })),
        total: candidates.length
      },
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Erro ao buscar candidatos:', error)
    const message = getLocalizedMessage('internal_server', req.headers['x-lang'] as string || 'pt-BR')
    res.status(500).json({
      success: false,
      error: message,
      timestamp: new Date()
    })
  }
})

// =============================================================================
// ROTA DE CANCELAMENTO DE JOB
// =============================================================================

/**
 * @route   DELETE /reindex/cancel/:jobId
 * @desc    Cancela um job de processamento
 * @access  Private
 */
router.delete('/cancel/:jobId', authenticate, RBACMiddleware.requireUserOrAdmin, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user
    const { jobId } = req.params
    const lang = req.headers['x-lang'] as string || 'pt-BR'

    const n8nService = new N8NService()

    // Buscar job do usuário
    const jobs = await n8nService.getProcessingQueue(user.id)
    const job = jobs.find(j => j.id === jobId)

    if (!job) {
      const message = getLocalizedMessage('job_not_found', lang)
      return res.status(404).json({
        success: false,
        error: message,
        timestamp: new Date()
      })
    }

    if (job.status === 'completed' || job.status === 'failed') {
      const message = getLocalizedMessage('job_already_finished', lang)
      return res.status(400).json({
        success: false,
        error: message,
        timestamp: new Date()
      })
    }

    // Cancelar job
    await n8nService.updateJobStatus(jobId, 'failed', 'Cancelled by user')

    const successMessage = getSuccessMessage('job_cancelled', lang)

    res.json({
      success: true,
      message: successMessage,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Erro ao cancelar job:', error)
    const message = getLocalizedMessage('internal_server', req.headers['x-lang'] as string || 'pt-BR')
    res.status(500).json({
      success: false,
      error: message,
      timestamp: new Date()
    })
  }
})

// =============================================================================
// ROTA DE CONFIGURAÇÃO DE WORKFLOWS
// =============================================================================

/**
 * @route   POST /reindex/setup-workflows
 * @desc    Configura workflows n8n para processamento
 * @access  Private (Admin)
 */
router.post('/setup-workflows', authenticate, RBACMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const n8nService = new N8NService()
    const lang = req.headers['x-lang'] as string || 'pt-BR'

    // Criar workflows
    const processingWorkflow = await n8nService.createDocumentProcessingWorkflow()
    const reindexWorkflow = await n8nService.createReindexWorkflow()

    const successMessage = getSuccessMessage('workflows_created', lang)

    res.json({
      success: true,
      data: {
        processingWorkflow: {
          id: processingWorkflow.id,
          name: processingWorkflow.name,
          active: processingWorkflow.active
        },
        reindexWorkflow: {
          id: reindexWorkflow.id,
          name: reindexWorkflow.name,
          active: reindexWorkflow.active
        }
      },
      message: successMessage,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Erro ao configurar workflows:', error)
    const message = getLocalizedMessage('workflow_setup_failed', req.headers['x-lang'] as string || 'pt-BR')
    res.status(500).json({
      success: false,
      error: message,
      timestamp: new Date()
    })
  }
})

export default router 