import dotenv from 'dotenv'

// Carrega variáveis de ambiente
dotenv.config()

// =============================================================================
// CONFIGURAÇÕES DO SERVIDOR
// =============================================================================

export interface ServerConfig {
  port: number
  host: string
  nodeEnv: string
  allowedOrigins: string[]
  rateLimitWindowMs: number
  rateLimitMaxRequests: number
}

export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
}

// =============================================================================
// CONFIGURAÇÕES DO SUPABASE
// =============================================================================

export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceKey: string
  jwtSecret: string
}

export const supabaseConfig: SupabaseConfig = {
  url: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  jwtSecret: process.env.JWT_SECRET || 'gabi-jwt-secret-change-in-production'
}

// =============================================================================
// CONFIGURAÇÕES MCP
// =============================================================================

export interface MCPConfig {
  registryUrl: string
  jurisprudenciaUrl: string
  ingestaoUrl: string
  scrapingUrl: string
}

export const mcpConfig: MCPConfig = {
  registryUrl: process.env.MCP_REGISTRY_URL || 'http://localhost:3001',
  jurisprudenciaUrl: process.env.MCP_JURISPRUDENCIA_URL || 'http://localhost:3003',
  ingestaoUrl: process.env.MCP_INGESTAO_URL || 'http://localhost:3004',
  scrapingUrl: process.env.MCP_SCRAPING_URL || 'http://localhost:3005'
}

// =============================================================================
// CONFIGURAÇÕES WEAVIATE
// =============================================================================

export interface WeaviateConfig {
  url: string
  apiKey: string
}

export const weaviateConfig: WeaviateConfig = {
  url: process.env.WEAVIATE_URL || 'http://localhost:8080',
  apiKey: process.env.WEAVIATE_API_KEY || 'gabi-weaviate-key'
}

// =============================================================================
// CONFIGURAÇÕES EVOAI
// =============================================================================

export interface EvoAIConfig {
  url: string
  apiKey: string
}

export const evoaiConfig: EvoAIConfig = {
  url: process.env.EVOAI_URL || 'http://localhost:3006',
  apiKey: process.env.EVOAI_API_KEY || 'gabi-evoai-key'
}

// =============================================================================
// CONFIGURAÇÕES DE LOGGING
// =============================================================================

export interface LoggingConfig {
  langfuseUrl: string
  langfuseKey: string
  lokiUrl: string
  lokiKey: string
}

export const loggingConfig: LoggingConfig = {
  langfuseUrl: process.env.LANGFUSE_URL || 'http://localhost:3007',
  langfuseKey: process.env.LANGFUSE_KEY || 'gabi-langfuse-key',
  lokiUrl: process.env.LOKI_URL || 'http://localhost:3100',
  lokiKey: process.env.LOKI_KEY || 'gabi-loki-key'
}

// =============================================================================
// CONFIGURAÇÕES DA ASSISTENTE GABI
// =============================================================================

export interface GabiConfig {
  name: string
  description: string
  avatar: string
  personality: string
  capabilities: string[]
  defaultSettings: {
    model: string
    temperature: number
    maxTokens: number
  }
}

export const gabiConfig: GabiConfig = {
  name: process.env.GABI_NAME || 'Gabi',
  description: process.env.GABI_DESCRIPTION || 'Assistente Jurídica Inteligente',
  avatar: process.env.GABI_AVATAR || 'https://api.dicebear.com/7.x/avataaars/svg?seed=gabi',
  personality: process.env.GABI_PERSONALITY || 'Profissional, precisa e amigável. Especialista em direito brasileiro.',
  capabilities: [
    'consultas_juridicas',
    'analise_contratos',
    'calculo_prazos',
    'interpretacao_legal',
    'redacao_documentos',
    'pesquisa_jurisprudencia'
  ],
  defaultSettings: {
    model: process.env.GABI_DEFAULT_MODEL || 'gpt-4',
    temperature: parseFloat(process.env.GABI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.GABI_MAX_TOKENS || '2000')
  }
}

// =============================================================================
// CONFIGURAÇÕES DE PERSONALIZAÇÃO
// =============================================================================

export interface PersonalizationConfig {
  allowCustomName: boolean
  allowCustomAvatar: boolean
  allowCustomPersonality: boolean
  maxCustomLength: {
    name: number
    description: number
    personality: number
  }
}

export const personalizationConfig: PersonalizationConfig = {
  allowCustomName: process.env.ALLOW_CUSTOM_NAME === 'true',
  allowCustomAvatar: process.env.ALLOW_CUSTOM_AVATAR === 'true',
  allowCustomPersonality: process.env.ALLOW_CUSTOM_PERSONALITY === 'true',
  maxCustomLength: {
    name: parseInt(process.env.MAX_CUSTOM_NAME_LENGTH || '50'),
    description: parseInt(process.env.MAX_CUSTOM_DESCRIPTION_LENGTH || '200'),
    personality: parseInt(process.env.MAX_CUSTOM_PERSONALITY_LENGTH || '500')
  }
}

// =============================================================================
// VALIDAÇÃO DE CONFIGURAÇÕES
// =============================================================================

export function validateConfig(): void {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY'
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias não encontradas: ${missingVars.join(', ')}`)
  }

  // Validações específicas
  if (serverConfig.port < 1 || serverConfig.port > 65535) {
    throw new Error('Porta do servidor deve estar entre 1 e 65535')
  }

  if (supabaseConfig.jwtSecret === 'gabi-jwt-secret-change-in-production') {
    console.warn('⚠️  JWT_SECRET está usando valor padrão. Altere em produção!')
  }
}

// =============================================================================
// CONFIGURAÇÕES DE DESENVOLVIMENTO
// =============================================================================

export const isDevelopment = serverConfig.nodeEnv === 'development'
export const isProduction = serverConfig.nodeEnv === 'production'
export const isTest = serverConfig.nodeEnv === 'test'

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

export {
  serverConfig as default,
  supabaseConfig,
  mcpConfig,
  weaviateConfig,
  evoaiConfig,
  loggingConfig,
  gabiConfig,
  personalizationConfig
} 