import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Tipos para as mensagens
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    agentId?: string
    baseIds?: string[]
    tokens?: number
    latency?: number
  }
}

// Tipos para agentes
export interface Agent {
  id: string
  name: string
  description: string
  type: 'juridico' | 'contrato' | 'prazo' | 'custom'
  isActive: boolean
  metadata?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
}

// Tipos para bases de conhecimento
export interface KnowledgeBase {
  id: string
  name: string
  description: string
  type: 'documentos' | 'jurisprudencia' | 'contratos' | 'custom'
  isActive: boolean
  metadata?: {
    source?: string
    lastUpdated?: Date
    documentCount?: number
  }
}

// Interface do estado do chat
interface ChatState {
  // Estado das mensagens
  messages: Message[]
  isLoading: boolean
  error: string | null
  
  // Estado dos agentes e bases
  selectedAgent: string | null
  selectedBases: string[]
  availableAgents: Agent[]
  availableBases: KnowledgeBase[]
  
  // Estado da sessão
  sessionId: string | null
  userId: string | null
  
  // Ações para mensagens
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  removeMessage: (id: string) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Ações para agentes
  setSelectedAgent: (agentId: string | null) => void
  addAgent: (agent: Agent) => void
  updateAgent: (agentId: string, updates: Partial<Agent>) => void
  removeAgent: (agentId: string) => void
  setAvailableAgents: (agents: Agent[]) => void
  
  // Ações para bases de conhecimento
  setSelectedBases: (baseIds: string[]) => void
  toggleBase: (baseId: string) => void
  addBase: (base: KnowledgeBase) => void
  updateBase: (baseId: string, updates: Partial<KnowledgeBase>) => void
  removeBase: (baseId: string) => void
  setAvailableBases: (bases: KnowledgeBase[]) => void
  
  // Ações para sessão
  setSession: (sessionId: string, userId: string) => void
  clearSession: () => void
  
  // Ações utilitárias
  reset: () => void
}

// Estado inicial
const initialState = {
  messages: [],
  isLoading: false,
  error: null,
  selectedAgent: null,
  selectedBases: [],
  availableAgents: [
    {
      id: 'agente-juridico',
      name: 'Agente Jurídico',
      description: 'Especialista em direito e jurisprudência',
      type: 'juridico',
      isActive: true,
      metadata: {
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 4000
      }
    },
    {
      id: 'agente-contrato',
      name: 'Agente de Contratos',
      description: 'Especialista em análise e redação de contratos',
      type: 'contrato',
      isActive: true,
      metadata: {
        model: 'gpt-4',
        temperature: 0.2,
        maxTokens: 4000
      }
    },
    {
      id: 'agente-prazo',
      name: 'Agente de Prazos',
      description: 'Especialista em prazos processuais e calendário',
      type: 'prazo',
      isActive: true,
      metadata: {
        model: 'gpt-4',
        temperature: 0.1,
        maxTokens: 2000
      }
    }
  ],
  availableBases: [
    {
      id: 'base-documentos',
      name: 'Documentos Internos',
      description: 'Documentos, contratos e pareceres da empresa',
      type: 'documentos',
      isActive: true,
      metadata: {
        source: 'internal',
        lastUpdated: new Date(),
        documentCount: 1250
      }
    },
    {
      id: 'base-jurisprudencia',
      name: 'Jurisprudência',
      description: 'Decisões do STF, STJ e tribunais estaduais',
      type: 'jurisprudencia',
      isActive: true,
      metadata: {
        source: 'public',
        lastUpdated: new Date(),
        documentCount: 50000
      }
    },
    {
      id: 'base-contratos',
      name: 'Modelos de Contratos',
      description: 'Modelos e templates de contratos',
      type: 'contratos',
      isActive: true,
      metadata: {
        source: 'internal',
        lastUpdated: new Date(),
        documentCount: 150
      }
    }
  ],
  sessionId: null,
  userId: null
}

// Store principal
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Ações para mensagens
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date()
        }]
      })),
      
      updateMessage: (id, updates) => set((state) => ({
        messages: state.messages.map(msg => 
          msg.id === id ? { ...msg, ...updates } : msg
        )
      })),
      
      removeMessage: (id) => set((state) => ({
        messages: state.messages.filter(msg => msg.id !== id)
      })),
      
      clearMessages: () => set({ messages: [] }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      // Ações para agentes
      setSelectedAgent: (agentId) => set({ selectedAgent: agentId }),
      
      addAgent: (agent) => set((state) => ({
        availableAgents: [...state.availableAgents, agent]
      })),
      
      updateAgent: (agentId, updates) => set((state) => ({
        availableAgents: state.availableAgents.map(agent => 
          agent.id === agentId ? { ...agent, ...updates } : agent
        )
      })),
      
      removeAgent: (agentId) => set((state) => ({
        availableAgents: state.availableAgents.filter(agent => agent.id !== agentId),
        selectedAgent: state.selectedAgent === agentId ? null : state.selectedAgent
      })),
      
      setAvailableAgents: (agents) => set({ availableAgents: agents }),
      
      // Ações para bases de conhecimento
      setSelectedBases: (baseIds) => set({ selectedBases: baseIds }),
      
      toggleBase: (baseId) => set((state) => ({
        selectedBases: state.selectedBases.includes(baseId)
          ? state.selectedBases.filter(id => id !== baseId)
          : [...state.selectedBases, baseId]
      })),
      
      addBase: (base) => set((state) => ({
        availableBases: [...state.availableBases, base]
      })),
      
      updateBase: (baseId, updates) => set((state) => ({
        availableBases: state.availableBases.map(base => 
          base.id === baseId ? { ...base, ...updates } : base
        )
      })),
      
      removeBase: (baseId) => set((state) => ({
        availableBases: state.availableBases.filter(base => base.id !== baseId),
        selectedBases: state.selectedBases.filter(id => id !== baseId)
      })),
      
      setAvailableBases: (bases) => set({ availableBases: bases }),
      
      // Ações para sessão
      setSession: (sessionId, userId) => set({ sessionId, userId }),
      
      clearSession: () => set({ sessionId: null, userId: null }),
      
      // Ação de reset
      reset: () => set(initialState)
    }),
    {
      name: 'lexmcp-chat-storage',
      partialize: (state) => ({
        selectedAgent: state.selectedAgent,
        selectedBases: state.selectedBases,
        availableAgents: state.availableAgents,
        availableBases: state.availableBases,
        sessionId: state.sessionId,
        userId: state.userId
      })
    }
  )
)

// Hooks utilitários
export const useSelectedAgent = () => {
  const { selectedAgent, availableAgents } = useChatStore()
  return availableAgents.find(agent => agent.id === selectedAgent) || null
}

export const useSelectedBases = () => {
  const { selectedBases, availableBases } = useChatStore()
  return availableBases.filter(base => selectedBases.includes(base.id))
}

export const useMessageCount = () => {
  const { messages } = useChatStore()
  return messages.length
}

export const useLastMessage = () => {
  const { messages } = useChatStore()
  return messages[messages.length - 1] || null
} 