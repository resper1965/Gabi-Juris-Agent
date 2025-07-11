import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { hybridSearchService, 
  SearchQuery, 
  SearchResult, 
  ChatMessage, 
  ChatSession,
  HybridSearchResponse 
} from '@/services/hybridSearchService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface UseHybridChatOptions {
  organizationId: string
  initialBases?: string[]
  initialAgent?: string
  initialStyle?: string
  initialLanguage?: string
}

interface ChatState {
  currentSession: ChatSession | null
  sessions: ChatSession[]
  messages: ChatMessage[]
  isSearching: boolean
  isGenerating: boolean
  searchResults: SearchResult[]
  suggestions: string[]
  relatedQueries: string[]
  error: string | null
}

interface ChatActions {
  sendMessage: (content: string) => Promise<void>
  createNewSession: (title?: string) => Promise<void>
  loadSession: (sessionId: string) => Promise<void>
  updateSession: (updates: Partial<ChatSession>) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  regenerateResponse: (messageId: string) => Promise<void>
  clearChat: () => void
  setBases: (bases: string[]) => void
  setAgent: (agent: string) => void
  setStyle: (style: string) => void
  setLanguage: (language: string) => void
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useHybridChat(options: UseHybridChatOptions): ChatState & ChatActions {
  const {
    organizationId,
    initialBases = [],
    initialAgent = 'gpt-4',
    initialStyle = 'neutro',
    initialLanguage = 'pt-BR'
  } = options

  // =============================================================================
  // ESTADO
  // =============================================================================

  const [state, setState] = useState<ChatState>({
    currentSession: null,
    sessions: [],
    messages: [],
    isSearching: false,
    isGenerating: false,
    searchResults: [],
    suggestions: [],
    relatedQueries: [],
    error: null
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const isInitializedRef = useRef(false)

  // =============================================================================
  // INICIALIZAÇÃO
  // =============================================================================

  useEffect(() => {
    if (!isInitializedRef.current) {
      initializeChat()
      isInitializedRef.current = true
    }
  }, [organizationId])

  const initializeChat = async () => {
    try {
      // Carregar sessões existentes
      const sessions = await hybridSearchService.getChatSessions()
      
      setState(prev => ({
        ...prev,
        sessions
      }))

      // Criar nova sessão se não houver nenhuma ativa
      if (sessions.length === 0) {
        await createNewSession()
      }
    } catch (error) {
      console.error('Erro ao inicializar chat:', error)
      setState(prev => ({
        ...prev,
        error: 'Erro ao inicializar chat'
      }))
    }
  }

  // =============================================================================
  // AÇÕES PRINCIPAIS
  // =============================================================================

  const sendMessage = useCallback(async (content: string) => {
    if (!state.currentSession) {
      toast.error('Nenhuma sessão ativa')
      return
    }

    if (!content.trim()) {
      return
    }

    try {
      // Cancelar operação anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      // Adicionar mensagem do usuário
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString()
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isSearching: true,
        error: null
      }))

      // Realizar busca híbrida
      const searchQuery: SearchQuery = {
        text: content,
        bases: state.currentSession.bases,
        agent: state.currentSession.agent,
        style: state.currentSession.style,
        language: state.currentSession.language
      }

      const searchResponse = await hybridSearchService.performHybridSearch(searchQuery)

      setState(prev => ({
        ...prev,
        searchResults: searchResponse.results,
        suggestions: searchResponse.suggestions || [],
        relatedQueries: searchResponse.relatedQueries || [],
        isSearching: false,
        isGenerating: true
      }))

      // Gerar resposta
      const assistantMessage = await hybridSearchService.generateResponse(
        content,
        searchResponse.results,
        state.messages,
        state.currentSession.agent,
        state.currentSession.style
      )

      // Adicionar resposta do assistente
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isGenerating: false
      }))

      // Atualizar sessão
      if (state.currentSession) {
        await updateSession({
          messages: [...state.messages, userMessage, assistantMessage],
          updated_at: new Date().toISOString()
        })
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Operação cancelada
      }

