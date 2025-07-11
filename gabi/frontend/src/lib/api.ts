// =============================================================================
// API CLIENT PARA GABI GATEWAY
// =============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

// =============================================================================
// TIPOS
// =============================================================================

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  data: {
    token: string
    user: {
      id: string
      email: string
      role: string
      name?: string
      avatar_url?: string
    }
    expiresIn: number
  }
  message?: string
  timestamp: string
}

export interface ChatMessage {
  message: string
  agentId: string
  bases: string[]
}

export interface ChatResponse {
  success: boolean
  data: {
    message: {
      id: string
      role: 'assistant'
      content: string
      timestamp: string
      metadata: {
        agentId: string
        sessionId: string
        tokens: number
        latency: number
      }
    }
    sessionId: string
    metadata: {
      tokens: number
      latency: number
      agentUsed: string
      basesQueried: string[]
    }
  }
  timestamp: string
}

export interface Agent {
  id: string
  name: string
  description: string
  type: string
  endpoint: string
  isActive: boolean
  metadata: {
    model: string
    temperature: number
    capabilities: string[]
  }
}

export interface KnowledgeBase {
  id: string
  name: string
  description: string
  type: string
  endpoint: string
  isActive: boolean
  metadata: {
    documentCount: number
    source: string
    lastUpdated: string
  }
}

export interface AssistantConfig {
  name: string
  description: string
  avatar: string
  personality: string
  capabilities: string[]
  isCustomized: boolean
}

export interface PersonalizationTemplate {
  id: string
  name: string
  description: string
  avatar: string
  personality: string
  preview: string
}

// =============================================================================
// UTILITÁRIOS
// =============================================================================

function getAuthToken(): string | null {
  return localStorage.getItem('gabi_token')
}

function setAuthToken(token: string): void {
  localStorage.setItem('gabi_token', token)
}

function removeAuthToken(): void {
  localStorage.removeItem('gabi_token')
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json()
}

// =============================================================================
// FUNÇÕES DE AUTENTICAÇÃO
// =============================================================================

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  })

  const data = await handleResponse<LoginResponse>(response)
  
  if (data.success && data.data.token) {
    setAuthToken(data.data.token)
  }
  
  return data
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
  } catch (error) {
    console.error('Erro no logout:', error)
  } finally {
    removeAuthToken()
  }
}

export async function refreshToken(): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: getAuthHeaders()
  })

  const data = await handleResponse<LoginResponse>(response)
  
  if (data.success && data.data.token) {
    setAuthToken(data.data.token)
  }
  
  return data
}

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders()
  })

  return handleResponse(response)
}

// =============================================================================
// FUNÇÕES DE CHAT
// =============================================================================

export async function sendChatMessage(chatData: ChatMessage): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(chatData)
  })

  return handleResponse<ChatResponse>(response)
}

export async function getAgents(): Promise<{ success: boolean; data: Agent[] }> {
  const response = await fetch(`${API_BASE_URL}/chat/agents`, {
    headers: getAuthHeaders()
  })

  return handleResponse(response)
}

export async function getKnowledgeBases(): Promise<{ success: boolean; data: KnowledgeBase[] }> {
  const response = await fetch(`${API_BASE_URL}/chat/bases`, {
    headers: getAuthHeaders()
  })

  return handleResponse(response)
}

export async function getSessionHistory(sessionId: string): Promise<{ success: boolean; data: any[] }> {
  const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
    headers: getAuthHeaders()
  })

  return handleResponse(response)
}

// =============================================================================
// FUNÇÕES DE PERSONALIZAÇÃO
// =============================================================================

export async function getPersonalizationConfig(): Promise<{
  success: boolean
  data: {
    allowCustomName: boolean
    allowCustomAvatar: boolean
    allowCustomPersonality: boolean
    maxCustomLength: {
      name: number
      description: number
      personality: number
    }
    defaultConfig: {
      name: string
      description: string
      avatar: string
      personality: string
      capabilities: string[]
    }
  }
}> {
  const response = await fetch(`${API_BASE_URL}/personalization/config`, {
    headers: getAuthHeaders()
  })

  return handleResponse(response)
}

