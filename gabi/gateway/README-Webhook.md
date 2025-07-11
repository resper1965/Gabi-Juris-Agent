# Sistema de Webhooks da GABI

## 📋 Visão Geral

O sistema de webhooks da GABI permite receber notificações em tempo real sobre mudanças em documentos do Google Drive e SharePoint através do n8n. Este sistema garante que qualquer alteração nas fontes seja refletida automaticamente na base vetorizada da plataforma.

## 🎯 Funcionalidades

### ✅ Implementadas

- **Endpoint REST**: `POST /api/webhook/documents`
- **Autenticação**: Via `x-api-key` header
- **Validação**: Payload completo com tipos TypeScript
- **Persistência**: Supabase com Prisma ORM
- **Vetorização**: Integração automática com serviço de vetorização
- **Logs**: Auditoria completa de todas as operações
- **Rate Limiting**: Proteção contra spam
- **Tratamento de Erros**: Sempre retorna 200 OK
- **Testes**: Cobertura completa com Jest

### 🔄 Fluxo de Processamento

1. **Recebimento**: Webhook do n8n chega no endpoint
2. **Autenticação**: Validação da API key
3. **Validação**: Verificação do payload
4. **Persistência**: Criação/atualização no Supabase
5. **Vetorização**: Processamento automático (se aplicável)
6. **Log**: Registro da operação
7. **Resposta**: Retorno do resultado

## 🛠️ Instalação e Configuração

### 1. Dependências

```bash
npm install @supabase/supabase-js express cors helmet compression express-rate-limit
npm install --save-dev @types/node @types/express jest supertest
```

### 2. Variáveis de Ambiente

```env
# Supabase
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Webhook
N8N_WEBHOOK_API_KEY=n8n-secret
INTERNAL_API_KEY=internal-key

# Servidor
PORT=3001
NODE_ENV=development
```

### 3. Banco de Dados

Execute as migrações do Prisma:

```bash
npx prisma migrate dev --name add_webhook_tables
npx prisma generate
```

## 📡 Uso da API

### Endpoint Principal

```http
POST /api/webhook/documents
Content-Type: application/json
x-api-key: n8n-secret
```

### Payload de Exemplo

```json
{
  "source": "google",
  "filename": "contrato-acordo.pdf",
  "file_id": "1xYZa8l7k9",
  "last_modified": "2025-07-10T14:45:00.000Z",
  "base_id": "legal",
  "event": "created",
  "user_id": "user_123",
  "metadata": {
    "file_size": 1024000,
    "mime_type": "application/pdf",
    "parent_folder": "/Contratos",
    "owner": "joao@empresa.com"
  }
}
```

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Documento criado com sucesso",
  "data": {
    "document_id": "doc_abc123",
    "status": "indexed",
    "vector_id": "vec_xyz789"
  },
  "timestamp": "2025-01-10T10:00:00.000Z"
}
```

### Resposta de Erro

```json
{
  "success": false,
  "message": "Erro interno processado",
  "timestamp": "2025-01-10T10:00:00.000Z"
}
```

## 🔐 Autenticação

### API Key

O sistema usa autenticação via header `x-api-key`:

```bash
curl -X POST http://localhost:3001/api/webhook/documents \
  -H "Content-Type: application/json" \
  -H "x-api-key: n8n-secret" \
  -d '{"source":"google","filename":"test.pdf",...}'
```

### Configuração no n8n

No n8n, configure o webhook com:

- **URL**: `http://localhost:3001/api/webhook/documents`
- **Method**: `POST`
- **Headers**: 
  - `Content-Type: application/json`
  - `x-api-key: n8n-secret`

## 📊 Endpoints Adicionais

### Health Check

```http
GET /api/webhook/health
```

### Estatísticas

```http
GET /api/webhook/stats
```

### Teste (Desenvolvimento)

```http
POST /api/webhook/test
```

## 🗄️ Estrutura do Banco

### Tabela `webhook_documents`

