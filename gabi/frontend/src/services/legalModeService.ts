import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface LegalDocument {
  id: string
  organization_id: string
  user_id: string
  title: string
  document_type: LegalDocumentType
  content: LegalDocumentContent
  metadata: LegalDocumentMetadata
  formatting: LegalFormatting
  created_at: string
  updated_at: string
}

export type LegalDocumentType = 
  | 'petition' | 'legal_opinion' | 'contract' | 'motion' | 'appeal'
  | 'response' | 'notification' | 'agreement' | 'power_of_attorney'

export interface LegalDocumentContent {
  // Estrutura de petição
  header?: LegalHeader
  facts?: string
  legal_basis?: string
  requests?: string[]
  closing?: string
  
  // Conteúdo geral
  raw_content: string
  formatted_content: string
  
  // Referências jurídicas
  jurisprudence?: LegalReference[]
  legislation?: LegalReference[]
  doctrine?: LegalReference[]
}

export interface LegalHeader {
  court?: string
  case_number?: string
  plaintiff?: string
  defendant?: string
  attorney?: string
  oab_number?: string
  office_name?: string
  office_address?: string
  office_phone?: string
  office_email?: string
}

export interface LegalReference {
  type: 'jurisprudence' | 'legislation' | 'doctrine'
  citation: string
  description: string
  relevance_score: number
  source?: string
}

export interface LegalDocumentMetadata {
  jurisdiction: string
  court_type: string
  case_type: string
  urgency_level: 'normal' | 'urgent' | 'very_urgent'
  confidentiality_level: 'public' | 'confidential' | 'restricted'
  tags: string[]
  related_cases?: string[]
  estimated_pages: number
  complexity_level: 'low' | 'medium' | 'high'
}

export interface LegalFormatting {
  template: LegalTemplate
  style: LegalStyle
  header_footer: HeaderFooterConfig
  watermark?: string
  page_numbering: boolean
  line_spacing: number
  font_family: string
  font_size: number
  margins: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

export interface LegalTemplate {
  id: string
  name: string
  type: LegalDocumentType
  jurisdiction: string
  structure: LegalTemplateStructure
  variables: LegalTemplateVariable[]
}

export interface LegalTemplateStructure {
  sections: LegalSection[]
  required_sections: string[]
  optional_sections: string[]
}

export interface LegalSection {
  id: string
  name: string
  type: 'header' | 'content' | 'list' | 'table' | 'signature'
  required: boolean
  placeholder: string
  validation_rules?: string[]
}

export interface LegalTemplateVariable {
  name: string
  type: 'text' | 'date' | 'number' | 'select' | 'multiselect'
  required: boolean
  default_value?: any
  options?: string[]
  validation?: string
}

export interface LegalStyle {
  id: string
  name: string
  description: string
  formal_level: 'formal' | 'semi_formal' | 'technical'
  language_style: 'traditional' | 'modern' | 'technical'
  citation_format: 'abnt' | 'bluebook' | 'custom'
  paragraph_spacing: number
  indentation: number
  bold_headers: boolean
  italic_citations: boolean
}

export interface HeaderFooterConfig {
  enabled: boolean
  header_content?: string
  footer_content?: string
  include_page_numbers: boolean
  include_date: boolean
  include_office_info: boolean
}

export interface LegalModeConfig {
  enabled: boolean
  auto_detect: boolean
  default_template?: string
  default_style?: string
  auto_format: boolean
  auto_suggest: boolean
  export_formats: ('docx' | 'pdf')[]
  watermark_enabled: boolean
  default_watermark?: string
}

export interface LegalSuggestion {
  id: string
  type: 'clause' | 'citation' | 'argument' | 'procedure'
  title: string
  content: string
  relevance_score: number
  source?: string
  tags: string[]
}

export interface LegalExportOptions {
  format: 'docx' | 'pdf'
  include_header_footer: boolean
  include_watermark: boolean
  include_page_numbers: boolean
  filename?: string
  metadata?: {
    author?: string
    subject?: string
    keywords?: string[]
  }
}

// =============================================================================
// SERVIÇO PRINCIPAL
// =============================================================================

class LegalModeService {
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
  // CONFIGURAÇÃO DO MODO JURÍDICO
  // =============================================================================

  async getLegalModeConfig(): Promise<LegalModeConfig> {
    try {
      const { data, error } = await this.supabase
        .from('legal_mode_configs')
        .select('*')
        .eq('organization_id', this.getCurrentOrgId())
        .single()

      if (error) throw error
      return data || this.getDefaultConfig()
    } catch (error) {
      console.error('Erro ao buscar configuração do modo jurídico:', error)
      return this.getDefaultConfig()
    }
  }

