import { Router, Request, Response } from 'express'
import axios from 'axios'
import { authenticate } from '../middleware/authMiddleware'
import { AuthRequest, APIResponse, Agent, KnowledgeBase } from '../types'

const router = Router()

// =============================================================================
// ROTA POST /chat
// =============================================================================

/**
 * @route   POST /chat
 * @desc    Envia mensagem para agente MCP
 * @access  Private
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest
    const user = authReq.user!
    const { message, agentId, bases = [] } = req.body

    // Validação dos campos obrigatórios
    if (!message || !agentId) {
      return res.status(400).json({
        success: false,
        error: 'Mensagem e agentId são obrigatórios',
        timestamp: new Date()
      })
    }

    // Prepara payload para o MCP Server conforme especificação
    const mcpPayload = {
      question: message,
      agent: agentId,
      bases: bases,
      user: {
        id: user.id,
        email: user.email
      }
    }

    console.log('Enviando para MCP Server:', {
      url: 'http://localhost:8080',
      payload: mcpPayload
    })

    // Faz chamada para o MCP Server
    const mcpResponse = await axios.post('http://localhost:8080/chat', mcpPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos
    })

    // Retorna resposta conforme especificação
    const response = {
      response: mcpResponse.data.response || mcpResponse.data.message || 'Resposta do agente'
    }

    res.json(response)

  } catch (error: any) {
    console.error('Erro no chat:', error)
    
    // Se for erro do MCP Server
    if (error.response) {
      console.error('Erro do MCP Server:', error.response.data)
      return res.status(error.response.status).json({
        success: false,
        error: 'Erro no servidor MCP',
        details: error.response.data,
        timestamp: new Date()
      })
    }

    // Se for erro de timeout ou conexão
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Servidor MCP não disponível',
        timestamp: new Date()
      })
    }

    // Erro genérico
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      timestamp: new Date()
    })
  }
})

/**
 * @route   GET /chat/agents
 * @desc    Lista agentes disponíveis
 * @access  Private
 */
router.get('/agents', authenticate, async (req: Request, res: Response) => {
  try {
    const agents: Agent[] = [
      {
        id: 'juridico-geral',
        name: 'Advogado Geral',
        description: 'Especialista em consultas jurídicas gerais',
        type: 'mcp',
        endpoint: 'http://localhost:3003',
        isActive: true,
        metadata: {
          model: 'gpt-4',
          temperature: 0.7,
          capabilities: ['consultas_juridicas', 'interpretacao_legal']
        }
      },
      {
        id: 'contratos',
        name: 'Especialista em Contratos',
        description: 'Especialista em análise e redação de contratos',
        type: 'mcp',
        endpoint: 'http://localhost:3004',
        isActive: true,
        metadata: {
          model: 'gpt-4',
          temperature: 0.5,
          capabilities: ['analise_contratos', 'redacao_contratos']
        }
      },
      {
        id: 'prazos',
        name: 'Gestor de Prazos',
        description: 'Especialista em gestão de prazos processuais',
        type: 'mcp',
        endpoint: 'http://localhost:3005',
        isActive: true,
        metadata: {
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          capabilities: ['calculo_prazos', 'lembretes_processuais']
        }
      },
      {
        id: 'tributario',
        name: 'Especialista Tributário',
        description: 'Especialista em direito tributário',
        type: 'mcp',
        endpoint: 'http://localhost:3006',
        isActive: true,
        metadata: {
          model: 'gpt-4',
          temperature: 0.6,
          capabilities: ['direito_tributario', 'planejamento_tributario']
        }
      }
    ]

    const response: APIResponse<Agent[]> = {
      success: true,
      data: agents,
      timestamp: new Date()
    }

    res.json(response)
  } catch (error) {
    console.error('Erro ao listar agentes:', error)
    
    const response: APIResponse = {
      success: false,
      error: 'Erro ao listar agentes',
      timestamp: new Date()
    }
    
    res.status(500).json(response)
  }
})

/**
 * @route   GET /chat/bases
 * @desc    Lista bases de conhecimento do tenant
 * @access  Private
 */
