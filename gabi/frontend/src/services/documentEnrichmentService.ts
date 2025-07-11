import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface DocumentEnrichment {
  id: string
  document_id: string
  titulo: string
  sumario: string
  topicos: string[]
  idioma: string
  data_geracao: string
  modelo_utilizado: string
  confianca: number
  duplicado_titulo: boolean
  titulo_original?: string
  metadata: {
    processing_time?: number
    tokens_used?: number
    version?: string
    suggestions?: {
      titulo_alternativo?: string
      topicos_adicionais?: string[]
      sumario_alternativo?: string
    }
  }
}

export interface EnrichmentRequest {
  document_id: string
  content: string
  filename?: string
  file_type?: string
  idioma?: string
  original_metadata?: any
  force_regeneration?: boolean
}

export interface EnrichmentResponse {
  success: boolean
  enrichment: DocumentEnrichment
  suggestions?: {
    titulo_alternativo?: string
    topicos_adicionais?: string[]
    sumario_alternativo?: string
  }
  warnings?: string[]
  processing_time: number
}

export interface EnrichmentFilters {
  idioma?: string
  data_inicio?: string
  data_fim?: string
  topicos?: string[]
  confianca_minima?: number
  duplicado_titulo?: boolean
}

export interface EnrichmentStats {
  total_documents: number
  enriched_documents: number
  pending_enrichment: number
  high_confidence: number
  low_confidence: number
  by_idioma: { [key: string]: number }
  by_topico: { [key: string]: number }
  recent_enrichments: number
  avg_processing_time: number
  duplicate_titles: number
}

// =============================================================================
// SERVIÇO DE ENRIQUECIMENTO DE DOCUMENTOS
// =============================================================================

