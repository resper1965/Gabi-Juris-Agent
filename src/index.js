import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

// Configuração do servidor MCP
const server = new Server(
  {
    name: 'mcp-integration-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Ferramenta para buscar informações da web
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'web_search':
      return await handleWebSearch(args);
    
    case 'file_operations':
      return await handleFileOperations(args);
    
    case 'api_request':
      return await handleApiRequest(args);
    
    case 'database_query':
      return await handleDatabaseQuery(args);
    
    case 'system_info':
      return await handleSystemInfo(args);
    
    default:
      throw new Error(`Ferramenta desconhecida: ${name}`);
  }
});

// Manipulador para busca na web
async function handleWebSearch(args) {
  const { query } = args;
  
  try {
    // Exemplo usando uma API de busca (você precisará de uma chave de API)
    const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
    
    return {
      content: [
        {
          type: 'text',
          text: `Resultados da busca para "${query}":\n${JSON.stringify(response.data, null, 2)}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Erro na busca: ${error.message}`
        }
      ]
    };
  }
}

// Manipulador para operações de arquivo
async function handleFileOperations(args) {
  const { operation, filePath, content } = args;
  
  try {
    switch (operation) {
      case 'read':
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: `Conteúdo do arquivo ${filePath}:\n${fileContent}`
            }
          ]
        };
      
      case 'write':
        await fs.writeFile(filePath, content);
        return {
          content: [
            {
              type: 'text',
              text: `Arquivo ${filePath} escrito com sucesso.`
            }
          ]
        };
      
      case 'list':
        const files = await fs.readdir(filePath);
        return {
          content: [
            {
              type: 'text',
              text: `Arquivos em ${filePath}:\n${files.join('\n')}`
            }
          ]
        };
      
      default:
        throw new Error(`Operação desconhecida: ${operation}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Erro na operação de arquivo: ${error.message}`
        }
      ]
    };
  }
}

// Manipulador para requisições de API
async function handleApiRequest(args) {
  const { url, method = 'GET', headers = {}, data } = args;
  
  try {
    const config = {
      method,
      url,
      headers,
      data
    };
    
    const response = await axios(config);
    
    return {
      content: [
        {
          type: 'text',
          text: `Resposta da API (${response.status}):\n${JSON.stringify(response.data, null, 2)}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Erro na requisição da API: ${error.message}`
        }
      ]
    };
  }
}

// Manipulador para consultas de banco de dados (exemplo)
async function handleDatabaseQuery(args) {
  const { query, database } = args;
  
  // Aqui você implementaria a conexão real com seu banco de dados
  // Este é apenas um exemplo
  return {
    content: [
      {
        type: 'text',
        text: `Consulta simulada no banco ${database}:\n${query}\n\nResultado: Dados simulados da consulta.`
      }
    ]
  };
}

// Manipulador para informações do sistema
async function handleSystemInfo(args) {
  const { type } = args;
  
  const systemInfo = {
    platform: process.platform,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    pid: process.pid
  };
  
  return {
    content: [
      {
        type: 'text',
        text: `Informações do sistema:\n${JSON.stringify(systemInfo, null, 2)}`
      }
    ]
  };
}

// Configuração das ferramentas disponíveis
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'web_search',
        description: 'Realiza busca na web',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Termo de busca'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'file_operations',
        description: 'Operações com arquivos (ler, escrever, listar)',
        inputSchema: {
          type: 'object',
          properties: {
            operation: {
              type: 'string',
              enum: ['read', 'write', 'list'],
              description: 'Tipo de operação'
            },
            filePath: {
              type: 'string',
              description: 'Caminho do arquivo'
            },
            content: {
              type: 'string',
              description: 'Conteúdo para escrita (apenas para operação write)'
            }
          },
          required: ['operation', 'filePath']
        }
      },
      {
        name: 'api_request',
        description: 'Faz requisições HTTP para APIs',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL da API'
            },
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE'],
              description: 'Método HTTP'
            },
            headers: {
              type: 'object',
              description: 'Headers da requisição'
            },
            data: {
              type: 'object',
              description: 'Dados para enviar (para POST/PUT)'
            }
          },
          required: ['url']
        }
      },
      {
        name: 'database_query',
        description: 'Executa consultas em banco de dados',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Query SQL'
            },
            database: {
              type: 'string',
              description: 'Nome do banco de dados'
            }
          },
          required: ['query', 'database']
        }
      },
      {
        name: 'system_info',
        description: 'Obtém informações do sistema',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Tipo de informação'
            }
          }
        }
      }
    ]
  };
});

// Inicialização do servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('Servidor MCP iniciado com sucesso!');
}

main().catch(console.error); 