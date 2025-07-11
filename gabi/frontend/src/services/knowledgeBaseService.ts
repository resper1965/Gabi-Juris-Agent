// =============================================================================
// SERVIÇO DE BASES DE CONHECIMENTO - GABI
// =============================================================================

import { toast } from 'sonner'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface AgentConfig {
  id: string
  name: string
  description?: string
  model: string
  temperature: number
  max_tokens: number
  use_style_profile: boolean
  custom_prompt?: string
  is_active: boolean
}

export interface StyleProfile {
  mode: 'preset' | 'inferred'
  preset?: 'juridico' | 'didatico' | 'neutro' | 'cientifico' | 'comercial' | 'outro'
  inferred_from_base_id?: string
  description?: string
  confidence_score?: number
  analyzed_documents?: number
  vocabulary_complexity?: 'baixo' | 'medio' | 'alto'
  tone?: 'formal' | 'neutro' | 'informal'
  structure_preference?: 'paragrafos_curtos' | 'paragrafos_medios' | 'paragrafos_longos'
  created_at?: string
  updated_at?: string
}

export interface KnowledgeBase {
  id?: string
  name: string
  description?: string
  source_type: 'upload' | 'gdrive' | 'sharepoint' | 's3' | 'api' | 'manual'
  visibility: 'private' | 'organization' | 'public'
  style_profile: StyleProfile
  language: 'pt' | 'en' | 'es' | 'fr' | 'de'
  agents: AgentConfig[]
  created_at?: string
  updated_at?: string
  document_count?: number
  status?: 'active' | 'inactive' | 'processing'
  owner_id?: string
  organization_id?: string
}

export interface StyleAnalysisResult {
  base_id: string
  analysis_id: string
  confidence_score: number
  analyzed_documents: number
  vocabulary_complexity: 'baixo' | 'medio' | 'alto'
  tone: 'formal' | 'neutro' | 'informal'
  structure_preference: 'paragrafos_curtos' | 'paragrafos_medios' | 'paragrafos_longos'
  key_phrases: string[]
  common_terms: string[]
  style_description: string
  processing_time: number
  created_at: string
}

export interface KnowledgeBaseFilters {
  search?: string
  visibility?: string[]
  language?: string[]
  source_type?: string[]
  status?: string[]
  owner_id?: string
  page?: number
  limit?: number
}

// =============================================================================
// CONFIGURAÇÃO DA API
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('gabi_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

// =============================================================================
// FUNÇÕES DE BASES DE CONHECIMENTO
// =============================================================================

export const createKnowledgeBase = async (knowledgeBase: KnowledgeBase): Promise<KnowledgeBase> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(knowledgeBase)
    })

    if (!response.ok) {
      throw new Error('Erro ao criar base de conhecimento')
    }

    const result = await response.json()
    toast.success('Base de conhecimento criada com sucesso!')
    return result
  } catch (error) {
    console.error('Erro ao criar base de conhecimento:', error)
    toast.error('Erro ao criar base de conhecimento')
    throw error
  }
}

export const getKnowledgeBases = async (filters: KnowledgeBaseFilters = {}): Promise<{
  knowledge_bases: KnowledgeBase[]
  total: number
  page: number
  totalPages: number
}> => {
  try {
    const params = new URLSearchParams()
    
    if (filters.search) params.append('search', filters.search)
    if (filters.visibility?.length) params.append('visibility', filters.visibility.join(','))
    if (filters.language?.length) params.append('language', filters.language.join(','))
    if (filters.source_type?.length) params.append('source_type', filters.source_type.join(','))
    if (filters.status?.length) params.append('status', filters.status.join(','))
    if (filters.owner_id) params.append('owner_id', filters.owner_id)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const response = await fetch(`${API_BASE_URL}/knowledge-bases?${params}`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao carregar bases de conhecimento')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao carregar bases de conhecimento:', error)
    toast.error('Erro ao carregar bases de conhecimento')
    throw error
  }
}

export const getKnowledgeBaseById = async (id: string): Promise<KnowledgeBase> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${id}`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao carregar base de conhecimento')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao carregar base de conhecimento:', error)
    toast.error('Erro ao carregar base de conhecimento')
    throw error
  }
}

export const updateKnowledgeBase = async (id: string, updates: Partial<KnowledgeBase>): Promise<KnowledgeBase> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error('Erro ao atualizar base de conhecimento')
    }

    const result = await response.json()
    toast.success('Base de conhecimento atualizada com sucesso!')
    return result
  } catch (error) {
    console.error('Erro ao atualizar base de conhecimento:', error)
    toast.error('Erro ao atualizar base de conhecimento')
    throw error
  }
}

export const deleteKnowledgeBase = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao remover base de conhecimento')
    }

    toast.success('Base de conhecimento removida com sucesso!')
  } catch (error) {
    console.error('Erro ao remover base de conhecimento:', error)
    toast.error('Erro ao remover base de conhecimento')
    throw error
  }
}

// =============================================================================
// FUNÇÕES DE ANÁLISE DE ESTILO
// =============================================================================

export const analyzeStyleFromBase = async (baseId: string): Promise<StyleAnalysisResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${baseId}/analyze-style`, {
      method: 'POST',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao analisar estilo da base')
    }

    const result = await response.json()
    toast.success('Análise de estilo concluída!')
    return result
  } catch (error) {
    console.error('Erro ao analisar estilo:', error)
    toast.error('Erro ao analisar estilo da base')
    throw error
  }
}

