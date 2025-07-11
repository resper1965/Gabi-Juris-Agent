# 🖼️ Guia Visual - Deploy GABI no EasyPanel

## 📸 Screenshots e Comandos Detalhados

### 🎯 Objetivo
Este guia mostra **exatamente** o que você verá na tela e quais comandos executar, com explicações detalhadas de cada passo.

---

## 📋 Etapa 1: Preparar a VPS

### 1.1 Conectar via SSH

**Comando:**
```bash
ssh root@SEU_IP_DA_VPS
```

**O que você verá:**
```
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-88-generic x86_64)

 * Documentation:  https://help.ubuntu.com/
 * Management:     https://landscape.canonical.com/
 * Support:        https://ubuntu.com/advantage

  System information as of Mon Dec 18 10:30:00 UTC 2023

  System load:  0.02              Users logged in:       1
  Usage of /:   12.3% of 50.0GB   IPv4 address:          192.168.1.100
  Memory usage: 15%               System uptime:         2 days
  Swap usage:   0%

Last login: Mon Dec 18 10:25:00 2023 from 192.168.1.50
root@vps:~#
```

### 1.2 Atualizar Sistema

**Comandos:**
```bash
# Atualizar lista de pacotes
apt update

# Você verá algo como:
# Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease
# Hit:2 http://archive.ubuntu.com/ubuntu jammy-updates InRelease
# Hit:3 http://archive.ubuntu.com/ubuntu jammy-security InRelease
# Reading package lists... Done
# Building dependency tree... Done
# Reading state information... Done
# All packages are up to date.

# Atualizar sistema
apt upgrade -y

# Você verá a lista de pacotes sendo atualizados
```

### 1.3 Instalar EasyPanel

**Comando:**
```bash
curl -s https://easypanel.io/install.sh | bash
```

**O que você verá:**
```
🚀 Installing EasyPanel...

📦 Installing dependencies...
✅ Dependencies installed

🐳 Installing Docker...
✅ Docker installed

📥 Downloading EasyPanel...
✅ EasyPanel downloaded

🔧 Configuring EasyPanel...
✅ EasyPanel configured

🎉 Installation complete!

📋 Next steps:
1. Open http://YOUR_IP:3000 in your browser
2. Create your account
3. Start deploying!

root@vps:~#
```

### 1.4 Acessar EasyPanel

**URL:** `http://SEU_IP:3000`

**O que você verá:**
```
┌─────────────────────────────────────┐
│           EasyPanel                 │
│                                     │
│  Welcome to EasyPanel!              │
│                                     │
│  Create your account:               │
│  ┌─────────────────────────────────┐ │
│  │ Email: [________________]       │ │
│  │ Password: [________________]    │ │
│  │ Confirm: [________________]     │ │
│  └─────────────────────────────────┘ │
│                                     │
│  [Create Account]                   │
└─────────────────────────────────────┘
```

---

## 📋 Etapa 2: Configurar Supabase

### 2.1 Criar Conta Supabase

**URL:** https://supabase.com

**O que você verá:**
```
┌─────────────────────────────────────┐
│           Supabase                  │
│                                     │
│  [GitHub] [Google] [Email]          │
│                                     │
│  Or continue with:                  │
│  ┌─────────────────────────────────┐ │
│  │ Email: [________________]       │ │
│  │ Password: [________________]    │ │
│  └─────────────────────────────────┘ │
│                                     │
│  [Sign Up]                          │
└─────────────────────────────────────┘
```

### 2.2 Criar Projeto

**O que você verá:**
```
┌─────────────────────────────────────┐
│        New Project                  │
│                                     │
│  Organization: [Select Org ▼]       │
│  Name: [gabi-projeto]               │
│  Database Password: [************]   │
│  Region: [São Paulo ▼]              │
│                                     │
│  [Create new project]               │
└─────────────────────────────────────┘
```

### 2.3 Obter Credenciais

**Navegar para:** Settings → API

**O que você verá:**
```
┌─────────────────────────────────────┐
│           API Settings              │
│                                     │
│  Project URL:                       │
│  https://abcdefghijklm.supabase.co  │
│                                     │
│  Project API keys:                  │
│  anon public:                       │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │
│                                     │
│  service_role secret:               │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │
└─────────────────────────────────────┘
```

**⚠️ IMPORTANTE:** Copie essas 3 informações!

---

## 📋 Etapa 3: Preparar Código

### 3.1 Baixar Projeto

