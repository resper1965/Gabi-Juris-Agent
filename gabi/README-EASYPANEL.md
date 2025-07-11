# 🚀 Deploy GABI no EasyPanel - Guia Rápido

## 📋 Pré-requisitos

- ✅ VPS com EasyPanel instalado
- ✅ Domínio configurado
- ✅ Conta Supabase ativa
- ✅ Node.js 18+ (EasyPanel gerencia)

## 🎯 Passos para Deploy

### 1. Preparar Repositório

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/gabi.git
cd gabi

# Configurar variáveis de ambiente
cp env.example .env
# Editar .env com suas configurações
```

### 2. Configurar Supabase

1. **Criar projeto no Supabase**
   - Acesse [supabase.com](https://supabase.com)
   - Crie novo projeto
   - Anote: URL, Anon Key, Service Role Key

2. **Configurar banco de dados**
   ```sql
   -- Executar no SQL Editor do Supabase
   -- Conteúdo do arquivo: gabi/gateway/supabase-schema.sql
   ```

3. **Configurar Storage**
   - Criar bucket: `gabi-documents`
   - Configurar políticas de acesso

### 3. Configurar EasyPanel

#### Opção A: Deploy via Git (Recomendado)

1. **Criar projeto no EasyPanel**
   - Nome: `gabi`
   - Tipo: `Deploy from Git`
   - Repositório: `https://github.com/seu-usuario/gabi.git`

2. **Configurar build**
   ```bash
   # Build Command
   docker-compose -f easypanel-deploy.yml up --build -d
   
   # Start Command
   docker-compose -f easypanel-deploy.yml up -d
   ```

3. **Configurar variáveis de ambiente**
   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=sua-anon-key
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
   JWT_SECRET=seu-jwt-secret-64-caracteres
   ALLOWED_ORIGINS=https://seu-dominio.com
   ```

#### Opção B: Deploy via Docker Compose

1. **Upload dos arquivos**
   - Fazer upload de todos os arquivos para a VPS
   - Via SFTP ou Git clone

2. **Executar deploy**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

### 4. Configurar Domínio

1. **Configurar DNS**
   ```
   A     seu-dominio.com     -> IP_DA_VPS
   A     api.seu-dominio.com -> IP_DA_VPS
   ```

2. **Configurar SSL**
   - EasyPanel gerencia automaticamente
   - Ou usar Let's Encrypt manualmente

### 5. Verificar Deploy

```bash
# Verificar containers
docker ps

# Verificar logs
docker-compose logs -f

# Testar endpoints
curl https://seu-dominio.com/health
curl https://api.seu-dominio.com/health
```

## 🔧 Configurações Específicas

### Variáveis de Ambiente Obrigatórias

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Segurança
JWT_SECRET=seu-jwt-secret-super-seguro-64-caracteres
ALLOWED_ORIGINS=https://seu-dominio.com

# Frontend
VITE_API_BASE_URL=https://api.seu-dominio.com/api/v1
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### Variáveis Opcionais

```env
# Performance
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
MAX_PAYLOAD_SIZE=10485760

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

## 🌐 URLs de Acesso

Após o deploy, você terá acesso a:

- **Frontend**: `https://seu-dominio.com`
- **API**: `https://api.seu-dominio.com`
- **Health Check**: `https://api.seu-dominio.com/health`
- **Admin Panel**: `https://seu-dominio.com/admin`

## 🔍 Monitoramento

### Logs
```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs específicos
docker-compose logs -f gabi-frontend
docker-compose logs -f gabi-gateway
docker-compose logs -f gabi-nginx
```

### Métricas
- **Uptime**: Monitorado pelo EasyPanel
- **Performance**: Logs estruturados em JSON
- **Erros**: Capturados automaticamente

## 🛠️ Manutenção

### Atualizações
```bash
# Atualizar código
git pull origin main

# Rebuild e restart
docker-compose -f easypanel-deploy.yml up --build -d
```

### Backup
```bash
# Backup dos dados
docker-compose exec gabi-gateway npm run db:backup

# Backup do sistema
easypanel backup create
```

### Troubleshooting

#### Problema: Containers não iniciam
```bash
# Verificar logs
docker-compose logs

# Verificar variáveis de ambiente
docker-compose config
```

#### Problema: Erro de conexão com Supabase
- Verificar credenciais no `.env`
- Verificar políticas de CORS no Supabase
- Verificar conectividade de rede

#### Problema: SSL não funciona
- Verificar configuração do domínio
- Aguardar propagação DNS (até 24h)
- Verificar certificado no EasyPanel

## 📊 Recursos Utilizados

### Mínimos Recomendados
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **Bandwidth**: 1TB/mês

### Estimativa de Uso
- **Frontend**: ~200MB RAM
- **Gateway**: ~500MB RAM
- **Nginx**: ~50MB RAM
- **Total**: ~750MB RAM

## 🔐 Segurança

### Configurações Implementadas
- ✅ HTTPS forçado
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Headers de segurança
- ✅ JWT com expiração
- ✅ Validação de entrada

### Recomendações Adicionais
- 🔒 Firewall configurado
- 🔒 Backup automático
- 🔒 Monitoramento de logs
- 🔒 Atualizações regulares

## 📞 Suporte

### Problemas Comuns
1. **Erro 502 Bad Gateway**
   - Verificar se containers estão rodando
   - Verificar logs do nginx

2. **Erro de CORS**
   - Verificar ALLOWED_ORIGINS
   - Verificar configuração do Supabase

3. **Erro de autenticação**
   - Verificar JWT_SECRET
   - Verificar credenciais do Supabase

### Contatos
- **Documentação**: Este arquivo
- **Issues**: GitHub do projeto
- **EasyPanel**: Suporte oficial

## ✅ Checklist Final

- [ ] VPS configurada
- [ ] EasyPanel instalado
- [ ] Domínio configurado
- [ ] Supabase configurado
- [ ] Variáveis de ambiente definidas
- [ ] Deploy executado
- [ ] SSL configurado
- [ ] Testes realizados
- [ ] Monitoramento ativo
- [ ] Backup configurado

## 🎉 Conclusão

Após seguir este guia, você terá:

- ✅ Sistema GABI funcionando em produção
- ✅ Todas as funcionalidades ativas
- ✅ Segurança implementada
- ✅ Monitoramento configurado
- ✅ Backup automático

O sistema estará pronto para uso com todas as funcionalidades de IA jurídica implementadas e funcionando em ambiente de produção. 