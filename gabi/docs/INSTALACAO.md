# 🚀 Guia de Instalação - GABI

## 📋 Pré-requisitos

### Sistema
- **Node.js**: 18.0.0 ou superior
- **npm**: 9.0.0 ou superior
- **Git**: 2.30.0 ou superior
- **RAM**: Mínimo 4GB (recomendado 8GB)
- **Espaço**: Mínimo 2GB livre

### Contas Necessárias
- **Supabase**: Para banco de dados e autenticação
- **GitHub**: Para versionamento (opcional)

## 🔧 Instalação Local

### 1. Clone do Repositório
```bash
git clone https://github.com/seu-usuario/gabi.git
cd gabi
```

### 2. Configuração do Ambiente
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite as variáveis de ambiente
nano .env
```

### 3. Configuração do Supabase
```bash
# Acesse https://supabase.com
# Crie um novo projeto
# Copie as credenciais para o .env
```

### 4. Instalação das Dependências

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd ../backend
npm install
```

### 5. Configuração do Banco de Dados
```bash
# Execute os scripts SQL no Supabase
# Arquivos em: backend/database/
```

### 6. Execução do Projeto

#### Desenvolvimento
```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev
```

#### Produção
```bash
# Build do frontend
cd frontend
npm run build

# Execução do backend
cd backend
npm start
```

## 🌐 Acesso

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Supabase**: https://app.supabase.com

## ✅ Verificação da Instalação

### Testes Automatizados
```bash
# Frontend
cd frontend
npm run test

# Backend
cd backend
npm run test
```

### Verificação Manual
1. Acesse http://localhost:5173
2. Faça login com credenciais de teste
3. Verifique se todas as funcionalidades estão operacionais

## 🔧 Configurações Avançadas

### Variáveis de Ambiente
```env
# Frontend (.env)
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_API_URL=http://localhost:3001

# Backend (.env)
PORT=3001
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_KEY=sua_chave_service
JWT_SECRET=seu_jwt_secret
CORS_ORIGIN=http://localhost:5173
UPLOAD_PATH=./uploads
```

### Configuração do Tailwind
```javascript
// frontend/tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Problemas Comuns

#### Erro de Porta em Uso
```bash
# Verifique processos na porta
lsof -i :3001
lsof -i :5173

# Mate o processo se necessário
kill -9 <PID>
```

#### Erro de Dependências
```bash
# Limpe cache do npm
npm cache clean --force

# Remova node_modules e reinstale
rm -rf node_modules package-lock.json
npm install
```

#### Erro de Supabase
```bash
# Verifique as credenciais no .env
# Confirme se o projeto está ativo
# Teste a conexão
```

## 📚 Próximos Passos

1. **Configuração de SSL**: Para produção
2. **Backup Automático**: Configurar rotinas
3. **Monitoramento**: Implementar logs
4. **Deploy**: Configurar ambiente de produção

---

**Precisa de ajuda?** Consulte [Troubleshooting](./TROUBLESHOOTING.md) ou abra uma issue no GitHub. 