import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Configuração específica para Magic Chat
const MAGIC_CHAT_CONFIG = {
  baseUrl: process.env.MAGIC_CHAT_BASE_URL || 'https://api.21st.dev',
  apiKey: process.env.MAGIC_CHAT_API_KEY,
  projectId: process.env.MAGIC_CHAT_PROJECT_ID,
  environment: process.env.MAGIC_CHAT_ENVIRONMENT || 'development'
};

// Servidor MCP para Magic Chat
const server = new Server(
  {
    name: 'magic-chat-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Manipulador principal de ferramentas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'magic_chat_query':
      return await handleMagicChatQuery(args);
    
    case 'magic_chat_conversation':
      return await handleMagicChatConversation(args);
    
    case 'magic_chat_agent':
      return await handleMagicChatAgent(args);
    
    case 'magic_chat_knowledge':
      return await handleMagicChatKnowledge(args);
    
    case 'magic_chat_webhook':
      return await handleMagicChatWebhook(args);
    
    case 'magic_chat_analytics':
      return await handleMagicChatAnalytics(args);
    
    case 'magic_chat_deployment':
      return await handleMagicChatDeployment(args);
    
    case 'magic_chat_config':
      return await handleMagicChatConfig(args);
    
    default:
      throw new Error(`Ferramenta desconhecida: ${name}`);
  }
});

// Manipulador para consultas do Magic Chat
async function handleMagicChatQuery(args) {
  const { query, conversationId, userId, context } = args;
  
  try {
    const response = await axios.post(`${MAGIC_CHAT_CONFIG.baseUrl}/api/chat/query`, {
      query,
      conversationId,
      userId,
      context,
      projectId: MAGIC_CHAT_CONFIG.projectId,
      environment: MAGIC_CHAT_CONFIG.environment
    }, {
      headers: {
        'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `Resposta do Magic Chat:\n${JSON.stringify(response.data, null, 2)}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Erro na consulta Magic Chat: ${error.message}`
        }
      ]
    };
  }
}

