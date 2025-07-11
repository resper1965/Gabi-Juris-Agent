# 🎥 Guia para Criar Vídeo Tutorial - Deploy GABI no EasyPanel

## 📹 Roteiro do Vídeo Tutorial

### 🎯 Objetivo do Vídeo
Criar um tutorial completo e didático mostrando como implementar o sistema GABI no EasyPanel, desde a configuração da VPS até o sistema funcionando.

---

## 📋 Estrutura do Vídeo

### 🎬 Parte 1: Introdução (2-3 minutos)

#### 1.1 Apresentação
```
"Olá! Neste vídeo vou te mostrar como implementar o sistema GABI 
(Assistente Jurídica Inteligente) no EasyPanel de forma completa 
e profissional."
```

#### 1.2 O que é o GABI
```
"O GABI é um sistema completo que inclui:
- Chat inteligente com IA
- Sistema de tarefas
- Exportação de documentos
- Auditoria completa
- Modo jurídico especializado
- E muito mais!"
```

#### 1.3 O que vamos fazer
```
"Vamos implementar tudo isso em uma VPS usando EasyPanel, 
que é uma ferramenta que facilita muito o deploy de aplicações."
```

### 🎬 Parte 2: Pré-requisitos (1-2 minutos)

#### 2.1 Lista de necessários
```
"Antes de começar, você precisa ter:
- Uma VPS (recomendo 4GB RAM, 2 vCPUs)
- Um domínio configurado
- Conta no Supabase (gratuita)
- Acesso SSH à VPS"
```

#### 2.2 Custos estimados
```
"Os custos são:
- VPS: $10-20/mês
- Domínio: $10-15/ano
- Supabase: Gratuito até 500MB
- Total: ~$10-20/mês"
```

### 🎬 Parte 3: Configurar VPS (5-7 minutos)

#### 3.1 Conectar via SSH
```
"Primeiro, vamos conectar na VPS via SSH.
Abra o terminal e digite: ssh root@SEU_IP_DA_VPS"
```

**Mostrar na tela:**
- Terminal abrindo
- Comando SSH sendo digitado
- Conexão estabelecida
- Prompt do servidor

#### 3.2 Atualizar sistema
```
"Agora vamos atualizar o sistema para garantir 
que tudo esteja funcionando corretamente."
```

**Comandos a mostrar:**
```bash
apt update
apt upgrade -y
```

#### 3.3 Instalar EasyPanel
```
"Agora vamos instalar o EasyPanel, que é a ferramenta 
que vai facilitar todo o processo de deploy."
```

**Comando:**
```bash
curl -s https://easypanel.io/install.sh | bash
```

**Mostrar:**
- Download iniciando
- Instalação em progresso
- Mensagem de sucesso
- URL para acesso

#### 3.4 Acessar EasyPanel
```
"Agora vamos acessar o EasyPanel no navegador.
Abra o navegador e digite: http://SEU_IP:3000"
```

**Mostrar:**
- Navegador abrindo
- URL sendo digitada
- Tela de criação de conta
- Conta sendo criada

### 🎬 Parte 4: Configurar Supabase (3-4 minutos)

#### 4.1 Criar conta
```
"Agora vamos configurar o Supabase, que é onde 
vamos armazenar nossos dados."
```

**Mostrar:**
- Acessando supabase.com
- Criando conta
- Fazendo login

#### 4.2 Criar projeto
```
"Vamos criar um novo projeto no Supabase."
```

**Mostrar:**
- Clicando em "New Project"
- Preenchendo formulário:
  - Nome: gabi-projeto
  - Senha do banco: (senha forte)
  - Região: São Paulo
- Clicando em "Create"

#### 4.3 Obter credenciais
```
"Agora precisamos das credenciais do projeto."
```

**Mostrar:**
- Navegando para Settings → API
- Copiando:
  - Project URL
  - Anon Key
  - Service Role Key
- Explicando que essas são as chaves de acesso

#### 4.4 Configurar banco
```
"Vamos configurar o banco de dados executando 
o script SQL fornecido."
```

**Mostrar:**
- Indo para SQL Editor
- Criando nova query
- Colando o script SQL
- Executando
- Verificando que as tabelas foram criadas

### 🎬 Parte 5: Preparar Código (3-4 minutos)

#### 5.1 Baixar projeto
```
"Agora vamos baixar o código do projeto GABI."
```

**Comandos:**
```bash
cd /opt
git clone https://github.com/seu-usuario/gabi.git
cd gabi
ls -la
```

