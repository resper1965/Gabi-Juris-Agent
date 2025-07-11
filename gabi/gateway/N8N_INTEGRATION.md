# Integração com n8n - Gabi Gateway

## Visão Geral

Este documento descreve a integração completa entre o Gabi Gateway e o n8n para automação de processamento de documentos, incluindo reindexação automática e manual.

## Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Google Drive  │    │   SharePoint    │    │   Upload Manual │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │         n8n Workflows     │
                    │  (Monitoramento & Trigger)│
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │    Gabi Gateway API       │
                    │   POST /api/docs/update   │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      MCP Server           │
                    │   (Vetorização)           │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Supabase Database     │
                    │  (Documentos Indexados)   │
                    └───────────────────────────┘
```

## Endpoints da API

### 1. Atualização de Documentos (n8n → Gateway)

**POST** `/api/docs/update`

Endpoint usado pelo n8n para enviar documentos atualizados.

#### Headers Obrigatórios
```
X-API-Key: your-n8n-api-key
Content-Type: application/json
```

#### Payload
```json
{
  "origin": "google" | "sharepoint" | "manual",
  "docId": "string",
  "filename": "string",
  "userId": "string",
  "lang": "string",
  "content": "string",
  "knowledgeBases": ["string"] // opcional
}
```

#### Resposta de Sucesso
```json
{
  "success": true,
  "data": {
    "documentId": "string",
    "vectorId": "string",
    "status": "indexed"
  },
  "message": "Document indexed successfully"
}
```

### 2. Status de Documentos

**GET** `/api/docs/status`

Retorna o status de todos os documentos do usuário.

#### Parâmetros de Query
- `origin`: Filtro por origem (google, sharepoint, manual)
- `status`: Filtro por status (pending, indexed, error)
- `knowledgeBase`: Filtro por base de conhecimento
- `dateFrom`: Data inicial (ISO string)
- `dateTo`: Data final (ISO string)
- `search`: Busca por nome do arquivo

#### Resposta
```json
{
  "success": true,
  "data": [
    {
      "docId": "string",
      "origin": "google",
      "filename": "documento.pdf",
      "status": "indexed",
      "lastUpdate": "2024-01-15T10:30:00Z",
      "knowledgeBases": ["default", "projetos"],
      "vectorId": "vector_123",
      "errorMessage": null
    }
  ],
  "message": "Documents retrieved successfully"
}
```

### 3. Reindexação Manual

**POST** `/api/docs/reindex/:docId`

Força a reindexação de um documento específico.

#### Payload
```json
{
  "priority": "low" | "normal" | "high"
}
```

#### Resposta
```json
{
  "success": true,
  "data": {
    "jobId": "reindex_1234567890_abc123",
    "documentId": "string",
    "status": "processing",
    "estimatedTime": 60
  },
  "message": "Reindexing job created successfully"
}
```

### 4. Estatísticas de Documentos

**GET** `/api/docs/stats`

Retorna estatísticas dos documentos do usuário.

#### Resposta
```json
{
  "success": true,
  "data": {
    "total": 150,
    "indexed": 120,
    "pending": 20,
    "error": 10,
    "byOrigin": {
      "google": 80,
      "sharepoint": 50,
      "manual": 20
    },
    "byStatus": {
      "pending": 20,
      "indexed": 120,
      "error": 10
    },
    "averageProcessingTime": 45,
    "lastIndexed": "2024-01-15T10:30:00Z"
  },
  "message": "Statistics retrieved successfully"
}
```

## Workflows n8n

### 1. Monitoramento do Google Drive

```json
{
  "name": "Monitor Google Drive Changes",
  "nodes": [
    {
      "type": "googleDriveTrigger",
      "name": "File Changed",
      "parameters": {
        "folderId": "{{ $env.GOOGLE_DRIVE_FOLDER_ID }}",
        "events": ["file.updated", "file.created"]
      }
    },
    {
      "type": "httpRequest",
      "name": "Send to Gabi Gateway",
      "parameters": {
        "method": "POST",
        "url": "{{ $env.GABI_GATEWAY_URL }}/api/docs/update",
        "headers": {
          "X-API-Key": "{{ $env.N8N_API_KEY }}",
          "Content-Type": "application/json"
        },
        "body": {
          "origin": "google",
          "docId": "{{ $json.id }}",
          "filename": "{{ $json.name }}",
          "userId": "{{ $json.owners[0].emailAddress }}",
          "lang": "pt",
          "content": "{{ $json.content }}",
          "knowledgeBases": ["default"]
        }
      }
    }
  ]
}
```

### 2. Monitoramento do SharePoint

```json
{
  "name": "Monitor SharePoint Changes",
  "nodes": [
    {
      "type": "microsoftGraphTrigger",
      "name": "File Changed",
      "parameters": {
        "resource": "sites/{{ $env.SHAREPOINT_SITE_ID }}/drive/root/children",
        "events": ["created", "updated"]
      }
    },
    {
      "type": "httpRequest",
      "name": "Send to Gabi Gateway",
      "parameters": {
        "method": "POST",
        "url": "{{ $env.GABI_GATEWAY_URL }}/api/docs/update",
        "headers": {
          "X-API-Key": "{{ $env.N8N_API_KEY }}",
          "Content-Type": "application/json"
        },
        "body": {
          "origin": "sharepoint",
          "docId": "{{ $json.id }}",
          "filename": "{{ $json.name }}",
          "userId": "{{ $json.createdBy.user.email }}",
          "lang": "pt",
          "content": "{{ $json.content }}",
          "knowledgeBases": ["default"]
        }
      }
    }
  ]
}
```

### 3. Processamento de Retry

```json
{
  "name": "Retry Failed Documents",
  "nodes": [
    {
      "type": "cron",
      "name": "Daily Retry",
      "parameters": {
        "rule": "0 2 * * *" // 2 AM daily
      }
    },
    {
      "type": "httpRequest",
      "name": "Get Failed Documents",
      "parameters": {
        "method": "GET",
        "url": "{{ $env.GABI_GATEWAY_URL }}/api/docs/status?status=error"
      }
    },
    {
      "type": "splitInBatches",
      "name": "Process Each Document",
      "parameters": {
        "batchSize": 10
      }
    },
    {
      "type": "httpRequest",
      "name": "Reindex Document",
      "parameters": {
        "method": "POST",
        "url": "{{ $env.GABI_GATEWAY_URL }}/api/docs/reindex/{{ $json.docId }}",
        "headers": {
          "X-API-Key": "{{ $env.N8N_API_KEY }}",
          "Content-Type": "application/json"
        },
        "body": {
          "priority": "low"
        }
      }
    }
  ]
}
```

## Configuração do n8n

### 1. Variáveis de Ambiente

```bash
# Gabi Gateway
GABI_GATEWAY_URL=http://localhost:3000
N8N_API_KEY=your-secure-api-key

