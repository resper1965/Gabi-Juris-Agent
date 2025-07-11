import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { ChatResponse, ChatMessage, MCPServer } from '../types'
import { mcpConfig } from '../config'

// =============================================================================
// CLIENTE MCP
// =============================================================================

class MCPClientService {
  private servers: Map<string, MCPServer> = new Map()

  constructor() {
    this.initializeServers()
  }

  // =============================================================================
  // INICIALIZAÇÃO DE SERVIDORES
  // =============================================================================

  private initializeServers(): void {
    const defaultServers: MCPServer[] = [
      {
        id: 'juridico-geral',
        name: 'Advogado Geral',
        url: mcpConfig.jurisprudenciaUrl,
        isActive: true,
        capabilities: ['consultas_juridicas', 'interpretacao_legal']
      },
      {
        id: 'contratos',
        name: 'Especialista em Contratos',
        url: mcpConfig.ingestaoUrl,
        isActive: true,
        capabilities: ['analise_contratos', 'redacao_contratos']
      },
      {
        id: 'prazos',
        name: 'Gestor de Prazos',
        url: mcpConfig.scrapingUrl,
        isActive: true,
        capabilities: ['calculo_prazos', 'lembretes_processuais']
      }
    ]

    defaultServers.forEach(server => {
      this.servers.set(server.id, server)
    })
  }

  // =============================================================================
  // OPERAÇÕES PRINCIPAIS
  // =============================================================================

  async listServers(): Promise<MCPServer[]> {
    try {
      // Busca servidores do registry
      const registryResponse = await axios.get(`${mcpConfig.registryUrl}/servers`)
      const registryServers = registryResponse.data || []

      // Combina com servidores locais
      const allServers = Array.from(this.servers.values())
      
      registryServers.forEach((server: any) => {
        if (!this.servers.has(server.id)) {
          this.servers.set(server.id, {
            id: server.id,
            name: server.name,
            url: server.url,
            isActive: server.isActive,
            capabilities: server.capabilities || []
          })
        }
      })

      return allServers
    } catch (error) {
      console.error('Erro ao listar servidores MCP:', error)
      return Array.from(this.servers.values())
    }
  }

  async queryAgent(agentId: string, message: string, context?: any): Promise<ChatResponse> {
    try {
      const server = this.servers.get(agentId)
      
      if (!server || !server.isActive) {
        throw new Error(`Agente ${agentId} não encontrado ou inativo`)
      }

      const startTime = Date.now()

      // Prepara payload para o servidor MCP
      const payload = {
        message,
        context: {
          userId: context?.userId,
          tenant: context?.tenant,
          bases: context?.bases || [],
          timestamp: new Date().toISOString()
        },
        sessionId: context?.sessionId || `session_${uuidv4()}`
      }

      // Faz chamada para o servidor MCP
      const response = await axios.post(`${server.url}/chat`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.generateMCPSessionToken(agentId)}`
        },
        timeout: 30000 // 30 segundos
      })

      const endTime = Date.now()
      const latency = endTime - startTime

      // Processa resposta do servidor MCP
      const mcpResponse = response.data
      
      const chatMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: mcpResponse.response || mcpResponse.message || 'Resposta do agente',
        timestamp: new Date(),
        metadata: {
          agentId,
          sessionId: payload.sessionId,
          tokens: mcpResponse.tokens || 0,
          latency
        }
      }

      const chatResponse: ChatResponse = {
        message: chatMessage,
        sessionId: payload.sessionId,
        metadata: {
          tokens: mcpResponse.tokens || 0,
          latency,
          agentUsed: agentId,
          basesQueried: context?.bases || []
        }
      }

      return chatResponse
    } catch (error: any) {
      console.error(`Erro ao consultar agente ${agentId}:`, error)
      
      // Retorna resposta de erro
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente em alguns instantes.`,
        timestamp: new Date(),
        metadata: {
          agentId,
          sessionId: `session_${uuidv4()}`,
          error: error.message
        }
      }

      return {
        message: errorMessage,
        sessionId: errorMessage.metadata?.sessionId || `session_${uuidv4()}`,
        metadata: {
          tokens: 0,
          latency: 0,
          agentUsed: agentId,
          error: error.message
        }
      }
    }
  }

  async getAgentCapabilities(agentId: string): Promise<string[]> {
    try {
      const server = this.servers.get(agentId)
      
      if (!server) {
        return []
      }

      // Busca capacidades do servidor
      const response = await axios.get(`${server.url}/capabilities`, {
        headers: {
          'Authorization': `Bearer ${this.generateMCPSessionToken(agentId)}`
        },
        timeout: 5000
      })

      return response.data.capabilities || server.capabilities
    } catch (error) {
      console.error(`Erro ao buscar capacidades do agente ${agentId}:`, error)
      return this.servers.get(agentId)?.capabilities || []
    }
  }

  // =============================================================================
  // OPERAÇÕES DE TESTE
  // =============================================================================

  async testAgentConnection(agentId: string): Promise<boolean> {
    try {
      const server = this.servers.get(agentId)
      
      if (!server) {
        return false
      }

      const response = await axios.get(`${server.url}/health`, {
        timeout: 5000
      })

      return response.status === 200
    } catch (error) {
      console.error(`Erro no teste de conexão com agente ${agentId}:`, error)
      return false
    }
  }

  async testJurisprudenciaAgent(): Promise<ChatResponse> {
    // Teste específico para o agente de jurisprudência
    const testMessage = "Qual é o prazo para contestação em ação de cobrança?"
    
    return this.queryAgent('juridico-geral', testMessage, {
      userId: 'test-user',
      tenant: 'test-tenant',
      bases: ['jurisprudencia-stf', 'jurisprudencia-stj']
    })
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  private generateMCPSessionToken(agentId: string): string {
    // Gera token de sessão para comunicação com MCP
    const payload = {
      agentId,
      timestamp: Date.now(),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hora
    }

    // Em produção, usar JWT real
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  async healthCheck(): Promise<boolean> {
    try {
      const servers = await this.listServers()
      const activeServers = servers.filter(server => server.isActive)
      
      // Testa pelo menos um servidor
      if (activeServers.length > 0) {
        return await this.testAgentConnection(activeServers[0].id)
      }
      
      return false
    } catch (error) {
      console.error('Erro no health check do MCP:', error)
      return false
    }
  }

  // =============================================================================
  // GERENCIAMENTO DE SERVIDORES
  // =============================================================================

  addServer(server: MCPServer): void {
    this.servers.set(server.id, server)
  }

  removeServer(serverId: string): boolean {
    return this.servers.delete(serverId)
  }

  updateServer(serverId: string, updates: Partial<MCPServer>): boolean {
    const server = this.servers.get(serverId)
    if (!server) {
      return false
    }

    this.servers.set(serverId, { ...server, ...updates })
    return true
  }

  getServer(serverId: string): MCPServer | undefined {
    return this.servers.get(serverId)
  }
}

// Exporta uma instância singleton
export const mcpService = new MCPClientService() 