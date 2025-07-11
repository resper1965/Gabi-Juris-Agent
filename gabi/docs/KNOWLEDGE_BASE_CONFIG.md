# 📚 Configuração Dinâmica da Base de Conhecimento (Fulltext/Vetorial)

## 🎯 Objetivo
Permitir que cada organização (tenant) escolha se sua base de conhecimento será:
- **Fulltext** (busca tradicional)
- **Vetorial** (busca semântica)

---

## 🏗️ Estrutura de Banco de Dados

### 1. Adicionar campo de configuração na tabela de organizações
```sql
ALTER TABLE organizations ADD COLUMN knowledge_base_type VARCHAR(20) DEFAULT 'fulltext';
-- valores possíveis: 'fulltext' | 'vector'
```

### 2. (Opcional) Por base de conhecimento
```sql
ALTER TABLE knowledge_bases ADD COLUMN type VARCHAR(20) DEFAULT 'fulltext';
```

---

## ⚙️ Backend/Serviço (Node.js ou n8n)

### Exemplo de lógica para alternar busca
```typescript
// services/knowledgeBase.ts
import { searchFullText, searchVector } from './search'

export async function searchKnowledgeBase({ tenantId, query }) {
  // Buscar configuração do tenant
  const tenant = await getTenant(tenantId)
  const type = tenant.knowledge_base_type || 'fulltext'

  if (type === 'vector') {
    // Busca semântica
    return searchVector(query, tenantId)
  } else {
    // Busca tradicional
    return searchFullText(query, tenantId)
  }
}
```

---

## 🖥️ Frontend/Admin

- Adicione uma opção nas configurações da organização:
  - "Tipo de Base de Conhecimento:"
    - [ ] Fulltext (tradicional)
    - [ ] Vetorial (semântica)
- Mostre ao usuário qual tipo está ativo.
- (Opcional) Permita alternar em tempo real (se embeddings já existirem).

---

## 🔄 Migração de Fulltext para Vetorial

1. Gere embeddings para todos os documentos existentes:
   - Use pipeline n8n, script Node.js ou Python (OpenAI, Cohere, etc.)
2. Salve os vetores na tabela apropriada (Supabase pgvector ou banco vetorial externo)
3. Atualize o campo `knowledge_base_type` para 'vector'

---

## 📝 Exemplo de Pipeline n8n
- Trigger: Novo documento criado
- Node: Gerar embedding (OpenAI API)
- Node: Salvar embedding no banco vetorial
- Node: Atualizar status do documento

---

## 💡 Dicas
- Comece com fulltext para todos os tenants
- Ofereça vetorial como upgrade (premium)
- Mantenha pipelines de atualização de embeddings
- Log todas as buscas para análise de uso

---

**Com isso, cada organização pode escolher o tipo de base de conhecimento mais adequado ao seu contexto!** 🚀 