  async updateLegalModeConfig(config: Partial<LegalModeConfig>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('legal_mode_configs')
        .upsert({
          organization_id: this.getCurrentOrgId(),
          ...config,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Erro ao atualizar configuração do modo jurídico:', error)
      throw error
    }
  }

  private getDefaultConfig(): LegalModeConfig {
    return {
      enabled: false,
      auto_detect: true,
      auto_format: true,
      auto_suggest: true,
      export_formats: ['docx', 'pdf'],
      watermark_enabled: false
    }
  }

  // =============================================================================
  // TEMPLATES JURÍDICOS
  // =============================================================================

  async getLegalTemplates(documentType?: LegalDocumentType): Promise<LegalTemplate[]> {
    try {
      let query = this.supabase
        .from('legal_templates')
        .select('*')
        .eq('organization_id', this.getCurrentOrgId())

      if (documentType) {
        query = query.eq('type', documentType)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar templates jurídicos:', error)
      return []
    }
  }

  async getLegalTemplate(templateId: string): Promise<LegalTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('legal_templates')
        .select('*')
        .eq('id', templateId)
        .eq('organization_id', this.getCurrentOrgId())
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar template jurídico:', error)
      return null
    }
  }

  async createLegalTemplate(template: Omit<LegalTemplate, 'id'>): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('legal_templates')
        .insert({
          ...template,
          organization_id: this.getCurrentOrgId(),
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Erro ao criar template jurídico:', error)
      throw error
    }
  }

  // =============================================================================
  // ESTILOS JURÍDICOS
  // =============================================================================

  async getLegalStyles(): Promise<LegalStyle[]> {
    try {
      const { data, error } = await this.supabase
        .from('legal_styles')
        .select('*')
        .eq('organization_id', this.getCurrentOrgId())

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar estilos jurídicos:', error)
      return []
    }
  }

  async getLegalStyle(styleId: string): Promise<LegalStyle | null> {
    try {
      const { data, error } = await this.supabase
        .from('legal_styles')
        .select('*')
        .eq('id', styleId)
        .eq('organization_id', this.getCurrentOrgId())
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar estilo jurídico:', error)
      return null
    }
  }

  // =============================================================================
  // FORMATAÇÃO JURÍDICA
  // =============================================================================

  async formatLegalDocument(
    content: string,
    templateId: string,
    styleId: string,
    variables: { [key: string]: any } = {}
  ): Promise<LegalDocumentContent> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/legal/format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          content,
          template_id: templateId,
          style_id: styleId,
          variables,
          organization_id: this.getCurrentOrgId()
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao formatar documento jurídico')
      }

