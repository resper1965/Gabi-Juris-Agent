# 🎓 Guia Didático - Deploy GABI no EasyPanel

## 📚 Índice

1. [O que é o GABI?](#o-que-é-o-gabi)
2. [O que é o EasyPanel?](#o-que-é-o-easypanel)
3. [Por que usar EasyPanel?](#por-que-usar-easypanel)
4. [Arquitetura do Sistema](#arquitetura-do-sistema)
5. [Pré-requisitos](#pré-requisitos)
6. [Passo a Passo Completo](#passo-a-passo-completo)
7. [Configurações Detalhadas](#configurações-detalhadas)
8. [Testando o Sistema](#testando-o-sistema)
9. [Manutenção](#manutenção)
10. [Troubleshooting](#troubleshooting)

---

## 🤖 O que é o GABI?

O **GABI** é um sistema completo de **Assistente Jurídica Inteligente** que oferece:

### ✨ Funcionalidades Principais

| Funcionalidade | Descrição | Benefício |
|---|---|---|
| **💬 Chat Inteligente** | Conversa com IA especializada em direito | Respostas jurídicas precisas |
| **📋 Sistema de Tarefas** | Gerenciamento de tarefas com templates | Organização eficiente |
| **📄 Exportação** | Exporta em PDF, Markdown e JSON | Flexibilidade de formatos |
| **🔍 Auditoria** | Logs completos de todas as ações | Conformidade legal |
| **⚖️ Modo Jurídico** | Formatação específica para documentos jurídicos | Padrões OAB |
| **🌐 Multilíngue** | Suporte a múltiplos idiomas | Acesso global |
| **📚 Base de Conhecimento** | Armazenamento inteligente de documentos | Consulta rápida |

### 🎯 Público-Alvo
- **Advogados** e escritórios de advocacia
- **Estudantes de direito**
- **Departamentos jurídicos** de empresas
- **Consultores legais**

---

## 🎛️ O que é o EasyPanel?

O **EasyPanel** é um painel de controle web que facilita o gerenciamento de aplicações em servidores. É como um "painel de controle" para sua VPS.

### 🎨 Interface Visual
- **Dashboard intuitivo** com gráficos e estatísticas
- **Gerenciamento de containers** com interface gráfica
- **Configuração de domínios** e SSL automático
- **Monitoramento** em tempo real

### 🔧 Funcionalidades
- ✅ Deploy automático via Git
- ✅ SSL gratuito (Let's Encrypt)
- ✅ Backup automático
- ✅ Monitoramento de recursos
- ✅ Gerenciamento de logs

---

## 🚀 Por que usar EasyPanel?

### ✅ Vantagens

| Aspecto | Sem EasyPanel | Com EasyPanel |
|---|---|---|
| **Configuração** | Manual, complexa | Automática, visual |
| **SSL** | Configuração manual | Automático |
| **Backup** | Scripts manuais | Automático |
| **Monitoramento** | Comandos complexos | Interface gráfica |
| **Deploy** | Comandos SSH | Clique no botão |

### 💰 Custo-Benefício
- **Gratuito** para uso pessoal
- **Economia de tempo** significativa
- **Menos erros** de configuração
- **Facilidade de manutenção**

---

## 🏗️ Arquitetura do Sistema

### 📊 Diagrama Simplificado

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   🌐 Internet   │    │   🖥️ VPS        │    │   ☁️ Supabase   │
│                 │    │                 │    │                 │
│   Usuários      │◄──►│   EasyPanel     │◄──►│   Banco de      │
│   Acessando     │    │   + GABI        │    │   Dados         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔧 Componentes

| Componente | Função | Porta |
|---|---|---|
| **Frontend** | Interface do usuário | 5173 |
| **Gateway** | API e lógica de negócio | 3001 |
| **Nginx** | Proxy reverso e SSL | 80/443 |
| **Supabase** | Banco de dados e autenticação | - |

---

## 📋 Pré-requisitos

### 🖥️ Hardware Mínimo

| Recurso | Mínimo | Recomendado |
|---|---|---|
| **CPU** | 2 vCPUs | 4 vCPUs |
| **RAM** | 4GB | 8GB |
| **Storage** | 50GB SSD | 100GB SSD |
| **Bandwidth** | 1TB/mês | 2TB/mês |

### 🌐 Software Necessário

- ✅ **Sistema Operacional**: Ubuntu 20.04+ ou Debian 11+
- ✅ **Acesso SSH** à VPS
- ✅ **Domínio** configurado
- ✅ **Conta Supabase** (gratuita)

### 💳 Custos Estimados

| Serviço | Custo Mensal |
|---|---|
| **VPS** | $10-20 |
| **Domínio** | $10-15/ano |
| **Supabase** | Gratuito (até 500MB) |
| **Total** | ~$10-20/mês |

---

## 🚀 Passo a Passo Completo

### 📝 Etapa 1: Preparar a VPS

#### 1.1 Conectar na VPS
```bash
# Conectar via SSH
ssh root@seu-ip-da-vps

# Exemplo:
ssh root@192.168.1.100
```

#### 1.2 Atualizar o Sistema
```bash
# Atualizar lista de pacotes
apt update

# Atualizar sistema
apt upgrade -y

# Reiniciar se necessário
reboot
```

#### 1.3 Instalar EasyPanel
```bash
# Baixar e instalar EasyPanel
curl -s https://easypanel.io/install.sh | bash

# Aguardar instalação (pode demorar alguns minutos)
```

#### 1.4 Acessar o EasyPanel
```
http://seu-ip-da-vps:3000
```

### 📝 Etapa 2: Configurar Supabase

#### 2.1 Criar Conta
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub ou Google

#### 2.2 Criar Projeto
1. Clique em "New Project"
2. Escolha sua organização
3. Digite um nome: `gabi-projeto`
4. Escolha uma senha forte para o banco
5. Escolha a região mais próxima (ex: São Paulo)
6. Clique em "Create new project"

#### 2.3 Obter Credenciais
1. Vá em **Settings** → **API**
2. Anote as seguintes informações:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **Anon Key**: `eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Service Role Key**: `eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 2.4 Configurar Banco de Dados
1. Vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo do arquivo `gabi/gateway/supabase-schema.sql`
4. Clique em **Run**

#### 2.5 Configurar Storage
1. Vá em **Storage**
2. Clique em **New Bucket**
3. Nome: `gabi-documents`
4. Marque **Public bucket**
5. Clique em **Create bucket**

### 📝 Etapa 3: Preparar Código

#### 3.1 Baixar o Projeto
```bash
# Na VPS, baixar o projeto
cd /opt
git clone https://github.com/seu-usuario/gabi.git
cd gabi
```

#### 3.2 Configurar Variáveis
```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar configurações
nano .env
```

#### 3.3 Configurações Necessárias
```env
# Substitua pelos seus valores reais
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
JWT_SECRET=seu-jwt-secret-super-seguro-64-caracteres-aqui
ALLOWED_ORIGINS=https://seu-dominio.com
VITE_API_BASE_URL=https://api.seu-dominio.com/api/v1
```

### 📝 Etapa 4: Deploy no EasyPanel

#### 4.1 Criar Projeto
1. Acesse o EasyPanel
2. Clique em **New Project**
3. Nome: `gabi`
4. Clique em **Create**

#### 4.2 Configurar Frontend
1. Clique em **New Service**
2. Tipo: **Web Service**
3. Nome: `gabi-frontend`
4. **Source**: Local Directory
5. **Directory**: `/opt/gabi/frontend`
6. **Port**: `5173`
7. **Build Command**: `npm install && npm run build`
8. **Start Command**: `npm run preview -- --host 0.0.0.0 --port 5173`

#### 4.3 Configurar Gateway
1. Clique em **New Service**
2. Tipo: **Web Service**
3. Nome: `gabi-gateway`
4. **Source**: Local Directory
5. **Directory**: `/opt/gabi/gateway`
6. **Port**: `3001`
7. **Build Command**: `npm install && npm run build`
8. **Start Command**: `npm start`

#### 4.4 Adicionar Variáveis de Ambiente
Para cada serviço, adicione as variáveis do arquivo `.env`:

**Frontend:**
```
NODE_ENV=production
VITE_API_BASE_URL=https://api.seu-dominio.com/api/v1
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

**Gateway:**
```
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
JWT_SECRET=seu-jwt-secret
ALLOWED_ORIGINS=https://seu-dominio.com
```

### 📝 Etapa 5: Configurar Domínio

#### 5.1 Configurar DNS
No seu provedor de domínio, configure:

```
Tipo: A
Nome: @
Valor: IP_DA_SUA_VPS

Tipo: A
Nome: api
Valor: IP_DA_SUA_VPS
```

#### 5.2 Configurar SSL
1. No EasyPanel, vá em **Settings**
2. **SSL**: Enable
3. **Domain**: `seu-dominio.com`
4. Clique em **Save**

### 📝 Etapa 6: Testar Sistema

#### 6.1 Verificar Serviços
```bash
# Verificar se estão rodando
docker ps

# Ver logs
docker logs gabi-frontend
docker logs gabi-gateway
```

#### 6.2 Testar URLs
- **Frontend**: https://seu-dominio.com
- **API**: https://api.seu-dominio.com/health
- **Admin**: https://seu-dominio.com/admin

---

## ⚙️ Configurações Detalhadas

### 🔐 Segurança

#### Firewall
```bash
# Configurar UFW
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # EasyPanel
ufw enable
```

#### SSL/TLS
- **Automático** via EasyPanel
- **Renovação automática**
- **HSTS habilitado**

#### Rate Limiting
- **100 requisições** por 15 minutos por IP
- **Configurável** no arquivo `.env`

### 📊 Monitoramento

#### Logs
```bash
# Ver logs em tempo real
docker logs -f gabi-frontend
docker logs -f gabi-gateway

# Ver logs do sistema
tail -f /var/log/syslog
```

#### Métricas
- **CPU**: Monitorado pelo EasyPanel
- **RAM**: Monitorado pelo EasyPanel
- **Disco**: Monitorado pelo EasyPanel
- **Rede**: Monitorado pelo EasyPanel

### 💾 Backup

#### Configuração Automática
1. No EasyPanel, vá em **Settings**
2. **Backup**: Enable
3. **Schedule**: Daily at 2:00 AM
4. **Retention**: 7 days

#### Backup Manual
```bash
# Criar backup manual
docker-compose down
tar -czf backup-$(date +%Y%m%d).tar.gz /opt/gabi
docker-compose up -d
```

---

## 🧪 Testando o Sistema

### ✅ Checklist de Testes

| Teste | Como Testar | Resultado Esperado |
|---|---|---|
| **Frontend** | Acessar https://seu-dominio.com | Página carrega |
| **API Health** | `curl https://api.seu-dominio.com/health` | `{"success":true}` |
| **Login** | Tentar fazer login | Redireciona para dashboard |
| **Chat** | Enviar mensagem | Resposta da IA |
| **Tarefas** | Criar nova tarefa | Tarefa aparece na lista |
| **Exportação** | Exportar documento | Download inicia |
| **SSL** | Verificar cadeado no navegador | Verde/seguro |

### 🔍 Comandos de Diagnóstico

```bash
# Verificar status dos containers
docker ps

# Verificar uso de recursos
docker stats

# Verificar conectividade
curl -I https://seu-dominio.com
curl -I https://api.seu-dominio.com

# Verificar logs de erro
docker logs gabi-frontend --tail 50
docker logs gabi-gateway --tail 50
```

---

## 🔧 Manutenção

### 📅 Tarefas Diárias
- ✅ Verificar logs de erro
- ✅ Monitorar uso de recursos
- ✅ Verificar backups

### 📅 Tarefas Semanais
- ✅ Atualizar sistema operacional
- ✅ Verificar atualizações do EasyPanel
- ✅ Revisar logs de segurança

### 📅 Tarefas Mensais
- ✅ Atualizar dependências
- ✅ Revisar configurações de segurança
- ✅ Otimizar performance

### 🔄 Atualizações

#### Atualizar Código
```bash
# Parar serviços
docker-compose down

# Atualizar código
git pull origin main

# Rebuild e restart
docker-compose up --build -d
```

#### Atualizar EasyPanel
```bash
# Atualizar EasyPanel
curl -s https://easypanel.io/install.sh | bash
```

---

## 🚨 Troubleshooting

### ❌ Problemas Comuns

#### 1. Containers não iniciam
**Sintomas:**
- Erro "Container failed to start"
- Logs mostram erro de configuração

**Solução:**
```bash
# Verificar logs
docker logs nome-do-container

# Verificar variáveis de ambiente
docker-compose config

# Reiniciar container
docker-compose restart nome-do-container
```

#### 2. Erro de conexão com Supabase
**Sintomas:**
- Erro "Connection refused"
- Erro "Invalid credentials"

**Solução:**
1. Verificar credenciais no `.env`
2. Verificar políticas de CORS no Supabase
3. Verificar conectividade de rede

#### 3. SSL não funciona
**Sintomas:**
- Erro "SSL certificate error"
- Site não carrega com HTTPS

**Solução:**
1. Verificar configuração do domínio
2. Aguardar propagação DNS (até 24h)
3. Verificar certificado no EasyPanel

#### 4. Performance lenta
**Sintomas:**
- Páginas demoram para carregar
- Timeout em requisições

**Solução:**
```bash
# Verificar uso de recursos
docker stats

# Verificar logs de performance
docker logs gabi-gateway | grep "slow"

# Otimizar configurações
# Aumentar recursos da VPS se necessário
```

### 📞 Suporte

#### Informações para Suporte
Quando precisar de ajuda, forneça:

1. **Versão do sistema:**
   ```bash
   cat /etc/os-release
   docker --version
   ```

2. **Logs de erro:**
   ```bash
   docker logs gabi-frontend --tail 100
   docker logs gabi-gateway --tail 100
   ```

3. **Configuração:**
   ```bash
   docker-compose config
   ```

4. **Status dos serviços:**
   ```bash
   docker ps -a
   systemctl status docker
   ```

---

## 🎉 Conclusão

### ✅ O que foi implementado

- ✅ **Sistema GABI** completo funcionando
- ✅ **Interface web** responsiva e moderna
- ✅ **API robusta** com autenticação
- ✅ **Banco de dados** configurado
- ✅ **SSL automático** configurado
- ✅ **Backup automático** configurado
- ✅ **Monitoramento** ativo
- ✅ **Segurança** implementada

### 🚀 Próximos Passos

1. **Personalizar** o sistema para suas necessidades
2. **Adicionar** mais funcionalidades
3. **Otimizar** performance
4. **Escalar** conforme necessário

### 📚 Recursos Adicionais

- **Documentação completa**: `DEPLOY-EASYPANEL.md`
- **Configurações avançadas**: `easypanel-config.json`
- **Scripts automatizados**: `scripts/setup-easypanel.sh`
- **Guia rápido**: `QUICK-START.md`

---

## 🤝 Suporte

Se precisar de ajuda:

1. **Consulte** esta documentação
2. **Verifique** a seção de troubleshooting
3. **Abra uma issue** no GitHub
4. **Entre em contato** com a equipe

**Boa sorte com seu projeto GABI! 🎉** 