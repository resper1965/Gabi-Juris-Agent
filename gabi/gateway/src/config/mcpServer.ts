// =============================================================================
// CONFIGURAÇÃO DO MCP SERVER
// =============================================================================

export const mcpServerConfig = {
  // URL do servidor MCP conforme especificação
  baseUrl: process.env.MCP_SERVER_URL || 'http://localhost:8080',
  
  // Timeout para requisições
  timeout: 30000, // 30 segundos
  
  // Headers padrão
  headers: {
    'Content-Type': 'application/json'
  },
  
  // Endpoints
  endpoints: {
    chat: '/chat',
    health: '/health',
    agents: '/agents'
  }
}

// =============================================================================
// TIPOS PARA MCP SERVER
// =============================================================================

export interface MCPServerRequest {
  question: string
  agent: string
  bases: string[]
  user: {
    id: string
    email: string
  }
}

export interface MCPServerResponse {
  response: string
  metadata?: {
    tokens?: number
    latency?: number
    agent?: string
  }
} 