export async function getAssistantConfig(): Promise<{ success: boolean; data: AssistantConfig }> {
  const response = await fetch(`${API_BASE_URL}/personalization/assistant`, {
    headers: getAuthHeaders()
  })

  return handleResponse(response)
}

export async function updateAssistantConfig(config: Partial<AssistantConfig>): Promise<{ success: boolean; data: AssistantConfig }> {
  const response = await fetch(`${API_BASE_URL}/personalization/assistant`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(config)
  })

  return handleResponse(response)
}

export async function removeAssistantConfig(): Promise<{ success: boolean; data: AssistantConfig }> {
  const response = await fetch(`${API_BASE_URL}/personalization/assistant`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })

  return handleResponse(response)
}

export async function getPersonalizationTemplates(): Promise<{ success: boolean; data: PersonalizationTemplate[] }> {
  const response = await fetch(`${API_BASE_URL}/personalization/templates`, {
    headers: getAuthHeaders()
  })

  return handleResponse(response)
}

export async function applyTemplate(templateId: string): Promise<{ success: boolean; data: AssistantConfig }> {
  const response = await fetch(`${API_BASE_URL}/personalization/apply-template`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ templateId })
  })

  return handleResponse(response)
}

export async function uploadAvatar(avatarData: string, avatarType: 'url' | 'base64' | 'svg'): Promise<{ success: boolean; data: { avatarUrl: string } }> {
  const response = await fetch(`${API_BASE_URL}/personalization/avatar/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ avatarData, avatarType })
  })

  return handleResponse(response)
}

// =============================================================================
// FUNÇÕES DE ADMINISTRAÇÃO
// =============================================================================

export async function getDetailedHealth(): Promise<{ success: boolean; data: any }> {
  const response = await fetch(`${API_BASE_URL}/admin/health/detailed`, {
    headers: getAuthHeaders()
  })

  return handleResponse(response)
}

export async function testMCPAgent(agentId: string): Promise<{ success: boolean; data: any }> {
  const response = await fetch(`${API_BASE_URL}/admin/test/mcp`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ agentId })
  })

  return handleResponse(response)
}

export async function testRAGSearch(query: string, baseIds?: string[]): Promise<{ success: boolean; data: any }> {
  const response = await fetch(`${API_BASE_URL}/admin/test/rag`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ query, baseIds })
  })

  return handleResponse(response)
}

export async function testWorkflow(workflowId: string, input?: any): Promise<{ success: boolean; data: any }> {
  const response = await fetch(`${API_BASE_URL}/admin/test/workflow`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ workflowId, input })
  })

  return handleResponse(response)
}

// =============================================================================
// FUNÇÕES DE SISTEMA
// =============================================================================

export async function getHealthStatus(): Promise<{ success: boolean; data: any }> {
  const response = await fetch('http://localhost:3000/health')
  return handleResponse(response)
}

export async function getAPIDocs(): Promise<{ success: boolean; data: any }> {
  const response = await fetch(`${API_BASE_URL}/docs`)
  return handleResponse(response)
}

// =============================================================================
// INTERCEPTOR PARA RENOVAÇÃO AUTOMÁTICA DE TOKEN
// =============================================================================

export function setupTokenRefresh() {
  // Verifica se o token está próximo de expirar (a cada 5 minutos)
  setInterval(async () => {
    const token = getAuthToken()
    if (token) {
      try {
        // Tenta renovar o token
        await refreshToken()
      } catch (error) {
        console.error('Erro ao renovar token:', error)
        // Se falhar, remove o token e redireciona para login
        removeAuthToken()
        window.location.href = '/login'
      }
    }
  }, 5 * 60 * 1000) // 5 minutos
}

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

export {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getAuthHeaders
} 