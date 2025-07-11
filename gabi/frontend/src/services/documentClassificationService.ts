import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface DocumentClassification {
  id: string
  document_id: string
  bases_sugeridas: string[]
  tags: string[]
  idioma: string
  confidencialidade: 'baixa' | 'media' | 'alta'
  estilo: string
  categoria: string
  area: string
  tema: string
  nivel_tecnico: 'basico' | 'intermediario' | 'avancado'
  publico_alvo: string[]
  data_classificacao: string
  modelo_utilizado: string
  confianca: number
  revisado_por_humano: boolean
  revisado_em?: string
  revisado_por?: string
  observacoes?: string
  metadata: {
    processing_time?: number
    tokens_used?: number
    version?: string
  }
}

export interface ClassificationRequest {
  document_id: string
  content: string
  filename?: string
  file_type?: string
  original_metadata?: any
  force_reclassification?: boolean
}

export interface ClassificationResponse {
  success: boolean
  classification: DocumentClassification
  suggestions?: {
    bases_alternativas?: string[]
    tags_adicionais?: string[]
    estilo_alternativo?: string
  }
  warnings?: string[]
  processing_time: number
}

export interface ClassificationFilters {
  bases?: string[]
  tags?: string[]
  idioma?: string
  confidencialidade?: string[]
  estilo?: string[]
  categoria?: string[]
  area?: string[]
  nivel_tecnico?: string[]
  data_inicio?: string
  data_fim?: string
  revisado_por_humano?: boolean
  confianca_minima?: number
}

export interface ClassificationStats {
  total_documents: number
  classified_documents: number
  pending_review: number
  high_confidence: number
  low_confidence: number
  by_confidencialidade: { [key: string]: number }
  by_estilo: { [key: string]: number }
  by_area: { [key: string]: number }
  by_base: { [key: string]: number }
  recent_classifications: number
  avg_processing_time: number
}

// =============================================================================
// SERVIÇO DE CLASSIFICAÇÃO DE DOCUMENTOS
// =============================================================================

class DocumentClassificationService {
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
  // CLASSIFICAÇÃO AUTOMÁTICA
  // =============================================================================

