# 🚀 Guia de Deploy GABI no EasyPanel

## 📋 Visão Geral

Este guia detalha como implementar o sistema GABI (Assistente Jurídica Inteligente) em uma VPS usando EasyPanel, incluindo todas as funcionalidades:

- ✅ Sistema de Tarefas com Templates
- ✅ Exportação de Conteúdos (PDF, Markdown, JSON)
- ✅ Sistema de Auditoria e Rastreabilidade
- ✅ Modo Jurídico Especializado
- ✅ Chat Inteligente com IA
- ✅ Classificação e Enriquecimento de Documentos
- ✅ Sistema Multilíngue
- ✅ Base de Conhecimento
- ✅ Painel Administrativo

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Gateway       │    │   Serviços      │
│   (React)       │◄──►│   (Express)     │◄──►│   Externos      │
│   Porta: 5173   │    │   Porta: 3001   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Supabase      │
                       │   (Database)    │
                       └─────────────────┘
```

## 📦 Pré-requisitos

### 1. VPS com EasyPanel
- **CPU**: Mínimo 2 vCPUs (Recomendado: 4 vCPUs)
- **RAM**: Mínimo 4GB (Recomendado: 8GB)
- **Storage**: Mínimo 50GB SSD
- **OS**: Ubuntu 20.04+ ou Debian 11+

### 2. Domínio
- Domínio configurado com DNS apontando para a VPS
- Certificado SSL (EasyPanel gerencia automaticamente)

### 3. Contas Externas
- **Supabase**: Para banco de dados e autenticação
- **OpenAI**: Para funcionalidades de IA (opcional)

## 🔧 Configuração do EasyPanel

### 1. Instalação do EasyPanel

```bash
# Conectar via SSH na VPS
ssh root@seu-ip-da-vps

# Instalar EasyPanel
curl -s https://easypanel.io/install.sh | bash

# Acessar o painel
# http://seu-ip:3000
```

### 2. Configuração Inicial
1. Criar conta no EasyPanel
2. Configurar domínio principal
3. Ativar SSL automático
4. Configurar backup automático

## 🗄️ Configuração do Supabase

### 1. Criar Projeto
1. Acessar [supabase.com](https://supabase.com)
2. Criar novo projeto
3. Anotar as credenciais:
   - Project URL
   - Anon Key
   - Service Role Key

### 2. Configurar Banco de Dados
Executar o script SQL fornecido em `gabi/gateway/supabase-schema.sql`

### 3. Configurar Storage
1. Criar bucket `gabi-documents`
2. Configurar políticas de acesso
3. Habilitar RLS (Row Level Security)

## 🐳 Configuração dos Containers

### 1. Frontend Container

**Configuração no EasyPanel:**
- **Nome**: `gabi-frontend`
- **Imagem**: `node:18-alpine`
- **Porta**: `5173`
- **Variáveis de Ambiente**:
  ```
  VITE_API_BASE_URL=https://api.seu-dominio.com/api/v1
  VITE_SUPABASE_URL=sua-url-supabase
  VITE_SUPABASE_ANON_KEY=sua-anon-key
  ```

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview"]
```

### 2. Gateway Container

**Configuração no EasyPanel:**
- **Nome**: `gabi-gateway`
- **Imagem**: `node:18-alpine`
- **Porta**: `3001`
- **Variáveis de Ambiente**:
  ```
  NODE_ENV=production
  PORT=3001
  SUPABASE_URL=sua-url-supabase
  SUPABASE_ANON_KEY=sua-anon-key
  SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
  JWT_SECRET=seu-jwt-secret-super-seguro
  ALLOWED_ORIGINS=https://seu-dominio.com
  ```

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

## 🔄 Processo de Deploy

### 1. Preparar Repositório

```bash
# Clonar o repositório na VPS
git clone https://github.com/seu-usuario/gabi.git
cd gabi

# Configurar arquivos de ambiente
cp gabi/frontend/.env.example gabi/frontend/.env
cp gabi/gateway/env.example gabi/gateway/.env
```

### 2. Configurar Variáveis de Ambiente

**Frontend (.env):**
```env
VITE_API_BASE_URL=https://api.seu-dominio.com/api/v1
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

**Gateway (.env):**
```env
# Servidor
PORT=3001
NODE_ENV=production

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Segurança
JWT_SECRET=seu-jwt-secret-super-seguro-64-caracteres
ALLOWED_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### 3. Deploy no EasyPanel