**Comandos:**
```bash
# Navegar para diretório
cd /opt

# Baixar projeto
git clone https://github.com/seu-usuario/gabi.git

# Você verá:
# Cloning into 'gabi'...
# remote: Enumerating objects: 1234, done.
# remote: Counting objects: 100% (1234/1234), done.
# remote: Compressing objects: 100% (1000/1000), done.
# Receiving objects: 100% (1234/1234), 2.5 MiB | 5.2 MiB/s, done.
# Resolving deltas: 100% (500/500), done.

# Entrar no diretório
cd gabi

# Verificar arquivos
ls -la

# Você verá:
# total 1234
# drwxr-xr-x  15 root root   4096 Dec 18 10:30 .
# drwxr-xr-x   3 root root   4096 Dec 18 10:30 ..
# -rw-r--r--   1 root root   1234 Dec 18 10:30 README.md
# -rw-r--r--   1 root root   5678 Dec 18 10:30 docker-compose.yml
# drwxr-xr-x   8 root root   4096 Dec 18 10:30 frontend
# drwxr-xr-x   8 root root   4096 Dec 18 10:30 gateway
# ...
```

### 3.2 Configurar Variáveis

**Comandos:**
```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar arquivo
nano .env
```

**O que você verá no editor:**
```
# =============================================================================
# CONFIGURAÇÕES GERAIS
# =============================================================================

# Ambiente de execução
NODE_ENV=production

# Portas dos serviços
FRONTEND_PORT=5173
GATEWAY_PORT=3001

# =============================================================================
# CONFIGURAÇÕES DO FRONTEND
# =============================================================================

# URL da API Gateway
VITE_API_BASE_URL=https://api.seu-dominio.com/api/v1

# Configurações do Supabase (Frontend)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

**Como editar:**
1. Use as setas para navegar
2. Substitua os valores pelos seus reais
3. Pressione `Ctrl + X` para sair
4. Pressione `Y` para salvar
5. Pressione `Enter` para confirmar

---

## 📋 Etapa 4: Deploy no EasyPanel

### 4.1 Criar Projeto

**No EasyPanel, você verá:**
```
┌─────────────────────────────────────┐
│           Dashboard                 │
│                                     │
│  [New Project] [Settings] [Logs]    │
│                                     │
│  No projects yet.                   │
│  Create your first project!         │
└─────────────────────────────────────┘
```

**Clique em "New Project"**

**O que você verá:**
```
┌─────────────────────────────────────┐
│        Create Project               │
│                                     │
│  Project Name: [gabi]               │
│  Description: [Sistema GABI]        │
│                                     │
│  [Create Project] [Cancel]          │
└─────────────────────────────────────┘
```

### 4.2 Configurar Frontend

**Clique em "New Service"**

**O que você verá:**
```
┌─────────────────────────────────────┐
│        New Service                  │
│                                     │
│  Service Type:                      │
│  ○ Web Service                      │
│  ○ Database                         │
│  ○ Cache                           │
│  ○ Other                           │
│                                     │
│  [Next] [Cancel]                    │
└─────────────────────────────────────┘
```

**Selecione "Web Service" e clique "Next"**

**O que você verá:**
```
┌─────────────────────────────────────┐
│        Web Service Config           │
│                                     │
│  Service Name: [gabi-frontend]      │
│  Source: [Local Directory ▼]        │
│  Directory: [/opt/gabi/frontend]    │
│  Port: [5173]                       │
│                                     │
│  Build Command:                     │
│  [npm install && npm run build]     │
│                                     │
│  Start Command:                     │
│  [npm run preview -- --host 0.0.0.0 --port 5173] │
│                                     │
│  [Create Service] [Back]            │
└─────────────────────────────────────┘
```

### 4.3 Adicionar Variáveis de Ambiente

**Após criar o serviço, clique em "Environment"**

**O que você verá:**
```
┌─────────────────────────────────────┐
│        Environment Variables        │
│                                     │
│  [Add Variable]                     │
│                                     │
│  No variables yet.                  │
└─────────────────────────────────────┘
```

**Clique em "Add Variable"**

**Adicione uma por vez:**
```
┌─────────────────────────────────────┐
│        Add Variable                 │
│                                     │
│  Name: [NODE_ENV]                   │
│  Value: [production]                │
│                                     │
│  [Add] [Cancel]                     │
└─────────────────────────────────────┘
```

**Repita para:**
- `VITE_API_BASE_URL` = `https://api.seu-dominio.com/api/v1`
- `VITE_SUPABASE_URL` = `https://seu-projeto.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `sua-anon-key`

### 4.4 Configurar Gateway

**Repita o processo para o Gateway:**

**Configurações:**
- **Service Name:** `gabi-gateway`
- **Directory:** `/opt/gabi/gateway`
- **Port:** `3001`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Variáveis de ambiente:**
- `NODE_ENV` = `production`
- `PORT` = `3001`
- `SUPABASE_URL` = `https://seu-projeto.supabase.co`
- `SUPABASE_ANON_KEY` = `sua-anon-key`
- `SUPABASE_SERVICE_ROLE_KEY` = `sua-service-role-key`
- `JWT_SECRET` = `seu-jwt-secret`
- `ALLOWED_ORIGINS` = `https://seu-dominio.com`