#### 5.2 Configurar variáveis
```
"Vamos configurar as variáveis de ambiente 
com nossas credenciais do Supabase."
```

**Mostrar:**
```bash
cp env.example .env
nano .env
```

**Editar as variáveis principais:**
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- JWT_SECRET
- ALLOWED_ORIGINS

### 🎬 Parte 6: Deploy no EasyPanel (8-10 minutos)

#### 6.1 Criar projeto
```
"Agora vamos criar o projeto no EasyPanel."
```

**Mostrar:**
- Clicando em "New Project"
- Nome: gabi
- Descrição: Sistema GABI
- Clicando em "Create"

#### 6.2 Configurar frontend
```
"Vamos configurar o serviço frontend primeiro."
```

**Mostrar:**
- Clicando em "New Service"
- Tipo: Web Service
- Nome: gabi-frontend
- Source: Local Directory
- Directory: /opt/gabi/frontend
- Port: 5173
- Build Command: npm install && npm run build
- Start Command: npm run preview -- --host 0.0.0.0 --port 5173

#### 6.3 Adicionar variáveis frontend
```
"Agora vamos adicionar as variáveis de ambiente 
para o frontend."
```

**Mostrar:**
- Clicando em "Environment"
- Adicionando variáveis:
  - NODE_ENV = production
  - VITE_API_BASE_URL = https://api.seu-dominio.com/api/v1
  - VITE_SUPABASE_URL = https://seu-projeto.supabase.co
  - VITE_SUPABASE_ANON_KEY = sua-anon-key

#### 6.4 Configurar gateway
```
"Agora vamos configurar o serviço gateway."
```

**Mostrar:**
- Repetindo processo para gateway
- Nome: gabi-gateway
- Directory: /opt/gabi/gateway
- Port: 3001
- Build Command: npm install && npm run build
- Start Command: npm start

#### 6.5 Adicionar variáveis gateway
```
"Vamos adicionar as variáveis de ambiente 
para o gateway."
```

**Mostrar:**
- Adicionando variáveis:
  - NODE_ENV = production
  - PORT = 3001
  - SUPABASE_URL = https://seu-projeto.supabase.co
  - SUPABASE_ANON_KEY = sua-anon-key
  - SUPABASE_SERVICE_ROLE_KEY = sua-service-role-key
  - JWT_SECRET = seu-jwt-secret
  - ALLOWED_ORIGINS = https://seu-dominio.com

### 🎬 Parte 7: Configurar Domínio (3-4 minutos)

#### 7.1 Configurar DNS
```
"Agora vamos configurar o domínio para apontar 
para nossa VPS."
```

**Mostrar:**
- Acessando provedor de domínio
- Configurando registros DNS:
  - A @ → IP_DA_VPS
  - A api → IP_DA_VPS

#### 7.2 Configurar SSL
```
"Vamos configurar o SSL para ter HTTPS."
```

**Mostrar:**
- No EasyPanel, Settings
- Habilitando SSL
- Configurando domínio
- Salvando configuração

### 🎬 Parte 8: Testar Sistema (3-4 minutos)

#### 8.1 Verificar status
```
"Vamos verificar se tudo está funcionando."
```

**Mostrar:**
- Dashboard do EasyPanel
- Status dos serviços (Running)
- Logs dos serviços

#### 8.2 Testar URLs
```
"Agora vamos testar as URLs do sistema."
```

**Mostrar:**
- Abrindo https://seu-dominio.com
- Mostrando tela de login
- Testando https://api.seu-dominio.com/health
- Mostrando resposta JSON
- Acessando https://seu-dominio.com/admin

### 🎬 Parte 9: Demonstração (5-7 minutos)

#### 9.1 Funcionalidades principais
```
"Agora vou mostrar as principais funcionalidades 
do sistema GABI."
```

**Mostrar:**
- Login no sistema
- Dashboard principal
- Chat com IA
- Sistema de tarefas
- Exportação de documentos
- Modo jurídico
- Painel administrativo

#### 9.2 Configurações avançadas
```
"Vamos ver algumas configurações avançadas."
```

**Mostrar:**
- Configurações de usuário
- Personalização da interface
- Configurações de backup
- Monitoramento

### 🎬 Parte 10: Manutenção (2-3 minutos)

#### 10.1 Comandos úteis
```
"Vou mostrar alguns comandos úteis para manutenção."
```

**Mostrar:**
```bash
# Ver logs
docker logs gabi-frontend --tail 50
docker logs gabi-gateway --tail 50

# Reiniciar serviços
docker restart gabi-frontend
docker restart gabi-gateway

# Ver status
docker ps
docker stats
```

