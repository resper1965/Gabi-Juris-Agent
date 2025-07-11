# Guia de Contribuição - GABI

Obrigado por considerar contribuir com o GABI! Este documento fornece diretrizes para contribuições.

## 🚀 Como Contribuir

### 1. Configuração Inicial

```bash
# Fork o repositório
git clone https://github.com/SEU_USUARIO/Gabi-Juris-Agent.git
cd Gabi-Juris-Agent

# Configure o upstream
git remote add upstream https://github.com/resper1965/Gabi-Juris-Agent.git

# Instale dependências
npm install
cd gabi && npm install
```

### 2. Fluxo de Trabalho

1. **Crie uma branch** para sua feature/fix:
   ```bash
   git checkout -b feature/nova-funcionalidade
   # ou
   git checkout -b fix/correcao-bug
   ```

2. **Faça suas alterações** seguindo os padrões de código

3. **Teste suas alterações**:
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

4. **Commit suas mudanças**:
   ```bash
   git add .
   git commit -m "feat: adiciona nova funcionalidade X"
   ```

5. **Push para sua branch**:
   ```bash
   git push origin feature/nova-funcionalidade
   ```

6. **Abra um Pull Request** no GitHub

## 📝 Padrões de Commit

Seguimos o [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Tipos de Commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação, ponto e vírgula, etc.
- `refactor`: Refatoração de código
- `test`: Adição de testes
- `chore`: Tarefas de build, dependências, etc.

### Exemplos

```bash
git commit -m "feat: adiciona sistema de busca vetorial"
git commit -m "fix: corrige erro de autenticação multi-tenant"
git commit -m "docs: atualiza README com instruções de deploy"
git commit -m "test: adiciona testes para serviço de documentos"
```

## 🎨 Padrões de Código

### TypeScript

- Use TypeScript para todo o código
- Defina tipos explícitos para funções e variáveis
- Use interfaces para objetos complexos
- Evite `any` - use `unknown` quando necessário

### React

- Use componentes funcionais com hooks
- Use TypeScript para props e estado
- Siga as convenções de nomenclatura
- Use memoização quando apropriado

### Node.js/Express

- Use async/await em vez de callbacks
- Implemente tratamento de erros adequado
- Use middleware para funcionalidades reutilizáveis
- Documente APIs com JSDoc

### Estrutura de Arquivos

```
src/
├── components/     # Componentes React
├── pages/         # Páginas da aplicação
├── services/      # Serviços e APIs
├── hooks/         # Custom hooks
├── types/         # Definições de tipos
├── utils/         # Utilitários
└── styles/        # Estilos globais
```

## 🧪 Testes

### Executando Testes

```bash
# Todos os testes
npm run test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:coverage

# Testes específicos
npm run test -- --grep "nome do teste"
```

### Escrevendo Testes

- Use Jest como framework de teste
- Use React Testing Library para componentes
- Teste casos de sucesso e erro
- Mantenha cobertura acima de 80%

## 🔍 Linting e Formatação

### ESLint

```bash
# Verificar problemas
npm run lint

# Corrigir automaticamente
npm run lint:fix
```

### Prettier

```bash
# Formatar código
npm run format

# Verificar formatação
npm run format:check
```

## 📋 Checklist do Pull Request

Antes de submeter um PR, verifique:

- [ ] Código segue os padrões estabelecidos
- [ ] Testes passam e foram adicionados
- [ ] Documentação foi atualizada
- [ ] Commits seguem o padrão conventional
- [ ] Não há conflitos de merge
- [ ] Build passa sem erros
- [ ] Funcionalidade foi testada localmente

## 🐛 Reportando Bugs

Use o template de issue para bugs:

```markdown
## Descrição do Bug
Descrição clara e concisa do bug.

## Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

## Comportamento Esperado
O que deveria acontecer.

## Comportamento Atual
O que realmente acontece.

## Screenshots
Se aplicável, adicione screenshots.

## Ambiente
- OS: [ex: Windows 10]
- Browser: [ex: Chrome 91]
- Versão: [ex: 1.0.0]

## Informações Adicionais
Qualquer outra informação relevante.
```

## 💡 Sugerindo Funcionalidades

Use o template de feature request:

```markdown
## Descrição da Funcionalidade
Descrição clara da funcionalidade desejada.

## Problema que Resolve
Explicação do problema que esta funcionalidade resolveria.

## Solução Proposta
Descrição da solução proposta.

## Alternativas Consideradas
Outras soluções que foram consideradas.

## Informações Adicionais
Qualquer contexto adicional.
```

## 🤝 Comunicação

- **Issues**: Para bugs e feature requests
- **Discussions**: Para perguntas e discussões gerais
- **Pull Requests**: Para contribuições de código

## 📞 Suporte

Se você tem dúvidas sobre como contribuir:

1. Verifique a documentação existente
2. Procure por issues similares
3. Abra uma discussion no GitHub
4. Entre em contato com os mantenedores

## 🏆 Reconhecimento

Contribuidores serão reconhecidos no README e releases do projeto.

---

Obrigado por contribuir com o GABI! 🚀 