---

## 📋 Etapa 5: Configurar Domínio

### 5.1 Configurar DNS

**No seu provedor de domínio (ex: GoDaddy, Namecheap):**

**O que você verá:**
```
┌─────────────────────────────────────┐
│           DNS Records               │
│                                     │
│  Type  Name    Value               │
│  A     @       192.168.1.100       │
│  A     api     192.168.1.100       │
│  CNAME www     @                   │
└─────────────────────────────────────┘
```

### 5.2 Configurar SSL

**No EasyPanel, vá em "Settings"**

**O que você verá:**
```
┌─────────────────────────────────────┐
│           SSL Settings              │
│                                     │
│  SSL: [Enable] [Disable]            │
│  Domain: [seu-dominio.com]          │
│  Email: [seu-email@dominio.com]     │
│                                     │
│  [Save] [Cancel]                    │
└─────────────────────────────────────┘
```

---

## 📋 Etapa 6: Testar Sistema

### 6.1 Verificar Status

**No EasyPanel Dashboard:**
```
┌─────────────────────────────────────┐
│           Project: gabi             │
│                                     │
│  Services:                          │
│  ✅ gabi-frontend (Running)         │
│  ✅ gabi-gateway (Running)          │
│                                     │
│  Resources:                         │
│  CPU: 15% | RAM: 45% | Disk: 20%   │
└─────────────────────────────────────┘
```

### 6.2 Testar URLs

**Abra no navegador:**

1. **Frontend:** `https://seu-dominio.com`
   - Deve mostrar a tela de login do GABI

2. **API Health:** `https://api.seu-dominio.com/health`
   - Deve retornar: `{"success":true,"message":"GABI Gateway funcionando"}`

3. **Admin:** `https://seu-dominio.com/admin`
   - Deve mostrar o painel administrativo

---

## 🔧 Comandos Úteis

### Verificar Logs
```bash
# Logs do frontend
docker logs gabi-frontend --tail 50

# Logs do gateway
docker logs gabi-gateway --tail 50

# Logs em tempo real
docker logs -f gabi-frontend
```

### Reiniciar Serviços
```bash
# Via EasyPanel
# Clique em "Restart" no serviço

# Via comando
docker restart gabi-frontend
docker restart gabi-gateway
```

### Verificar Status
```bash
# Status dos containers
docker ps

# Uso de recursos
docker stats

# Espaço em disco
df -h
```

---

## 🚨 Problemas Comuns

### Container não inicia
**Sintoma:** Status "Failed" no EasyPanel

**Solução:**
1. Clique em "Logs" no serviço
2. Verifique a mensagem de erro
3. Corrija a configuração
4. Clique em "Restart"

### Erro de SSL
**Sintoma:** Site não carrega com HTTPS

**Solução:**
1. Aguarde propagação DNS (até 24h)
2. Verifique configuração do domínio
3. Regenere certificado SSL

### Erro de conexão com Supabase
**Sintoma:** Erro "Connection refused"

**Solução:**
1. Verifique credenciais no `.env`
2. Verifique políticas de CORS no Supabase
3. Teste conectividade: `ping seu-projeto.supabase.co`

---

## ✅ Checklist Final

- [ ] VPS configurada com EasyPanel
- [ ] Supabase configurado
- [ ] Código baixado e configurado
- [ ] Serviços criados no EasyPanel
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio configurado
- [ ] SSL configurado
- [ ] Sistema testado
- [ ] Backup configurado

---

## 🎉 Sucesso!

Se você chegou até aqui, seu sistema GABI está funcionando! 

**URLs de acesso:**
- 🌐 **Site:** https://seu-dominio.com
- 🔧 **API:** https://api.seu-dominio.com
- 👨‍💼 **Admin:** https://seu-dominio.com/admin

**Próximos passos:**
1. Criar conta de usuário
2. Configurar funcionalidades
3. Personalizar interface
4. Treinar equipe

**Boa sorte! 🚀** 