```sql
CREATE TABLE webhook_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('google', 'sharepoint')),
  filename TEXT NOT NULL,
  file_id TEXT UNIQUE NOT NULL,
  last_modified TIMESTAMP NOT NULL,
  base_id TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('created', 'modified', 'deleted')),
  status TEXT NOT NULL DEFAULT 'pending',
  user_id TEXT,
  metadata JSONB,
  vector_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela `webhook_logs`

```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id TEXT NOT NULL,
  source TEXT NOT NULL,
  event TEXT NOT NULL,
  file_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  status TEXT NOT NULL,
  processing_time INTEGER NOT NULL,
  error_message TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## 🧪 Testes

### Executar Testes

```bash
npm test
npm run test:watch
npm run test:coverage
```

### Testes Disponíveis

- ✅ Autenticação
- ✅ Validação de payload
- ✅ Processamento de eventos (create/modify/delete)
- ✅ Rate limiting
- ✅ Tratamento de erros
- ✅ Integração completa

### Exemplo de Teste

```typescript
it('should process created event successfully', async () => {
  const response = await request(app)
    .post('/api/webhook/documents')
    .set('x-api-key', 'n8n-secret')
    .send({
      source: 'google',
      filename: 'test.pdf',
      file_id: 'test123',
      last_modified: '2025-01-10T10:00:00.000Z',
      base_id: 'test',
      event: 'created'
    })

  expect(response.status).toBe(200)
  expect(response.body.success).toBe(true)
})
```

## 📈 Monitoramento

### Logs Estruturados

O sistema gera logs estruturados para todas as operações:

```json
{
  "level": "info",
  "message": "Webhook processado com sucesso",
  "webhook_id": "webhook_1704892800000_abc123",
  "document_id": "doc_xyz789",
  "status": "indexed",
  "processing_time": 1250,
  "vector_id": "vec_123456",
  "timestamp": "2025-01-10T10:00:00.000Z"
}
```

### Métricas Disponíveis

- Total de webhooks processados
- Taxa de sucesso/erro
- Tempo médio de processamento
- Distribuição por fonte (Google/SharePoint)
- Distribuição por evento (create/modify/delete)

## 🔧 Configuração Avançada

### Rate Limiting

```typescript
// Configurar no middleware
webhookRateLimit(60000, 100) // 100 requests por minuto
```

### Timeout de Vetorização

```typescript
// Configurar no serviço
const vectorizationTimeout = 300000 // 5 minutos
```

### Tamanho Máximo de Payload

```typescript
// Configurar no Express
app.use(express.json({ limit: '10mb' }))
```

## 🚀 Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Variáveis de Produção

```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=sua_url_producao
SUPABASE_SERVICE_ROLE_KEY=sua_key_producao
N8N_WEBHOOK_API_KEY=chave_secreta_producao
INTERNAL_API_KEY=chave_interna_producao
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Erro 401**: Verificar se a API key está correta
2. **Erro 400**: Verificar formato do payload
3. **Erro 429**: Rate limit excedido
4. **Erro de vetorização**: Verificar serviço de vetorização

### Logs de Debug

```bash
# Habilitar logs detalhados
DEBUG=webhook:* npm start
```

### Verificar Saúde

```bash
curl http://localhost:3001/api/webhook/health
```

## 📚 Próximos Passos

### Melhorias Planejadas

- [ ] Fila de processamento assíncrono
- [ ] Retry automático em caso de falha
- [ ] Webhook de retorno para n8n
- [ ] Dashboard de monitoramento
- [ ] Alertas por email/Slack
- [ ] Backup automático de logs
- [ ] Compressão de payloads grandes
- [ ] Cache Redis para performance

### Integrações Futuras

- [ ] Microsoft Graph API
- [ ] Google Drive API
- [ ] Dropbox Business
- [ ] OneDrive for Business
- [ ] Box Enterprise

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Adicione testes
5. Execute os testes
6. Faça commit das mudanças
7. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 