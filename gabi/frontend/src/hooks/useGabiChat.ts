import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { 
  gabiApiService,
  GabiChatResponse,
  GabiChatSession,
  GabiMessage,
  GabiAgent,
  GabiBase,
  GabiTenant
} from '@/services/gabiApiService'
import { useAuth } from '@/hooks/useAuth'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface UseGabiChatOptions {
  tenantId: string
  agentId?: string
  baseIds?: string[]
  styleSource?: string
  autoConnect?: boolean
  enableHistory?: boolean
}

interface ChatState {
  messages: GabiMessage[]
  currentSession: GabiChatSession | null
  agents: GabiAgent[]
  bases: GabiBase[]
  tenant: GabiTenant | null
  loading: boolean
  sending: boolean
  error: string | null
  isConnected: boolean
}

interface ChatActions {
  sendMessage: (question: string, options?: SendMessageOptions) => Promise<GabiChatResponse | null>
  createSession: (options?: CreateSessionOptions) => Promise<GabiChatSession | null>
  loadHistory: (chatId: string) => Promise<void>
  deleteSession: (chatId: string) => Promise<void>
  refreshAgents: () => Promise<void>
  refreshBases: () => Promise<void>
  clearMessages: () => void
  retryLastMessage: () => Promise<void>
}

interface SendMessageOptions {
  styleOverride?: any
  customInstructions?: string
  chatId?: string
}

interface CreateSessionOptions {
  agentId?: string
  baseIds?: string[]
  styleSource?: string
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useGabiChat(options: UseGabiChatOptions): [ChatState, ChatActions] {
  const { user } = useAuth()
  const { tenantId, agentId: initialAgentId, baseIds: initialBaseIds, styleSource: initialStyleSource, autoConnect = true, enableHistory = true } = options

  const [state, setState] = useState<ChatState>({
    messages: [],
    currentSession: null,
    agents: [],
    bases: [],
    tenant: null,
    loading: false,
    sending: false,
    error: null,
    isConnected: false
  })

  const lastMessageRef = useRef<GabiMessage | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // =============================================================================
  // EFEITOS INICIAIS
  // =============================================================================

  useEffect(() => {
    if (autoConnect && tenantId) {
      initializeChat()
    }
  }, [tenantId, autoConnect])

  // =============================================================================
  // INICIALIZAÇÃO
  // =============================================================================

  const initializeChat = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // Carregar dados em paralelo
      const [agents, bases, tenant] = await Promise.all([
        gabiApiService.getAgents(tenantId),
        gabiApiService.getBases(tenantId),
        gabiApiService.getTenant(tenantId)
      ])

      setState(prev => ({
        ...prev,
        agents,
        bases,
        tenant,
        loading: false,
        isConnected: true
      }))

      // Criar sessão inicial se não existir
      if (!state.currentSession && initialAgentId && initialBaseIds) {
        await createSession({
          agentId: initialAgentId,
          baseIds: initialBaseIds,
          styleSource: initialStyleSource
        })
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao inicializar chat'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        isConnected: false
      }))
      
      toast.error(errorMessage)
    }
  }, [tenantId, initialAgentId, initialBaseIds, initialStyleSource, state.currentSession])

  // =============================================================================
  // AÇÕES PRINCIPAIS
  // =============================================================================

  const sendMessage = useCallback(async (
    question: string,
    options: SendMessageOptions = {}
  ): Promise<GabiChatResponse | null> => {
    if (!state.isConnected) {
      toast.error('Chat não está conectado')
      return null
    }

    if (!question.trim()) {
      toast.error('Digite uma pergunta')
      return null
    }

    try {
      setState(prev => ({ ...prev, sending: true, error: null }))

      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Criar novo controller para esta requisição
      abortControllerRef.current = new AbortController()

      // Determinar agentId e baseIds
      const finalAgentId = options.chatId ? 
        state.currentSession?.agent_id || initialAgentId || state.agents[0]?.id :
        options.chatId ? state.currentSession?.agent_id : initialAgentId || state.agents[0]?.id

      const finalBaseIds = options.chatId ?
        state.currentSession?.base_ids || initialBaseIds || [] :
        initialBaseIds || []

      if (!finalAgentId || finalBaseIds.length === 0) {
        throw new Error('Agente ou bases não configurados')
      }

      // Enviar mensagem
      const response = await gabiApiService.askQuestion(
        question,
        finalAgentId,
        finalBaseIds,
        tenantId,
        {
          styleSource: state.currentSession?.style_source || initialStyleSource,
          chatId: options.chatId || state.currentSession?.chat_id,
          styleOverride: options.styleOverride,
          customInstructions: options.customInstructions
        }
      )

      // Criar objeto de mensagem
      const message: GabiMessage = {
        id: response.request_id,
        chat_id: response.chat_id,
        question,
        answer: response.answer,
        sources: response.sources,
        style: response.style,
        created_at: new Date().toISOString(),
        processing_time: response.processing_time,
        tokens_used: response.tokens_used,
        confidence_score: response.confidence_score,
        style_inheritance: response.style_inheritance
      }

      // Atualizar estado
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, message],
        sending: false
      }))

      lastMessageRef.current = message

      // Atualizar sessão se necessário
      if (!state.currentSession || state.currentSession.chat_id !== response.chat_id) {
        const session = await gabiApiService.getChatSession(response.chat_id)
        if (session) {
          setState(prev => ({ ...prev, currentSession: session }))
        }
      }

      toast.success('Resposta recebida!')
      return response

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Requisição foi cancelada
        return null
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar mensagem'
      setState(prev => ({ ...prev, sending: false, error: errorMessage }))
      
      toast.error(errorMessage)
      return null
    }
  }, [state.isConnected, state.currentSession, state.agents, initialAgentId, initialBaseIds, initialStyleSource, tenantId])

  const createSession = useCallback(async (
    options: CreateSessionOptions = {}
  ): Promise<GabiChatSession | null> => {
    try {
      const finalAgentId = options.agentId || initialAgentId || state.agents[0]?.id
      const finalBaseIds = options.baseIds || initialBaseIds || []
      const finalStyleSource = options.styleSource || initialStyleSource

      if (!finalAgentId || finalBaseIds.length === 0) {
        throw new Error('Agente ou bases não configurados')
      }

      const session = await gabiApiService.createChatSession(
        tenantId,
        finalAgentId,
        finalBaseIds,
        finalStyleSource
      )

      setState(prev => ({ ...prev, currentSession: session }))

      // Carregar histórico se habilitado
      if (enableHistory) {
        await loadHistory(session.chat_id)
      }

      toast.success('Nova sessão de chat criada!')
      return session

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar sessão'
      setState(prev => ({ ...prev, error: errorMessage }))
      
      toast.error(errorMessage)
      return null
    }
  }, [tenantId, initialAgentId, initialBaseIds, initialStyleSource, state.agents, enableHistory])

  const loadHistory = useCallback(async (chatId: string): Promise<void> => {
    try {
      const messages = await gabiApiService.getChatHistory(chatId)
      setState(prev => ({ ...prev, messages }))
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      toast.error('Erro ao carregar histórico de mensagens')
    }
  }, [])

  const deleteSession = useCallback(async (chatId: string): Promise<void> => {
    try {
      await gabiApiService.deleteChatSession(chatId)
      
      if (state.currentSession?.chat_id === chatId) {
        setState(prev => ({ 
          ...prev, 
          currentSession: null,
          messages: []
        }))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir sessão'
      toast.error(errorMessage)
    }
  }, [state.currentSession])

  const refreshAgents = useCallback(async (): Promise<void> => {
    try {
      const agents = await gabiApiService.getAgents(tenantId)
      setState(prev => ({ ...prev, agents }))
    } catch (error) {
      console.error('Erro ao atualizar agentes:', error)
      toast.error('Erro ao atualizar lista de agentes')
    }
  }, [tenantId])

  const refreshBases = useCallback(async (): Promise<void> => {
    try {
      const bases = await gabiApiService.getBases(tenantId)
      setState(prev => ({ ...prev, bases }))
    } catch (error) {
      console.error('Erro ao atualizar bases:', error)
      toast.error('Erro ao atualizar lista de bases')
    }
  }, [tenantId])

  const clearMessages = useCallback((): void => {
    setState(prev => ({ ...prev, messages: [] }))
  }, [])

  const retryLastMessage = useCallback(async (): Promise<void> => {
    if (lastMessageRef.current) {
      const lastMessage = lastMessageRef.current
      await sendMessage(lastMessage.question)
    } else {
      toast.error('Nenhuma mensagem para tentar novamente')
    }
  }, [sendMessage])

  // =============================================================================
  // RETORNO DO HOOK
  // =============================================================================

  const actions: ChatActions = {
    sendMessage,
    createSession,
    loadHistory,
    deleteSession,
    refreshAgents,
    refreshBases,
    clearMessages,
    retryLastMessage
  }

  return [state, actions]
}

