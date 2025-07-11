import { gabiApiService } from './gabiApiService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface SearchQuery {
  text: string
  bases: string[]
  agent: string
  style: string
  language: string
  filters?: SearchFilters
}

export interface SearchFilters {
  documentType?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  sensitivity?: 'public' | 'internal' | 'confidential'
  area?: string[]
  exactMatch?: boolean
  semanticWeight?: number // 0-1, peso da busca semântica vs lexical
}

export interface SearchResult {
  id: string
  content: string
  source: string
  base_id: string
  document_id: string
  chunk_id: string
  score: number
  searchType: 'semantic' | 'lexical' | 'hybrid'
  metadata: {
    title?: string
    author?: string
    date?: string
    type?: string
    tags?: string[]
    confidence?: number
  }
  highlights?: {
    text: string
    type: 'semantic' | 'lexical'
  }[]
}

export interface HybridSearchResponse {
  results: SearchResult[]
  totalResults: number
  searchTime: number
  query: SearchQuery
  suggestions?: string[]
  relatedQueries?: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  sources?: SearchResult[]
  agent?: string
  style?: string
  metadata?: {
    processingTime?: number
    tokensUsed?: number
    model?: string
  }
}

export interface ChatSession {
  id: string
  title: string
  bases: string[]
  agent: string
  style: string
  language: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
  status: 'active' | 'archived'
  metadata?: {
    totalMessages?: number
    lastActivity?: string
    user_id?: string
    organization_id?: string
  }
}

// =============================================================================
// SERVIÇO DE BUSCA HÍBRIDA
// =============================================================================

class HybridSearchService {
  private apiBaseUrl: string

  constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  }

  // =============================================================================
  // BUSCA HÍBRIDA PRINCIPAL
  // =============================================================================

  async performHybridSearch(query: SearchQuery): Promise<HybridSearchResponse> {
    try {
      const startTime = Date.now()

      // Executar buscas em paralelo
      const [semanticResults, lexicalResults] = await Promise.all([
        this.performSemanticSearch(query),
        this.performLexicalSearch(query)
      ])

      // Combinar e ranquear resultados
      const combinedResults = this.combineAndRankResults(
        semanticResults,
        lexicalResults,
        query.filters?.semanticWeight || 0.7
      )

      const searchTime = Date.now() - startTime

      return {
        results: combinedResults,
        totalResults: combinedResults.length,
        searchTime,
        query,
        suggestions: this.generateSuggestions(query.text),
        relatedQueries: this.generateRelatedQueries(query.text)
      }
    } catch (error) {
      console.error('Erro na busca híbrida:', error)
      throw new Error('Falha na busca híbrida')
    }
  }

  // =============================================================================
  // BUSCA SEMÂNTICA (RAG)
  // =============================================================================

  private async performSemanticSearch(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/search/semantic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          query: query.text,
          bases: query.bases,
          filters: query.filters,
          agent: query.agent,
          top_k: 20
        })
      })

      if (!response.ok) {
        throw new Error('Erro na busca semântica')
      }

      const data = await response.json()
      return data.results.map((result: any) => ({
        ...result,
        searchType: 'semantic' as const
      }))
    } catch (error) {
      console.error('Erro na busca semântica:', error)
      return []
    }
  }

  // =============================================================================
  // BUSCA LEXICAL/BOOLEANA
  // =============================================================================

  private async performLexicalSearch(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/search/lexical`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          query: query.text,
          bases: query.bases,
          filters: query.filters,
          exactMatch: query.filters?.exactMatch || false,
          top_k: 20
        })
      })

      if (!response.ok) {
        throw new Error('Erro na busca lexical')
      }

      const data = await response.json()
      return data.results.map((result: any) => ({
        ...result,
        searchType: 'lexical' as const
      }))
    } catch (error) {
      console.error('Erro na busca lexical:', error)
      return []
    }
  }

  // =============================================================================
  // COMBINAÇÃO E RANQUEAMENTO
  // =============================================================================

  private combineAndRankResults(
    semanticResults: SearchResult[],
    lexicalResults: SearchResult[],
    semanticWeight: number
  ): SearchResult[] {
    const lexicalWeight = 1 - semanticWeight
    const combinedMap = new Map<string, SearchResult>()

    // Processar resultados semânticos
    semanticResults.forEach((result, index) => {
      const key = `${result.base_id}_${result.document_id}_${result.chunk_id}`
      const weightedScore = result.score * semanticWeight
      
      combinedMap.set(key, {
        ...result,
        score: weightedScore,
        searchType: 'semantic'
      })
    })

    // Processar resultados lexicais
    lexicalResults.forEach((result, index) => {
      const key = `${result.base_id}_${result.document_id}_${result.chunk_id}`
      const weightedScore = result.score * lexicalWeight
      
      if (combinedMap.has(key)) {
        // Combinar scores se o mesmo resultado aparecer em ambas as buscas
        const existing = combinedMap.get(key)!
        combinedMap.set(key, {
          ...existing,
          score: existing.score + weightedScore,
          searchType: 'hybrid',
          highlights: [
            ...(existing.highlights || []),
            ...(result.highlights || [])
          ]
        })
      } else {
        combinedMap.set(key, {
          ...result,
          score: weightedScore,
          searchType: 'lexical'
        })
      }
    })

    // Converter para array e ordenar por score
    const combinedResults = Array.from(combinedMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 15) // Limitar a 15 resultados finais

    return combinedResults
  }

  // =============================================================================
  // GERAÇÃO DE RESPOSTA COM RAG
  // =============================================================================

  async generateResponse(
    query: string,
    searchResults: SearchResult[],
    chatHistory: ChatMessage[],
    agent: string,
    style: string
  ): Promise<ChatMessage> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/chat/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          query,
          searchResults: searchResults.slice(0, 8), // Limitar contexto
          chatHistory: chatHistory.slice(-10), // Últimas 10 mensagens
          agent,
          style,
          maxTokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error('Erro na geração de resposta')
      }

      const data = await response.json()
      
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        sources: searchResults.slice(0, 5), // Top 5 fontes
        agent,
        style,
        metadata: {
          processingTime: data.processingTime,
          tokensUsed: data.tokensUsed,
          model: data.model
        }
      }
    } catch (error) {
      console.error('Erro na geração de resposta:', error)
      throw new Error('Falha na geração de resposta')
    }
  }

  // =============================================================================
  // GESTÃO DE SESSÕES DE CHAT
  // =============================================================================

  async createChatSession(
    title: string,
    bases: string[],
    agent: string,
    style: string,
    language: string
  ): Promise<ChatSession> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/chat/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          title,
          bases,
          agent,
          style,
          language
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao criar sessão')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao criar sessão:', error)
      throw new Error('Falha ao criar sessão de chat')
    }
  }

  async getChatSessions(): Promise<ChatSession[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/chat/sessions`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar sessões')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar sessões:', error)
      return []
    }
  }

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/chat/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar sessão:', error)
      return null
    }
  }

  async updateChatSession(
    sessionId: string,
    updates: Partial<ChatSession>
  ): Promise<ChatSession> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar sessão')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error)
      throw new Error('Falha ao atualizar sessão')
    }
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao deletar sessão')
      }
    } catch (error) {
      console.error('Erro ao deletar sessão:', error)
      throw new Error('Falha ao deletar sessão')
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  private getAuthToken(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gabi_token') || ''
    }
    return ''
  }

  private generateSuggestions(query: string): string[] {
    // Implementar geração de sugestões baseada na query
    const suggestions = []
    
    if (query.toLowerCase().includes('jurídico') || query.toLowerCase().includes('legal')) {
      suggestions.push('Quais são os requisitos legais para...')
      suggestions.push('Como proceder em caso de...')
    }
    
    if (query.toLowerCase().includes('esg') || query.toLowerCase().includes('sustentabilidade')) {
      suggestions.push('Quais são as práticas ESG recomendadas...')
      suggestions.push('Como implementar políticas de sustentabilidade...')
    }
    
    return suggestions.slice(0, 3)
  }

  private generateRelatedQueries(query: string): string[] {
    // Implementar geração de queries relacionadas
    const related = []
    
    // Simples expansão de termos
    if (query.toLowerCase().includes('compliance')) {
      related.push('regulamentação compliance')
      related.push('normas compliance')
      related.push('auditoria compliance')
    }
    
    return related.slice(0, 3)
  }

  // =============================================================================
  // ANÁLISE DE CONTEÚDO
  // =============================================================================

  async analyzeQuery(query: string): Promise<{
    intent: string
    entities: string[]
    confidence: number
    suggestedBases: string[]
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/search/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ query })
      })

      if (!response.ok) {
        throw new Error('Erro na análise da query')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro na análise da query:', error)
      return {
        intent: 'general',
        entities: [],
        confidence: 0.5,
        suggestedBases: []
      }
    }
  }

  // =============================================================================
  // CACHE E OTIMIZAÇÃO
  // =============================================================================

  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutos

  private getCachedResult(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    return null
  }

  private setCachedResult(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  // =============================================================================
  // MÉTRICAS E MONITORAMENTO
  // =============================================================================

  private logSearchMetrics(query: SearchQuery, results: SearchResult[], searchTime: number): void {
    const metrics = {
      query: query.text,
      bases: query.bases,
      agent: query.agent,
      style: query.style,
      resultsCount: results.length,
      searchTime,
      timestamp: new Date().toISOString()
    }

    // Em produção, enviar para sistema de analytics
    console.log('Search Metrics:', metrics)
  }
}

// =============================================================================
// INSTÂNCIA SINGLETON
// =============================================================================

export const hybridSearchService = new HybridSearchService() 