#### Frontend
1. Criar novo projeto no EasyPanel
2. Selecionar "Deploy from Git"
3. Configurar repositório
4. Definir build command: `npm run build`
5. Definir start command: `npm run preview`
6. Configurar porta: `5173`
7. Adicionar variáveis de ambiente

#### Gateway
1. Criar novo projeto no EasyPanel
2. Selecionar "Deploy from Git"
3. Configurar repositório
4. Definir build command: `npm run build`
5. Definir start command: `npm start`
6. Configurar porta: `3001`
7. Adicionar variáveis de ambiente

### 4. Configurar Proxy Reverso

**Nginx Configuration (EasyPanel):**
```nginx
# Frontend
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API Gateway
server {
    listen 80;
    server_name api.seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔐 Configurações de Segurança

### 1. Firewall
```bash
# Configurar UFW
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. SSL/TLS
- EasyPanel gerencia automaticamente com Let's Encrypt
- Configurar renovação automática

### 3. Rate Limiting
- Configurado no Gateway
- 100 requisições por 15 minutos por IP

### 4. CORS
- Configurado para domínios específicos
- Credenciais habilitadas

## 📊 Monitoramento

### 1. Logs
- Logs estruturados em JSON
- Rotação automática
- Retenção de 30 dias

### 2. Health Checks
```bash
# Frontend
curl https://seu-dominio.com/health

# Gateway
curl https://api.seu-dominio.com/health
```

### 3. Métricas
- Uptime monitoring
- Performance monitoring
- Error tracking

## 🔄 Backup e Recuperação

### 1. Backup Automático
- EasyPanel gerencia backup do sistema
- Backup diário do banco Supabase
- Backup semanal dos arquivos

### 2. Recuperação
```bash
# Restaurar aplicação
easypanel restore backup-name

# Restaurar banco
# Via Supabase Dashboard
```

## 🚀 Funcionalidades Específicas

### 1. Sistema de Tarefas
- Templates configuráveis
- Estatísticas em tempo real
- Filtros avançados
- Ações contextuais

### 2. Exportação
- PDF com formatação jurídica
- Markdown estruturado
- JSON com metadados
- Controle de acesso RBAC

### 3. Auditoria
- Logs de todas as ações
- Conformidade LGPD
- Alertas automáticos
- Snapshots imutáveis

### 4. Modo Jurídico
- Formatação OAB
- Templates de petições
- Sugestões jurídicas
- Exportação .docx

## 🛠️ Manutenção

### 1. Atualizações
```bash
# Atualizar aplicação
git pull origin main
easypanel redeploy

# Atualizar dependências
npm update
```

### 2. Monitoramento
- Verificar logs diariamente
- Monitorar uso de recursos
- Verificar backups

### 3. Troubleshooting
```bash
# Verificar status dos containers
docker ps

# Verificar logs
docker logs container-name

# Reiniciar serviços
easypanel restart
```

## 📞 Suporte

### Problemas Comuns
1. **Erro de conexão com Supabase**
   - Verificar credenciais
   - Verificar políticas de CORS

2. **Erro de build**
   - Verificar dependências
   - Verificar Node.js version

3. **Erro de SSL**
   - Verificar configuração do domínio
   - Aguardar propagação DNS

### Contatos
- **Documentação**: Este arquivo
- **Issues**: GitHub do projeto
- **Suporte**: Equipe de desenvolvimento

## ✅ Checklist de Deploy

- [ ] VPS configurada com EasyPanel
- [ ] Domínio configurado
- [ ] Supabase configurado
- [ ] Variáveis de ambiente definidas
- [ ] Containers criados
- [ ] Proxy reverso configurado
- [ ] SSL configurado
- [ ] Backup configurado
- [ ] Monitoramento ativo
- [ ] Testes realizados

## 🎉 Conclusão

Após seguir este guia, você terá um sistema GABI completamente funcional em produção com:

- ✅ Alta disponibilidade
- ✅ Segurança robusta
- ✅ Monitoramento completo
- ✅ Backup automático
- ✅ Todas as funcionalidades ativas

O sistema estará pronto para uso em ambiente de produção com todas as funcionalidades de IA jurídica implementadas. 