      console.error('Erro ao enviar mensagem:', error)
      setState(prev => ({
        ...prev,
        isSearching: false,
        isGenerating: false,
        error: 'Erro ao processar mensagem'
      }))
      toast.error('Erro ao processar mensagem')
    }
  }, [state.currentSession, state.messages])

  const createNewSession = useCallback(async (title?: string) => {
    try {
      const sessionTitle = title || `Nova Conversa ${new Date().toLocaleString('pt-BR')}`
      
      const newSession = await hybridSearchService.createChatSession(
        sessionTitle,
        initialBases,
        initialAgent,
        initialStyle,
        initialLanguage
      )

      setState(prev => ({
        ...prev,
        currentSession: newSession,
        sessions: [newSession, ...prev.sessions],
        messages: [],
        searchResults: [],
        suggestions: [],
        relatedQueries: [],
        error: null
      }))

      toast.success('Nova sessão criada')
    } catch (error) {
      console.error('Erro ao criar sessão:', error)
      toast.error('Erro ao criar nova sessão')
    }
  }, [initialBases, initialAgent, initialStyle, initialLanguage])

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const session = await hybridSearchService.getChatSession(sessionId)
      
      if (!session) {
        toast.error('Sessão não encontrada')
        return
      }

      setState(prev => ({
        ...prev,
        currentSession: session,
        messages: session.messages,
        searchResults: [],
        suggestions: [],
        relatedQueries: [],
        error: null
      }))

      toast.success('Sessão carregada')
    } catch (error) {
      console.error('Erro ao carregar sessão:', error)
      toast.error('Erro ao carregar sessão')
    }
  }, [])

  const updateSession = useCallback(async (updates: Partial<ChatSession>) => {
    if (!state.currentSession) return

    try {
      const updatedSession = await hybridSearchService.updateChatSession(
        state.currentSession.id,
        updates
      )

      setState(prev => ({
        ...prev,
        currentSession: updatedSession,
        sessions: prev.sessions.map(session =>
          session.id === updatedSession.id ? updatedSession : session
        )
      }))
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error)
      toast.error('Erro ao atualizar sessão')
    }
  }, [state.currentSession])

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await hybridSearchService.deleteChatSession(sessionId)

      setState(prev => ({
        ...prev,
        sessions: prev.sessions.filter(session => session.id !== sessionId),
        currentSession: prev.currentSession?.id === sessionId ? null : prev.currentSession
      }))

      toast.success('Sessão excluída')
    } catch (error) {
      console.error('Erro ao deletar sessão:', error)
      toast.error('Erro ao deletar sessão')
    }
  }, [])

  const regenerateResponse = useCallback(async (messageId: string) => {
    const messageIndex = state.messages.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1 || messageIndex === 0) return

    const userMessage = state.messages[messageIndex - 1]
    const assistantMessage = state.messages[messageIndex]

    if (userMessage.role !== 'user' || assistantMessage.role !== 'assistant') return

    try {
      setState(prev => ({
        ...prev,
        isGenerating: true,
        error: null
      }))

      // Realizar nova busca
      const searchQuery: SearchQuery = {
        text: userMessage.content,
        bases: state.currentSession?.bases || [],
        agent: state.currentSession?.agent || 'gpt-4',
        style: state.currentSession?.style || 'neutro',
        language: state.currentSession?.language || 'pt-BR'
      }

      const searchResponse = await hybridSearchService.performHybridSearch(searchQuery)

      // Gerar nova resposta
      const newAssistantMessage = await hybridSearchService.generateResponse(
        userMessage.content,
        searchResponse.results,
        state.messages.slice(0, messageIndex - 1), // Histórico até a mensagem anterior
        state.currentSession?.agent || 'gpt-4',
        state.currentSession?.style || 'neutro'
      )

      // Substituir mensagem
      const newMessages = [...state.messages]
      newMessages[messageIndex] = newAssistantMessage

      setState(prev => ({
        ...prev,
        messages: newMessages,
        searchResults: searchResponse.results,
        isGenerating: false
      }))

      // Atualizar sessão
      if (state.currentSession) {
        await updateSession({
          messages: newMessages,
          updated_at: new Date().toISOString()
        })
      }

      toast.success('Resposta regenerada')
    } catch (error) {
      console.error('Erro ao regenerar resposta:', error)
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: 'Erro ao regenerar resposta'
      }))
      toast.error('Erro ao regenerar resposta')
    }
  }, [state.messages, state.currentSession])

  const clearChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      searchResults: [],
      suggestions: [],
      relatedQueries: [],
      error: null
    }))
  }, [])

  // =============================================================================
  // CONFIGURAÇÕES
  // =============================================================================

  const setBases = useCallback((bases: string[]) => {
    if (state.currentSession) {
      updateSession({ bases })
    }
  }, [state.currentSession, updateSession])

  const setAgent = useCallback((agent: string) => {
    if (state.currentSession) {
      updateSession({ agent })
    }
  }, [state.currentSession, updateSession])

  const setStyle = useCallback((style: string) => {
    if (state.currentSession) {
      updateSession({ style })
    }
  }, [state.currentSession, updateSession])

  const setLanguage = useCallback((language: string) => {
    if (state.currentSession) {
      updateSession({ language })
    }
  }, [state.currentSession, updateSession])

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      cancelOperation()
    }
  }, [cancelOperation])

  // =============================================================================
  // RETORNO
  // =============================================================================

  return {
    // Estado
    currentSession: state.currentSession,
    sessions: state.sessions,
    messages: state.messages,
    isSearching: state.isSearching,
    isGenerating: state.isGenerating,
    searchResults: state.searchResults,
    suggestions: state.suggestions,
    relatedQueries: state.relatedQueries,
    error: state.error,

    // Ações
    sendMessage,
    createNewSession,
    loadSession,
    updateSession,
    deleteSession,
    regenerateResponse,
    clearChat,
    setBases,
    setAgent,
    setStyle,
    setLanguage,

    // Utilitários
    cancelOperation
  }
} 