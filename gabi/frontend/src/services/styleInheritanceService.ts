// =============================================================================
// SERVIÇO DE HERANÇA E FALLBACK DE ESTILO - GABI
// =============================================================================

import { toast } from 'sonner'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export type StyleType = 
  | 'juridico' 
  | 'didatico' 
  | 'neutro' 
  | 'cientifico' 
  | 'comercial' 
  | 'institucional' 
  | 'conversacional' 
  | 'formulario' 
  | 'inspirado_em_base'
  | 'custom'

export interface StyleConfig {
  type: StyleType
  name?: string
  description?: string
  base_id?: string // Para estilos inferidos de base
  confidence_score?: number
  vocabulary_complexity?: 'baixo' | 'medio' | 'alto'
  tone?: 'formal' | 'neutro' | 'informal'
  structure_preference?: 'paragrafos_curtos' | 'paragrafos_medios' | 'paragrafos_longos'
  custom_prompt?: string
  created_at?: string
  updated_at?: string
}

export interface AgentStyle {
  agent_id: string
  agent_name: string
  style: StyleConfig | null
  use_base_style: boolean
  custom_prompt?: string
}

export interface BaseStyle {
  base_id: string
  base_name: string
  style: StyleConfig | null
  is_primary: boolean
  priority: number
}

export interface RequestStyle {
  style_override?: StyleConfig
  preferred_style?: StyleType
  custom_instructions?: string
}

export interface OrganizationStyle {
  default_style: StyleConfig | null
  available_styles: StyleConfig[]
  style_policies: {
    allow_custom_styles: boolean
    require_style_approval: boolean
    max_custom_styles_per_user: number
  }
}

export interface StyleInheritanceResult {
  final_style: StyleConfig
  source: 'request' | 'agent' | 'base' | 'organization' | 'fallback'
  source_details: {
    agent_id?: string
    agent_name?: string
    base_id?: string
    base_name?: string
    organization_id?: string
    request_id?: string
  }
  inheritance_chain: StyleInheritanceStep[]
  confidence_score: number
  applied_at: string
  response_id: string
}

export interface StyleInheritanceStep {
  level: 'request' | 'agent' | 'base' | 'organization' | 'fallback'
  style: StyleConfig | null
  reason: string
  timestamp: string
}

export interface StyleLog {
  response_id: string
  request_id: string
  user_id: string
  inheritance_result: StyleInheritanceResult
  generated_content_length: number
  processing_time: number
  created_at: string
}

