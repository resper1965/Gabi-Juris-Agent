import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebSocketServerTransport } from '@modelcontextprotocol/sdk/server/websocket.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import WebSocket from 'ws';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servidor MCP com WebSocket
const mcpServer = new Server(
  {
    name: 'mcp-websocket-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Configuração do WebSocket
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Cliente WebSocket conectado');
  
  const transport = new WebSocketServerTransport(ws);
  mcpServer.connect(transport);
  
  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado');
  });
});

// Manipulador de ferramentas MCP
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  console.log(`Chamada de ferramenta: ${name}`, args);
  
  switch (name) {
    case 'real_time_data':
      return await handleRealTimeData(args);
    
    case 'chat_message':
      return await handleChatMessage(args);
    
    case 'notification':
      return await handleNotification(args);
    
    default:
      throw new Error(`Ferramenta desconhecida: ${name}`);
  }
});

// Manipulador para dados em tempo real
async function handleRealTimeData(args) {
  const { dataType, interval } = args;
  
  // Simula dados em tempo real
  const mockData = {
    timestamp: new Date().toISOString(),
    dataType,
    value: Math.random() * 100,
    interval: interval || 1000
  };
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(mockData, null, 2)
      }
    ]
  };
}

// Manipulador para mensagens de chat
async function handleChatMessage(args) {
  const { message, userId, roomId } = args;
  
  // Simula processamento de mensagem de chat
  const processedMessage = {
    id: Date.now(),
    message,
    userId,
    roomId,
    timestamp: new Date().toISOString(),
    processed: true
  };
  
  // Broadcast para todos os clientes conectados
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'chat_message',
        data: processedMessage
      }));
    }
  });
  
  return {
    content: [
      {
        type: 'text',
        text: `Mensagem processada: ${JSON.stringify(processedMessage, null, 2)}`
      }
    ]
  };
}

// Manipulador para notificações
async function handleNotification(args) {
  const { title, message, type, userId } = args;
  
  const notification = {
    id: Date.now(),
    title,
    message,
    type: type || 'info',
    userId,
    timestamp: new Date().toISOString()
  };
  
  // Envia notificação para clientes específicos ou todos
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
    }
  });
  
  return {
    content: [
      {
        type: 'text',
        text: `Notificação enviada: ${JSON.stringify(notification, null, 2)}`
      }
    ]
  };
}

// Configuração das ferramentas disponíveis
mcpServer.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'real_time_data',
        description: 'Obtém dados em tempo real',
        inputSchema: {
          type: 'object',
          properties: {
            dataType: {
              type: 'string',
              description: 'Tipo de dados'
            },
            interval: {
              type: 'number',
              description: 'Intervalo de atualização em ms'
            }
          },
          required: ['dataType']
        }
      },
      {
        name: 'chat_message',
        description: 'Processa mensagens de chat',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Conteúdo da mensagem'
            },
            userId: {
              type: 'string',
              description: 'ID do usuário'
            },
            roomId: {
              type: 'string',
              description: 'ID da sala'
            }
          },
          required: ['message', 'userId']
        }
      },
      {
        name: 'notification',
        description: 'Envia notificações',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Título da notificação'
            },
            message: {
              type: 'string',
              description: 'Mensagem da notificação'
            },
            type: {
              type: 'string',
              enum: ['info', 'success', 'warning', 'error'],
              description: 'Tipo da notificação'
            },
            userId: {
              type: 'string',
              description: 'ID do usuário (opcional)'
            }
          },
          required: ['title', 'message']
        }
      }
    ]
  };
});

// Rotas da API REST
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/clients', (req, res) => {
  const clients = Array.from(wss.clients).map(client => ({
    readyState: client.readyState,
    connected: client.readyState === WebSocket.OPEN
  }));
  
  res.json({
    totalClients: wss.clients.size,
    connectedClients: clients.filter(c => c.connected).length,
    clients
  });
});

app.post('/broadcast', (req, res) => {
  const { message, type = 'broadcast' } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Mensagem é obrigatória' });
  }
  
  const broadcastData = {
    type,
    message,
    timestamp: new Date().toISOString()
  };
  
  let sentCount = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(broadcastData));
      sentCount++;
    }
  });
  
  res.json({
    success: true,
    sentTo: sentCount,
    data: broadcastData
  });
});

// Inicialização dos servidores
async function main() {
  // Inicia o servidor HTTP
  app.listen(PORT, () => {
    console.log(`Servidor HTTP rodando na porta ${PORT}`);
  });
  
  console.log('Servidor WebSocket MCP iniciado na porta 8080');
  console.log('Use ws://localhost:8080 para conectar via WebSocket');
}

main().catch(console.error); 