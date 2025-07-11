import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import WebSocket from 'ws';

// Cliente MCP WebSocket
class MCPWebSocketClient {
  constructor(serverUrl = 'ws://localhost:8080') {
    this.serverUrl = serverUrl;
    this.client = new Client({
      name: 'mcp-websocket-client',
      version: '1.0.0',
    });
    this.ws = null;
    this.isConnected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.serverUrl);
      
      this.ws.on('open', async () => {
        console.log('WebSocket conectado');
        this.isConnected = true;
        
        try {
          const transport = new WebSocketClientTransport(this.ws);
          await this.client.connect(transport);
          console.log('Cliente MCP WebSocket conectado com sucesso!');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      });
      
      this.ws.on('close', () => {
        console.log('WebSocket desconectado');
        this.isConnected = false;
      });
      
      this.ws.on('error', (error) => {
        console.error('Erro no WebSocket:', error);
        reject(error);
      });
    });
  }

  handleMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'chat_message':
        console.log('📨 Nova mensagem de chat:', data);
        break;
      
      case 'notification':
        console.log('🔔 Nova notificação:', data);
        break;
      
      case 'broadcast':
        console.log('📢 Broadcast:', data);
        break;
      
      default:
        console.log('📥 Mensagem recebida:', message);
    }
  }

  async disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.isConnected = false;
  }

  async callTool(name, args) {
    if (!this.isConnected) {
      throw new Error('Cliente não está conectado');
    }
    
    try {
      const response = await this.client.callTool({
        name,
        arguments: args
      });
      return response;
    } catch (error) {
      console.error(`Erro ao chamar ferramenta ${name}:`, error);
      throw error;
    }
  }

  async getRealTimeData(dataType, interval = 1000) {
    return await this.callTool('real_time_data', { dataType, interval });
  }

  async sendChatMessage(message, userId, roomId = 'general') {
    return await this.callTool('chat_message', { message, userId, roomId });
  }

  async sendNotification(title, message, type = 'info', userId = null) {
    const args = { title, message, type };
    if (userId) args.userId = userId;
    return await this.callTool('notification', args);
  }

  async listTools() {
    return await this.callTool('tools/list', {});
  }
}

// Exemplo de uso do cliente WebSocket
async function exemploWebSocket() {
  const client = new MCPWebSocketClient();
  
  try {
    await client.connect();
    
    // Listar ferramentas disponíveis
    console.log('=== Ferramentas Disponíveis ===');
    const tools = await client.listTools();
    console.log(tools);
    
    // Enviar mensagem de chat
    console.log('\n=== Enviando Mensagem de Chat ===');
    const chatResult = await client.sendChatMessage(
      'Olá! Esta é uma mensagem de teste via MCP WebSocket!',
      'user123',
      'sala-teste'
    );
    console.log(chatResult);
    
    // Enviar notificação
    console.log('\n=== Enviando Notificação ===');
    const notificationResult = await client.sendNotification(
      'Teste MCP',
      'Esta é uma notificação de teste via MCP WebSocket!',
      'success'
    );
    console.log(notificationResult);
    
    // Obter dados em tempo real
    console.log('\n=== Dados em Tempo Real ===');
    const realTimeData = await client.getRealTimeData('sensor', 2000);
    console.log(realTimeData);
    
    // Manter conexão aberta para receber mensagens
    console.log('\n=== Aguardando mensagens... (Pressione Ctrl+C para sair) ===');
    
    // Simular envio de mensagens periódicas
    setInterval(async () => {
      try {
        await client.sendChatMessage(
          `Mensagem automática - ${new Date().toLocaleTimeString()}`,
          'bot',
          'sala-teste'
        );
      } catch (error) {
        console.error('Erro ao enviar mensagem automática:', error);
      }
    }, 10000); // A cada 10 segundos
    
  } catch (error) {
    console.error('Erro no exemplo WebSocket:', error);
  }
}

// Cliente de teste simples
class TestClient {
  constructor() {
    this.ws = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('ws://localhost:8080');
      
      this.ws.on('open', () => {
        console.log('Cliente de teste conectado');
        resolve();
      });
      
      this.ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        console.log('📥 Cliente de teste recebeu:', message);
      });
      
      this.ws.on('error', reject);
    });
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Executar exemplo se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  exemploWebSocket();
}

export { MCPWebSocketClient, TestClient }; 