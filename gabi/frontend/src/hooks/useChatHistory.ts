import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { 
  chatHistoryService, 
  ChatSession, 
  ChatMessage, 
  ChatHistoryFilters,
  ChatHistoryStats 
} from '@/services/chatHistoryService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface UseChatHistoryOptions {
  userId: string
  organizationId: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface ChatHistoryState {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  messages: ChatMessage[]
  stats: ChatHistoryStats | null
  loading: boolean
  loadingMessages: boolean
  loadingStats: boolean
  error: string | null
  filters: ChatHistoryFilters
}

interface ChatHistoryActions {
  // Gestão de sessões
  createSession: (sessionData: {
    agent_id: string
    base_ids: string[]
    style_id: string
    language: string
    title?: string
  }) => Promise<ChatSession>
  
  loadSession: (sessionId: string) => Promise<void>
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => Promise<void>
  archiveSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  restoreSession: (sessionId: string) => Promise<void>
  
  // Gestão de mensagens
  addMessage: (messageData: {
    sender: 'user' | 'agent'
    content: string
    used_docs?: any[]
    tokens_used?: number
    metadata?: any
  }) => Promise<ChatMessage>
  
  regenerateMessage: (messageId: string, newContent: string, newUsedDocs?: any[], newTokensUsed?: number) => Promise<ChatMessage>
  
  // Filtros e busca
  setFilters: (filters: ChatHistoryFilters) => void
  clearFilters: () => void
  searchSessions: (query: string) => void
  
  // Estatísticas
  loadStats: (dateRange?: { start: string; end: string }) => Promise<void>
  
