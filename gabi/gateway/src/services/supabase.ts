import { createClient, SupabaseClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { User, UserRole } from '../types'
import { supabaseConfig } from '../config'

// =============================================================================
// CLIENTE SUPABASE
// =============================================================================

class SupabaseService {
  private client: SupabaseClient
  private adminClient: SupabaseClient

  constructor() {
    this.client = createClient(supabaseConfig.url, supabaseConfig.anonKey)
    this.adminClient = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey)
  }

  // =============================================================================
  // AUTENTICAÇÃO JWT
  // =============================================================================

  async verifyJWT(token: string): Promise<User | null> {
    try {
      // Verifica o token JWT
      const decoded = jwt.verify(token, supabaseConfig.jwtSecret) as any
      
      if (!decoded.sub) {
        return null
      }

      // Busca o usuário no Supabase
      const { data: user, error } = await this.adminClient
        .from('users')
        .select('*')
        .eq('id', decoded.sub)
        .single()

      if (error || !user) {
        return null
      }

      return this.mapUserFromSupabase(user)
    } catch (error) {
      console.error('Erro ao verificar JWT:', error)
      return null
    }
  }

  // =============================================================================
  // GERENCIAMENTO DE USUÁRIOS
  // =============================================================================

  async getUserById(id: string): Promise<User | null> {
    try {
      const { data: user, error } = await this.adminClient
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !user) {
        return null
      }

      return this.mapUserFromSupabase(user)
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      return null
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      const { data: user, error } = await this.adminClient
        .from('users')
        .update({
          name: data.name,
          avatar_url: data.avatar_url,
          metadata: data.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Erro ao atualizar usuário: ${error.message}`)
      }

      return this.mapUserFromSupabase(user)
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      throw error
    }
  }

  async createUser(userData: {
    id: string
    email: string
    role: UserRole
    name?: string
    avatar_url?: string
  }): Promise<User> {
    try {
      const { data: user, error } = await this.adminClient
        .from('users')
        .insert({
          id: userData.id,
          email: userData.email,
          role: userData.role,
          name: userData.name,
          avatar_url: userData.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Erro ao criar usuário: ${error.message}`)
      }

      return this.mapUserFromSupabase(user)
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      throw error
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const { error } = await this.adminClient
        .from('users')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Erro ao deletar usuário: ${error.message}`)
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      throw error
    }
  }

  // =============================================================================
  // GERENCIAMENTO DE SESSÕES
  // =============================================================================

  async createSession(userId: string, sessionData: {
    agentId?: string
    baseIds?: string[]
    metadata?: Record<string, any>
  }): Promise<string> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const { error } = await this.adminClient
        .from('chat_sessions')
        .insert({
          id: sessionId,
          user_id: userId,
          agent_id: sessionData.agentId,
          base_ids: sessionData.baseIds || [],
          metadata: sessionData.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw new Error(`Erro ao criar sessão: ${error.message}`)
      }

      return sessionId
    } catch (error) {
      console.error('Erro ao criar sessão:', error)
      throw error
    }
  }

  async getSession(sessionId: string): Promise<any> {
    try {
      const { data: session, error } = await this.adminClient
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error || !session) {
        return null
      }

      return session
    } catch (error) {
      console.error('Erro ao buscar sessão:', error)
      return null
    }
  }

  async updateSession(sessionId: string, data: any): Promise<void> {
    try {
      const { error } = await this.adminClient
        .from('chat_sessions')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) {
        throw new Error(`Erro ao atualizar sessão: ${error.message}`)
      }
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error)
      throw error
    }
  }

  // =============================================================================
  // GERENCIAMENTO DE MENSAGENS
  // =============================================================================

  async saveMessage(messageData: {
    sessionId: string
    role: string
    content: string
    metadata?: Record<string, any>
  }): Promise<void> {
    try {
      const { error } = await this.adminClient
        .from('chat_messages')
        .insert({
          session_id: messageData.sessionId,
          role: messageData.role,
          content: messageData.content,
          metadata: messageData.metadata || {},
          created_at: new Date().toISOString()
        })

      if (error) {
        throw new Error(`Erro ao salvar mensagem: ${error.message}`)
      }
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error)
      throw error
    }
  }

  async getSessionMessages(sessionId: string, limit = 50): Promise<any[]> {
    try {
      const { data: messages, error } = await this.adminClient
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        throw new Error(`Erro ao buscar mensagens: ${error.message}`)
      }

      return messages || []
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
      return []
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  private mapUserFromSupabase(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: supabaseUser.role as UserRole,
      name: supabaseUser.name,
      avatar_url: supabaseUser.avatar_url,
      created_at: supabaseUser.created_at,
      updated_at: supabaseUser.updated_at,
      metadata: supabaseUser.metadata
    }
  }

  // =============================================================================
  // HEALTH CHECK
  // =============================================================================

  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('count')
        .limit(1)

      return !error
    } catch (error) {
      console.error('Erro no health check do Supabase:', error)
      return false
    }
  }
}

// Exporta uma instância singleton
export const supabaseService = new SupabaseService() 