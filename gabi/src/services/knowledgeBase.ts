// Serviço de busca de conhecimento com suporte a fulltext e vetorial (LangChain)

import { getTenant } from './tenant' // Função que retorna config do tenant
import { createClient } from '@supabase/supabase-js'
import { OpenAI } from '@langchain/openai'
import { WeaviateStore } from '@langchain/weaviate'
import { RetrievalQAChain } from 'langchain/chains'
import weaviate from 'weaviate-client'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

// Função principal de busca
export async function searchKnowledgeBase({ tenantId, query }: { tenantId: string, query: string }) {
  // Buscar configuração do tenant
  const tenant = await getTenant(tenantId)
  const type = tenant.knowledge_base_type || 'fulltext'

  if (type === 'vector') {
    // Busca vetorial com LangChain + Weaviate
    const llm = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // ou endpoint do Ollama
      temperature: 0.2,
    })
    const client = weaviate.client({
      scheme: 'http',
      host: process.env.WEAVIATE_HOST || 'localhost:8080',
    })
    const vectorStore = new WeaviateStore(client, 'Documentos')
    const chain = RetrievalQAChain.fromLLM(llm, vectorStore.asRetriever())
    const resposta = await chain.call({ query })
    return { type: 'vector', resposta: resposta.text }
  } else {
    // Busca fulltext no Supabase
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, content')
      .textSearch('content', query)
      .limit(5)
    if (error) throw new Error(error.message)
    // Retornar os trechos encontrados
    return { type: 'fulltext', resposta: data }
  }
} 