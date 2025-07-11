import i18next from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import Backend from 'i18next-fs-backend'
import path from 'path'

// =============================================================================
// CONFIGURAÇÃO I18NEXT
// =============================================================================

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
    },
    fallbackLng: 'pt-BR',
    preload: ['pt-BR', 'en-US'],
    ns: ['common', 'errors', 'messages'],
    defaultNS: 'common',
    detection: {
      order: ['header', 'querystring', 'cookie'],
      lookupHeader: 'x-lang',
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      caches: ['cookie']
    }
  })

// =============================================================================
// MENSAGENS DE ERRO
// =============================================================================

export const errorMessages = {
  'pt-BR': {
    unauthorized: 'Não autorizado. Faça login para continuar.',
    insufficient_permissions: 'Permissões insuficientes para esta ação.',
    internal_server: 'Erro interno do servidor. Tente novamente.',
    resource_id_required: 'ID do recurso é obrigatório.',
    resource_not_owned: 'Você não tem permissão para acessar este recurso.',
    invalid_token: 'Token inválido ou expirado.',
    oauth_error: 'Erro na autenticação OAuth.',
    document_not_found: 'Documento não encontrado.',
    extraction_failed: 'Falha na extração do documento.',
    indexing_failed: 'Falha na indexação do documento.',
    mcp_server_error: 'Erro no servidor MCP.',
    invalid_request: 'Requisição inválida.',
    rate_limit_exceeded: 'Limite de requisições excedido.',
    service_unavailable: 'Serviço temporariamente indisponível.',
    reindex_failed: 'Falha na reindexação do documento.',
    batch_reindex_failed: 'Falha na reindexação em lote.',
    job_not_found: 'Job de processamento não encontrado.',
    job_already_finished: 'Job já foi finalizado.',
    workflow_setup_failed: 'Falha na configuração dos workflows n8n.',
    n8n_connection_error: 'Erro de conexão com n8n.'
  },
  'en-US': {
    unauthorized: 'Unauthorized. Please login to continue.',
    insufficient_permissions: 'Insufficient permissions for this action.',
    internal_server: 'Internal server error. Please try again.',
    resource_id_required: 'Resource ID is required.',
    resource_not_owned: 'You do not have permission to access this resource.',
    invalid_token: 'Invalid or expired token.',
    oauth_error: 'OAuth authentication error.',
    document_not_found: 'Document not found.',
    extraction_failed: 'Document extraction failed.',
    indexing_failed: 'Document indexing failed.',
    mcp_server_error: 'MCP server error.',
    invalid_request: 'Invalid request.',
    rate_limit_exceeded: 'Rate limit exceeded.',
    service_unavailable: 'Service temporarily unavailable.',
    reindex_failed: 'Document reindexing failed.',
    batch_reindex_failed: 'Batch reindexing failed.',
    job_not_found: 'Processing job not found.',
    job_already_finished: 'Job already finished.',
    workflow_setup_failed: 'N8N workflow setup failed.',
    n8n_connection_error: 'N8N connection error.'
  }
}

// =============================================================================
// MENSAGENS DE SUCESSO
// =============================================================================

export const successMessages = {
  'pt-BR': {
    oauth_success: 'Autenticação OAuth realizada com sucesso.',
    document_listed: 'Documentos listados com sucesso.',
    document_extracted: 'Documento extraído com sucesso.',
    document_indexed: 'Documento indexado com sucesso.',
    access_revoked: 'Acesso revogado com sucesso.',
    token_refreshed: 'Token atualizado com sucesso.',
    reindex_started: 'Reindexação iniciada com sucesso.',
    batch_reindex_started: 'Reindexação em lote iniciada com sucesso.',
    job_cancelled: 'Job cancelado com sucesso.',
    workflows_created: 'Workflows n8n criados com sucesso.',
    document_synced: 'Documentos sincronizados com sucesso.',
    document_deleted: 'Documento excluído com sucesso.'
  },
  'en-US': {
    oauth_success: 'OAuth authentication successful.',
    document_listed: 'Documents listed successfully.',
    document_extracted: 'Document extracted successfully.',
    document_indexed: 'Document indexed successfully.',
    access_revoked: 'Access revoked successfully.',
    token_refreshed: 'Token refreshed successfully.',
    reindex_started: 'Reindexing started successfully.',
    batch_reindex_started: 'Batch reindexing started successfully.',
    job_cancelled: 'Job cancelled successfully.',
    workflows_created: 'N8N workflows created successfully.',
    document_synced: 'Documents synced successfully.',
    document_deleted: 'Document deleted successfully.'
  }
}

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

export function getLocalizedMessage(key: string, lang: string = 'pt-BR'): string {
  const messages = errorMessages[lang as keyof typeof errorMessages] || errorMessages['pt-BR']
  return messages[key as keyof typeof messages] || key
}

export function getSuccessMessage(key: string, lang: string = 'pt-BR'): string {
  const messages = successMessages[lang as keyof typeof successMessages] || successMessages['pt-BR']
  return messages[key as keyof typeof messages] || key
}

export function getLocalizedResponse(key: string, lang: string = 'pt-BR') {
  return {
    'pt-BR': getLocalizedMessage(key, 'pt-BR'),
    'en-US': getLocalizedMessage(key, 'en-US')
  }
}

// =============================================================================
// MIDDLEWARE DE INTERNACIONALIZAÇÃO
// =============================================================================

export const i18nMiddleware = i18nextMiddleware.handle(i18next)

// =============================================================================
// VALIDAÇÃO DE IDIOMA SUPORTADO
// =============================================================================

export function isValidLanguage(lang: string): boolean {
  return ['pt-BR', 'en-US'].includes(lang)
}

export function getDefaultLanguage(): string {
  return 'pt-BR'
} 