# Google Drive
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# SharePoint
SHAREPOINT_SITE_ID=your-site-id
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

### 2. Configuração de Segurança

```javascript
// n8n/webhook.js
const crypto = require('crypto');

function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', process.env.N8N_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
    
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
}
```

## Monitoramento e Logs

### 1. Logs de Reindexação

Todos os eventos de reindexação são registrados na tabela `reindex_logs`:

```sql
SELECT 
  rl.action,
  rl.origin,
  rl.status,
  rl.details,
  rl.timestamp,
  u.email as user_email
FROM reindex_logs rl
JOIN supabase_users u ON rl.user_id = u.id
WHERE rl.timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY rl.timestamp DESC;
```

### 2. Métricas de Performance

```sql
-- Tempo médio de processamento
SELECT 
  AVG(EXTRACT(EPOCH FROM (rl.timestamp - rl.created_at))) as avg_processing_time,
  COUNT(*) as total_operations
FROM reindex_logs rl
WHERE rl.status = 'success'
  AND rl.timestamp >= NOW() - INTERVAL '7 days';

-- Taxa de sucesso por origem
SELECT 
  origin,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as success,
  ROUND(
    COUNT(CASE WHEN status = 'success' THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as success_rate
FROM reindex_logs
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY origin;
```

## Tratamento de Erros

### 1. Retry Automático

```javascript
// Implementação de retry com backoff exponencial
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 2. Dead Letter Queue

Para documentos que falharam permanentemente:

```sql
-- Criar tabela para DLQ
CREATE TABLE IF NOT EXISTS document_dlq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL,
  user_id UUID REFERENCES supabase_users(id),
  error_message TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_retry_at TIMESTAMP WITH TIME ZONE
);
```

## Performance e Escalabilidade

### 1. Rate Limiting

```javascript
// Configuração de rate limiting específico para n8n
const n8nRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por minuto
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
  message: {
    error: 'Rate limit exceeded for n8n requests'
  }
});

app.use('/api/docs/update', n8nRateLimit);
```

### 2. Processamento Assíncrono

```javascript
// Usar filas para processamento pesado
import Queue from 'bull';

const documentQueue = new Queue('document-processing', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

// Adicionar job à fila
await documentQueue.add('process-document', {
  documentId,
  userId,
  content,
  metadata
}, {
  priority: 1, // Alta prioridade
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
});
```

## Segurança

### 1. Autenticação de API

```javascript
// Middleware de validação de API key
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.N8N_API_KEY) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'Unauthorized access'
    });
  }
  
  next();
}
```

### 2. Validação de Conteúdo

```javascript
// Sanitização de conteúdo antes da vetorização
function sanitizeContent(content) {
  // Remover scripts maliciosos
  content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Limitar tamanho
  if (content.length > 1000000) { // 1MB
    throw new Error('Content too large');
  }
  
  return content;
}
```

## Roadmap

### Fase 1 (Atual)
- ✅ Endpoints básicos de documentos
- ✅ Integração com n8n
- ✅ Logs de reindexação
- ✅ Frontend para visualização

### Fase 2 (Próxima)
- 🔄 Processamento em lote
- 🔄 Priorização inteligente
- 🔄 Métricas avançadas
- 🔄 Notificações em tempo real

### Fase 3 (Futura)
- 📋 Machine Learning para otimização
- 📋 Processamento distribuído
- 📋 Cache inteligente
- 📋 Backup automático

## Troubleshooting

### Problemas Comuns

1. **Documentos não sendo indexados**
   - Verificar logs do n8n
   - Validar API key
   - Verificar conectividade com MCP

2. **Erros de timeout**
   - Aumentar timeout do MCP
   - Verificar performance do servidor
   - Implementar retry automático

3. **Duplicação de documentos**
   - Verificar hash de conteúdo
   - Implementar deduplicação
   - Validar lógica de upsert

### Comandos Úteis

```bash
# Verificar status dos serviços
curl http://localhost:3000/health

# Testar endpoint de documentos
curl -X POST http://localhost:3000/api/docs/update \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"origin":"manual","docId":"test","filename":"test.txt","userId":"user123","lang":"pt","content":"test content"}'

# Verificar logs
docker logs gabi-gateway --tail 100
``` 