      const result = await response.json()
      return result.formatted_content
    } catch (error) {
      console.error('Erro ao formatar documento jurídico:', error)
      throw error
    }
  }

  async applyLegalFormatting(
    document: LegalDocument,
    templateId: string,
    styleId: string
  ): Promise<LegalDocument> {
    try {
      const formattedContent = await this.formatLegalDocument(
        document.content.raw_content,
        templateId,
        styleId
      )

      const updatedDocument: LegalDocument = {
        ...document,
        content: {
          ...document.content,
          formatted_content: formattedContent.formatted_content,
          facts: formattedContent.facts,
          legal_basis: formattedContent.legal_basis,
          requests: formattedContent.requests,
          closing: formattedContent.closing,
          jurisprudence: formattedContent.jurisprudence,
          legislation: formattedContent.legislation,
          doctrine: formattedContent.doctrine
        },
        formatting: {
          ...document.formatting,
          template: await this.getLegalTemplate(templateId) || document.formatting.template,
          style: await this.getLegalStyle(styleId) || document.formatting.style
        },
        updated_at: new Date().toISOString()
      }

      return updatedDocument
    } catch (error) {
      console.error('Erro ao aplicar formatação jurídica:', error)
      throw error
    }
  }

  // =============================================================================
  // SUGESTÕES JURÍDICAS
  // =============================================================================

  async getLegalSuggestions(
    content: string,
    documentType: LegalDocumentType,
    context?: string
  ): Promise<LegalSuggestion[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/legal/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          content,
          document_type: documentType,
          context,
          organization_id: this.getCurrentOrgId()
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar sugestões jurídicas')
      }

      const result = await response.json()
      return result.suggestions
    } catch (error) {
      console.error('Erro ao buscar sugestões jurídicas:', error)
      return []
    }
  }

  async getJurisprudenceSuggestions(
    topic: string,
    jurisdiction: string
  ): Promise<LegalReference[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/legal/jurisprudence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          topic,
          jurisdiction,
          organization_id: this.getCurrentOrgId()
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar jurisprudência')
      }

      const result = await response.json()
      return result.references
    } catch (error) {
      console.error('Erro ao buscar jurisprudência:', error)
      return []
    }
  }

  // =============================================================================
  // DOCUMENTOS JURÍDICOS
  // =============================================================================

  async createLegalDocument(
    document: Omit<LegalDocument, 'id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('legal_documents')
        .insert({
          ...document,
          organization_id: this.getCurrentOrgId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Erro ao criar documento jurídico:', error)
      throw error
    }
  }

  async getLegalDocuments(filter?: {
    document_type?: LegalDocumentType
    user_id?: string
    date_range?: { from: Date; to: Date }
  }): Promise<LegalDocument[]> {
    try {
      let query = this.supabase
        .from('legal_documents')
        .select('*')
        .eq('organization_id', this.getCurrentOrgId())
        .order('created_at', { ascending: false })

      if (filter) {
        if (filter.document_type) {
          query = query.eq('document_type', filter.document_type)
        }
        if (filter.user_id) {
          query = query.eq('user_id', filter.user_id)
        }
        if (filter.date_range) {
          query = query
            .gte('created_at', filter.date_range.from.toISOString())
            .lte('created_at', filter.date_range.to.toISOString())
        }
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar documentos jurídicos:', error)
      return []
    }
  }

  async getLegalDocument(documentId: string): Promise<LegalDocument | null> {
    try {
      const { data, error } = await this.supabase
        .from('legal_documents')
        .select('*')
        .eq('id', documentId)
        .eq('organization_id', this.getCurrentOrgId())
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar documento jurídico:', error)
      return null
    }
  }

  async updateLegalDocument(
    documentId: string,
    updates: Partial<LegalDocument>
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('legal_documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('organization_id', this.getCurrentOrgId())

      if (error) throw error
    } catch (error) {
      console.error('Erro ao atualizar documento jurídico:', error)
      throw error
    }
  }

  async deleteLegalDocument(documentId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('legal_documents')
        .delete()
        .eq('id', documentId)
        .eq('organization_id', this.getCurrentOrgId())

      if (error) throw error
    } catch (error) {
      console.error('Erro ao excluir documento jurídico:', error)
      throw error
    }
  }

  // =============================================================================
  // EXPORTAÇÃO
  // =============================================================================

  async exportLegalDocument(
    documentId: string,
    options: LegalExportOptions
  ): Promise<Blob> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/legal/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          document_id: documentId,
          options,
          organization_id: this.getCurrentOrgId()
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao exportar documento jurídico')
      }

      return await response.blob()
    } catch (error) {
      console.error('Erro ao exportar documento jurídico:', error)
      throw error
    }
  }

  async downloadLegalDocument(
    documentId: string,
    options: LegalExportOptions
  ): Promise<void> {
    try {
      const blob = await this.exportLegalDocument(documentId, options)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = options.filename || `documento_juridico_${documentId}.${options.format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar documento jurídico:', error)
      throw error
    }
  }

  // =============================================================================
  // VALIDAÇÃO JURÍDICA
  // =============================================================================

  async validateLegalDocument(
    document: LegalDocument
  ): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
    suggestions: string[]
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/legal/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          document,
          organization_id: this.getCurrentOrgId()
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao validar documento jurídico')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Erro ao validar documento jurídico:', error)
      return {
        valid: false,
        errors: ['Erro ao validar documento'],
        warnings: [],
        suggestions: []
      }
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  getDocumentTypeName(type: LegalDocumentType): string {
    const names = {
      petition: 'Petição',
      legal_opinion: 'Parecer Jurídico',
      contract: 'Contrato',
      motion: 'Recurso',
      appeal: 'Apelação',
      response: 'Contestação',
      notification: 'Notificação',
      agreement: 'Acordo',
      power_of_attorney: 'Procuração'
    }
    return names[type] || 'Documento Jurídico'
  }

  getDocumentTypeIcon(type: LegalDocumentType): string {
    const icons = {
      petition: '📄',
      legal_opinion: '⚖️',
      contract: '📋',
      motion: '📤',
      appeal: '📨',
      response: '📝',
      notification: '📢',
      agreement: '🤝',
      power_of_attorney: '✍️'
    }
    return icons[type] || '📄'
  }

  getUrgencyColor(urgency: string): string {
    const colors = {
      normal: 'bg-green-100 text-green-800 border-green-200',
      urgent: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      very_urgent: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[urgency as keyof typeof colors] || colors.normal
  }

  getConfidentialityColor(level: string): string {
    const colors = {
      public: 'bg-green-100 text-green-800 border-green-200',
      confidential: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      restricted: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[level as keyof typeof colors] || colors.public
  }

  private getAuthToken(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gabi_token') || ''
    }
    return ''
  }

  private getCurrentOrgId(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gabi_org_id') || ''
    }
    return ''
  }
}

// =============================================================================
// INSTÂNCIA SINGLETON
// =============================================================================

export const legalModeService = new LegalModeService() 