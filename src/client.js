import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Cliente MCP para conectar ao servidor
class MCPClient {
  constructor() {
    this.client = new Client({
      name: 'mcp-client',
      version: '1.0.0',
    });
  }

  async connect() {
    const transport = new StdioClientTransport();
    await this.client.connect(transport);
    console.log('Cliente MCP conectado com sucesso!');
  }

  async listTools() {
    try {
      const response = await this.client.callTool({
        name: 'tools/list',
        arguments: {}
      });
      return response;
    } catch (error) {
      console.error('Erro ao listar ferramentas:', error);
      throw error;
    }
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

  async webSearch(query) {
    return await this.callTool('web_search', { query });
  }

  async fileOperation(operation, filePath, content = null) {
    const args = { operation, filePath };
    if (content) args.content = content;
    return await this.callTool('file_operations', args);
  }

  async apiRequest(url, method = 'GET', headers = {}, data = null) {
    const args = { url, method, headers };
    if (data) args.data = data;
    return await this.callTool('api_request', args);
  }

  async databaseQuery(query, database) {
    return await this.callTool('database_query', { query, database });
  }

  async getSystemInfo(type = 'general') {
    return await this.callTool('system_info', { type });
  }
}

// Exemplo de uso do cliente
async function exemploUso() {
  const client = new MCPClient();
  
  try {
    await client.connect();
    
    // Listar ferramentas disponíveis
    console.log('=== Ferramentas Disponíveis ===');
    const tools = await client.listTools();
    console.log(tools);
    
    // Exemplo de busca na web
    console.log('\n=== Busca na Web ===');
    const searchResult = await client.webSearch('MCP protocol');
    console.log(searchResult);
    
    // Exemplo de operação com arquivo
    console.log('\n=== Operação com Arquivo ===');
    const fileResult = await client.fileOperation('list', './');
    console.log(fileResult);
    
    // Exemplo de requisição de API
    console.log('\n=== Requisição de API ===');
    const apiResult = await client.apiRequest('https://jsonplaceholder.typicode.com/posts/1');
    console.log(apiResult);
    
    // Exemplo de informações do sistema
    console.log('\n=== Informações do Sistema ===');
    const sysInfo = await client.getSystemInfo();
    console.log(sysInfo);
    
  } catch (error) {
    console.error('Erro no exemplo:', error);
  }
}

// Executar exemplo se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  exemploUso();
}

export default MCPClient; 