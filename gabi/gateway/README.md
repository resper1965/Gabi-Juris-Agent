# Gabi Gateway - Backend

Backend Node.js com TypeScript para o sistema Gabi, incluindo autenticação, chat com agentes MCP, OAuth 2.0, processamento de documentos e integração com n8n.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Autenticação JWT** via Supabase
- **Controle de acesso RBAC** (Role-Based Access Control)
- **Chat com agentes MCP** (Model Context Protocol)
- **OAuth 2.0** Google e Microsoft
- **Processamento de documentos** Google Drive e SharePoint
- **Indexação vetorial** via MCP Server
- **Integração com n8n** para automação
- **Reindexação automática e manual** de documentos
- **Logs estruturados** com Langfuse e Loki
- **Internacionalização** (PT-BR, EN-US, ES-ES)
- **Rate limiting** e segurança
- **Health checks** completos

### 🔄 Em Desenvolvimento
- **Integração EvoAI** (futuro)
- **Busca vetorial Weaviate** (opcional)
- **Processamento em lote** avançado
- **Métricas em tempo real**

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL (via Supabase)
- MCP Server rodando em `localhost:8080`
- n8n (opcional, para automação)

## 🛠️ Instalação

### 1. Clone e Instale Dependências

```bash
cd gabi/gateway
npm install
```

### 2. Configure Variáveis de Ambiente

```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# JWT
JWT_SECRET=your-jwt-secret-key

# OAuth Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth Microsoft
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# MCP Server
MCP_SERVER_URL=http://localhost:8080

# n8n Integration
N8N_API_KEY=your-n8n-api-key
N8N_URL=http://localhost:5678

# Logging
LANGFUSE_PUBLIC_KEY=your-langfuse-public-key
LANGFUSE_SECRET_KEY=your-langfuse-secret-key
```

### 3. Configure o Banco de Dados

Execute o schema do Supabase:

```bash
# No painel do Supabase ou via SQL Editor
cat supabase-schema.sql
```

### 4. Inicie o Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 📚 Documentação da API

### Autenticação

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

### Chat

```http
POST /api/v1/chat
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "message": "Olá, como você pode me ajudar?",
  "agentId": "gabi-assistant",
  "bases": ["default"]
}
```

### Documentos

#### Atualização (n8n)
```http
POST /api/docs/update
X-API-Key: your-n8n-api-key
Content-Type: application/json

{
  "origin": "google",
  "docId": "document-id",
  "filename": "document.pdf",
  "userId": "user-id",
  "lang": "pt",
  "content": "conteúdo do documento"
}
```

#### Status
```http
GET /api/docs/status?origin=google&status=indexed
Authorization: Bearer <jwt-token>
```

#### Reindexação Manual
```http
POST /api/docs/reindex/:docId
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "priority": "normal"
}
```

### OAuth

```http
GET /api/v1/auth/google
GET /api/v1/auth/google/callback
GET /api/v1/auth/microsoft
GET /api/v1/auth/microsoft/callback
```

## 🔧 Configuração do n8n

### 1. Instale o n8n

```bash
# Via Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Via npm
npm install n8n -g
n8n start
```

### 2. Importe os Workflows

1. Acesse `http://localhost:5678`
2. Vá em **Settings** → **Import**
3. Importe o arquivo `n8n-workflows.json`
4. Configure as credenciais do Google Drive e SharePoint

### 3. Configure as Variáveis

No n8n, configure as seguintes variáveis:

```env
GABI_GATEWAY_URL=http://localhost:3000
N8N_API_KEY=your-n8n-api-key
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
SHAREPOINT_SITE_ID=your-site-id
```

## 🏗️ Estrutura do Projeto

```
src/
├── config/           # Configurações
├── middlewares/      # Middlewares (auth, rbac, logging)
├── routes/           # Rotas da API
│   ├── auth.ts       # Autenticação
│   ├── chat.ts       # Chat com MCP
│   ├── documents.ts  # Documentos indexados
│   ├── oauth.ts      # OAuth 2.0
│   └── reindex.ts    # Reindexação
├── services/         # Serviços
│   ├── supabase.ts   # Cliente Supabase
│   ├── mcpClient.ts  # Cliente MCP
│   ├── documentIndexingService.ts # Indexação
│   └── n8nService.ts # Integração n8n
├── types/            # Tipos TypeScript
├── utils/            # Utilitários
└── index.ts          # Servidor principal
```

## 🔍 Monitoramento

### Health Check

```bash
curl http://localhost:3000/health
```

### Logs

Os logs são enviados para:
- **Langfuse**: Logs estruturados e métricas
- **Loki**: Logs de sistema
- **Supabase**: Logs de auditoria

### Métricas

```sql
-- Documentos por status
SELECT status, COUNT(*) 
FROM supabase_docs_indexed 
GROUP BY status;

-- Logs de reindexação
SELECT action, status, COUNT(*) 
FROM reindex_logs 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY action, status;
```

## 🔐 Segurança

### Autenticação
- JWT tokens com expiração configurável
- Refresh tokens automáticos
- Rate limiting por IP e endpoint

### Autorização
- RBAC (Role-Based Access Control)
- Políticas RLS no Supabase
- Validação de permissões por recurso

### Dados
- Tokens OAuth criptografados
- Sanitização de conteúdo
- Logs de auditoria completos

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de conexão MCP**
   ```bash
   # Verificar se o MCP Server está rodando
   curl http://localhost:8080/health
   ```

2. **Erro de autenticação Supabase**
   ```bash
   # Verificar variáveis de ambiente
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Documentos não sendo indexados**
   ```bash
   # Verificar logs
   docker logs gabi-gateway --tail 100
   
   # Testar endpoint
   curl -X POST http://localhost:3000/api/docs/update \
     -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"origin":"manual","docId":"test","filename":"test.txt","userId":"user123","lang":"pt","content":"test"}'
   ```

### Logs de Debug

Ative logs detalhados:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📈 Performance

### Otimizações Recomendadas

1. **Cache Redis** para tokens OAuth
2. **Connection pooling** para Supabase
3. **Rate limiting** por usuário
4. **Compressão** de respostas

### Métricas Esperadas

- **Latência**: < 200ms para chat
- **Throughput**: 1000+ req/min
- **Uptime**: > 99.9%
- **Documentos/hora**: 500+

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Documentação**: [N8N_INTEGRATION.md](N8N_INTEGRATION.md)
- **Issues**: GitHub Issues
- **Email**: suporte@gabi.com

---

**Gabi Gateway** - Backend inteligente para processamento de documentos e chat com IA 🤖📄 