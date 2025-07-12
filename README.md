# GABI - Agente IA para Escritórios de Advocacia

<div align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-blue" alt="Status">
  <img src="https://img.shields.io/badge/Node.js-18+-green" alt="Node.js">
  <img src="https://img.shields.io/badge/React-18+-blue" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5+-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</div>

## 🎯 Sobre o Projeto

O **GABI** é uma plataforma avançada de gestão de tarefas e conteúdos jurídicos com inteligência artificial, desenvolvida especificamente para escritórios de advocacia. O sistema oferece funcionalidades multi-tenant, busca semântica vetorial, e integração com diversas ferramentas de IA.

### ✨ Principais Funcionalidades

- 🤖 **Agente IA Jurídico**: Assistente inteligente para consultas jurídicas
- 🏢 **Multi-tenant**: Suporte a múltiplos escritórios de advocacia
- 🔍 **Busca Híbrida**: Combinação de busca fulltext e vetorial
- 📚 **Base de Conhecimento**: Gestão inteligente de documentos jurídicos
- 📋 **Sistema de Tarefas**: Organização e acompanhamento de atividades
- 🔐 **Segurança Avançada**: Isolamento de dados por tenant
- 📊 **Dashboards**: Relatórios e métricas personalizadas
- 🔄 **Integração**: Conecta com Supabase, Ollama, Weaviate, n8n, Grafana

## 🏗️ Arquitetura

### Stack Tecnológica

**Frontend:**
- React 18+ com TypeScript
- Tailwind CSS para estilização
- Vite para build e desenvolvimento

**Backend:**
- Node.js com Express
- TypeScript
- Supabase (PostgreSQL + pgvector)
- Weaviate (busca vetorial)

**IA e Automação:**
- Ollama (modelos locais)
- LangChain (orquestração de IA)
- n8n (automação de workflows)
- Evo AI Frontend (interface de IA)

**Infraestrutura:**
- Docker & Docker Compose
- EasyPanel (deploy e gerenciamento)
- Grafana (monitoramento)
- Nginx (proxy reverso)

## 🚀 Instalação Rápida

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- Git

### 1. Clone o Repositório

```bash
git clone https://github.com/resper1965/Gabi-Juris-Agent.git
cd Gabi-Juris-Agent
```

### 2. Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp gabi/env.example gabi/.env

# Edite as variáveis necessárias
nano gabi/.env
```

### 3. Inicie com Docker

```bash
cd gabi
docker-compose up -d
```

### 4. Acesse a Aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **n8n**: http://localhost:5678
- **Grafana**: http://localhost:3001

## 📖 Documentação

### Guias Principais

- [📋 Quick Start](gabi/QUICK-START.md) - Comece rapidamente
- [🎥 Tutorial Visual](gabi/VIDEO-TUTORIAL.md) - Guia passo a passo
- [📚 Guia Didático](gabi/GUIA-DIDATICO.md) - Aprendizado detalhado
- [🚀 Deploy no EasyPanel](gabi/DEPLOY-EASYPANEL.md) - Deploy em produção

### Configuração

- [⚙️ Configuração do EasyPanel](gabi/README-EASYPANEL.md)
- [🎨 Framework UI](gabi/INSTALACAO-UI-FRAMEWORK.md)
- [📊 Resumo UI](gabi/UI-FRAMEWORK-SUMMARY.md)

## 🔧 Desenvolvimento

### Estrutura do Projeto

```
gabi/
├── frontend/          # Aplicação React
├── backend/           # API Node.js/Express
├── docs/             # Documentação
├── scripts/          # Scripts de automação
├── nginx/            # Configuração do proxy
├── gateway/          # Gateway de API
└── docker-compose.yml
```

### Comandos de Desenvolvimento

```bash
# Instalar dependências
npm install

# Desenvolvimento local
npm run dev

# Build para produção
npm run build

# Testes
npm run test

# Linting
npm run lint
```

## 🌐 Deploy

### EasyPanel (Recomendado)

O GABI está otimizado para deploy no EasyPanel. Veja o guia completo:

[🚀 Guia de Deploy no EasyPanel](gabi/DEPLOY-EASYPANEL.md)

### Docker Compose

```bash
# Produção
docker-compose -f docker-compose.prod.yml up -d

# Desenvolvimento
docker-compose up -d
```

## 🤝 Contribuição

### Como Contribuir

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

### Padrões de Código

- Use TypeScript para todo o código
- Siga as convenções do ESLint
- Escreva testes para novas funcionalidades
- Documente APIs e componentes

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

### Problemas Comuns

- **Problemas de conexão**: Verifique as variáveis de ambiente
- **Erros de build**: Limpe o cache do Docker (`docker system prune`)
- **Problemas de IA**: Verifique se o Ollama está rodando

### Comunidade

- 📧 **Email**: [seu-email@exemplo.com]
- 💬 **Issues**: [GitHub Issues](https://github.com/resper1965/Gabi-Juris-Agent/issues)
- 📖 **Wiki**: [Documentação Wiki](https://github.com/resper1965/Gabi-Juris-Agent/wiki)

## 🏆 Roadmap

### Próximas Funcionalidades

- [ ] Integração com sistemas jurídicos externos
- [ ] Análise preditiva de casos
- [ ] Chatbot jurídico avançado
- [ ] Mobile app nativo
- [ ] API pública para desenvolvedores
- [ ] Marketplace de templates jurídicos

### Versões

- **v1.0.0** - MVP com funcionalidades básicas
- **v1.1.0** - Melhorias na busca vetorial
- **v1.2.0** - Sistema de templates
- **v2.0.0** - API pública e marketplace

---

<div align="center">
  <p>Desenvolvido com ❤️ para a comunidade jurídica</p>
  <p>
    <a href="https://github.com/resper1965/Gabi-Juris-Agent/stargazers">
      <img src="https://img.shields.io/github/stars/resper1965/Gabi-Juris-Agent" alt="Stars">
    </a>
    <a href="https://github.com/resper1965/Gabi-Juris-Agent/network">
      <img src="https://img.shields.io/github/forks/resper1965/Gabi-Juris-Agent" alt="Forks">
    </a>
    <a href="https://github.com/resper1965/Gabi-Juris-Agent/issues">
      <img src="https://img.shields.io/github/issues/resper1965/Gabi-Juris-Agent" alt="Issues">
    </a>
  </p>
</div> 
=======
# Gabi-Juris-Agent
Agente IA voltada a escritorios de advocacia
>>>>>>> 1a0d18889c832540068b0e1448f9d62681fdfa3c
