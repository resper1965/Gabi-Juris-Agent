// =============================================================================
// TIPOS PARA DOCUMENTOS INDEXADOS
// =============================================================================

export interface IndexedDocument {
  id: string
  docId: string
  origin: 'google' | 'sharepoint' | 'manual'
  filename: string
  lang: string
  contentHash: string
  lastModified: Date
  lastIndexed: Date
  vectorId: string
  status: 'pending' | 'indexed' | 'error'
  userId: string
  knowledgeBases: string[]
  createdAt: Date
  updatedAt: Date
}

export interface DocumentUpdatePayload {
  origin: 'google' | 'sharepoint' | 'manual'
  docId: string
  filename: string
  userId: string
  lang: string
  content: string
  knowledgeBases?: string[]
}

export interface DocumentStatus {
  docId: string
  origin: 'google' | 'sharepoint' | 'manual'
  filename: string
  status: 'pending' | 'indexed' | 'error'
  lastUpdate: Date
  knowledgeBases: string[]
  vectorId?: string
  errorMessage?: string
}

export interface ReindexResponse {
  success: boolean
  data: {
    jobId: string
    documentId: string
    status: 'processing'
    estimatedTime?: number
  }
  message: string
  timestamp: string
}

export interface DocumentIndexingJob {
  id: string
  documentId: string
  userId: string
  origin: 'google' | 'sharepoint' | 'manual'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: 'low' | 'normal' | 'high'
  metadata: {
    filename: string
    lang: string
    contentHash: string
    knowledgeBases: string[]
  }
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  error?: string
}

// =============================================================================
// TIPOS PARA LOGS DE REINDEXAÇÃO
// =============================================================================

export interface ReindexLog {
  id: string
  userId: string
  documentId: string
  action: 'reindex' | 'update' | 'delete'
  origin: 'google' | 'sharepoint' | 'manual'
  status: 'success' | 'error'
  details: {
    filename: string
    vectorId?: string
    errorMessage?: string
    processingTime?: number
  }
  ipAddress: string
  userAgent: string
  timestamp: Date
}

// =============================================================================
// TIPOS PARA ESTATÍSTICAS
// =============================================================================

export interface DocumentStats {
  total: number
  indexed: number
  pending: number
  error: number
  byOrigin: {
    google: number
    sharepoint: number
    manual: number
  }
  byStatus: {
    pending: number
    indexed: number
    error: number
  }
  averageProcessingTime: number
  lastIndexed: Date
}

// =============================================================================
// TIPOS PARA FILTROS E PAGINAÇÃO
// =============================================================================

export interface DocumentFilters {
  origin?: 'google' | 'sharepoint' | 'manual'
  status?: 'pending' | 'indexed' | 'error'
  knowledgeBase?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
}

export interface PaginatedDocuments {
  documents: IndexedDocument[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
} 