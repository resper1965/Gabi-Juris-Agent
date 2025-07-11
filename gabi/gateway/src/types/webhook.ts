// =============================================================================
// TIPOS PARA WEBHOOKS DE DOCUMENTOS - GABI
// =============================================================================

export interface DocumentWebhookPayload {
  source: 'google' | 'sharepoint'
  filename: string
  file_id: string
  last_modified: string
  base_id: string
  event: 'created' | 'modified' | 'deleted'
  user_id?: string // opcional, para rastreamento
  metadata?: {
    file_size?: number
    mime_type?: string
    parent_folder?: string
    owner?: string
  }
}

export interface DocumentRecord {
  id: string
  source: 'google' | 'sharepoint'
  filename: string
  file_id: string
  last_modified: Date
  base_id: string
  event: 'created' | 'modified' | 'deleted'
  status: 'pending' | 'indexed' | 'error' | 'deleted'
  user_id?: string
  metadata?: Record<string, any>
  vector_id?: string
  error_message?: string
  created_at: Date
  updated_at: Date
}

export interface WebhookResponse {
  success: boolean
  message: string
  data?: {
    document_id: string
    status: string
    vector_id?: string
  }
  timestamp: string
}

export interface VectorizationRequest {
  file_id: string
  filename: string
  source: 'google' | 'sharepoint'
  base_id: string
  metadata?: Record<string, any>
}

export interface VectorizationResponse {
  success: boolean
  vector_id?: string
  error?: string
  processing_time?: number
}

// =============================================================================
// TIPOS PARA LOGS E AUDITORIA
// =============================================================================

export interface WebhookLog {
  id: string
  webhook_id: string
  source: 'google' | 'sharepoint'
  event: 'created' | 'modified' | 'deleted'
  file_id: string
  filename: string
  status: 'success' | 'error'
  processing_time: number
  error_message?: string
  ip_address: string
  user_agent: string
  timestamp: Date
}

export interface WebhookStats {
  total_webhooks: number
  successful: number
  failed: number
  by_source: {
    google: number
    sharepoint: number
  }
  by_event: {
    created: number
    modified: number
    deleted: number
  }
  average_processing_time: number
  last_webhook: Date
}

// =============================================================================
// TIPOS PARA VALIDAÇÃO
// =============================================================================

export interface WebhookValidationResult {
  isValid: boolean
  errors: string[]
  payload?: DocumentWebhookPayload
}

// =============================================================================
// TIPOS PARA CONFIGURAÇÃO
// =============================================================================

export interface WebhookConfig {
  api_key: string
  max_payload_size: number
  rate_limit_window: number
  rate_limit_max: number
  retry_attempts: number
  retry_delay: number
  vectorization_timeout: number
}

// =============================================================================
// TIPOS PARA FILAS E PROCESSAMENTO
// =============================================================================

export interface WebhookJob {
  id: string
  payload: DocumentWebhookPayload
  priority: 'low' | 'normal' | 'high'
  attempts: number
  max_attempts: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: Date
  processed_at?: Date
  error?: string
}

export interface WebhookProcessingResult {
  success: boolean
  document_id: string
  vector_id?: string
  error?: string
  processing_time: number
  retry_count: number
} 