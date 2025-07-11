// =============================================================================
// SERVIÇO DE COMUNICAÇÃO COM API GABI
// =============================================================================

import { toast } from 'sonner'
import { 
  StyleInheritanceResult, 
  RequestStyle, 
  AgentStyle, 
  BaseStyle,
  styleInheritanceService
} from '@/services/styleInheritanceService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface GabiChatRequest {
  question: string
  agent_id: string
  base_ids: string[]
  style_source?: string
  chat_id?: string
  tenant_id: string
  style_override?: any // Para compatibilidade com sistema de herança
  custom_instructions?: string
}

export interface GabiChatResponse {
  answer: string
  sources: GabiSource[]
  style: string
  chat_id: string
  request_id: string
  processing_time: number
  tokens_used: number
  confidence_score: number
  style_inheritance?: StyleInheritanceResult
}

export interface GabiSource {
  title: string
  url: string
  snippet?: string
  relevance_score?: number
  base_id?: string
}

export interface GabiChatSession {
  chat_id: string
  tenant_id: string
  user_id: string
  agent_id: string
  base_ids: string[]
  style_source?: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface GabiMessage {
  id: string
  chat_id: string
  question: string
  answer: string
  sources: GabiSource[]
  style: string
  created_at: string
  processing_time: number
  tokens_used: number
  confidence_score: number
  style_inheritance?: StyleInheritanceResult
}

export interface GabiAgent {
  id: string
  name: string
  description: string
  model: string
  capabilities: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GabiBase {
  id: string
  name: string
  description: string
  type: 'document' | 'knowledge' | 'custom'
  document_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GabiTenant {
  id: string
  name: string
  domain: string
  settings: {
    default_agent_id: string
    default_base_ids: string[]
    style_policies: {
      allow_custom_styles: boolean
      require_style_approval: boolean
      max_custom_styles_per_user: number
    }
  }
  created_at: string
  updated_at: string
}

// =============================================================================
// CONFIGURAÇÃO DA API
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_GABI_API_URL || 'https://gabi.ness.net.br/api'
const API_TIMEOUT = 30000 // 30 segundos

const getAuthHeaders = () => {
  const token = localStorage.getItem('gabi_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

// =============================================================================
// CLASSE PRINCIPAL DO SERVIÇO
// =============================================================================

export class GabiApiService {
  private static instance: GabiApiService
  private chatSessions: Map<string, GabiChatSession> = new Map()
  private messageCache: Map<string, GabiMessage> = new Map()

  static getInstance(): GabiApiService {
    if (!GabiApiService.instance) {
      GabiApiService.instance = new GabiApiService()
    }
    return GabiApiService.instance
  }

  // =============================================================================
  // MÉTODO PRINCIPAL DE CHAT
  // =============================================================================

  async askQuestion(
    question: string,
    agentId: string,
    baseIds: string[],
    tenantId: string,
    options: {
      styleSource?: string
      chatId?: string
      styleOverride?: any
      customInstructions?: string
    } = {}
  ): Promise<GabiChatResponse> {
    const startTime = Date.now()
    
    try {
      // Preparar payload da requisição
      const payload: GabiChatRequest = {
        question,
        agent_id: agentId,
        base_ids: baseIds,
        tenant_id: tenantId,
        chat_id: options.chatId,
        style_source: options.styleSource,
        style_override: options.styleOverride,
        custom_instructions: options.customInstructions
      }

      // Fazer requisição para a API
      const response = await this.makeApiRequest('/chat/ask', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      const processingTime = Date.now() - startTime

      // Processar resposta e adicionar metadados
      const chatResponse: GabiChatResponse = {
        ...response,
        processing_time: processingTime,
        request_id: response.request_id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      // Determinar herança de estilo se não fornecida
      if (!chatResponse.style_inheritance) {
        chatResponse.style_inheritance = await this.determineStyleInheritance(
          payload,
          chatResponse,
          tenantId
        )
      }

      // Registrar log de herança de estilo
      if (chatResponse.style_inheritance) {
        await this.logStyleInheritance(
          chatResponse.style_inheritance,
          chatResponse.request_id,
          chatResponse.answer.length,
          processingTime
        )
      }

      // Atualizar cache de sessão
      this.updateChatSession(chatResponse.chat_id, payload, tenantId)

      // Cache da mensagem
      this.messageCache.set(chatResponse.request_id, {
        id: chatResponse.request_id,
        chat_id: chatResponse.chat_id,
        question,
        answer: chatResponse.answer,
        sources: chatResponse.sources,
        style: chatResponse.style,
        created_at: new Date().toISOString(),
        processing_time: processingTime,
        tokens_used: chatResponse.tokens_used || 0,
        confidence_score: chatResponse.confidence_score || 0,
        style_inheritance: chatResponse.style_inheritance
      })

      return chatResponse

    } catch (error) {
      console.error('Erro na requisição de chat:', error)
      throw this.handleApiError(error)
    }
  }

  // =============================================================================
  // MÉTODOS DE SESSÃO DE CHAT
  // =============================================================================

  async createChatSession(
    tenantId: string,
    agentId: string,
    baseIds: string[],
    styleSource?: string
  ): Promise<GabiChatSession> {
    try {
      const response = await this.makeApiRequest('/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: tenantId,
          agent_id: agentId,
          base_ids: baseIds,
          style_source: styleSource
        })
      })

      const session: GabiChatSession = {
        ...response,
        message_count: 0
      }

      this.chatSessions.set(session.chat_id, session)
      return session

    } catch (error) {
      console.error('Erro ao criar sessão de chat:', error)
      throw this.handleApiError(error)
    }
  }

  async getChatSession(chatId: string): Promise<GabiChatSession | null> {
    // Verificar cache primeiro
    if (this.chatSessions.has(chatId)) {
      return this.chatSessions.get(chatId)!
    }

    try {
      const response = await this.makeApiRequest(`/chat/sessions/${chatId}`)
      const session: GabiChatSession = response
      
      this.chatSessions.set(chatId, session)
      return session

    } catch (error) {
      console.error('Erro ao obter sessão de chat:', error)
      return null
    }
  }

  async getChatHistory(chatId: string, limit: number = 50): Promise<GabiMessage[]> {
    try {
      const response = await this.makeApiRequest(`/chat/sessions/${chatId}/messages?limit=${limit}`)
      return response.messages || []
    } catch (error) {
      console.error('Erro ao obter histórico de chat:', error)
      return []
    }
  }

  async deleteChatSession(chatId: string): Promise<void> {
    try {
      await this.makeApiRequest(`/chat/sessions/${chatId}`, {
        method: 'DELETE'
      })

      this.chatSessions.delete(chatId)
      toast.success('Sessão de chat excluída com sucesso!')

    } catch (error) {
      console.error('Erro ao excluir sessão de chat:', error)
      throw this.handleApiError(error)
    }
  }

  // =============================================================================
  // MÉTODOS DE AGENTES
  // =============================================================================

  async getAgents(tenantId: string): Promise<GabiAgent[]> {
    try {
      const response = await this.makeApiRequest(`/agents?tenant_id=${tenantId}`)
      return response.agents || []
    } catch (error) {
      console.error('Erro ao obter agentes:', error)
      return []
    }
  }

  async getAgent(agentId: string): Promise<GabiAgent | null> {
    try {
      const response = await this.makeApiRequest(`/agents/${agentId}`)
      return response
    } catch (error) {
      console.error('Erro ao obter agente:', error)
      return null
    }
  }

  // =============================================================================
  // MÉTODOS DE BASES DE CONHECIMENTO
  // =============================================================================

  async getBases(tenantId: string): Promise<GabiBase[]> {
    try {
      const response = await this.makeApiRequest(`/bases?tenant_id=${tenantId}`)
      return response.bases || []
    } catch (error) {
      console.error('Erro ao obter bases:', error)
      return []
    }
  }

  async getBase(baseId: string): Promise<GabiBase | null> {
    try {
      const response = await this.makeApiRequest(`/bases/${baseId}`)
      return response
    } catch (error) {
      console.error('Erro ao obter base:', error)
      return null
    }
  }

  // =============================================================================
  // MÉTODOS DE TENANT
  // =============================================================================

  async getTenant(tenantId: string): Promise<GabiTenant | null> {
    try {
      const response = await this.makeApiRequest(`/tenants/${tenantId}`)
      return response
    } catch (error) {
      console.error('Erro ao obter tenant:', error)
      return null
    }
  }

  // =============================================================================
  // MÉTODOS DE HERANÇA DE ESTILO
  // =============================================================================

  private async determineStyleInheritance(
    request: GabiChatRequest,
    response: GabiChatResponse,
    tenantId: string
  ): Promise<StyleInheritanceResult> {
    try {
      // Preparar dados para herança de estilo
      const requestStyle: RequestStyle = {
        style_override: request.style_override,
        custom_instructions: request.custom_instructions
      }

      const agentStyle: AgentStyle = {
        agent_id: request.agent_id,
        agent_name: request.agent_id, // Será atualizado se tivermos dados do agente
        style: null,
        use_base_style: true
      }

      const baseStyles: BaseStyle[] = request.base_ids.map((baseId, index) => ({
        base_id: baseId,
        base_name: baseId, // Será atualizado se tivermos dados da base
        style: null,
        is_primary: index === 0,
        priority: index + 1
      }))

      // Determinar herança de estilo
      return await styleInheritanceService.determineStyle(
        requestStyle,
        agentStyle,
        baseStyles,
        tenantId,
        response.request_id
      )

    } catch (error) {
      console.error('Erro ao determinar herança de estilo:', error)
      
      // Retornar estilo fallback
      return {
        final_style: {
          type: 'neutro',
          name: 'Estilo Neutro Padrão',
          description: 'Estilo neutro aplicado devido a erro na determinação',
          confidence_score: 0.5
        },
        source: 'fallback',
        source_details: { request_id: response.request_id },
        inheritance_chain: [{
          level: 'fallback',
          style: null,
          reason: 'Erro na determinação de estilo',
          timestamp: new Date().toISOString()
        }],
        confidence_score: 0.5,
        applied_at: new Date().toISOString(),
        response_id: response.request_id
      }
    }
  }

  private async logStyleInheritance(
    inheritanceResult: StyleInheritanceResult,
    requestId: string,
    contentLength: number,
    processingTime: number
  ): Promise<void> {
    try {
      const userId = this.getCurrentUserId()
      if (userId) {
        await styleInheritanceService.logStyleInheritance(
          inheritanceResult,
          requestId,
          contentLength,
          processingTime
        )
      }
    } catch (error) {
      console.error('Erro ao registrar log de herança:', error)
      // Não falhar a operação por erro de log
    }
  }

  // =============================================================================
  // MÉTODOS AUXILIARES
  // =============================================================================

  private async makeApiRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = getAuthHeaders()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()

    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private handleApiError(error: any): Error {
    if (error.name === 'AbortError') {
      return new Error('Timeout na requisição. Tente novamente.')
    }

    if (error.message?.includes('401')) {
      return new Error('Sessão expirada. Faça login novamente.')
    }

    if (error.message?.includes('403')) {
      return new Error('Acesso negado. Verifique suas permissões.')
    }

    if (error.message?.includes('404')) {
      return new Error('Recurso não encontrado.')
    }

    if (error.message?.includes('500')) {
      return new Error('Erro interno do servidor. Tente novamente.')
    }

    return new Error(error.message || 'Erro desconhecido na comunicação com a API.')
  }

  private updateChatSession(
    chatId: string,
    request: GabiChatRequest,
    tenantId: string
  ): void {
    const existingSession = this.chatSessions.get(chatId)
    
    if (existingSession) {
      existingSession.updated_at = new Date().toISOString()
      existingSession.message_count += 1
    } else {
      const newSession: GabiChatSession = {
        chat_id: chatId,
        tenant_id: tenantId,
        user_id: this.getCurrentUserId() || '',
        agent_id: request.agent_id,
        base_ids: request.base_ids,
        style_source: request.style_source,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 1
      }
      
      this.chatSessions.set(chatId, newSession)
    }
  }

  private getCurrentUserId(): string | null {
    // Implementar lógica para obter ID do usuário atual
    // Pode vir do contexto de autenticação
    return localStorage.getItem('gabi_user_id')
  }

  // =============================================================================
  // MÉTODOS DE CACHE E LIMPEZA
  // =============================================================================

  clearCache(): void {
    this.chatSessions.clear()
    this.messageCache.clear()
  }

  getCachedMessage(messageId: string): GabiMessage | null {
    return this.messageCache.get(messageId) || null
  }

  getCachedSession(chatId: string): GabiChatSession | null {
    return this.chatSessions.get(chatId) || null
  }
}

// =============================================================================
// INSTÂNCIA GLOBAL
// =============================================================================

export const gabiApiService = GabiApiService.getInstance() 