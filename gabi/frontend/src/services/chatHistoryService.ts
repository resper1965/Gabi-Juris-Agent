import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface ChatSession {
  id: string
  user_id: string
  organization_id: string
  agent_id: string
  base_ids: string[]
  style_id: string
  language: string
  started_at: string
  ended_at?: string
  title: string
  summary?: string
  status: 'active' | 'archived' | 'deleted'
  metadata?: {
    total_messages?: number
    total_tokens?: number
    last_activity?: string
    tags?: string[]
  }
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  chat_id: string
  sender: 'user' | 'agent'
  content: string
  timestamp: string
  used_docs?: UsedDocument[]
  tokens_used?: number
  metadata?: {
    processing_time?: number
    model?: string
    search_results?: SearchResult[]
    confidence?: number
  }
  created_at: string
}

export interface UsedDocument {
  id: string
  title: string
  base_id: string
  chunk_id: string
  content: string
  score: number
  search_type: 'semantic' | 'lexical' | 'hybrid'
}

export interface SearchResult {
  id: string
  content: string
  source: string
  base_id: string
  document_id: string
  chunk_id: string
  score: number
  searchType: 'semantic' | 'lexical' | 'hybrid'
  metadata: {
    title?: string
    author?: string
    date?: string
    type?: string
    tags?: string[]
    confidence?: number
  }
}

export interface ChatHistoryFilters {
  agent_id?: string
  base_ids?: string[]
  style_id?: string
  date_range?: {
    start: string
    end: string
  }
  status?: 'active' | 'archived' | 'deleted'
  search?: string
}

export interface ChatHistoryStats {
  total_sessions: number
  active_sessions: number
  archived_sessions: number
  total_messages: number
  total_tokens: number
  avg_session_duration: number
  most_used_agents: Array<{ agent_id: string; count: number }>
  most_used_bases: Array<{ base_id: string; count: number }>
  most_used_styles: Array<{ style_id: string; count: number }>
}

// =============================================================================
// SERVIÇO DE HISTÓRICO DE CHAT
// =============================================================================

