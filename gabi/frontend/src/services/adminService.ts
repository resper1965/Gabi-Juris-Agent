// =============================================================================
// SERVIÇO ADMINISTRATIVO - GABI
// =============================================================================

import { toast } from 'sonner'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface Document {
  id: string
  filename: string
  base_id: string
  source: 'google' | 'sharepoint' | 'manual'
  status: 'indexed' | 'pending' | 'error' | 'deleted'
  last_modified: string
  created_at: string
  vector_id?: string
  error_message?: string
  metadata?: {
    file_size?: number
    mime_type?: string
    parent_folder?: string
    owner?: string
    language?: string
  }
  event: 'created' | 'modified' | 'deleted'
  processing_time?: number
}

export interface DocumentFilters {
  search?: string
  sources?: string[]
  statuses?: string[]
  bases?: string[]
  page?: number
  limit?: number
}

export interface AdminStats {
  total_documents: number
  indexed: number
  pending: number
  error: number
  by_source: {
    google: number
    sharepoint: number
    manual: number
  }
  by_base: Record<string, number>
}

export interface SystemStats {
  total_documents: number
  total_users: number
  total_bases: number
  documents_today: number
  errors_today: number
  avg_processing_time: number
  system_health: 'healthy' | 'warning' | 'error'
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'moderator'
  avatar?: string
  last_login?: string
  created_at: string
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
// FUNÇÕES DE AUTENTICAÇÃO E AUTORIZAÇÃO
// =============================================================================

export const checkAdminAccess = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      return false
    }

    const user = await response.json()
    return user.role === 'admin'
  } catch (error) {
    console.error('Erro ao verificar acesso de admin:', error)
    return false
  }
}

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error)
    return null
  }
}

// =============================================================================
// FUNÇÕES DE DOCUMENTOS
// =============================================================================

export const getDocuments = async (filters: DocumentFilters = {}): Promise<{
  documents: Document[]
  total: number
  page: number
  totalPages: number
}> => {
  try {
    const params = new URLSearchParams()
    
    if (filters.search) params.append('search', filters.search)
    if (filters.sources?.length) params.append('sources', filters.sources.join(','))
    if (filters.statuses?.length) params.append('statuses', filters.statuses.join(','))
    if (filters.bases?.length) params.append('bases', filters.bases.join(','))
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const response = await fetch(`${API_BASE_URL}/admin/documents?${params}`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao carregar documentos')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao carregar documentos:', error)
    toast.error('Erro ao carregar documentos')
    throw error
  }
}

export const getDocumentById = async (id: string): Promise<Document> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/documents/${id}`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao carregar documento')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao carregar documento:', error)
    toast.error('Erro ao carregar documento')
    throw error
  }
}

export const reprocessDocument = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/documents/${id}/reprocess`, {
      method: 'POST',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao reprocessar documento')
    }

    toast.success('Documento enviado para reprocessamento')
  } catch (error) {
    console.error('Erro ao reprocessar documento:', error)
    toast.error('Erro ao reprocessar documento')
    throw error
  }
}

export const removeDocument = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/documents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao remover documento')
    }

    toast.success('Documento removido com sucesso')
  } catch (error) {
    console.error('Erro ao remover documento:', error)
    toast.error('Erro ao remover documento')
    throw error
  }
}

export const resendDocument = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/documents/${id}/resend`, {
      method: 'POST',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao reenviar documento')
    }

    toast.success('Documento reenviado para vetorização')
  } catch (error) {
    console.error('Erro ao reenviar documento:', error)
    toast.error('Erro ao reenviar documento')
    throw error
  }
}

export const getDocumentLogs = async (id: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/documents/${id}/logs`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao carregar logs')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao carregar logs:', error)
    toast.error('Erro ao carregar logs')
    throw error
  }
}

// =============================================================================
// FUNÇÕES DE ESTATÍSTICAS
// =============================================================================

export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
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

export const getSystemStats = async (): Promise<SystemStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/system-stats`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao carregar estatísticas do sistema')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao carregar estatísticas do sistema:', error)
    toast.error('Erro ao carregar estatísticas do sistema')
    throw error
  }
}

// =============================================================================
// FUNÇÕES DE USUÁRIOS
// =============================================================================

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao carregar usuários')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
    toast.error('Erro ao carregar usuários')
    throw error
  }
}

export const updateUserRole = async (userId: string, role: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role })
    })

    if (!response.ok) {
      throw new Error('Erro ao atualizar role do usuário')
    }

    toast.success('Role do usuário atualizada com sucesso')
  } catch (error) {
    console.error('Erro ao atualizar role do usuário:', error)
    toast.error('Erro ao atualizar role do usuário')
    throw error
  }
}

// =============================================================================
// FUNÇÕES DE CONFIGURAÇÃO
// =============================================================================

export const getSystemConfig = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/config`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao carregar configurações')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao carregar configurações:', error)
    toast.error('Erro ao carregar configurações')
    throw error
  }
}

export const updateSystemConfig = async (config: any): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/config`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    })

    if (!response.ok) {
      throw new Error('Erro ao atualizar configurações')
    }

    toast.success('Configurações atualizadas com sucesso')
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    toast.error('Erro ao atualizar configurações')
    throw error
  }
}

// =============================================================================
// FUNÇÕES DE WEBSOCKET (TEMPO REAL)
// =============================================================================

export const connectWebSocket = (onMessage: (data: any) => void): WebSocket | null => {
  try {
    const token = localStorage.getItem('gabi_token')
    const ws = new WebSocket(`ws://localhost:3001/ws?token=${token}`)

    ws.onopen = () => {
      console.log('WebSocket conectado')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('Erro no WebSocket:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket desconectado')
    }

    return ws
  } catch (error) {
    console.error('Erro ao conectar WebSocket:', error)
    return null
  }
}

// =============================================================================
// FUNÇÕES DE EXPORTAÇÃO
// =============================================================================

export const exportDocuments = async (filters: DocumentFilters = {}): Promise<Blob> => {
  try {
    const params = new URLSearchParams()
    
    if (filters.search) params.append('search', filters.search)
    if (filters.sources?.length) params.append('sources', filters.sources.join(','))
    if (filters.statuses?.length) params.append('statuses', filters.statuses.join(','))
    if (filters.bases?.length) params.append('bases', filters.bases.join(','))

    const response = await fetch(`${API_BASE_URL}/admin/documents/export?${params}`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao exportar documentos')
    }

    return await response.blob()
  } catch (error) {
    console.error('Erro ao exportar documentos:', error)
    toast.error('Erro ao exportar documentos')
    throw error
  }
}

export const exportLogs = async (documentId: string): Promise<Blob> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/documents/${documentId}/logs/export`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao exportar logs')
    }

    return await response.blob()
  } catch (error) {
    console.error('Erro ao exportar logs:', error)
    toast.error('Erro ao exportar logs')
    throw error
  }
} 