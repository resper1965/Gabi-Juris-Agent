import { createClient } from '@supabase/supabase-js'
import { 
  DocumentWebhookPayload, 
  DocumentRecord, 
  WebhookResponse, 
  VectorizationRequest,
  VectorizationResponse,
  WebhookLog,
  WebhookValidationResult,
  WebhookProcessingResult
} from '../types/webhook'

// =============================================================================
// SERVIÇO DE WEBHOOKS DE DOCUMENTOS - GABI
// =============================================================================

export class WebhookService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // =============================================================================
  // VALIDAÇÃO DE PAYLOAD
  // =============================================================================

  validatePayload(payload: any): WebhookValidationResult {
    const errors: string[] = []

    // Validar campos obrigatórios
    if (!payload.source || !['google', 'sharepoint'].includes(payload.source)) {
      errors.push('source deve ser "google" ou "sharepoint"')
    }

    if (!payload.filename || typeof payload.filename !== 'string') {
      errors.push('filename é obrigatório e deve ser uma string')
    }

    if (!payload.file_id || typeof payload.file_id !== 'string') {
      errors.push('file_id é obrigatório e deve ser uma string')
    }

    if (!payload.last_modified || !this.isValidISODate(payload.last_modified)) {
      errors.push('last_modified deve ser uma data ISO válida')
    }

    if (!payload.base_id || typeof payload.base_id !== 'string') {
      errors.push('base_id é obrigatório e deve ser uma string')
    }

    if (!payload.event || !['created', 'modified', 'deleted'].includes(payload.event)) {
      errors.push('event deve ser "created", "modified" ou "deleted"')
    }

    return {
      isValid: errors.length === 0,
      errors,
      payload: errors.length === 0 ? payload as DocumentWebhookPayload : undefined
    }
  }

  private isValidISODate(dateString: string): boolean {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }

  // =============================================================================
  // PROCESSAMENTO DE WEBHOOK
  // =============================================================================

  async processWebhook(payload: DocumentWebhookPayload, ipAddress: string, userAgent: string): Promise<WebhookResponse> {
    const startTime = Date.now()
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      console.info('🔄 Processando webhook', {
        webhook_id: webhookId,
        source: payload.source,
        event: payload.event,
        file_id: payload.file_id,
        filename: payload.filename,
        base_id: payload.base_id,
        timestamp: new Date().toISOString()
      })

      // Verificar se o documento já existe
      const existingDocument = await this.getDocumentByFileId(payload.file_id)

      let documentId: string
      let status: string = 'pending'

      if (payload.event === 'deleted') {
        // Para exclusões, marcar como deletado
        if (existingDocument) {
          await this.updateDocumentStatus(existingDocument.id, 'deleted')
          documentId = existingDocument.id
          status = 'deleted'
        } else {
          // Criar registro de documento deletado
          const newDoc = await this.createDocumentRecord({
            ...payload,
            status: 'deleted'
          })
          documentId = newDoc.id
          status = 'deleted'
        }
      } else {
        // Para criação/modificação
        if (existingDocument) {
          // Atualizar documento existente
          await this.updateDocumentRecord(existingDocument.id, {
            filename: payload.filename,
            last_modified: new Date(payload.last_modified),
            event: payload.event,
            status: 'pending',
            metadata: payload.metadata
          })
          documentId = existingDocument.id
        } else {
          // Criar novo documento
          const newDoc = await this.createDocumentRecord({
            ...payload,
            status: 'pending'
          })
          documentId = newDoc.id
        }

        // Processar vetorização se não for exclusão
        if (payload.event !== 'deleted') {
          const vectorizationResult = await this.processVectorization(payload, documentId)
          status = vectorizationResult.success ? 'indexed' : 'error'
          
          // Atualizar status baseado no resultado da vetorização
          await this.updateDocumentStatus(documentId, status, {
            vector_id: vectorizationResult.vector_id,
            error_message: vectorizationResult.error
          })
        }
      }

      const processingTime = Date.now() - startTime

      // Registrar log de sucesso
      await this.logWebhookEvent({
        webhook_id: webhookId,
        source: payload.source,
        event: payload.event,
        file_id: payload.file_id,
        filename: payload.filename,
        status: 'success',
        processing_time: processingTime,
        ip_address: ipAddress,
        user_agent: userAgent
      })

      console.info('✅ Webhook processado com sucesso', {
        webhook_id: webhookId,
        document_id: documentId,
        status,
        processing_time: processingTime,
        vector_id: status === 'indexed' ? 'vector_id' : undefined
      })

      return {
        success: true,
        message: `Documento ${payload.event} com sucesso`,
        data: {
          document_id: documentId,
          status,
          vector_id: status === 'indexed' ? 'vector_id' : undefined
        },
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

      console.error('❌ Erro ao processar webhook', {
        webhook_id: webhookId,
        source: payload.source,
        event: payload.event,
        file_id: payload.file_id,
        error: errorMessage,
        processing_time: processingTime
      })

      // Registrar log de erro
      await this.logWebhookEvent({
        webhook_id: webhookId,
        source: payload.source,
        event: payload.event,
        file_id: payload.file_id,
        filename: payload.filename,
        status: 'error',
        processing_time: processingTime,
        error_message: errorMessage,
        ip_address: ipAddress,
        user_agent: userAgent
      })

      // Retornar 200 OK mesmo em caso de erro (conforme especificação)
      return {
        success: false,
        message: 'Erro interno processado',
        timestamp: new Date().toISOString()
      }
    }
  }

  // =============================================================================
  // OPERAÇÕES DE BANCO DE DADOS
  // =============================================================================

  private async getDocumentByFileId(fileId: string): Promise<DocumentRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from('webhook_documents')
        .select('*')
        .eq('file_id', fileId)
        .single()

      if (error || !data) return null

      return {
        id: data.id,
        source: data.source,
        filename: data.filename,
        file_id: data.file_id,
        last_modified: new Date(data.last_modified),
        base_id: data.base_id,
        event: data.event,
        status: data.status,
        user_id: data.user_id,
        metadata: data.metadata,
        vector_id: data.vector_id,
        error_message: data.error_message,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Erro ao buscar documento:', error)
      return null
    }
  }

  private async createDocumentRecord(payload: DocumentWebhookPayload & { status: string }): Promise<DocumentRecord> {
    try {
      const documentData = {
        source: payload.source,
        filename: payload.filename,
        file_id: payload.file_id,
        last_modified: new Date(payload.last_modified),
        base_id: payload.base_id,
        event: payload.event,
        status: payload.status,
        user_id: payload.user_id,
        metadata: payload.metadata,
        created_at: new Date(),
        updated_at: new Date()
      }

      const { data, error } = await this.supabase
        .from('webhook_documents')
        .insert(documentData)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        source: data.source,
        filename: data.filename,
        file_id: data.file_id,
        last_modified: new Date(data.last_modified),
        base_id: data.base_id,
        event: data.event,
        status: data.status,
        user_id: data.user_id,
        metadata: data.metadata,
        vector_id: data.vector_id,
        error_message: data.error_message,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Erro ao criar documento:', error)
      throw error
    }
  }

  private async updateDocumentRecord(documentId: string, updates: Partial<DocumentRecord>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('webhook_documents')
        .update({
          ...updates,
          updated_at: new Date()
        })
        .eq('id', documentId)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao atualizar documento:', error)
      throw error
    }
  }

  private async updateDocumentStatus(documentId: string, status: string, additionalData?: { vector_id?: string; error_message?: string }): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date()
      }

      if (additionalData?.vector_id) {
        updateData.vector_id = additionalData.vector_id
      }

      if (additionalData?.error_message) {
        updateData.error_message = additionalData.error_message
      }

      const { error } = await this.supabase
        .from('webhook_documents')
        .update(updateData)
        .eq('id', documentId)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao atualizar status do documento:', error)
      throw error
    }
  }

  // =============================================================================
  // VETORIZAÇÃO
  // =============================================================================

  private async processVectorization(payload: DocumentWebhookPayload, documentId: string): Promise<VectorizationResponse> {
    const startTime = Date.now()

    try {
      console.info('🔍 Iniciando vetorização', {
        document_id: documentId,
        file_id: payload.file_id,
        filename: payload.filename,
        source: payload.source,
        base_id: payload.base_id
      })

      const vectorizationRequest: VectorizationRequest = {
        file_id: payload.file_id,
        filename: payload.filename,
        source: payload.source,
        base_id: payload.base_id,
        metadata: payload.metadata
      }

      // Chamar serviço de vetorização
      const response = await fetch(`http://localhost:3000/api/vectorize/${payload.file_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal-key'}`
        },
        body: JSON.stringify(vectorizationRequest)
      })

      if (!response.ok) {
        throw new Error(`Erro na vetorização: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      const processingTime = Date.now() - startTime

      console.info('✅ Vetorização concluída', {
        document_id: documentId,
        file_id: payload.file_id,
        success: result.success,
        vector_id: result.vector_id,
        processing_time: processingTime
      })

      return {
        success: result.success,
        vector_id: result.vector_id,
        error: result.error,
        processing_time: processingTime
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na vetorização'

      console.error('❌ Erro na vetorização', {
        document_id: documentId,
        file_id: payload.file_id,
        error: errorMessage,
        processing_time: processingTime
      })

      return {
        success: false,
        error: errorMessage,
        processing_time: processingTime
      }
    }
  }

  // =============================================================================
  // LOGS E AUDITORIA
  // =============================================================================

  private async logWebhookEvent(logData: Omit<WebhookLog, 'id'>): Promise<void> {
    try {
      await this.supabase
        .from('webhook_logs')
        .insert({
          webhook_id: logData.webhook_id,
          source: logData.source,
          event: logData.event,
          file_id: logData.file_id,
          filename: logData.filename,
          status: logData.status,
          processing_time: logData.processing_time,
          error_message: logData.error_message,
          ip_address: logData.ip_address,
          user_agent: logData.user_agent,
          timestamp: logData.timestamp
        })
    } catch (error) {
      console.error('Erro ao logar evento de webhook:', error)
    }
  }

  // =============================================================================
  // ESTATÍSTICAS
  // =============================================================================

  async getWebhookStats(): Promise<WebhookStats> {
    try {
      const { data: logs, error } = await this.supabase
        .from('webhook_logs')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h

      if (error) throw error

      const stats = {
        total_webhooks: logs.length,
        successful: 0,
        failed: 0,
        by_source: {
          google: 0,
          sharepoint: 0
        },
        by_event: {
          created: 0,
          modified: 0,
          deleted: 0
        },
        total_processing_time: 0,
        last_webhook: new Date(0)
      }

      logs.forEach(log => {
        if (log.status === 'success') stats.successful++
        else stats.failed++

        stats.by_source[log.source as keyof typeof stats.by_source]++
        stats.by_event[log.event as keyof typeof stats.by_event]++

        stats.total_processing_time += log.processing_time

        const logDate = new Date(log.timestamp)
        if (logDate > stats.last_webhook) {
          stats.last_webhook = logDate
        }
      })

      return {
        total_webhooks: stats.total_webhooks,
        successful: stats.successful,
        failed: stats.failed,
        by_source: stats.by_source,
        by_event: stats.by_event,
        average_processing_time: stats.total_webhooks > 0 ? stats.total_processing_time / stats.total_webhooks : 0,
        last_webhook: stats.last_webhook
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas de webhook:', error)
      throw error
    }
  }
} 