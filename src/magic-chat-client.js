import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Cliente MCP para Magic Chat da 21st.dev
class MagicChatMCPClient {
  constructor() {
    this.client = new Client({
      name: 'magic-chat-mcp-client',
      version: '1.0.0',
    });
  }

  async connect() {
    const transport = new StdioClientTransport();
    await this.client.connect(transport);
    console.log('Cliente MCP Magic Chat conectado com sucesso!');
  }

  async callTool(name, args) {
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

  // Métodos para consultas
  async query(query, userId, conversationId = null, context = null) {
    const args = { query, userId };
    if (conversationId) args.conversationId = conversationId;
    if (context) args.context = context;
    return await this.callTool('magic_chat_query', args);
  }

  // Métodos para conversas
  async createConversation(userId, metadata = {}) {
    return await this.callTool('magic_chat_conversation', {
      action: 'create',
      userId,
      metadata
    });
  }

  async getConversation(conversationId) {
    return await this.callTool('magic_chat_conversation', {
      action: 'get',
      conversationId
    });
  }

  async listConversations(userId) {
    return await this.callTool('magic_chat_conversation', {
      action: 'list',
      userId
    });
  }

  async deleteConversation(conversationId) {
    return await this.callTool('magic_chat_conversation', {
      action: 'delete',
      conversationId
    });
  }

  // Métodos para agentes
  async createAgent(config) {
    return await this.callTool('magic_chat_agent', {
      action: 'create',
      config
    });
  }

  async updateAgent(agentId, config) {
    return await this.callTool('magic_chat_agent', {
      action: 'update',
      agentId,
      config
    });
  }

  async getAgent(agentId) {
    return await this.callTool('magic_chat_agent', {
      action: 'get',
      agentId
    });
  }

  async listAgents() {
    return await this.callTool('magic_chat_agent', {
      action: 'list'
    });
  }

  async deleteAgent(agentId) {
    return await this.callTool('magic_chat_agent', {
      action: 'delete',
      agentId
    });
  }

  // Métodos para base de conhecimento
  async uploadKnowledge(data, type) {
    return await this.callTool('magic_chat_knowledge', {
      action: 'upload',
      data,
      type
    });
  }

  async searchKnowledge(query) {
    return await this.callTool('magic_chat_knowledge', {
      action: 'search',
      data: query
    });
  }

  async listKnowledge() {
    return await this.callTool('magic_chat_knowledge', {
      action: 'list'
    });
  }

  async deleteKnowledge(knowledgeId) {
    return await this.callTool('magic_chat_knowledge', {
      action: 'delete',
      knowledgeId
    });
  }

  // Métodos para webhooks
  async createWebhook(config) {
    return await this.callTool('magic_chat_webhook', {
      action: 'create',
      config
    });
  }

  async listWebhooks() {
    return await this.callTool('magic_chat_webhook', {
      action: 'list'
    });
  }

  async deleteWebhook(webhookId) {
    return await this.callTool('magic_chat_webhook', {
      action: 'delete',
      webhookId
    });
  }

  // Métodos para analytics
  async getConversationAnalytics(dateRange = '7d') {
    return await this.callTool('magic_chat_analytics', {
      action: 'conversations',
      dateRange
    });
  }

  async getMessageAnalytics(dateRange = '7d') {
    return await this.callTool('magic_chat_analytics', {
      action: 'messages',
      dateRange
    });
  }

  async getPerformanceAnalytics(dateRange = '7d', metrics = ['response_time', 'accuracy']) {
    return await this.callTool('magic_chat_analytics', {
      action: 'performance',
      dateRange,
      metrics
    });
  }

  // Métodos para deployments
  async deployAgent(config) {
    return await this.callTool('magic_chat_deployment', {
      action: 'deploy',
      config
    });
  }

  async getDeploymentStatus(deploymentId) {
    return await this.callTool('magic_chat_deployment', {
      action: 'status',
      deploymentId
    });
  }

  async listDeployments() {
    return await this.callTool('magic_chat_deployment', {
      action: 'list'
    });
  }

  async rollbackDeployment(deploymentId) {
    return await this.callTool('magic_chat_deployment', {
      action: 'rollback',
      deploymentId
    });
  }

  // Métodos para configurações
  async getConfig(configKey) {
    return await this.callTool('magic_chat_config', {
      action: 'get',
      configKey
    });
  }

  async setConfig(configKey, configValue) {
    return await this.callTool('magic_chat_config', {
      action: 'set',
      configKey,
      configValue
    });
  }

  async listConfigs() {
    return await this.callTool('magic_chat_config', {
      action: 'list'
    });
  }

  // Método para listar todas as ferramentas
  async listTools() {
    return await this.callTool('tools/list', {});
  }
}

// Exemplo de uso do cliente Magic Chat
async function exemploMagicChat() {
  const client = new MagicChatMCPClient();
  
  try {
    await client.connect();
    
    console.log('=== Exemplo Magic Chat MCP ===\n');
    
    // 1. Fazer uma consulta
    console.log('1. Fazendo consulta...');
    const queryResult = await client.query(
      'Como posso integrar o Magic Chat em minha aplicação?',
      'user123',
      'conv456'
    );
    console.log('Resposta:', queryResult.content[0].text);
    console.log();
    
    // 2. Criar uma conversa
    console.log('2. Criando conversa...');
    const conversationResult = await client.createConversation('user123', {
      title: 'Conversa de teste',
      tags: ['teste', 'mcp']
    });
    console.log('Conversa criada:', conversationResult.content[0].text);
    console.log();
    
    // 3. Listar conversas
    console.log('3. Listando conversas...');
    const conversationsResult = await client.listConversations('user123');
    console.log('Conversas:', conversationsResult.content[0].text);
    console.log();
    
    // 4. Criar um agente
    console.log('4. Criando agente...');
    const agentResult = await client.createAgent({
      name: 'Agente de Suporte',
      description: 'Agente para suporte ao cliente',
      model: 'gpt-4',
      temperature: 0.7
    });
    console.log('Agente criado:', agentResult.content[0].text);
    console.log();
    
    // 5. Fazer upload de conhecimento
    console.log('5. Fazendo upload de conhecimento...');
    const knowledgeResult = await client.uploadKnowledge(
      'O Magic Chat é uma plataforma de IA conversacional da 21st.dev',
      'text'
    );
    console.log('Conhecimento enviado:', knowledgeResult.content[0].text);
    console.log();
    
    // 6. Buscar conhecimento
    console.log('6. Buscando conhecimento...');
    const searchResult = await client.searchKnowledge('Magic Chat');
    console.log('Resultado da busca:', searchResult.content[0].text);
    console.log();
    
    // 7. Obter analytics
    console.log('7. Obtendo analytics...');
    const analyticsResult = await client.getConversationAnalytics('7d');
    console.log('Analytics:', analyticsResult.content[0].text);
    console.log();
    
    // 8. Fazer deployment
    console.log('8. Fazendo deployment...');
    const deploymentResult = await client.deployAgent({
      agentId: 'agent123',
      environment: 'production',
      version: '1.0.0'
    });
    console.log('Deployment:', deploymentResult.content[0].text);
    console.log();
    
  } catch (error) {
    console.error('Erro no exemplo:', error);
  }
}

// Executar exemplo se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  exemploMagicChat();
}

export default MagicChatMCPClient; 