  async classifyDocument(request: ClassificationRequest): Promise<ClassificationResponse> {
    try {
      const startTime = Date.now()

      // Verificar se já existe classificação
      if (!request.force_reclassification) {
        const existing = await this.getDocumentClassification(request.document_id)
        if (existing) {
          return {
            success: true,
            classification: existing,
            processing_time: 0
          }
        }
      }

      // Preparar prompt para classificação
      const classificationPrompt = this.buildClassificationPrompt(request.content)

      // Chamar API de classificação
      const response = await fetch(`${this.apiBaseUrl}/classification/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          content: request.content,
          filename: request.filename,
          file_type: request.file_type,
          original_metadata: request.original_metadata,
          prompt: classificationPrompt
        })
      })

      if (!response.ok) {
        throw new Error('Erro na classificação automática')
      }

      const analysisResult = await response.json()

      // Criar objeto de classificação
      const classification: DocumentClassification = {
        id: `class_${Date.now()}`,
        document_id: request.document_id,
        bases_sugeridas: analysisResult.bases_sugeridas || [],
        tags: analysisResult.tags || [],
        idioma: analysisResult.idioma || 'pt-BR',
        confidencialidade: analysisResult.confidencialidade || 'media',
        estilo: analysisResult.estilo || 'neutro',
        categoria: analysisResult.categoria || 'geral',
        area: analysisResult.area || 'geral',
        tema: analysisResult.tema || 'geral',
        nivel_tecnico: analysisResult.nivel_tecnico || 'intermediario',
        publico_alvo: analysisResult.publico_alvo || [],
        data_classificacao: new Date().toISOString(),
        modelo_utilizado: analysisResult.modelo || 'gpt-4',
        confianca: analysisResult.confianca || 0.8,
        revisado_por_humano: false,
        metadata: {
          processing_time: Date.now() - startTime,
          tokens_used: analysisResult.tokens_used,
          version: '1.0'
        }
      }

      // Salvar classificação no banco
      await this.saveClassification(classification)

      // Atualizar vetores no Weaviate
      await this.updateVectorMetadata(request.document_id, classification)

      // Verificar alertas de segurança
      const warnings = await this.checkSecurityAlerts(classification)

      const processingTime = Date.now() - startTime

      return {
        success: true,
        classification,
        suggestions: analysisResult.suggestions,
        warnings,
        processing_time: processingTime
      }

    } catch (error) {
      console.error('Erro na classificação:', error)
      throw new Error('Falha na classificação do documento')
    }
  }

  // =============================================================================
  // GESTÃO DE CLASSIFICAÇÕES
  // =============================================================================

  async getDocumentClassification(documentId: string): Promise<DocumentClassification | null> {
    try {
      const { data, error } = await this.supabase
        .from('document_classifications')
        .select('*')
        .eq('document_id', documentId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar classificação:', error)
      return null
    }
  }

  async saveClassification(classification: DocumentClassification): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('document_classifications')
        .upsert(classification, { onConflict: 'document_id' })

      if (error) throw error

      // Atualizar documento principal
      await this.supabase
        .from('documents')
        .update({
          tags: classification.tags,
          idioma: classification.idioma,
          confidencialidade: classification.confidencialidade,
          estilo: classification.estilo,
          base_ids: classification.bases_sugeridas,
          classificacao_id: classification.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', classification.document_id)

    } catch (error) {
      console.error('Erro ao salvar classificação:', error)
      throw new Error('Falha ao salvar classificação')
    }
  }

  async updateClassification(
    classificationId: string,
    updates: Partial<DocumentClassification>
  ): Promise<DocumentClassification> {
    try {
      const { data, error } = await this.supabase
        .from('document_classifications')
        .update({
          ...updates,
          revisado_por_humano: true,
          revisado_em: new Date().toISOString(),
          revisado_por: this.getCurrentUserId()
        })
        .eq('id', classificationId)
        .select()
        .single()

      if (error) throw error

      // Atualizar documento principal se necessário
      if (updates.bases_sugeridas || updates.tags || updates.confidencialidade) {
        await this.supabase
          .from('documents')
          .update({
            tags: data.tags,
            confidencialidade: data.confidencialidade,
            base_ids: data.bases_sugeridas,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.document_id)
      }

      return data
    } catch (error) {
      console.error('Erro ao atualizar classificação:', error)
      throw new Error('Falha ao atualizar classificação')
    }
  }

  async getClassifications(filters?: ClassificationFilters): Promise<DocumentClassification[]> {
    try {
      let query = this.supabase
        .from('document_classifications')
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
        .order('data_classificacao', { ascending: false })

      // Aplicar filtros
      if (filters?.bases && filters.bases.length > 0) {
        query = query.overlaps('bases_sugeridas', filters.bases)
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }

      if (filters?.idioma) {
        query = query.eq('idioma', filters.idioma)
      }

      if (filters?.confidencialidade && filters.confidencialidade.length > 0) {
        query = query.in('confidencialidade', filters.confidencialidade)
      }

      if (filters?.estilo && filters.estilo.length > 0) {
        query = query.in('estilo', filters.estilo)
      }

      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria)
      }

      if (filters?.area) {
        query = query.eq('area', filters.area)
      }

      if (filters?.nivel_tecnico && filters.nivel_tecnico.length > 0) {
        query = query.in('nivel_tecnico', filters.nivel_tecnico)
      }

      if (filters?.data_inicio) {
        query = query.gte('data_classificacao', filters.data_inicio)
      }

      if (filters?.data_fim) {
        query = query.lte('data_classificacao', filters.data_fim)
      }

      if (filters?.revisado_por_humano !== undefined) {
        query = query.eq('revisado_por_humano', filters.revisado_por_humano)
      }

      if (filters?.confianca_minima) {
        query = query.gte('confianca', filters.confianca_minima)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar classificações:', error)
      return []
    }
  }

  // =============================================================================
  // ESTATÍSTICAS E ANALYTICS
  // =============================================================================

  async getClassificationStats(organizationId: string): Promise<ClassificationStats> {
    try {
      const { data: classifications, error } = await this.supabase
        .from('document_classifications')
        .select('*')
        .eq('organization_id', organizationId)

      if (error) throw error

      const stats: ClassificationStats = {
        total_documents: classifications.length,
        classified_documents: classifications.filter(c => c.confianca > 0.5).length,
        pending_review: classifications.filter(c => !c.revisado_por_humano && c.confianca < 0.7).length,
        high_confidence: classifications.filter(c => c.confianca >= 0.8).length,
        low_confidence: classifications.filter(c => c.confianca < 0.6).length,
        by_confidencialidade: this.aggregateByField(classifications, 'confidencialidade'),
        by_estilo: this.aggregateByField(classifications, 'estilo'),
        by_area: this.aggregateByField(classifications, 'area'),
        by_base: this.aggregateByArrayField(classifications, 'bases_sugeridas'),
        recent_classifications: classifications.filter(c => {
          const date = new Date(c.data_classificacao)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return date > weekAgo
        }).length,
        avg_processing_time: this.calculateAverageProcessingTime(classifications)
      }

      return stats
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return {
        total_documents: 0,
        classified_documents: 0,
        pending_review: 0,
        high_confidence: 0,
        low_confidence: 0,
        by_confidencialidade: {},
        by_estilo: {},
        by_area: {},
        by_base: {},
        recent_classifications: 0,
        avg_processing_time: 0
      }
    }
  }

  // =============================================================================
  // VALIDAÇÃO ASSISTIDA
  // =============================================================================

  async getPendingReviews(organizationId: string): Promise<DocumentClassification[]> {
    try {
      const { data, error } = await this.supabase
        .from('document_classifications')
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
        .eq('revisado_por_humano', false)
        .lt('confianca', 0.7)
        .order('data_classificacao', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar revisões pendentes:', error)
      return []
    }
  }

  async approveClassification(
    classificationId: string,
    approvedData: Partial<DocumentClassification>
  ): Promise<void> {
    try {
      await this.updateClassification(classificationId, {
        ...approvedData,
        revisado_por_humano: true
      })

      toast.success('Classificação aprovada com sucesso')
    } catch (error) {
      console.error('Erro ao aprovar classificação:', error)
      toast.error('Erro ao aprovar classificação')
    }
  }

  async rejectClassification(
    classificationId: string,
    reason: string
  ): Promise<void> {
    try {
      await this.updateClassification(classificationId, {
        revisado_por_humano: true,
        observacoes: `Rejeitado: ${reason}`
      })

      toast.success('Classificação rejeitada')
    } catch (error) {
      console.error('Erro ao rejeitar classificação:', error)
      toast.error('Erro ao rejeitar classificação')
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  private buildClassificationPrompt(content: string): string {
    return `
Analise o conteúdo abaixo e classifique-o de acordo com os critérios especificados.

CONTEÚDO:
${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}

INSTRUÇÕES:
1. Identifique até 3 bases de conhecimento mais apropriadas
2. Extraia tags relevantes (máximo 10)
3. Determine o idioma principal
4. Avalie o nível de confidencialidade (baixa, media, alta)
5. Identifique o estilo predominante da linguagem
6. Categorize por área de conhecimento
7. Determine o tema principal
8. Avalie o nível técnico (basico, intermediario, avancado)
9. Identifique o público-alvo
10. Calcule o nível de confiança da classificação (0-1)

RESPONDA EM JSON:
{
  "bases_sugeridas": ["base1", "base2"],
  "tags": ["tag1", "tag2"],
  "idioma": "pt-BR",
  "confidencialidade": "media",
  "estilo": "tecnico",
  "categoria": "documentacao",
  "area": "tecnologia",
  "tema": "desenvolvimento",
  "nivel_tecnico": "intermediario",
  "publico_alvo": ["desenvolvedores", "analistas"],
  "confianca": 0.85,
  "suggestions": {
    "bases_alternativas": ["base3"],
    "tags_adicionais": ["tag3"],
    "estilo_alternativo": "formal"
  }
}
`
  }

  private async updateVectorMetadata(
    documentId: string,
    classification: DocumentClassification
  ): Promise<void> {
    try {
      // Atualizar metadados no Weaviate/Qdrant
      const response = await fetch(`${this.apiBaseUrl}/vectors/update-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          document_id: documentId,
          metadata: {
            classification: classification.id,
            bases: classification.bases_sugeridas,
            tags: classification.tags,
            idioma: classification.idioma,
            confidencialidade: classification.confidencialidade,
            estilo: classification.estilo,
            categoria: classification.categoria,
            area: classification.area,
            tema: classification.tema,
            nivel_tecnico: classification.nivel_tecnico,
            publico_alvo: classification.publico_alvo,
            confianca: classification.confianca
          }
        })
      })

      if (!response.ok) {
        console.warn('Erro ao atualizar metadados dos vetores')
      }
    } catch (error) {
      console.error('Erro ao atualizar vetores:', error)
    }
  }

  private async checkSecurityAlerts(classification: DocumentClassification): Promise<string[]> {
    const warnings: string[] = []

    // Verificar documentos confidenciais em bases públicas
    if (classification.confidencialidade === 'alta') {
      const publicBases = ['publica', 'geral']
      const hasPublicBase = classification.bases_sugeridas.some(base => 
        publicBases.includes(base)
      )

      if (hasPublicBase) {
        warnings.push('Documento confidencial sugerido para base pública')
      }
    }

    // Verificar tags sensíveis
    const sensitiveTags = ['senha', 'token', 'api_key', 'credential', 'secret']
    const hasSensitiveTags = classification.tags.some(tag => 
      sensitiveTags.some(sensitive => 
        tag.toLowerCase().includes(sensitive)
      )
    )

    if (hasSensitiveTags) {
      warnings.push('Documento contém tags potencialmente sensíveis')
    }

    // Enviar alertas via n8n se necessário
    if (warnings.length > 0) {
      await this.sendSecurityAlert(classification, warnings)
    }

    return warnings
  }

  private async sendSecurityAlert(
    classification: DocumentClassification,
    warnings: string[]
  ): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/alerts/security`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          classification_id: classification.id,
          document_id: classification.document_id,
          warnings,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Erro ao enviar alerta de segurança:', error)
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

  private calculateAverageProcessingTime(classifications: any[]): number {
    const validTimes = classifications
      .map(c => c.metadata?.processing_time)
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

  private getCurrentUserId(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gabi_user_id') || ''
    }
    return ''
  }
}

// =============================================================================
// INSTÂNCIA SINGLETON
// =============================================================================

export const documentClassificationService = new DocumentClassificationService() 