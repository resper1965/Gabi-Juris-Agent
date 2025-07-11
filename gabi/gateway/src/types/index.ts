import { Request, Response, NextFunction } from 'express'

// =============================================================================
// TIPOS PRINCIPAIS DA APLICAÇÃO
// =============================================================================

export interface User {
  id: string
  email: string
  role: UserRole
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export type UserRole = 'admin' | 'advogado' | 'estagiario'

export interface AuthRequest extends Request {
  user?: User
  token?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    agentId?: string
    baseIds?: string[]
    tokens?: number
    latency?: number
    sessionId?: string
  }
}

export interface ChatRequest {
  message: string
  agentId: string
  baseIds?: string[]
  sessionId?: string
  context?: {
    previousMessages?: ChatMessage[]
    userContext?: Record<string, any>
  }
}

export interface ChatResponse {
  message: ChatMessage
  sessionId: string
  metadata: {
    tokens: number
    latency: number
    agentUsed: string
    basesQueried?: string[]
  }
}

export interface Agent {
  id: string
  name: string
  description: string
  type: 'mcp' | 'evoai' | 'custom'
  endpoint?: string
  isActive: boolean
  metadata?: {
    model?: string
    temperature?: number
    maxTokens?: number
    capabilities?: string[]
  }
}

export interface KnowledgeBase {
  id: string
  name: string
  description: string
  type: 'weaviate' | 'supabase' | 'external'
  endpoint?: string
  isActive: boolean
  metadata?: {
    documentCount?: number
    source?: string
    lastUpdated?: string
  }
}

export interface MCPServer {
  id: string
  name: string
  url: string
  isActive: boolean
  capabilities: string[]
  metadata?: Record<string, any>
}

export interface RAGQuery {
  query: string
  baseIds: string[]
  limit?: number
  filters?: Record<string, any>
}

export interface RAGResult {
  documents: Array<{
    id: string
    content: string
    metadata: Record<string, any>
    score: number
  }>
  query: string
  totalResults: number
}

export interface EvoAIWorkflow {
  id: string
  name: string
  description: string
  isActive: boolean
  steps: WorkflowStep[]
}

export interface WorkflowStep {
  id: string
  type: 'agent' | 'condition' | 'action'
  config: Record<string, any>
  next?: string[]
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: Date
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Date
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// =============================================================================
// TIPOS PARA CONFIGURAÇÃO
// =============================================================================

export interface ServerConfig {
  port: number
  host: string
  nodeEnv: string
  corsOrigin: string
  rateLimitWindowMs: number
  rateLimitMaxRequests: number
}

export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey: string
  jwtSecret: string
}

export interface MCPConfig {
  registryUrl: string
  jurisprudenciaUrl: string
  ingestaoUrl: string
  scrapingUrl: string
}

export interface WeaviateConfig {
  url: string
  apiKey: string
  tenant: string
}

export interface LangfuseConfig {
  publicKey: string
  secretKey: string
  host: string
}

export interface EvoAIConfig {
  url: string
  apiKey: string
}

export interface LoggingConfig {
  level: string
  format: string
  lokiUrl?: string
  grafanaUrl?: string
}

// =============================================================================
// TIPOS PARA MIDDLEWARE
// =============================================================================

export interface AuthMiddleware {
  verifyToken: (token: string) => Promise<User | null>
  requireAuth: (req: AuthRequest, res: Response, next: NextFunction) => void
  requireRole: (roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => void
}

export interface LoggingMiddleware {
  logRequest: (req: Request, res: Response, next: NextFunction) => void
  logError: (error: Error, req: Request, res: Response, next: NextFunction) => void
}

// =============================================================================
// TIPOS PARA SERVIÇOS
// =============================================================================

export interface SupabaseService {
  verifyJWT: (token: string) => Promise<User | null>
  getUserById: (id: string) => Promise<User | null>
  updateUser: (id: string, data: Partial<User>) => Promise<User>
}

export interface MCPClientService {
  listServers: () => Promise<MCPServer[]>
  queryAgent: (agentId: string, message: string, context?: any) => Promise<ChatResponse>
  getAgentCapabilities: (agentId: string) => Promise<string[]>
}

export interface RAGService {
  search: (query: RAGQuery) => Promise<RAGResult>
  addDocument: (baseId: string, document: any) => Promise<void>
  deleteDocument: (baseId: string, documentId: string) => Promise<void>
}

export interface EvoAIService {
  executeWorkflow: (workflowId: string, input: any) => Promise<any>
  listWorkflows: () => Promise<EvoAIWorkflow[]>
  getWorkflow: (workflowId: string) => Promise<EvoAIWorkflow | null>
} 