router.get('/bases', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user
    const tenant = user.metadata?.tenant || 'default'

    const bases: KnowledgeBase[] = [
      {
        id: 'legislacao-federal',
        name: 'Legislação Federal',
        description: 'Leis e decretos federais',
        type: 'weaviate',
        endpoint: 'http://localhost:8080',
        isActive: true,
        metadata: {
          documentCount: 15420,
          source: 'Diário Oficial',
          lastUpdated: '2024-01-15'
        }
      },
      {
        id: 'jurisprudencia-stf',
        name: 'Jurisprudência STF',
        description: 'Decisões do Supremo Tribunal Federal',
        type: 'weaviate',
        endpoint: 'http://localhost:8080',
        isActive: true,
        metadata: {
          documentCount: 8920,
          source: 'STF',
          lastUpdated: '2024-01-10'
        }
      },
      {
        id: 'jurisprudencia-stj',
        name: 'Jurisprudência STJ',
        description: 'Decisões do Superior Tribunal de Justiça',
        type: 'weaviate',
        endpoint: 'http://localhost:8080',
        isActive: true,
        metadata: {
          documentCount: 12340,
          source: 'STJ',
          lastUpdated: '2024-01-12'
        }
      },
      {
        id: 'doutrina-juridica',
        name: 'Doutrina Jurídica',
        description: 'Artigos e livros especializados',
        type: 'weaviate',
        endpoint: 'http://localhost:8080',
        isActive: true,
        metadata: {
          documentCount: 5670,
          source: 'Acadêmico',
          lastUpdated: '2024-01-08'
        }
      }
    ]

    // Filtra bases por tenant (implementação futura)
    const tenantBases = bases.filter(base => 
      base.metadata?.tenant === tenant || !base.metadata?.tenant
    )

    const response: APIResponse<KnowledgeBase[]> = {
      success: true,
      data: tenantBases,
      timestamp: new Date()
    }

    res.json(response)
  } catch (error) {
    console.error('Erro ao listar bases:', error)
    
    const response: APIResponse = {
      success: false,
      error: 'Erro ao listar bases',
      timestamp: new Date()
    }
    
    res.status(500).json(response)
  }
})

/**
 * @route   GET /chat/sessions/:sessionId
 * @desc    Obtém histórico de uma sessão
 * @access  Private
 */
router.get('/sessions/:sessionId', 
  AuthMiddleware.requireAuth, 
  AuthMiddleware.requireOwnership('session', 'sessionId'),
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params
      const messages = await getSessionMessages(sessionId)

      const response: APIResponse<any[]> = {
        success: true,
        data: messages,
        timestamp: new Date()
      }

      res.json(response)
    } catch (error) {
      console.error('Erro ao buscar sessão:', error)
      
      const response: APIResponse = {
        success: false,
        error: 'Erro ao buscar sessão',
        timestamp: new Date()
      }
      
      res.status(500).json(response)
    }
  }
)

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

async function logChatInteraction(data: {
  userId: string
  sessionId: string
  message: string
  response: string
  agentId: string
  bases: string[]
  latency: number
  tokens: number
}): Promise<void> {
  try {
    // Log para Langfuse
    await logToLangfuse({
      userId: data.userId,
      sessionId: data.sessionId,
      input: data.message,
      output: data.response,
      metadata: {
        agentId: data.agentId,
        bases: data.bases,
        latency: data.latency,
        tokens: data.tokens
      }
    })

    // Log para Loki
    await logToLoki({
      level: 'info',
      message: 'Chat interaction',
      userId: data.userId,
      sessionId: data.sessionId,
      agentId: data.agentId,
      latency: data.latency,
      tokens: data.tokens
    })
  } catch (error) {
    console.error('Erro ao fazer log da interação:', error)
  }
}

async function logToLangfuse(data: any): Promise<void> {
  // Implementação futura do Langfuse
  console.log('Langfuse log:', data)
}

async function logToLoki(data: any): Promise<void> {
  // Implementação futura do Loki
  console.log('Loki log:', data)
}

async function getSessionMessages(sessionId: string): Promise<any[]> {
  // Implementação futura
  return []
}

export default router 