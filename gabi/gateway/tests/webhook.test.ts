import request from 'supertest'
import app from '../src/app'
import { WebhookService } from '../src/services/webhookService'

// =============================================================================
// TESTES UNITÁRIOS PARA WEBHOOKS
// =============================================================================

describe('Webhook Endpoints', () => {
  const validApiKey = 'n8n-secret'
  const baseUrl = '/api/webhook'

  // =============================================================================
  // TESTES DE AUTENTICAÇÃO
  // =============================================================================

  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      const response = await request(app)
        .post(`${baseUrl}/documents`)
        .send({
          source: 'google',
          filename: 'test.pdf',
          file_id: 'test123',
          last_modified: '2025-01-10T10:00:00.000Z',
          base_id: 'test',
          event: 'created'
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('API key')
    })

    it('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .post(`${baseUrl}/documents`)
        .set('x-api-key', 'invalid-key')
        .send({
          source: 'google',
          filename: 'test.pdf',
          file_id: 'test123',
          last_modified: '2025-01-10T10:00:00.000Z',
          base_id: 'test',
          event: 'created'
        })

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('API key inválida')
    })

    it('should accept requests with valid API key', async () => {
      const response = await request(app)
        .post(`${baseUrl}/documents`)
        .set('x-api-key', validApiKey)
        .send({
          source: 'google',
          filename: 'test.pdf',
          file_id: 'test123',
          last_modified: '2025-01-10T10:00:00.000Z',
          base_id: 'test',
          event: 'created'
        })

      // Deve retornar 200 mesmo com erro de validação (conforme especificação)
      expect(response.status).toBe(200)
    })
  })

  // =============================================================================
  // TESTES DE VALIDAÇÃO DE PAYLOAD
  // =============================================================================

  describe('Payload Validation', () => {
    it('should reject payload without required fields', async () => {
      const response = await request(app)
        .post(`${baseUrl}/documents`)
        .set('x-api-key', validApiKey)
        .send({
          source: 'google',
          filename: 'test.pdf'
          // missing required fields
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Campos obrigatórios ausentes')
    })

    it('should reject invalid source', async () => {
      const response = await request(app)
        .post(`${baseUrl}/documents`)
        .set('x-api-key', validApiKey)
        .send({
          source: 'invalid',
          filename: 'test.pdf',
          file_id: 'test123',
          last_modified: '2025-01-10T10:00:00.000Z',
          base_id: 'test',
          event: 'created'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('source deve ser')
    })

    it('should reject invalid event', async () => {
      const response = await request(app)
        .post(`${baseUrl}/documents`)
        .set('x-api-key', validApiKey)
        .send({
          source: 'google',
          filename: 'test.pdf',
          file_id: 'test123',
          last_modified: '2025-01-10T10:00:00.000Z',
          base_id: 'test',
          event: 'invalid'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('event deve ser')
    })

    it('should reject invalid date format', async () => {
      const response = await request(app)
        .post(`${baseUrl}/documents`)
        .set('x-api-key', validApiKey)
        .send({
          source: 'google',
          filename: 'test.pdf',
          file_id: 'test123',
          last_modified: 'invalid-date',
          base_id: 'test',
          event: 'created'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('data ISO válida')
    })
  })

  // =============================================================================
  // TESTES DE PROCESSAMENTO DE WEBHOOK
  // =============================================================================

  describe('Webhook Processing', () => {
    const validPayload = {
      source: 'google' as const,
      filename: 'test-document.pdf',
      file_id: 'test-file-123',
      last_modified: '2025-01-10T10:00:00.000Z',
      base_id: 'legal',
      event: 'created' as const
    }

    it('should process created event successfully', async () => {
      const response = await request(app)
        .post(`${baseUrl}/documents`)
        .set('x-api-key', validApiKey)
        .send(validPayload)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('criado com sucesso')
      expect(response.body.data).toBeDefined()
      expect(response.body.data.document_id).toBeDefined()
    })

    it('should process modified event successfully', async () => {
      const modifiedPayload = {
        ...validPayload,
        event: 'modified' as const,
        file_id: 'test-file-456'
      }

      const response = await request(app)
        .post(`${baseUrl}/documents`)
        .set('x-api-key', validApiKey)
        .send(modifiedPayload)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('modificado com sucesso')
    })

    it('should process deleted event successfully', async () => {
      const deletedPayload = {
        ...validPayload,
        event: 'deleted' as const,
        file_id: 'test-file-789'
      }

      const response = await request(app)
        .post(`${baseUrl}/documents`)
        .set('x-api-key', validApiKey)
        .send(deletedPayload)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('deletado com sucesso')
      expect(response.body.data.status).toBe('deleted')
    })

    it('should handle duplicate file_id by updating existing record', async () => {
      const payload = {
        ...validPayload,
        file_id: 'duplicate-test-123'
      }

      // Primeira requisição
      const response1 = await request(app)
        .post(`${baseUrl}/documents`)
        .set('x-api-key', validApiKey)
        .send(payload)

      expect(response1.status).toBe(200)
      expect(response1.body.success).toBe(true)

      // Segunda requisição com mesmo file_id
      const response2 = await request(app)
        .post(`${baseUrl}/documents`)
        .set('x-api-key', validApiKey)
        .send({
          ...payload,
          filename: 'updated-document.pdf',
          last_modified: '2025-01-10T11:00:00.000Z',
          event: 'modified'
        })

      expect(response2.status).toBe(200)
      expect(response2.body.success).toBe(true)
      expect(response2.body.data.document_id).toBe(response1.body.data.document_id)
    })
  })

  // =============================================================================
  // TESTES DE ENDPOINTS ADICIONAIS
  // =============================================================================

  describe('Additional Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get(`${baseUrl}/health`)
        .set('x-api-key', validApiKey)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('funcionando')
      expect(response.body.data.status).toBe('healthy')
    })

    it('should return webhook statistics', async () => {
      const response = await request(app)
        .get(`${baseUrl}/stats`)
        .set('x-api-key', validApiKey)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.total_webhooks).toBeDefined()
    })

    it('should handle test endpoint in development', async () => {
      const response = await request(app)
        .post(`${baseUrl}/test`)
        .set('x-api-key', validApiKey)
        .send({
          source: 'sharepoint',
          filename: 'test-sharepoint.docx',
          file_id: 'test-sp-123',
          last_modified: '2025-01-10T10:00:00.000Z',
          base_id: 'test',
          event: 'created'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Teste de webhook')
      expect(response.body.data.status).toBe('test')
    })
  })

  // =============================================================================
  // TESTES DE RATE LIMITING
  // =============================================================================

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array.from({ length: 101 }, () =>
        request(app)
          .post(`${baseUrl}/documents`)
          .set('x-api-key', validApiKey)
          .send({
            source: 'google',
            filename: 'rate-limit-test.pdf',
            file_id: `rate-test-${Date.now()}-${Math.random()}`,
            last_modified: '2025-01-10T10:00:00.000Z',
            base_id: 'test',
            event: 'created'
          })
      )

      const responses = await Promise.all(requests)
      const rateLimitedResponses = responses.filter(r => r.status === 429)

      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  // =============================================================================
  // TESTES DE SERVIÇO
  // =============================================================================

  describe('WebhookService', () => {
    let webhookService: WebhookService

    beforeEach(() => {
      webhookService = new WebhookService()
    })

    it('should validate payload correctly', () => {
      const validPayload = {
        source: 'google',
        filename: 'test.pdf',
        file_id: 'test123',
        last_modified: '2025-01-10T10:00:00.000Z',
        base_id: 'test',
        event: 'created'
      }

      const result = webhookService.validatePayload(validPayload)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid payload', () => {
      const invalidPayload = {
        source: 'invalid',
        filename: '',
        file_id: null,
        last_modified: 'invalid-date',
        base_id: '',
        event: 'invalid'
      }

      const result = webhookService.validatePayload(invalidPayload)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate ISO date correctly', () => {
      const validDate = '2025-01-10T10:00:00.000Z'
      const invalidDate = 'invalid-date'

      // Teste com data válida
      const validPayload = {
        source: 'google',
        filename: 'test.pdf',
        file_id: 'test123',
        last_modified: validDate,
        base_id: 'test',
        event: 'created'
      }

      const validResult = webhookService.validatePayload(validPayload)
      expect(validResult.isValid).toBe(true)

      // Teste com data inválida
      const invalidPayload = {
        ...validPayload,
        last_modified: invalidDate
      }

      const invalidResult = webhookService.validatePayload(invalidPayload)
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors.some(e => e.includes('data ISO'))).toBe(true)
    })
  })
})

// =============================================================================
// TESTES DE INTEGRAÇÃO
// =============================================================================

describe('Webhook Integration Tests', () => {
  const validApiKey = 'n8n-secret'

  it('should handle complete webhook flow', async () => {
    // 1. Criar documento
    const createResponse = await request(app)
      .post('/api/webhook/documents')
      .set('x-api-key', validApiKey)
      .send({
        source: 'google',
        filename: 'integration-test.pdf',
        file_id: 'integration-test-123',
        last_modified: '2025-01-10T10:00:00.000Z',
        base_id: 'legal',
        event: 'created',
        metadata: {
          file_size: 1024000,
          mime_type: 'application/pdf',
          owner: 'test@example.com'
        }
      })

    expect(createResponse.status).toBe(200)
    expect(createResponse.body.success).toBe(true)

    // 2. Modificar documento
    const modifyResponse = await request(app)
      .post('/api/webhook/documents')
      .set('x-api-key', validApiKey)
      .send({
        source: 'google',
        filename: 'integration-test-updated.pdf',
        file_id: 'integration-test-123',
        last_modified: '2025-01-10T11:00:00.000Z',
        base_id: 'legal',
        event: 'modified',
        metadata: {
          file_size: 2048000,
          mime_type: 'application/pdf',
          owner: 'test@example.com'
        }
      })

    expect(modifyResponse.status).toBe(200)
    expect(modifyResponse.body.success).toBe(true)

    // 3. Deletar documento
    const deleteResponse = await request(app)
      .post('/api/webhook/documents')
      .set('x-api-key', validApiKey)
      .send({
        source: 'google',
        filename: 'integration-test-updated.pdf',
        file_id: 'integration-test-123',
        last_modified: '2025-01-10T12:00:00.000Z',
        base_id: 'legal',
        event: 'deleted'
      })

    expect(deleteResponse.status).toBe(200)
    expect(deleteResponse.body.success).toBe(true)
    expect(deleteResponse.body.data.status).toBe('deleted')
  })

  it('should handle SharePoint documents', async () => {
    const response = await request(app)
      .post('/api/webhook/documents')
      .set('x-api-key', validApiKey)
      .send({
        source: 'sharepoint',
        filename: 'sharepoint-document.docx',
        file_id: 'sp-doc-123',
        last_modified: '2025-01-10T10:00:00.000Z',
        base_id: 'hr',
        event: 'created',
        metadata: {
          file_size: 512000,
          mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          parent_folder: '/Documents/HR',
          owner: 'hr@company.com'
        }
      })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toBeDefined()
  })
}) 