#### 10.2 Backup
```
"Vamos configurar backup automático."
```

**Mostrar:**
- Configuração de backup no EasyPanel
- Backup manual
- Restauração

### 🎬 Parte 11: Conclusão (1-2 minutos)

#### 11.1 Resumo
```
"Implementamos com sucesso o sistema GABI no EasyPanel!
Agora você tem um sistema completo funcionando em produção."
```

#### 11.2 URLs finais
```
"URLs de acesso:
- Site: https://seu-dominio.com
- API: https://api.seu-dominio.com
- Admin: https://seu-dominio.com/admin"
```

#### 11.3 Próximos passos
```
"Próximos passos:
1. Personalizar o sistema
2. Treinar a equipe
3. Configurar funcionalidades específicas
4. Monitorar performance"
```

#### 11.4 Call to action
```
"Se gostou do vídeo, deixe um like e se inscreva no canal!
Para mais informações, acesse a documentação completa."
```

---

## 🎬 Dicas para Gravação

### 📹 Configurações de Vídeo
- **Resolução:** 1920x1080 (Full HD)
- **FPS:** 30 ou 60
- **Codec:** H.264
- **Duração:** 30-45 minutos

### 🎤 Configurações de Áudio
- **Microfone:** Qualidade profissional
- **Sample Rate:** 44.1kHz
- **Bitrate:** 128kbps mínimo
- **Formato:** MP3 ou AAC

### 🖥️ Software Recomendado
- **Gravação:** OBS Studio, Camtasia, ScreenFlow
- **Edição:** DaVinci Resolve, Adobe Premiere
- **Captura de tela:** ShareX, Greenshot

### 📝 Roteiro Detalhado
- **Tempo total:** 30-45 minutos
- **Partes:** 11 seções
- **Transições:** Suaves entre seções
- **Callouts:** Destacar comandos importantes

---

## 🎯 Pontos de Atenção

### ⚠️ Evitar
- Pausas longas
- Comandos errados
- Informações desatualizadas
- Falar muito rápido

### ✅ Fazer
- Explicar cada passo
- Mostrar resultados
- Usar callouts para comandos
- Incluir captions/legendas
- Mostrar erros comuns e soluções

### 🎨 Elementos Visuais
- **Callouts:** Destacar comandos
- **Zoom:** Ampliar áreas importantes
- **Anotações:** Explicar conceitos
- **Transições:** Suaves entre seções
- **Música:** Background suave (opcional)

---

## 📋 Checklist de Gravação

- [ ] Script revisado
- [ ] VPS configurada
- [ ] Supabase configurado
- [ ] Código preparado
- [ ] Domínio configurado
- [ ] Software de gravação configurado
- [ ] Microfone testado
- [ ] Tela limpa (sem ícones desnecessários)
- [ ] Navegador com abas organizadas
- [ ] Terminal com fonte legível

---

## 🎬 Estrutura do Vídeo Final

### 📹 Thumbnail
- Título: "Como Deployar GABI no EasyPanel - Tutorial Completo"
- Imagem: Screenshot do sistema funcionando
- Duração: 30-45 min

### 📝 Descrição
```
🔧 Tutorial completo para implementar o sistema GABI (Assistente Jurídica Inteligente) no EasyPanel

📋 O que você vai aprender:
✅ Configurar VPS com EasyPanel
✅ Configurar Supabase
✅ Deploy automático
✅ Configurar domínio e SSL
✅ Testar todas as funcionalidades

🛠️ Tecnologias utilizadas:
- EasyPanel
- Docker
- Supabase
- React
- Node.js
- Nginx

📁 Arquivos mencionados:
- docker-compose.yml
- env.example
- deploy.sh
- easypanel-config.json

⏰ Timestamps:
00:00 - Introdução
02:00 - Pré-requisitos
04:00 - Configurar VPS
11:00 - Configurar Supabase
15:00 - Preparar código
19:00 - Deploy no EasyPanel
29:00 - Configurar domínio
33:00 - Testar sistema
37:00 - Demonstração
44:00 - Manutenção
47:00 - Conclusão

🔗 Links úteis:
- Documentação: [link]
- GitHub: [link]
- EasyPanel: [link]
- Supabase: [link]

#GABI #EasyPanel #Deploy #Tutorial #Docker #Supabase
```

---

## 🎉 Resultado Final

O vídeo tutorial será um recurso completo e didático que permitirá a qualquer pessoa implementar o sistema GABI no EasyPanel de forma profissional e eficiente, seguindo um roteiro claro e bem estruturado. 