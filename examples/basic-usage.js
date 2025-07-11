import MCPClient from '../src/client.js';
import { MCPWebSocketClient } from '../src/websocket-client.js';

// Exemplo básico de uso do cliente MCP
async function exemploBasico() {
  console.log('🚀 Iniciando exemplo básico de MCP...\n');
  
  const client = new MCPClient();
  
  try {
    // Conectar ao servidor
    await client.connect();
    console.log('✅ Conectado ao servidor MCP\n');
    
    // Listar ferramentas disponíveis
    console.log('📋 Ferramentas disponíveis:');
    const tools = await client.listTools();
    console.log(JSON.stringify(tools, null, 2));
    console.log();
    
    // Exemplo 1: Informações do sistema
    console.log('💻 Informações do sistema:');
    const sysInfo = await client.getSystemInfo();
    console.log(sysInfo.content[0].text);
    console.log();
    
    // Exemplo 2: Operação com arquivo
    console.log('📁 Operação com arquivo:');
    const fileList = await client.fileOperation('list', './');
    console.log(fileList.content[0].text);
    console.log();
    
    // Exemplo 3: Requisição de API
    console.log('🌐 Requisição de API:');
    const apiResponse = await client.apiRequest('https://jsonplaceholder.typicode.com/posts/1');
    console.log(apiResponse.content[0].text);
    console.log();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Exemplo de uso com WebSocket
async function exemploWebSocket() {
  console.log('🔌 Iniciando exemplo WebSocket MCP...\n');
  
  const client = new MCPWebSocketClient();
  
  try {
    // Conectar ao servidor WebSocket
    await client.connect();
    console.log('✅ Conectado ao servidor WebSocket MCP\n');
    
    // Enviar mensagem de chat
    console.log('💬 Enviando mensagem de chat:');
    const chatResult = await client.sendChatMessage(
      'Olá! Este é um teste do MCP WebSocket!',
      'usuario-teste',
      'sala-demo'
    );
    console.log(chatResult.content[0].text);
    console.log();
    
    // Enviar notificação
    console.log('🔔 Enviando notificação:');
    const notificationResult = await client.sendNotification(
      'Teste MCP',
      'Esta é uma notificação de teste!',
      'success'
    );
    console.log(notificationResult.content[0].text);
    console.log();
    
    // Obter dados em tempo real
    console.log('📊 Dados em tempo real:');
    const realTimeData = await client.getRealTimeData('sensor-teste', 1000);
    console.log(realTimeData.content[0].text);
    console.log();
    
    // Manter conexão por alguns segundos para receber mensagens
    console.log('⏳ Aguardando mensagens por 5 segundos...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Erro WebSocket:', error.message);
  } finally {
    await client.disconnect();
    console.log('🔌 Desconectado do WebSocket');
  }
}

// Exemplo de integração com diferentes tipos de dados
async function exemploIntegracao() {
  console.log('🔗 Iniciando exemplo de integração...\n');
  
  const client = new MCPClient();
  
  try {
    await client.connect();
    
    // Simular consulta de banco de dados
    console.log('🗄️ Consulta de banco de dados:');
    const dbResult = await client.databaseQuery(
      'SELECT * FROM users WHERE active = true',
      'user_database'
    );
    console.log(dbResult.content[0].text);
    console.log();
    
    // Simular busca na web
    console.log('🔍 Busca na web:');
    const searchResult = await client.webSearch('Model Context Protocol');
    console.log(searchResult.content[0].text);
    console.log();
    
    // Criar e ler arquivo
    console.log('📝 Criando e lendo arquivo:');
    const testContent = 'Este é um arquivo de teste criado via MCP!\n' + 
                       'Timestamp: ' + new Date().toISOString();
    
    await client.fileOperation('write', './teste-mcp.txt', testContent);
    console.log('✅ Arquivo criado');
    
    const readResult = await client.fileOperation('read', './teste-mcp.txt');
    console.log('📖 Conteúdo do arquivo:');
    console.log(readResult.content[0].text);
    console.log();
    
  } catch (error) {
    console.error('❌ Erro na integração:', error.message);
  }
}

// Função principal para executar todos os exemplos
async function executarExemplos() {
  console.log('🎯 EXEMPLOS DE INTEGRAÇÃO MCP\n');
  console.log('=' .repeat(50));
  
  // Exemplo básico
  await exemploBasico();
  console.log('=' .repeat(50));
  
  // Exemplo WebSocket
  await exemploWebSocket();
  console.log('=' .repeat(50));
  
  // Exemplo de integração
  await exemploIntegracao();
  console.log('=' .repeat(50));
  
  console.log('✅ Todos os exemplos foram executados!');
}

// Executar se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  executarExemplos().catch(console.error);
}

export { exemploBasico, exemploWebSocket, exemploIntegracao, executarExemplos }; 