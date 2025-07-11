# Gabi - Assistente Jurídico Inteligente

Uma plataforma moderna de chat com IA especializada no setor jurídico, construída com React, TypeScript, Tailwind CSS e Zustand.

## 🚀 Características

- **Interface Moderna**: Design limpo e responsivo com modo escuro/claro
- **Múltiplos Agentes**: Suporte a diferentes agentes de IA especializados
- **Bases de Conhecimento**: Integração com múltiplas bases de dados jurídicas
- **Chat em Tempo Real**: Interface de conversação fluida e intuitiva
- **Tema Personalizado**: Cores em preto, branco e tons de #00ade0
- **TypeScript**: Código totalmente tipado para maior segurança
- **Zustand**: Gerenciamento de estado simples e eficiente

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + PostCSS
- **Estado**: Zustand
- **Ícones**: Lucide React
- **Linting**: ESLint + TypeScript ESLint

## 📦 Instalação

1. **Clone o repositório**:
```bash
git clone <repository-url>
cd gabi/frontend
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Execute em modo de desenvolvimento**:
```bash
npm run dev
```

4. **Acesse a aplicação**:
```
http://localhost:5173
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── Sidebar.tsx     # Barra lateral com agentes e bases
│   ├── ChatWindow.tsx  # Janela de chat principal
│   └── MessageInput.tsx # Input de mensagens
├── stores/             # Gerenciamento de estado (Zustand)
│   └── useChatStore.ts # Store principal do chat
├── App.tsx             # Componente raiz
├── main.tsx           # Ponto de entrada
└── index.css          # Estilos globais
```

## 🎨 Design System

### Cores
- **Primária**: `#00ade0` (azul)
- **Neutras**: Preto (`#000000`) e Branco (`#ffffff`)
- **Estados**: Sucesso, Aviso, Erro

### Tipografia
- **Fonte Principal**: Inter
- **Fonte Mono**: JetBrains Mono

### Componentes
- **Sidebar**: Navegação e seleção de agentes/bases
- **ChatWindow**: Área de conversação
- **MessageInput**: Input de mensagens com funcionalidades extras

## 🔧 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Preview do build
- `npm run lint` - Verificação de código

## 📱 Funcionalidades

### Agentes Disponíveis
- **Advogado Geral**: Consultas jurídicas gerais
- **Especialista Trabalhista**: Direito do trabalho
- **Especialista Tributário**: Direito tributário
- **Especialista Civil**: Direito civil e contratual

### Bases de Conhecimento
- **Legislação Federal**: Leis e decretos federais
- **Jurisprudência STF**: Decisões do Supremo Tribunal Federal
- **Jurisprudência STJ**: Decisões do Superior Tribunal de Justiça
- **Doutrina Jurídica**: Artigos e livros especializados

## 🚧 Próximos Passos

- [ ] Integração com backend Node.js
- [ ] Autenticação com Supabase JWT
- [ ] Integração MCP (Model Context Protocol)
- [ ] Upload de arquivos
- [ ] Histórico de conversas
- [ ] Exportação de conversas
- [ ] Configurações avançadas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para suporte@gabi.app ou abra uma issue no repositório.

---

**Gabi** - Transformando a advocacia com inteligência artificial. 