// Manipulador para gerenciar conversas
async function handleMagicChatConversation(args) {
  const { action, conversationId, userId, metadata } = args;
  
  try {
    let response;
    
    switch (action) {
      case 'create':
        response = await axios.post(`${MAGIC_CHAT_CONFIG.baseUrl}/api/conversations`, {
          userId,
          metadata,
          projectId: MAGIC_CHAT_CONFIG.projectId
        }, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        break;
      
      case 'get':
        response = await axios.get(`${MAGIC_CHAT_CONFIG.baseUrl}/api/conversations/${conversationId}`, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      case 'list':
        response = await axios.get(`${MAGIC_CHAT_CONFIG.baseUrl}/api/conversations`, {
          params: { userId, projectId: MAGIC_CHAT_CONFIG.projectId },
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      case 'delete':
        response = await axios.delete(`${MAGIC_CHAT_CONFIG.baseUrl}/api/conversations/${conversationId}`, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Operação de conversa (${action}):\n${JSON.stringify(response.data, null, 2)}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Erro na operação de conversa: ${error.message}`
        }
      ]
    };
  }
}

// Manipulador para gerenciar agentes
async function handleMagicChatAgent(args) {
  const { action, agentId, config } = args;
  
  try {
    let response;
    
    switch (action) {
      case 'create':
        response = await axios.post(`${MAGIC_CHAT_CONFIG.baseUrl}/api/agents`, {
          ...config,
          projectId: MAGIC_CHAT_CONFIG.projectId
        }, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        break;
      
      case 'update':
        response = await axios.put(`${MAGIC_CHAT_CONFIG.baseUrl}/api/agents/${agentId}`, {
          ...config,
          projectId: MAGIC_CHAT_CONFIG.projectId
        }, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        break;
      
      case 'get':
        response = await axios.get(`${MAGIC_CHAT_CONFIG.baseUrl}/api/agents/${agentId}`, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      case 'list':
        response = await axios.get(`${MAGIC_CHAT_CONFIG.baseUrl}/api/agents`, {
          params: { projectId: MAGIC_CHAT_CONFIG.projectId },
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      case 'delete':
        response = await axios.delete(`${MAGIC_CHAT_CONFIG.baseUrl}/api/agents/${agentId}`, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Operação de agente (${action}):\n${JSON.stringify(response.data, null, 2)}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Erro na operação de agente: ${error.message}`
        }
      ]
    };
  }
}

// Manipulador para gerenciar base de conhecimento
async function handleMagicChatKnowledge(args) {
  const { action, knowledgeId, data, type } = args;
  
  try {
    let response;
    
    switch (action) {
      case 'upload':
        response = await axios.post(`${MAGIC_CHAT_CONFIG.baseUrl}/api/knowledge/upload`, {
          data,
          type,
          projectId: MAGIC_CHAT_CONFIG.projectId
        }, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        break;
      
      case 'search':
        response = await axios.post(`${MAGIC_CHAT_CONFIG.baseUrl}/api/knowledge/search`, {
          query: data,
          projectId: MAGIC_CHAT_CONFIG.projectId
        }, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        break;
      
      case 'list':
        response = await axios.get(`${MAGIC_CHAT_CONFIG.baseUrl}/api/knowledge`, {
          params: { projectId: MAGIC_CHAT_CONFIG.projectId },
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      case 'delete':
        response = await axios.delete(`${MAGIC_CHAT_CONFIG.baseUrl}/api/knowledge/${knowledgeId}`, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Operação de conhecimento (${action}):\n${JSON.stringify(response.data, null, 2)}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Erro na operação de conhecimento: ${error.message}`
        }
      ]
    };
  }
}

// Manipulador para webhooks
async function handleMagicChatWebhook(args) {
  const { action, webhookId, config } = args;
  
  try {
    let response;
    
    switch (action) {
      case 'create':
        response = await axios.post(`${MAGIC_CHAT_CONFIG.baseUrl}/api/webhooks`, {
          ...config,
          projectId: MAGIC_CHAT_CONFIG.projectId
        }, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        break;
      
      case 'list':
        response = await axios.get(`${MAGIC_CHAT_CONFIG.baseUrl}/api/webhooks`, {
          params: { projectId: MAGIC_CHAT_CONFIG.projectId },
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      case 'delete':
        response = await axios.delete(`${MAGIC_CHAT_CONFIG.baseUrl}/api/webhooks/${webhookId}`, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Operação de webhook (${action}):\n${JSON.stringify(response.data, null, 2)}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Erro na operação de webhook: ${error.message}`
        }
      ]
    };
  }
}

// Manipulador para analytics
async function handleMagicChatAnalytics(args) {
  const { action, dateRange, metrics } = args;
  
  try {
    let response;
    
    switch (action) {
      case 'conversations':
        response = await axios.get(`${MAGIC_CHAT_CONFIG.baseUrl}/api/analytics/conversations`, {
          params: { 
            dateRange, 
            projectId: MAGIC_CHAT_CONFIG.projectId 
          },
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      case 'messages':
        response = await axios.get(`${MAGIC_CHAT_CONFIG.baseUrl}/api/analytics/messages`, {
          params: { 
            dateRange, 
            projectId: MAGIC_CHAT_CONFIG.projectId 
          },
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      case 'performance':
        response = await axios.get(`${MAGIC_CHAT_CONFIG.baseUrl}/api/analytics/performance`, {
          params: { 
            dateRange, 
            metrics,
            projectId: MAGIC_CHAT_CONFIG.projectId 
          },
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Analytics (${action}):\n${JSON.stringify(response.data, null, 2)}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Erro nos analytics: ${error.message}`
        }
      ]
    };
  }
}

// Manipulador para deployments
async function handleMagicChatDeployment(args) {
  const { action, deploymentId, config } = args;
  
  try {
    let response;
    
    switch (action) {
      case 'deploy':
        response = await axios.post(`${MAGIC_CHAT_CONFIG.baseUrl}/api/deployments`, {
          ...config,
          projectId: MAGIC_CHAT_CONFIG.projectId
        }, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        break;
      
      case 'status':
        response = await axios.get(`${MAGIC_CHAT_CONFIG.baseUrl}/api/deployments/${deploymentId}/status`, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      case 'list':
        response = await axios.get(`${MAGIC_CHAT_CONFIG.baseUrl}/api/deployments`, {
          params: { projectId: MAGIC_CHAT_CONFIG.projectId },
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      case 'rollback':
        response = await axios.post(`${MAGIC_CHAT_CONFIG.baseUrl}/api/deployments/${deploymentId}/rollback`, {
          projectId: MAGIC_CHAT_CONFIG.projectId
        }, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        break;
      
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Deployment (${action}):\n${JSON.stringify(response.data, null, 2)}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Erro no deployment: ${error.message}`
        }
      ]
    };
  }
}

// Manipulador para configurações
async function handleMagicChatConfig(args) {
  const { action, configKey, configValue } = args;
  
  try {
    let response;
    
    switch (action) {
      case 'get':
        response = await axios.get(`${MAGIC_CHAT_CONFIG.baseUrl}/api/config/${configKey}`, {
          params: { projectId: MAGIC_CHAT_CONFIG.projectId },
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      case 'set':
        response = await axios.put(`${MAGIC_CHAT_CONFIG.baseUrl}/api/config/${configKey}`, {
          value: configValue,
          projectId: MAGIC_CHAT_CONFIG.projectId
        }, {
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        break;
      
      case 'list':
        response = await axios.get(`${MAGIC_CHAT_CONFIG.baseUrl}/api/config`, {
          params: { projectId: MAGIC_CHAT_CONFIG.projectId },
          headers: {
            'Authorization': `Bearer ${MAGIC_CHAT_CONFIG.apiKey}`
          }
        });
        break;
      
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Configuração (${action}):\n${JSON.stringify(response.data, null, 2)}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Erro na configuração: ${error.message}`
        }
      ]
    };
  }
}

// Configuração das ferramentas disponíveis
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'magic_chat_query',
        description: 'Faz consultas ao Magic Chat da 21st.dev',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Pergunta ou comando para o Magic Chat'
            },
            conversationId: {
              type: 'string',
              description: 'ID da conversa (opcional)'
            },
            userId: {
              type: 'string',
              description: 'ID do usuário'
            },
            context: {
              type: 'object',
              description: 'Contexto adicional (opcional)'
            }
          },
          required: ['query', 'userId']
        }
      },
      {
        name: 'magic_chat_conversation',
        description: 'Gerencia conversas do Magic Chat',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['create', 'get', 'list', 'delete'],
              description: 'Ação a ser executada'
            },
            conversationId: {
              type: 'string',
              description: 'ID da conversa (exceto para create e list)'
            },
            userId: {
              type: 'string',
              description: 'ID do usuário'
            },
            metadata: {
              type: 'object',
              description: 'Metadados da conversa (opcional)'
            }
          },
          required: ['action', 'userId']
        }
      },
      {
        name: 'magic_chat_agent',
        description: 'Gerencia agentes do Magic Chat',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['create', 'update', 'get', 'list', 'delete'],
              description: 'Ação a ser executada'
            },
            agentId: {
              type: 'string',
              description: 'ID do agente (exceto para create e list)'
            },
            config: {
              type: 'object',
              description: 'Configuração do agente'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'magic_chat_knowledge',
        description: 'Gerencia base de conhecimento',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['upload', 'search', 'list', 'delete'],
              description: 'Ação a ser executada'
            },
            knowledgeId: {
              type: 'string',
              description: 'ID do conhecimento (para delete)'
            },
            data: {
              type: 'string',
              description: 'Dados para upload ou busca'
            },
            type: {
              type: 'string',
              description: 'Tipo de conhecimento (para upload)'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'magic_chat_webhook',
        description: 'Gerencia webhooks do Magic Chat',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['create', 'list', 'delete'],
              description: 'Ação a ser executada'
            },
            webhookId: {
              type: 'string',
              description: 'ID do webhook (para delete)'
            },
            config: {
              type: 'object',
              description: 'Configuração do webhook'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'magic_chat_analytics',
        description: 'Obtém analytics do Magic Chat',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['conversations', 'messages', 'performance'],
              description: 'Tipo de analytics'
            },
            dateRange: {
              type: 'string',
              description: 'Intervalo de datas (ex: "7d", "30d")'
            },
            metrics: {
              type: 'array',
              description: 'Métricas específicas (para performance)'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'magic_chat_deployment',
        description: 'Gerencia deployments do Magic Chat',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['deploy', 'status', 'list', 'rollback'],
              description: 'Ação a ser executada'
            },
            deploymentId: {
              type: 'string',
              description: 'ID do deployment (para status e rollback)'
            },
            config: {
              type: 'object',
              description: 'Configuração do deployment'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'magic_chat_config',
        description: 'Gerencia configurações do Magic Chat',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['get', 'set', 'list'],
              description: 'Ação a ser executada'
            },
            configKey: {
              type: 'string',
              description: 'Chave da configuração (para get e set)'
            },
            configValue: {
              type: 'string',
              description: 'Valor da configuração (para set)'
            }
          },
          required: ['action']
        }
      }
    ]
  };
});

// Inicialização do servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('Servidor MCP Magic Chat iniciado com sucesso!');
}

main().catch(console.error); 