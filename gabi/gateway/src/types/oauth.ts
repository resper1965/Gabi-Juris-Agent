// =============================================================================
// TIPOS PARA OAUTH 2.0
// =============================================================================

export interface OAuthProvider {
  id: string
  name: string
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string[]
  isActive: boolean
}

export interface OAuthToken {
  id: string
  userId: string
  provider: 'google' | 'microsoft'
  accessToken: string
  refreshToken: string
  expiresAt: Date
  scope: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface OAuthUser {
  id: string
  email: string
  name: string
  picture?: string
  provider: 'google' | 'microsoft'
  providerId: string
}

// =============================================================================
// TIPOS PARA DOCUMENTOS
// =============================================================================

export interface Document {
  id: string
  name: string
  type: 'google-docs' | 'word' | 'pdf' | 'excel' | 'powerpoint'
  source: 'google' | 'sharepoint'
  sourceId: string
  userId: string
  size: number
  lastModified: Date
  url?: string
  isIndexed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DocumentListResponse {
  success: boolean
  data: Document[]
  pagination?: {
    nextPageToken?: string
    hasMore: boolean
  }
  timestamp: string
}

export interface DocumentExtractRequest {
  docId: string
  source: 'google' | 'sharepoint'
}

export interface DocumentExtractResponse {
  success: boolean
  data: {
    text: string
    metadata: {
      wordCount: number
      pageCount?: number
      extractedAt: Date
    }
  }
  timestamp: string
}

export interface DocumentIndexRequest {
  text: string
  userId: string
  origin: 'google' | 'sharepoint'
  docName: string
  docId?: string
}

export interface DocumentIndexResponse {
  success: boolean
  data: {
    indexId: string
    status: 'success' | 'error'
    message?: string
  }
  timestamp: string
}

// =============================================================================
// TIPOS PARA PRIVACIDADE
// =============================================================================

export type UserRole = 'admin' | 'user' | 'auditor'

export interface PrivacyPolicy {
  id: string
  version: string
  title: string
  content: string
  language: string
  isActive: boolean
  effectiveDate: Date
  createdAt: Date
}

export interface UserConsent {
  id: string
  userId: string
  policyId: string
  consent: boolean
  grantedAt: Date
  ipAddress: string
  userAgent: string
}

export interface PrivacyLog {
  id: string
  userId: string
  action: string
  resource: string
  details: any
  ipAddress: string
  userAgent: string
  timestamp: Date
}

// =============================================================================
// TIPOS PARA INTERNACIONALIZAÇÃO
// =============================================================================

export type SupportedLanguage = 'pt-BR' | 'en-US'

export interface LocalizedMessage {
  'pt-BR': string
  'en-US': string
}

export interface ErrorMessages {
  [key: string]: LocalizedMessage
}

// =============================================================================
// TIPOS PARA API RESPONSES
// =============================================================================

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: LocalizedMessage
  timestamp: string
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
} 