// =============================================================================
// HOOKS ESPECIALIZADOS
// =============================================================================

export function useGabiChatSession(chatId: string, tenantId: string) {
  const [session, setSession] = useState<GabiChatSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSession()
  }, [chatId, tenantId])

  const loadSession = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const sessionData = await gabiApiService.getChatSession(chatId)
      setSession(sessionData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar sessão'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const refreshSession = () => loadSession()

  return { session, loading, error, refreshSession }
}

export function useGabiChatHistory(chatId: string, limit: number = 50) {
  const [messages, setMessages] = useState<GabiMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [chatId, limit])

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const history = await gabiApiService.getChatHistory(chatId, limit)
      setMessages(history)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar histórico'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const refreshHistory = () => loadHistory()

  return { messages, loading, error, refreshHistory }
}

// =============================================================================
// HOOKS DE CONFIGURAÇÃO
// =============================================================================

export function useGabiAgents(tenantId: string) {
  const [agents, setAgents] = useState<GabiAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAgents()
  }, [tenantId])

  const loadAgents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const agentsData = await gabiApiService.getAgents(tenantId)
      setAgents(agentsData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar agentes'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const refreshAgents = () => loadAgents()

  return { agents, loading, error, refreshAgents }
}

export function useGabiBases(tenantId: string) {
  const [bases, setBases] = useState<GabiBase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBases()
  }, [tenantId])

  const loadBases = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const basesData = await gabiApiService.getBases(tenantId)
      setBases(basesData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar bases'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const refreshBases = () => loadBases()

  return { bases, loading, error, refreshBases }
}

export function useGabiTenant(tenantId: string) {
  const [tenant, setTenant] = useState<GabiTenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTenant()
  }, [tenantId])

  const loadTenant = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const tenantData = await gabiApiService.getTenant(tenantId)
      setTenant(tenantData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar tenant'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const refreshTenant = () => loadTenant()

  return { tenant, loading, error, refreshTenant }
} 