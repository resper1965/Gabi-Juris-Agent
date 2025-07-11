import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { 
  IndexedDocument, 
  DocumentUpdatePayload, 
  DocumentStatus, 
  DocumentIndexingJob,
  ReindexLog,
  DocumentStats,
  DocumentFilters,
  PaginatedDocuments
} from '../types/documents'

// =============================================================================
// SERVIÇO DE INDEXAÇÃO DE DOCUMENTOS
// =============================================================================

export class DocumentIndexingService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // =============================================================================
  // ATUALIZAÇÃO DE DOCUMENTOS (ENDPOINT N8N)
  // =============================================================================

  async updateDocument(payload: DocumentUpdatePayload, apiKey: string): Promise<{
    success: boolean
    data: {
      documentId: string
      vectorId: string
      status: string
    }
    message: string
  }> {
    try {
      // Validar API key
      if (apiKey !== process.env.N8N_API_KEY) {
        throw new Error('Invalid API key')
      }

      // Gerar hash do conteúdo
      const contentHash = this.generateContentHash(payload.content)

      // Verificar se o documento já existe
      const existingDoc = await this.getDocumentByDocId(payload.docId, payload.userId)

      if (existingDoc && existingDoc.contentHash === contentHash) {
        return {
          success: true,
          data: {
            documentId: existingDoc.docId,
            vectorId: existingDoc.vectorId,
            status: existingDoc.status
          },
          message: 'Document already indexed with same content'
        }
      }

      // Processar vetorização via MCP
      const vectorizationResult = await this.vectorizeContent(payload)

      // Preparar dados para inserção/atualização
      const documentData = {
        doc_id: payload.docId,
        origin: payload.origin,
        filename: payload.filename,
        lang: payload.lang,
        content_hash: contentHash,
        last_modified: new Date(),
        last_indexed: new Date(),
        vector_id: vectorizationResult.vectorId,
        status: 'indexed',
        user_id: payload.userId,
        knowledge_bases: payload.knowledgeBases || ['default'],
        created_at: existingDoc ? existingDoc.createdAt : new Date(),
        updated_at: new Date()
      }

      // Inserir ou atualizar no banco
      const { data, error } = await this.supabase
        .from('supabase_docs_indexed')
        .upsert(documentData, {
          onConflict: 'doc_id,user_id'
        })
        .select()
        .single()

      if (error) throw error

      // Registrar log de reindexação
      await this.logReindexAction({
        userId: payload.userId,
        documentId: payload.docId,
        action: existingDoc ? 'update' : 'reindex',
        origin: payload.origin,
        status: 'success',
        details: {
          filename: payload.filename,
          vectorId: vectorizationResult.vectorId,
          processingTime: vectorizationResult.processingTime
        },
        ipAddress: 'n8n-workflow',
        userAgent: 'n8n-automation',
        timestamp: new Date()
      })

      return {
        success: true,
        data: {
          documentId: payload.docId,
          vectorId: vectorizationResult.vectorId,
          status: 'indexed'
        },
        message: 'Document indexed successfully'
      }
    } catch (error) {
      console.error('Erro na atualização do documento:', error)

      // Registrar log de erro
      await this.logReindexAction({
        userId: payload.userId,
        documentId: payload.docId,
        action: 'update',
        origin: payload.origin,
        status: 'error',
        details: {
          filename: payload.filename,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        },
        ipAddress: 'n8n-workflow',
        userAgent: 'n8n-automation',
        timestamp: new Date()
      })

      throw error
    }
  }

  // =============================================================================
  // STATUS DE DOCUMENTOS
  // =============================================================================

  async getDocumentStatus(userId: string, filters?: DocumentFilters): Promise<DocumentStatus[]> {
    try {
      let query = this.supabase
        .from('supabase_docs_indexed')
        .select('*')
        .eq('user_id', userId)

      // Aplicar filtros
      if (filters?.origin) {
        query = query.eq('origin', filters.origin)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.knowledgeBase) {
        query = query.contains('knowledge_bases', [filters.knowledgeBase])
      }

      if (filters?.dateFrom) {
        query = query.gte('last_indexed', filters.dateFrom.toISOString())
      }

      if (filters?.dateTo) {
        query = query.lte('last_indexed', filters.dateTo.toISOString())
      }

      if (filters?.search) {
        query = query.ilike('filename', `%${filters.search}%`)
      }

      const { data, error } = await query.order('last_indexed', { ascending: false })

      if (error) throw error

      return data.map(doc => ({
        docId: doc.doc_id,
        origin: doc.origin,
        filename: doc.filename,
        status: doc.status,
        lastUpdate: new Date(doc.last_indexed),
        knowledgeBases: doc.knowledge_bases || [],
        vectorId: doc.vector_id,
        errorMessage: doc.error_message
      }))
    } catch (error) {
      console.error('Erro ao buscar status dos documentos:', error)
      throw error
    }
  }

  // =============================================================================
  // REINDEXAÇÃO MANUAL
  // =============================================================================

  async reindexDocument(docId: string, userId: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<{
    success: boolean
    data: {
      jobId: string
      documentId: string
      status: string
      estimatedTime?: number
    }
    message: string
  }> {
    try {
      // Verificar se o documento existe
      const document = await this.getDocumentByDocId(docId, userId)
      if (!document) {
        throw new Error('Document not found')
      }

      // Criar job de reindexação
      const jobId = `reindex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const job: DocumentIndexingJob = {
        id: jobId,
        documentId: docId,
        userId,
        origin: document.origin,
        status: 'pending',
        priority,
        metadata: {
          filename: document.filename,
          lang: document.lang,
          contentHash: document.contentHash,
          knowledgeBases: document.knowledgeBases
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Salvar job no banco
      await this.saveIndexingJob(job)

      // Atualizar status do documento
      await this.updateDocumentStatus(docId, userId, 'pending')

      // Disparar processamento (pode ser via n8n ou processamento direto)
      await this.triggerReindexProcessing(job)

      return {
        success: true,
        data: {
          jobId,
          documentId: docId,
          status: 'processing',
          estimatedTime: this.estimateProcessingTime(priority)
        },
        message: 'Reindexing job created successfully'
      }
    } catch (error) {
      console.error('Erro na reindexação:', error)
      throw error
    }
  }

  // =============================================================================
  // VETORIZAÇÃO VIA MCP
  // =============================================================================

  private async vectorizeContent(payload: DocumentUpdatePayload): Promise<{
    vectorId: string
    processingTime: number
  }> {
    const startTime = Date.now()

    try {
      const mcpPayload = {
        text: payload.content,
        metadata: {
          userId: payload.userId,
          origin: payload.origin,
          docName: payload.filename,
          docId: payload.docId,
          lang: payload.lang,
          knowledgeBases: payload.knowledgeBases || ['default'],
          indexedAt: new Date().toISOString()
        }
      }

      const response = await fetch('http://localhost:8080/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mcpPayload)
      })

      if (!response.ok) {
        throw new Error(`MCP Server error: ${response.status}`)
      }

      const result = await response.json()
      const processingTime = Date.now() - startTime

      return {
        vectorId: result.indexId || `vector_${Date.now()}`,
        processingTime
      }
    } catch (error) {
      console.error('Erro na vetorização MCP:', error)
      throw error
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  private async getDocumentByDocId(docId: string, userId: string): Promise<IndexedDocument | null> {
    try {
      const { data, error } = await this.supabase
        .from('supabase_docs_indexed')
        .select('*')
        .eq('doc_id', docId)
        .eq('user_id', userId)
        .single()

      if (error || !data) return null

      return {
        id: data.id,
        docId: data.doc_id,
        origin: data.origin,
        filename: data.filename,
        lang: data.lang,
        contentHash: data.content_hash,
        lastModified: new Date(data.last_modified),
        lastIndexed: new Date(data.last_indexed),
        vectorId: data.vector_id,
        status: data.status,
        userId: data.user_id,
        knowledgeBases: data.knowledge_bases || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Erro ao buscar documento:', error)
      return null
    }
  }

  private async saveIndexingJob(job: DocumentIndexingJob): Promise<void> {
    try {
      await this.supabase
        .from('document_indexing_jobs')
        .insert({
          id: job.id,
          document_id: job.documentId,
          user_id: job.userId,
          origin: job.origin,
          status: job.status,
          priority: job.priority,
          metadata: job.metadata,
          created_at: job.createdAt,
          updated_at: job.updatedAt
        })
    } catch (error) {
      console.error('Erro ao salvar job:', error)
      throw error
    }
  }

  private async updateDocumentStatus(docId: string, userId: string, status: string): Promise<void> {
    try {
      await this.supabase
        .from('supabase_docs_indexed')
        .update({
          status,
          updated_at: new Date()
        })
        .eq('doc_id', docId)
        .eq('user_id', userId)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      throw error
    }
  }

  private async triggerReindexProcessing(job: DocumentIndexingJob): Promise<void> {
    try {
      // Aqui você pode integrar com n8n ou processar diretamente
      // Por enquanto, vamos simular um processamento assíncrono
      setTimeout(async () => {
        try {
          // Simular processamento
          await this.updateDocumentStatus(job.documentId, job.userId, 'indexed')
          
          // Atualizar job como completado
          await this.supabase
            .from('document_indexing_jobs')
            .update({
              status: 'completed',
              completed_at: new Date(),
              updated_at: new Date()
            })
            .eq('id', job.id)
        } catch (error) {
          console.error('Erro no processamento do job:', error)
        }
      }, 5000) // 5 segundos de delay
    } catch (error) {
      console.error('Erro ao disparar processamento:', error)
      throw error
    }
  }

  private estimateProcessingTime(priority: string): number {
    switch (priority) {
      case 'high': return 30 // 30 segundos
      case 'normal': return 60 // 1 minuto
      case 'low': return 120 // 2 minutos
      default: return 60
    }
  }

  private async logReindexAction(log: Omit<ReindexLog, 'id'>): Promise<void> {
    try {
      await this.supabase
        .from('reindex_logs')
        .insert({
          user_id: log.userId,
          document_id: log.documentId,
          action: log.action,
          origin: log.origin,
          status: log.status,
          details: log.details,
          ip_address: log.ipAddress,
          user_agent: log.userAgent,
          timestamp: log.timestamp
        })
    } catch (error) {
      console.error('Erro ao logar ação de reindexação:', error)
    }
  }

  // =============================================================================
  // ESTATÍSTICAS
  // =============================================================================

  async getDocumentStats(userId: string): Promise<DocumentStats> {
    try {
      const { data: documents, error } = await this.supabase
        .from('supabase_docs_indexed')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      const stats: DocumentStats = {
        total: documents.length,
        indexed: 0,
        pending: 0,
        error: 0,
        byOrigin: {
          google: 0,
          sharepoint: 0,
          manual: 0
        },
        byStatus: {
          pending: 0,
          indexed: 0,
          error: 0
        },
        averageProcessingTime: 0,
        lastIndexed: new Date(0)
      }

      documents.forEach(doc => {
        // Contar por status
        stats.byStatus[doc.status as keyof typeof stats.byStatus]++
        
        // Contar por origem
        stats.byOrigin[doc.origin as keyof typeof stats.byOrigin]++

        // Atualizar contadores gerais
        if (doc.status === 'indexed') stats.indexed++
        else if (doc.status === 'pending') stats.pending++
        else if (doc.status === 'error') stats.error++

        // Última indexação
        const lastIndexed = new Date(doc.last_indexed)
        if (lastIndexed > stats.lastIndexed) {
          stats.lastIndexed = lastIndexed
        }
      })

      return stats
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      throw error
    }
  }
} 