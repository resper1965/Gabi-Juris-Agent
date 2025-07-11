# Gabi Frontend

Frontend React para o Gabi Gateway - Assistente Jurídica Inteligente

## 🚀 Tecnologias

- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Lucide React** - Ícones
- **React Hooks** - Gerenciamento de estado

## 📋 Pré-requisitos

- Node.js 18+ 
- npm, yarn ou pnpm
- Backend Gabi Gateway rodando em `http://localhost:3000`

## 🛠️ Instalação

1. **Instalar dependências:**
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

2. **Instalar shadcn/ui:**
```bash
npx shadcn@latest init
```

3. **Instalar componentes necessários:**
```bash
npx shadcn@latest add button input card badge scroll-area avatar select checkbox label separator alert
```

4. **Configurar alias no Vite:**
Edite `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

5. **Configurar TypeScript:**
Edite `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 🚀 Executar

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

O frontend estará disponível em `http://localhost:5173`

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/           # Componentes shadcn/ui
│   ├── LoginForm.tsx # Formulário de login
│   └── ChatInterface.tsx # Interface principal do chat
├── hooks/
│   └── useAuth.ts    # Hook de autenticação
├── lib/
│   └── api.ts        # Cliente API para backend
├── App.tsx           # Componente principal
├── main.tsx          # Entry point
└── index.css         # Estilos globais
```

## 🔐 Autenticação

O frontend usa autenticação JWT via Supabase:

- **Login**: E-mail e senha
- **Token**: Armazenado no localStorage
- **Renovação**: Automática a cada 5 minutos
- **Headers**: Authorization Bearer token

## 💬 Chat

Funcionalidades do chat:

- **Mensagens em tempo real** com o backend
- **Seleção de agentes** (GPT-4, Claude, etc.)
- **Bases de conhecimento** configuráveis
- **Sessões persistentes** com ID único
- **Métricas** (tokens, latência)
- **Interface responsiva**

## 🔧 Configuração

### Variáveis de Ambiente

Crie `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Gabi
```

### Backend

Certifique-se que o backend está rodando:
```bash
# No diretório backend
npm run dev
```

## 📱 Funcionalidades

### ✅ Implementadas

- [x] Autenticação com Supabase
- [x] Interface de chat responsiva
- [x] Seleção de agentes MCP
- [x] Configuração de bases de conhecimento
- [x] Envio de mensagens para backend
- [x] Exibição de respostas do agente
- [x] Gerenciamento de sessões
- [x] Renovação automática de token
- [x] Tratamento de erros
- [x] Loading states
- [x] Métricas de performance

### 🚧 Próximas Funcionalidades

- [ ] Personalização da assistente
- [ ] Upload de avatar
- [ ] Templates de personalização
- [ ] Histórico de conversas
- [ ] Exportação de chats
- [ ] Configurações avançadas
- [ ] Modo escuro/claro
- [ ] Notificações push

## 🐛 Troubleshooting

### Erro de CORS
Certifique-se que o backend está configurado para aceitar requisições do frontend.

### Token inválido
O token é renovado automaticamente. Se persistir, faça logout e login novamente.

### Backend não responde
Verifique se o backend está rodando em `http://localhost:3000`.

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Gabi** - Assistente Jurídica Inteligente 🤖⚖️ 