// =============================================================================
// CONFIGURAÇÃO DA API
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('gabi_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

// =============================================================================
// ESTILO PADRÃO (FALLBACK)
// =============================================================================

const FALLBACK_STYLE: StyleConfig = {
  type: 'neutro',
  name: 'Estilo Neutro Padrão',
  description: 'Linguagem clara, impessoal e formal. Utilizado quando nenhum estilo específico está configurado.',
  confidence_score: 1.0,
  vocabulary_complexity: 'medio',
  tone: 'neutro',
  structure_preference: 'paragrafos_medios',
  custom_prompt: 'Responda de forma clara, objetiva e neutra, utilizando linguagem formal mas acessível.'
}

// =============================================================================
// SERVIÇO PRINCIPAL DE HERANÇA DE ESTILO
// =============================================================================

export class StyleInheritanceService {
  private static instance: StyleInheritanceService
  private styleCache: Map<string, StyleConfig> = new Map()
  private organizationStyles: Map<string, OrganizationStyle> = new Map()

  static getInstance(): StyleInheritanceService {
    if (!StyleInheritanceService.instance) {
      StyleInheritanceService.instance = new StyleInheritanceService()
    }
    return StyleInheritanceService.instance
  }

  // =============================================================================
  // MÉTODO PRINCIPAL DE DECISÃO DE ESTILO
  // =============================================================================

  async determineStyle(
    requestStyle: RequestStyle,
    agentStyle: AgentStyle,
    baseStyles: BaseStyle[],
    organizationId: string,
    requestId: string
  ): Promise<StyleInheritanceResult> {
    const inheritanceChain: StyleInheritanceStep[] = []
    const timestamp = new Date().toISOString()

    try {
      // 1. Verificar se há override na requisição
      if (requestStyle.style_override) {
        inheritanceChain.push({
          level: 'request',
          style: requestStyle.style_override,
          reason: 'Estilo explicitamente definido na requisição',
          timestamp
        })

        return this.createInheritanceResult(
          requestStyle.style_override,
          'request',
          { request_id: requestId },
          inheritanceChain,
          requestId
        )
      }

      // 2. Verificar estilo do agente
      if (agentStyle.style && !agentStyle.use_base_style) {
        inheritanceChain.push({
          level: 'agent',
          style: agentStyle.style,
          reason: `Estilo configurado no agente: ${agentStyle.agent_name}`,
          timestamp
        })

        return this.createInheritanceResult(
          agentStyle.style,
          'agent',
          { 
            agent_id: agentStyle.agent_id,
            agent_name: agentStyle.agent_name,
            request_id: requestId
          },
          inheritanceChain,
          requestId
        )
      }

      // 3. Verificar estilos das bases
      if (baseStyles.length > 0) {
        const primaryBase = baseStyles.find(base => base.is_primary) || baseStyles[0]
        
        if (primaryBase.style) {
          inheritanceChain.push({
            level: 'base',
            style: primaryBase.style,
            reason: `Estilo da base primária: ${primaryBase.base_name}`,
            timestamp
          })

          return this.createInheritanceResult(
            primaryBase.style,
            'base',
            { 
              base_id: primaryBase.base_id,
              base_name: primaryBase.base_name,
              request_id: requestId
            },
            inheritanceChain,
            requestId
          )
        }

        // Se nenhuma base tem estilo, registrar na chain
        inheritanceChain.push({
          level: 'base',
          style: null,
          reason: 'Nenhuma base possui estilo configurado',
          timestamp
        })
      }

      // 4. Verificar estilo padrão da organização
      const orgStyle = await this.getOrganizationStyle(organizationId)
      if (orgStyle.default_style) {
        inheritanceChain.push({
          level: 'organization',
          style: orgStyle.default_style,
          reason: 'Estilo padrão da organização',
          timestamp
        })

        return this.createInheritanceResult(
          orgStyle.default_style,
          'organization',
          { 
            organization_id: organizationId,
            request_id: requestId
          },
          inheritanceChain,
          requestId
        )
      }

      // 5. Usar estilo fallback
      inheritanceChain.push({
        level: 'fallback',
        style: FALLBACK_STYLE,
        reason: 'Nenhum estilo configurado, usando padrão neutro',
        timestamp
      })

      return this.createInheritanceResult(
        FALLBACK_STYLE,
        'fallback',
        { request_id: requestId },
        inheritanceChain,
        requestId
      )

    } catch (error) {
      console.error('Erro ao determinar estilo:', error)
      
      // Em caso de erro, usar fallback
      inheritanceChain.push({
        level: 'fallback',
        style: FALLBACK_STYLE,
        reason: 'Erro na determinação de estilo, usando padrão neutro',
        timestamp
      })

      return this.createInheritanceResult(
        FALLBACK_STYLE,
        'fallback',
        { request_id: requestId },
        inheritanceChain,
        requestId
      )
    }
  }

  // =============================================================================
  // MÉTODOS AUXILIARES
  // =============================================================================

  private createInheritanceResult(
    style: StyleConfig,
    source: 'request' | 'agent' | 'base' | 'organization' | 'fallback',
    sourceDetails: any,
    inheritanceChain: StyleInheritanceStep[],
    requestId: string
  ): StyleInheritanceResult {
    return {
      final_style: style,
      source,
      source_details: sourceDetails,
      inheritance_chain: inheritanceChain,
      confidence_score: style.confidence_score || 1.0,
      applied_at: new Date().toISOString(),
      response_id: `${requestId}_${Date.now()}`
    }
  }

  private async getOrganizationStyle(organizationId: string): Promise<OrganizationStyle> {
    // Verificar cache primeiro
    if (this.organizationStyles.has(organizationId)) {
      return this.organizationStyles.get(organizationId)!
    }

    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/styles`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const orgStyle = await response.json()
        this.organizationStyles.set(organizationId, orgStyle)
        return orgStyle
      }
    } catch (error) {
      console.error('Erro ao obter estilo da organização:', error)
    }

    // Retornar configuração padrão se não conseguir carregar
    return {
      default_style: null,
      available_styles: [],
      style_policies: {
        allow_custom_styles: true,
        require_style_approval: false,
        max_custom_styles_per_user: 5
      }
    }
  }

  // =============================================================================
  // MÉTODOS DE LOG E AUDITORIA
  // =============================================================================

  async logStyleInheritance(
    inheritanceResult: StyleInheritanceResult,
    userId: string,
    requestId: string,
    generatedContentLength: number,
    processingTime: number
  ): Promise<void> {
    try {
      const styleLog: StyleLog = {
        response_id: inheritanceResult.response_id,
        request_id: requestId,
        user_id: userId,
        inheritance_result: inheritanceResult,
        generated_content_length: generatedContentLength,
        processing_time: processingTime,
        created_at: new Date().toISOString()
      }

      await fetch(`${API_BASE_URL}/style-logs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(styleLog)
      })

    } catch (error) {
      console.error('Erro ao registrar log de estilo:', error)
      // Não falhar a requisição por erro de log
    }
  }

  async getStyleInheritanceHistory(
    userId?: string,
    baseId?: string,
    agentId?: string,
    limit: number = 50
  ): Promise<StyleLog[]> {
    try {
      const params = new URLSearchParams()
      if (userId) params.append('user_id', userId)
      if (baseId) params.append('base_id', baseId)
      if (agentId) params.append('agent_id', agentId)
      params.append('limit', limit.toString())

      const response = await fetch(`${API_BASE_URL}/style-logs?${params}`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        return await response.json()
      }

      return []
    } catch (error) {
      console.error('Erro ao obter histórico de herança de estilo:', error)
      return []
    }
  }

  // =============================================================================
  // MÉTODOS DE VALIDAÇÃO E COMPATIBILIDADE
  // =============================================================================

  validateStyleCompatibility(
    style: StyleConfig,
    targetLanguage: string,
    contentType: 'response' | 'summary' | 'document' | 'report'
  ): {
    compatible: boolean
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []

    // Verificar se o estilo tem configuração mínima
    if (!style.type) {
      issues.push('Tipo de estilo não definido')
    }

    // Verificar compatibilidade de idioma para estilos específicos
    if (style.type === 'juridico' && targetLanguage !== 'pt') {
      issues.push('Estilo jurídico otimizado para português')
      recommendations.push('Considere usar um estilo mais neutro para outros idiomas')
    }

    // Verificar compatibilidade com tipo de conteúdo
    if (contentType === 'summary' && style.structure_preference === 'paragrafos_longos') {
      recommendations.push('Estilo com parágrafos longos pode não ser ideal para resumos')
    }

    if (contentType === 'document' && style.tone === 'informal') {
      recommendations.push('Tom informal pode não ser adequado para documentos formais')
    }

    return {
      compatible: issues.length === 0,
      issues,
      recommendations
    }
  }

  // =============================================================================
  // MÉTODOS DE CACHE E PERFORMANCE
  // =============================================================================

  async preloadStyles(styleIds: string[]): Promise<void> {
    const uncachedIds = styleIds.filter(id => !this.styleCache.has(id))
    
    if (uncachedIds.length === 0) return

    try {
      const response = await fetch(`${API_BASE_URL}/styles/batch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ style_ids: uncachedIds })
      })

      if (response.ok) {
        const styles = await response.json()
        styles.forEach((style: StyleConfig) => {
          this.styleCache.set(style.name || '', style)
        })
      }
    } catch (error) {
      console.error('Erro ao pré-carregar estilos:', error)
    }
  }

  clearCache(): void {
    this.styleCache.clear()
    this.organizationStyles.clear()
  }

  // =============================================================================
  // MÉTODOS DE ESTATÍSTICAS
  // =============================================================================

  async getStyleUsageStats(
    organizationId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<{
    total_requests: number
    style_distribution: Record<string, number>
    source_distribution: Record<string, number>
    avg_confidence: number
    most_used_styles: Array<{ style: string; count: number }>
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/organizations/${organizationId}/style-stats?period=${period}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        return await response.json()
      }

      return {
        total_requests: 0,
        style_distribution: {},
        source_distribution: {},
        avg_confidence: 0,
        most_used_styles: []
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas de uso de estilo:', error)
      return {
        total_requests: 0,
        style_distribution: {},
        source_distribution: {},
        avg_confidence: 0,
        most_used_styles: []
      }
    }
  }
}

// =============================================================================
// FUNÇÕES DE UTILIDADE
// =============================================================================

export const getStyleDisplayName = (style: StyleConfig): string => {
  if (style.name) return style.name

  const styleNames: Record<StyleType, string> = {
    juridico: 'Jurídico',
    didatico: 'Didático',
    neutro: 'Neutro',
    cientifico: 'Científico',
    comercial: 'Comercial',
    institucional: 'Institucional',
    conversacional: 'Conversacional',
    formulario: 'Formulário',
    inspirado_em_base: `Inspirado em ${style.base_id || 'Base'}`,
    custom: 'Personalizado'
  }

  return styleNames[style.type] || 'Desconhecido'
}

export const getStyleDescription = (style: StyleConfig): string => {
  if (style.description) return style.description

  const descriptions: Record<StyleType, string> = {
    juridico: 'Linguagem formal e técnica, vocabulário especializado, tom neutro-institucional',
    didatico: 'Linguagem clara e educativa, explicações passo a passo, tom amigável',
    neutro: 'Linguagem equilibrada, vocabulário padrão, tom neutro',
    cientifico: 'Linguagem técnica e precisa, vocabulário especializado, tom científico',
    comercial: 'Linguagem persuasiva, vocabulário acessível, tom amigável',
    institucional: 'Linguagem formal e institucional, tom neutro-profissional',
    conversacional: 'Linguagem natural e conversacional, tom amigável e acessível',
    formulario: 'Linguagem estruturada e objetiva, formato padronizado',
    inspirado_em_base: `Estilo personalizado baseado na análise de ${style.base_id || 'uma base de conhecimento'}`,
    custom: 'Estilo personalizado definido pelo usuário'
  }

  return descriptions[style.type] || 'Descrição não disponível'
}

export const getStyleIcon = (style: StyleType): string => {
  const icons: Record<StyleType, string> = {
    juridico: '⚖️',
    didatico: '📚',
    neutro: '📄',
    cientifico: '🔬',
    comercial: '💼',
    institucional: '🏢',
    conversacional: '💬',
    formulario: '📋',
    inspirado_em_base: '🎨',
    custom: '⚙️'
  }

  return icons[style] || '📝'
}

// =============================================================================
// INSTÂNCIA GLOBAL
// =============================================================================

export const styleInheritanceService = StyleInheritanceService.getInstance() 