class ChatHistoryService {
  private supabase: any
  private apiBaseUrl: string

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  }

  // =============================================================================
  // GESTÃO DE SESSÕES
  // =============================================================================

  async createChatSession(sessionData: {
    user_id: string
    organization_id: string
    agent_id: string
    base_ids: string[]
    style_id: string
    language: string
    title?: string
  }): Promise<ChatSession> {
    try {
      const { data, error } = await this.supabase
        .from('chats')
        .insert({
          ...sessionData,
          title: sessionData.title || `Nova Conversa ${new Date().toLocaleString('pt-BR')}`,
          started_at: new Date().toISOString(),
          status: 'active',
          metadata: {
            total_messages: 0,
            total_tokens: 0,
            last_activity: new Date().toISOString(),
            tags: []
          }
        })
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao criar sessão:', error)
      throw new Error('Falha ao criar sessão de chat')
    }
  }

  async getChatSessions(
    userId: string,
    organizationId: string,
    filters?: ChatHistoryFilters
  ): Promise<ChatSession[]> {
    try {
      let query = this.supabase
        .from('chats')
        .select(`
          *,
          chat_messages(count)
        `)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false })

      // Aplicar filtros
      if (filters?.agent_id) {
        query = query.eq('agent_id', filters.agent_id)
      }

      if (filters?.base_ids && filters.base_ids.length > 0) {
        query = query.overlaps('base_ids', filters.base_ids)
      }

      if (filters?.style_id) {
        query = query.eq('style_id', filters.style_id)
      }

      if (filters?.date_range) {
        query = query
          .gte('started_at', filters.date_range.start)
          .lte('started_at', filters.date_range.end)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao buscar sessões:', error)
      return []
    }
  }

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('chats')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao buscar sessão:', error)
      return null
    }
  }

  async updateChatSession(
    sessionId: string,
    updates: Partial<ChatSession>
  ): Promise<ChatSession> {
    try {
      const { data, error } = await this.supabase
        .from('chats')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error)
      throw new Error('Falha ao atualizar sessão')
    }
  }

  async archiveChatSession(sessionId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('chats')
        .update({
          status: 'archived',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) throw error

      toast.success('Conversa arquivada com sucesso')
    } catch (error) {
      console.error('Erro ao arquivar sessão:', error)
      toast.error('Erro ao arquivar conversa')
    }
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      // Soft delete - marcar como deletado
      const { error } = await this.supabase
        .from('chats')
        .update({
          status: 'deleted',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) throw error

      toast.success('Conversa excluída com sucesso')
    } catch (error) {
      console.error('Erro ao deletar sessão:', error)
      toast.error('Erro ao excluir conversa')
    }
  }

  async restoreChatSession(sessionId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('chats')
        .update({
          status: 'active',
          ended_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) throw error

      toast.success('Conversa restaurada com sucesso')
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error)
      toast.error('Erro ao restaurar conversa')
    }
  }

  // =============================================================================
  // GESTÃO DE MENSAGENS
  // =============================================================================

  async addChatMessage(messageData: {
    chat_id: string
    sender: 'user' | 'agent'
    content: string
    used_docs?: UsedDocument[]
    tokens_used?: number
    metadata?: any
  }): Promise<ChatMessage> {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .insert({
          ...messageData,
          timestamp: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Atualizar metadados da sessão
      await this.updateSessionMetadata(messageData.chat_id)

      return data
    } catch (error) {
      console.error('Erro ao adicionar mensagem:', error)
      throw new Error('Falha ao adicionar mensagem')
    }
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', sessionId)
        .order('timestamp', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
      return []
    }
  }

  async updateChatMessage(
    messageId: string,
    updates: Partial<ChatMessage>
  ): Promise<ChatMessage> {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .update(updates)
        .eq('id', messageId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao atualizar mensagem:', error)
      throw new Error('Falha ao atualizar mensagem')
    }
  }

  async regenerateMessage(
    messageId: string,
    newContent: string,
    newUsedDocs?: UsedDocument[],
    newTokensUsed?: number
  ): Promise<ChatMessage> {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .update({
          content: newContent,
          used_docs: newUsedDocs,
          tokens_used: newTokensUsed,
          metadata: {
            regenerated: true,
            regenerated_at: new Date().toISOString()
          }
        })
        .eq('id', messageId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao regenerar mensagem:', error)
      throw new Error('Falha ao regenerar mensagem')
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  private async updateSessionMetadata(sessionId: string): Promise<void> {
    try {
      // Buscar estatísticas da sessão
      const { data: messages } = await this.supabase
        .from('chat_messages')
        .select('tokens_used, timestamp')
        .eq('chat_id', sessionId)

      if (!messages) return

      const totalMessages = messages.length
      const totalTokens = messages.reduce((sum, msg) => sum + (msg.tokens_used || 0), 0)
      const lastActivity = messages[messages.length - 1]?.timestamp

      // Atualizar metadados da sessão
      await this.supabase
        .from('chats')
        .update({
          metadata: {
            total_messages: totalMessages,
            total_tokens: totalTokens,
            last_activity: lastActivity
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
    } catch (error) {
      console.error('Erro ao atualizar metadados da sessão:', error)
    }
  }

  async generateSessionSummary(sessionId: string): Promise<string> {
    try {
      const messages = await this.getChatMessages(sessionId)
      const userMessages = messages.filter(msg => msg.sender === 'user')
      
      if (userMessages.length === 0) return 'Sessão sem mensagens'

      // Usar a primeira pergunta do usuário como base para o resumo
      const firstQuestion = userMessages[0].content
      
      // Se houver mais de uma pergunta, criar um resumo mais abrangente
      if (userMessages.length > 1) {
        const topics = userMessages.map(msg => msg.content.substring(0, 50) + '...')
        return `Conversa sobre: ${topics.slice(0, 3).join(', ')}`
      }

      return firstQuestion.length > 100 
        ? firstQuestion.substring(0, 100) + '...'
        : firstQuestion
    } catch (error) {
      console.error('Erro ao gerar resumo:', error)
      return 'Resumo não disponível'
    }
  }

  // =============================================================================
  // ESTATÍSTICAS E RELATÓRIOS
  // =============================================================================

  async getChatHistoryStats(
    userId: string,
    organizationId: string,
    dateRange?: { start: string; end: string }
  ): Promise<ChatHistoryStats> {
    try {
      let query = this.supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .neq('status', 'deleted')

      if (dateRange) {
        query = query
          .gte('started_at', dateRange.start)
          .lte('started_at', dateRange.end)
      }

      const { data: sessions, error } = await query

      if (error) throw error

      // Calcular estatísticas
      const totalSessions = sessions.length
      const activeSessions = sessions.filter(s => s.status === 'active').length
      const archivedSessions = sessions.filter(s => s.status === 'archived').length

      // Agregar dados
      const agentCounts = this.aggregateByField(sessions, 'agent_id')
      const baseCounts = this.aggregateByArrayField(sessions, 'base_ids')
      const styleCounts = this.aggregateByField(sessions, 'style_id')

      // Calcular duração média das sessões
      const avgSessionDuration = this.calculateAverageSessionDuration(sessions)

      return {
        total_sessions: totalSessions,
        active_sessions: activeSessions,
        archived_sessions: archivedSessions,
        total_messages: sessions.reduce((sum, s) => sum + (s.metadata?.total_messages || 0), 0),
        total_tokens: sessions.reduce((sum, s) => sum + (s.metadata?.total_tokens || 0), 0),
        avg_session_duration: avgSessionDuration,
        most_used_agents: agentCounts,
        most_used_bases: baseCounts,
        most_used_styles: styleCounts
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return {
        total_sessions: 0,
        active_sessions: 0,
        archived_sessions: 0,
        total_messages: 0,
        total_tokens: 0,
        avg_session_duration: 0,
        most_used_agents: [],
        most_used_bases: [],
        most_used_styles: []
      }
    }
  }

  private aggregateByField(data: any[], field: string): Array<{ [key: string]: number }> {
    const counts: { [key: string]: number } = {}
    
    data.forEach(item => {
      const value = item[field]
      if (value) {
        counts[value] = (counts[value] || 0) + 1
      }
    })

    return Object.entries(counts)
      .map(([key, count]) => ({ [field.replace('_id', '')]: key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  private aggregateByArrayField(data: any[], field: string): Array<{ [key: string]: number }> {
    const counts: { [key: string]: number } = {}
    
    data.forEach(item => {
      const values = item[field] || []
      values.forEach((value: string) => {
        counts[value] = (counts[value] || 0) + 1
      })
    })

    return Object.entries(counts)
      .map(([key, count]) => ({ base_id: key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  private calculateAverageSessionDuration(sessions: any[]): number {
    const completedSessions = sessions.filter(s => s.ended_at)
    
    if (completedSessions.length === 0) return 0

    const totalDuration = completedSessions.reduce((sum, session) => {
      const start = new Date(session.started_at)
      const end = new Date(session.ended_at)
      return sum + (end.getTime() - start.getTime())
    }, 0)

    return totalDuration / completedSessions.length / 1000 / 60 // em minutos
  }

  // =============================================================================
  // EXPORTAÇÃO E BACKUP
  // =============================================================================

  async exportChatSession(sessionId: string): Promise<any> {
    try {
      const session = await this.getChatSession(sessionId)
      const messages = await this.getChatMessages(sessionId)

      if (!session) throw new Error('Sessão não encontrada')

      return {
        session,
        messages,
        exported_at: new Date().toISOString(),
        version: '1.0'
      }
    } catch (error) {
      console.error('Erro ao exportar sessão:', error)
      throw new Error('Falha ao exportar sessão')
    }
  }

  async importChatSession(
    userId: string,
    organizationId: string,
    importData: any
  ): Promise<ChatSession> {
    try {
      // Criar nova sessão
      const session = await this.createChatSession({
        user_id: userId,
        organization_id: organizationId,
        agent_id: importData.session.agent_id,
        base_ids: importData.session.base_ids,
        style_id: importData.session.style_id,
        language: importData.session.language,
        title: `${importData.session.title} (Importado)`
      })

      // Importar mensagens
      for (const message of importData.messages) {
        await this.addChatMessage({
          chat_id: session.id,
          sender: message.sender,
          content: message.content,
          used_docs: message.used_docs,
          tokens_used: message.tokens_used,
          metadata: message.metadata
        })
      }

      return session
    } catch (error) {
      console.error('Erro ao importar sessão:', error)
      throw new Error('Falha ao importar sessão')
    }
  }
}

// =============================================================================
// INSTÂNCIA SINGLETON
// =============================================================================

export const chatHistoryService = new ChatHistoryService() 