export const getStyleAnalysisHistory = async (baseId: string): Promise<StyleAnalysisResult[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${baseId}/style-analysis-history`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao carregar histórico de análises')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao carregar histórico de análises:', error)
    toast.error('Erro ao carregar histórico de análises')
    throw error
  }
}

export const validateStyleInference = async (baseId: string): Promise<{
  valid: boolean
  document_count: number
  min_required: number
  quality_score: number
  issues: string[]
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${baseId}/validate-inference`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao validar base para inferência')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao validar base para inferência:', error)
    toast.error('Erro ao validar base para inferência')
    throw error
  }
}

// =============================================================================
// FUNÇÕES DE AGENTES
// =============================================================================

export const createAgent = async (baseId: string, agent: AgentConfig): Promise<AgentConfig> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${baseId}/agents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(agent)
    })

    if (!response.ok) {
      throw new Error('Erro ao criar agente')
    }

    const result = await response.json()
    toast.success('Agente criado com sucesso!')
    return result
  } catch (error) {
    console.error('Erro ao criar agente:', error)
    toast.error('Erro ao criar agente')
    throw error
  }
}

export const updateAgent = async (baseId: string, agentId: string, updates: Partial<AgentConfig>): Promise<AgentConfig> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${baseId}/agents/${agentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error('Erro ao atualizar agente')
    }

    const result = await response.json()
    toast.success('Agente atualizado com sucesso!')
    return result
  } catch (error) {
    console.error('Erro ao atualizar agente:', error)
    toast.error('Erro ao atualizar agente')
    throw error
  }
}

export const deleteAgent = async (baseId: string, agentId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${baseId}/agents/${agentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao remover agente')
    }

    toast.success('Agente removido com sucesso!')
  } catch (error) {
    console.error('Erro ao remover agente:', error)
    toast.error('Erro ao remover agente')
    throw error
  }
}

export const testAgent = async (baseId: string, agentId: string, testQuery: string): Promise<{
  response: string
  processing_time: number
  tokens_used: number
  style_applied: boolean
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${baseId}/agents/${agentId}/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query: testQuery })
    })

    if (!response.ok) {
      throw new Error('Erro ao testar agente')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao testar agente:', error)
    toast.error('Erro ao testar agente')
    throw error
  }
}

// =============================================================================
// FUNÇÕES DE CONECTORES EXTERNOS
// =============================================================================

export const configureConnector = async (baseId: string, connectorType: string, config: any): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${baseId}/connectors/${connectorType}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    })

    if (!response.ok) {
      throw new Error('Erro ao configurar conector')
    }

    toast.success('Conector configurado com sucesso!')
  } catch (error) {
    console.error('Erro ao configurar conector:', error)
    toast.error('Erro ao configurar conector')
    throw error
  }
}

export const testConnector = async (baseId: string, connectorType: string): Promise<{
  connected: boolean
  document_count: number
  last_sync: string
  errors?: string[]
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${baseId}/connectors/${connectorType}/test`, {
      method: 'POST',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao testar conector')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao testar conector:', error)
    toast.error('Erro ao testar conector')
    throw error
  }
}

export const syncConnector = async (baseId: string, connectorType: string): Promise<{
  synced_documents: number
  processing_time: number
  errors: string[]
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${baseId}/connectors/${connectorType}/sync`, {
      method: 'POST',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao sincronizar conector')
    }

    const result = await response.json()
    toast.success(`Sincronização concluída: ${result.synced_documents} documentos`)
    return result
  } catch (error) {
    console.error('Erro ao sincronizar conector:', error)
    toast.error('Erro ao sincronizar conector')
    throw error
  }
}

// =============================================================================
// FUNÇÕES DE ESTATÍSTICAS E RELATÓRIOS
// =============================================================================

export const getKnowledgeBaseStats = async (baseId: string): Promise<{
  total_documents: number
  indexed_documents: number
  processing_documents: number
  error_documents: number
  total_agents: number
  active_agents: number
  style_confidence: number
  last_activity: string
  storage_used: number
  queries_today: number
  avg_response_time: number
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${baseId}/stats`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao carregar estatísticas')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error)
    toast.error('Erro ao carregar estatísticas')
    throw error
  }
}

export const exportKnowledgeBase = async (baseId: string, format: 'json' | 'csv' | 'pdf'): Promise<Blob> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${baseId}/export?format=${format}`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao exportar base de conhecimento')
    }

    return await response.blob()
  } catch (error) {
    console.error('Erro ao exportar base de conhecimento:', error)
    toast.error('Erro ao exportar base de conhecimento')
    throw error
  }
}

// =============================================================================
// FUNÇÕES DE VALIDAÇÃO
// =============================================================================

export const validateKnowledgeBaseName = async (name: string, excludeId?: string): Promise<{
  valid: boolean
  available: boolean
  suggestions?: string[]
}> => {
  try {
    const params = new URLSearchParams({ name })
    if (excludeId) params.append('exclude_id', excludeId)

    const response = await fetch(`${API_BASE_URL}/knowledge-bases/validate-name?${params}`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao validar nome')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao validar nome:', error)
    throw error
  }
}

export const checkStyleProfileCompatibility = async (baseId: string, targetLanguage: string): Promise<{
  compatible: boolean
  issues: string[]
  recommendations: string[]
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/knowledge-bases/${baseId}/check-style-compatibility`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ target_language: targetLanguage })
    })

    if (!response.ok) {
      throw new Error('Erro ao verificar compatibilidade de estilo')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao verificar compatibilidade de estilo:', error)
    throw error
  }
} 