  // Utilitários
  refreshSessions: () => Promise<void>
  exportSession: (sessionId: string) => Promise<any>
  importSession: (importData: any) => Promise<ChatSession>
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useChatHistory(options: UseChatHistoryOptions): ChatHistoryState & ChatHistoryActions {
  const {
    userId,
    organizationId,
    autoRefresh = true,
    refreshInterval = 30000 // 30 segundos
  } = options

  // =============================================================================
  // ESTADO
  // =============================================================================

  const [state, setState] = useState<ChatHistoryState>({
    sessions: [],
    currentSession: null,
    messages: [],
    stats: null,
    loading: false,
    loadingMessages: false,
    loadingStats: false,
    error: null,
    filters: {}
  })

  // =============================================================================
  // INICIALIZAÇÃO
  // =============================================================================

  useEffect(() => {
    if (userId && organizationId) {
      loadInitialData()
    }
  }, [userId, organizationId])

  useEffect(() => {
    if (autoRefresh && userId && organizationId) {
      const interval = setInterval(() => {
        refreshSessions()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, userId, organizationId, refreshInterval])

  // =============================================================================
  // FUNÇÕES PRINCIPAIS
  // =============================================================================

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      await Promise.all([
        refreshSessions(),
        loadStats()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao carregar histórico de conversas' 
      }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const refreshSessions = async () => {
    try {
      const sessions = await chatHistoryService.getChatSessions(
        userId,
        organizationId,
        state.filters
      )
      
      setState(prev => ({ ...prev, sessions }))
    } catch (error) {
      console.error('Erro ao atualizar sessões:', error)
    }
  }

  // =============================================================================
  // GESTÃO DE SESSÕES
  // =============================================================================

  const createSession = useCallback(async (sessionData: {
    agent_id: string
    base_ids: string[]
    style_id: string
    language: string
    title?: string
  }): Promise<ChatSession> => {
    try {
      const session = await chatHistoryService.createChatSession({
        user_id: userId,
        organization_id: organizationId,
        ...sessionData
      })

      setState(prev => ({
        ...prev,
        sessions: [session, ...prev.sessions],
        currentSession: session,
        messages: []
      }))

      toast.success('Nova conversa criada')
      return session
    } catch (error) {
      console.error('Erro ao criar sessão:', error)
      toast.error('Erro ao criar nova conversa')
      throw error
    }
  }, [userId, organizationId])

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      setState(prev => ({ ...prev, loadingMessages: true, error: null }))

      const [session, messages] = await Promise.all([
        chatHistoryService.getChatSession(sessionId),
        chatHistoryService.getChatMessages(sessionId)
      ])

      if (!session) {
        throw new Error('Sessão não encontrada')
      }

      setState(prev => ({
        ...prev,
        currentSession: session,
        messages,
        loadingMessages: false
      }))

      toast.success('Conversa carregada')
    } catch (error) {
      console.error('Erro ao carregar sessão:', error)
      setState(prev => ({ 
        ...prev, 
        loadingMessages: false,
        error: 'Erro ao carregar conversa' 
      }))
      toast.error('Erro ao carregar conversa')
    }
  }, [])

  const updateSession = useCallback(async (sessionId: string, updates: Partial<ChatSession>) => {
    try {
      const updatedSession = await chatHistoryService.updateChatSession(sessionId, updates)

      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(session =>
          session.id === sessionId ? updatedSession : session
        ),
        currentSession: prev.currentSession?.id === sessionId ? updatedSession : prev.currentSession
      }))

      toast.success('Conversa atualizada')
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error)
      toast.error('Erro ao atualizar conversa')
    }
  }, [])

  const archiveSession = useCallback(async (sessionId: string) => {
    try {
      await chatHistoryService.archiveChatSession(sessionId)
      
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(session =>
          session.id === sessionId 
            ? { ...session, status: 'archived' as const }
            : session
        ),
        currentSession: prev.currentSession?.id === sessionId ? null : prev.currentSession
      }))
    } catch (error) {
      console.error('Erro ao arquivar sessão:', error)
    }
  }, [])

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await chatHistoryService.deleteChatSession(sessionId)
      
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.filter(session => session.id !== sessionId),
        currentSession: prev.currentSession?.id === sessionId ? null : prev.currentSession
      }))
    } catch (error) {
      console.error('Erro ao deletar sessão:', error)
    }
  }, [])

  const restoreSession = useCallback(async (sessionId: string) => {
    try {
      await chatHistoryService.restoreChatSession(sessionId)
      
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(session =>
          session.id === sessionId 
            ? { ...session, status: 'active' as const }
            : session
        )
      }))
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error)
    }
  }, [])

  // =============================================================================
  // GESTÃO DE MENSAGENS
  // =============================================================================

  const addMessage = useCallback(async (messageData: {
    sender: 'user' | 'agent'
    content: string
    used_docs?: any[]
    tokens_used?: number
    metadata?: any
  }) => {
    if (!state.currentSession) {
      throw new Error('Nenhuma sessão ativa')
    }

    try {
      const message = await chatHistoryService.addChatMessage({
        chat_id: state.currentSession.id,
        ...messageData
      })

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, message]
      }))

      return message
    } catch (error) {
      console.error('Erro ao adicionar mensagem:', error)
      throw error
    }
  }, [state.currentSession])

  const regenerateMessage = useCallback(async (
    messageId: string, 
    newContent: string, 
    newUsedDocs?: any[], 
    newTokensUsed?: number
  ) => {
    try {
      const updatedMessage = await chatHistoryService.regenerateMessage(
        messageId,
        newContent,
        newUsedDocs,
        newTokensUsed
      )

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(message =>
          message.id === messageId ? updatedMessage : message
        )
      }))

      toast.success('Resposta regenerada')
      return updatedMessage
    } catch (error) {
      console.error('Erro ao regenerar mensagem:', error)
      toast.error('Erro ao regenerar resposta')
      throw error
    }
  }, [])

  // =============================================================================
  // FILTROS E BUSCA
  // =============================================================================

  const setFilters = useCallback((filters: ChatHistoryFilters) => {
    setState(prev => ({ ...prev, filters }))
  }, [])

  const clearFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: {} }))
  }, [])

  const searchSessions = useCallback((query: string) => {
    setState(prev => ({ 
      ...prev, 
      filters: { ...prev.filters, search: query } 
    }))
  }, [])

  // =============================================================================
  // ESTATÍSTICAS
  // =============================================================================

  const loadStats = useCallback(async (dateRange?: { start: string; end: string }) => {
    try {
      setState(prev => ({ ...prev, loadingStats: true }))
      
      const stats = await chatHistoryService.getChatHistoryStats(
        userId,
        organizationId,
        dateRange
      )
      
      setState(prev => ({ ...prev, stats, loadingStats: false }))
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      setState(prev => ({ ...prev, loadingStats: false }))
    }
  }, [userId, organizationId])

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const exportSession = useCallback(async (sessionId: string) => {
    try {
      const exportData = await chatHistoryService.exportChatSession(sessionId)
      
      // Criar arquivo para download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-session-${sessionId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Conversa exportada com sucesso')
      return exportData
    } catch (error) {
      console.error('Erro ao exportar sessão:', error)
      toast.error('Erro ao exportar conversa')
      throw error
    }
  }, [])

  const importSession = useCallback(async (importData: any) => {
    try {
      const session = await chatHistoryService.importChatSession(
        userId,
        organizationId,
        importData
      )

      setState(prev => ({
        ...prev,
        sessions: [session, ...prev.sessions]
      }))

      toast.success('Conversa importada com sucesso')
      return session
    } catch (error) {
      console.error('Erro ao importar sessão:', error)
      toast.error('Erro ao importar conversa')
      throw error
    }
  }, [userId, organizationId])

  // =============================================================================
  // RETORNO
  // =============================================================================

  return {
    // Estado
    sessions: state.sessions,
    currentSession: state.currentSession,
    messages: state.messages,
    stats: state.stats,
    loading: state.loading,
    loadingMessages: state.loadingMessages,
    loadingStats: state.loadingStats,
    error: state.error,
    filters: state.filters,

    // Ações
    createSession,
    loadSession,
    updateSession,
    archiveSession,
    deleteSession,
    restoreSession,
    addMessage,
    regenerateMessage,
    setFilters,
    clearFilters,
    searchSessions,
    loadStats,
    refreshSessions,
    exportSession,
    importSession
  }
} 