class DocumentEnrichmentService {
  private supabase: any
  private apiBaseUrl: string

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  }

  // =============================================================================
  // ENRIQUECIMENTO AUTOMÁTICO
  // =============================================================================

  async enrichDocument(request: EnrichmentRequest): Promise<EnrichmentResponse> {
    try {
      const startTime = Date.now()

      // Verificar se já existe enriquecimento
      if (!request.force_regeneration) {
        const existing = await this.getDocumentEnrichment(request.document_id)
        if (existing) {
          return {
            success: true,
            enrichment: existing,
            processing_time: 0
          }
        }
      }

      // Preparar prompt para enriquecimento
      const enrichmentPrompt = this.buildEnrichmentPrompt(request.content, request.idioma)

      // Chamar API de enriquecimento
      const response = await fetch(`${this.apiBaseUrl}/enrichment/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          content: request.content,
          filename: request.filename,
          file_type: request.file_type,
          idioma: request.idioma || 'pt-BR',
          original_metadata: request.original_metadata,
          prompt: enrichmentPrompt
        })
      })

      if (!response.ok) {
        throw new Error('Erro na geração de enriquecimento')
      }

      const generationResult = await response.json()

      // Verificar duplicidade de título
      const isDuplicateTitle = await this.checkDuplicateTitle(generationResult.titulo, request.document_id)

      // Criar objeto de enriquecimento
      const enrichment: DocumentEnrichment = {
        id: `enrich_${Date.now()}`,
        document_id: request.document_id,
        titulo: generationResult.titulo,
        sumario: generationResult.sumario,
        topicos: generationResult.topicos || [],
        idioma: request.idioma || 'pt-BR',
        data_geracao: new Date().toISOString(),
        modelo_utilizado: generationResult.modelo || 'gpt-4',
        confianca: generationResult.confianca || 0.8,
        duplicado_titulo: isDuplicateTitle,
        titulo_original: isDuplicateTitle ? generationResult.titulo : undefined,
        metadata: {
          processing_time: Date.now() - startTime,
          tokens_used: generationResult.tokens_used,
          version: '1.0',
          suggestions: generationResult.suggestions
        }
      }

      // Se título duplicado, gerar alternativa
      if (isDuplicateTitle) {
        const alternativeTitle = await this.generateAlternativeTitle(request.content, request.idioma)
        enrichment.titulo = alternativeTitle
        enrichment.metadata.suggestions = {
          ...enrichment.metadata.suggestions,
          titulo_alternativo: alternativeTitle
        }
      }

      // Salvar enriquecimento no banco
      await this.saveEnrichment(enrichment)

      // Atualizar documento principal
      await this.updateDocumentWithEnrichment(request.document_id, enrichment)

      // Atualizar vetores no Weaviate
      await this.updateVectorEnrichment(request.document_id, enrichment)

      const processingTime = Date.now() - startTime

      return {
        success: true,
        enrichment,
        suggestions: generationResult.suggestions,
        warnings: isDuplicateTitle ? ['Título duplicado detectado e corrigido'] : [],
        processing_time: processingTime
      }

    } catch (error) {
      console.error('Erro no enriquecimento:', error)
      throw new Error('Falha no enriquecimento do documento')
    }
  }

  // =============================================================================
  // GESTÃO DE ENRIQUECIMENTOS
  // =============================================================================

  async getDocumentEnrichment(documentId: string): Promise<DocumentEnrichment | null> {
    try {
      const { data, error } = await this.supabase
        .from('document_enrichments')
        .select('*')
        .eq('document_id', documentId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar enriquecimento:', error)
      return null
    }
  }

  async saveEnrichment(enrichment: DocumentEnrichment): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('document_enrichments')
        .upsert(enrichment, { onConflict: 'document_id' })

      if (error) throw error

    } catch (error) {
      console.error('Erro ao salvar enriquecimento:', error)
      throw new Error('Falha ao salvar enriquecimento')
    }
  }

  async updateEnrichment(
    enrichmentId: string,
    updates: Partial<DocumentEnrichment>
  ): Promise<DocumentEnrichment> {
    try {
      const { data, error } = await this.supabase
        .from('document_enrichments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', enrichmentId)
        .select()
        .single()

      if (error) throw error

      // Atualizar documento principal se necessário
      if (updates.titulo || updates.sumario || updates.topicos) {
        await this.updateDocumentWithEnrichment(data.document_id, data)
      }

      return data
    } catch (error) {
      console.error('Erro ao atualizar enriquecimento:', error)
      throw new Error('Falha ao atualizar enriquecimento')
    }
  }

  async getEnrichments(filters?: EnrichmentFilters): Promise<DocumentEnrichment[]> {
    try {
      let query = this.supabase
        .from('document_enrichments')
        .select(`
          *,
          documents (
            id,
            title,
            filename,
            file_type,
            created_at
          )
        `)
        .order('data_geracao', { ascending: false })

      // Aplicar filtros
      if (filters?.idioma) {
        query = query.eq('idioma', filters.idioma)
      }

      if (filters?.topicos && filters.topicos.length > 0) {
        query = query.overlaps('topicos', filters.topicos)
      }

      if (filters?.data_inicio) {
        query = query.gte('data_geracao', filters.data_inicio)
      }

      if (filters?.data_fim) {
        query = query.lte('data_geracao', filters.data_fim)
      }

      if (filters?.confianca_minima) {
        query = query.gte('confianca', filters.confianca_minima)
      }

      if (filters?.duplicado_titulo !== undefined) {
        query = query.eq('duplicado_titulo', filters.duplicado_titulo)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar enriquecimentos:', error)
      return []
    }
  }

  // =============================================================================
  // ESTATÍSTICAS E ANALYTICS
  // =============================================================================

  async getEnrichmentStats(organizationId: string): Promise<EnrichmentStats> {
    try {
      const { data: enrichments, error } = await this.supabase
        .from('document_enrichments')
        .select('*')
        .eq('organization_id', organizationId)

      if (error) throw error

      const stats: EnrichmentStats = {
        total_documents: enrichments.length,
        enriched_documents: enrichments.filter(e => e.confianca > 0.5).length,
        pending_enrichment: enrichments.filter(e => e.confianca < 0.6).length,
        high_confidence: enrichments.filter(e => e.confianca >= 0.8).length,
        low_confidence: enrichments.filter(e => e.confianca < 0.6).length,
        by_idioma: this.aggregateByField(enrichments, 'idioma'),
        by_topico: this.aggregateByArrayField(enrichments, 'topicos'),
        recent_enrichments: enrichments.filter(e => {
          const date = new Date(e.data_geracao)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return date > weekAgo
        }).length,
        avg_processing_time: this.calculateAverageProcessingTime(enrichments),
        duplicate_titles: enrichments.filter(e => e.duplicado_titulo).length
      }

      return stats
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return {
        total_documents: 0,
        enriched_documents: 0,
        pending_enrichment: 0,
        high_confidence: 0,
        low_confidence: 0,
        by_idioma: {},
        by_topico: {},
        recent_enrichments: 0,
        avg_processing_time: 0,
        duplicate_titles: 0
      }
    }
  }

  // =============================================================================
  // BUSCA E FILTRAGEM
  // =============================================================================

  async searchByTopicos(topicos: string[], organizationId: string): Promise<DocumentEnrichment[]> {
    try {
      const { data, error } = await this.supabase
        .from('document_enrichments')
        .select(`
          *,
          documents (
            id,
            title,
            filename,
            file_type
          )
        `)
        .eq('organization_id', organizationId)
        .overlaps('topicos', topicos)
        .order('data_geracao', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro na busca por tópicos:', error)
      return []
    }
  }

  async searchByTitulo(titulo: string, organizationId: string): Promise<DocumentEnrichment[]> {
    try {
      const { data, error } = await this.supabase
        .from('document_enrichments')
        .select(`
          *,
          documents (
            id,
            title,
            filename,
            file_type
          )
        `)
        .eq('organization_id', organizationId)
        .ilike('titulo', `%${titulo}%`)
        .order('data_geracao', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro na busca por título:', error)
      return []
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  private buildEnrichmentPrompt(content: string, idioma: string = 'pt-BR'): string {
    const languageMap = {
      'pt-BR': 'português brasileiro',
      'en': 'inglês',
      'es': 'espanhol',
      'fr': 'francês'
    }

    const language = languageMap[idioma as keyof typeof languageMap] || 'português brasileiro'

    return `
Analise o conteúdo abaixo e gere informações semânticas estruturadas.

CONTEÚDO:
${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}

INSTRUÇÕES:
1. Gere um título informativo e descritivo (máximo 100 caracteres)
2. Crie um sumário claro e conciso (3 a 5 linhas)
3. Extraia 5 a 10 tópicos-chave relevantes
4. Mantenha o idioma original: ${language}
5. Foque nos conceitos centrais e principais pontos
6. Use linguagem clara e acessível

RESPONDA EM JSON:
{
  "titulo": "Título informativo do documento",
  "sumario": "Sumário detalhado em 3-5 linhas, explicando os principais pontos e objetivos do documento de forma clara e acessível.",
  "topicos": ["tópico1", "tópico2", "tópico3", "tópico4", "tópico5"],
  "confianca": 0.85,
  "suggestions": {
    "titulo_alternativo": "Título alternativo se necessário",
    "topicos_adicionais": ["tópico6", "tópico7"],
    "sumario_alternativo": "Versão alternativa do sumário"
  }
}

IMPORTANTE:
- O título deve ser único e descritivo
- O sumário deve ser informativo e bem estruturado
- Os tópicos devem cobrir os conceitos principais
- Mantenha a coerência com o conteúdo original
`
  }

  private async checkDuplicateTitle(titulo: string, excludeDocumentId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('document_enrichments')
        .select('id')
        .eq('titulo', titulo)
        .neq('document_id', excludeDocumentId)
        .limit(1)

      if (error) throw error
      return data && data.length > 0
    } catch (error) {
      console.error('Erro ao verificar duplicidade:', error)
      return false
    }
  }

  private async generateAlternativeTitle(content: string, idioma: string = 'pt-BR'): Promise<string> {
    try {
      const prompt = `
Gere um título alternativo único para o documento abaixo, evitando duplicatas.

CONTEÚDO:
${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}

REQUISITOS:
- Título único e informativo
- Máximo 100 caracteres
- Mantenha o idioma: ${idioma}
- Foque em aspectos específicos do conteúdo

RESPONDA APENAS O TÍTULO:
`

      const response = await fetch(`${this.apiBaseUrl}/enrichment/generate-title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          content: content.substring(0, 1000),
          idioma,
          prompt
        })
      })

      if (!response.ok) {
        throw new Error('Erro na geração de título alternativo')
      }

      const result = await response.json()
      return result.titulo || 'Documento sem título'
    } catch (error) {
      console.error('Erro ao gerar título alternativo:', error)
      return 'Documento sem título'
    }
  }

  private async updateDocumentWithEnrichment(
    documentId: string,
    enrichment: DocumentEnrichment
  ): Promise<void> {
    try {
      await this.supabase
        .from('documents')
        .update({
          titulo: enrichment.titulo,
          sumario: enrichment.sumario,
          topicos: enrichment.topicos,
          enriched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)

    } catch (error) {
      console.error('Erro ao atualizar documento:', error)
    }
  }

  private async updateVectorEnrichment(
    documentId: string,
    enrichment: DocumentEnrichment
  ): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/vectors/update-enrichment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          document_id: documentId,
          enrichment: {
            titulo: enrichment.titulo,
            sumario: enrichment.sumario,
            topicos: enrichment.topicos,
            idioma: enrichment.idioma,
            confianca: enrichment.confianca
          }
        })
      })

      if (!response.ok) {
        console.warn('Erro ao atualizar enriquecimento dos vetores')
      }
    } catch (error) {
      console.error('Erro ao atualizar vetores:', error)
    }
  }

  private aggregateByField(data: any[], field: string): { [key: string]: number } {
    const counts: { [key: string]: number } = {}
    
    data.forEach(item => {
      const value = item[field]
      if (value) {
        counts[value] = (counts[value] || 0) + 1
      }
    })

    return counts
  }

  private aggregateByArrayField(data: any[], field: string): { [key: string]: number } {
    const counts: { [key: string]: number } = {}
    
    data.forEach(item => {
      const values = item[field] || []
      values.forEach((value: string) => {
        counts[value] = (counts[value] || 0) + 1
      })
    })

    return counts
  }

  private calculateAverageProcessingTime(enrichments: any[]): number {
    const validTimes = enrichments
      .map(e => e.metadata?.processing_time)
      .filter(time => time && time > 0)

    if (validTimes.length === 0) return 0

    return validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length
  }

  private getAuthToken(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gabi_token') || ''
    }
    return ''
  }
}

// =============================================================================
// INSTÂNCIA SINGLETON
// =============================================================================

export const documentEnrichmentService = new DocumentEnrichmentService() 