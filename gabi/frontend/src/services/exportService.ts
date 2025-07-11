import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface ExportContent {
  id: string
  type: 'chat' | 'task' | 'report' | 'analysis' | 'summary'
  title: string
  content: string
  agent_id: string
  agent_name: string
  style_id?: string
  style_name?: string
  knowledge_base_ids: string[]
  knowledge_base_names: string[]
  user_id: string
  user_name: string
  organization_id: string
  created_at: string
  metadata?: {
    tokens_used?: number
    processing_time?: number
    confidence_score?: number
    language?: string
    model_used?: string
  }
}

export interface ExportRequest {
  content_id: string
  content_type: 'chat' | 'task' | 'report' | 'analysis' | 'summary'
  format: 'pdf' | 'markdown' | 'json'
  options?: {
    include_header?: boolean
    include_footer?: boolean
    include_toc?: boolean
    include_metadata?: boolean
    custom_title?: string
    custom_author?: string
    language?: string
  }
}

export interface ExportResult {
  id: string
  content_id: string
  format: string
  file_url?: string
  file_name: string
  file_size: number
  download_url: string
  expires_at?: string
  created_at: string
}

export interface ExportLog {
  id: string
  user_id: string
  user_name: string
  content_id: string
  content_type: string
  format: string
  file_name: string
  file_size: number
  organization_id: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface ExportStats {
  total_exports: number
  exports_today: number
  exports_this_week: number
  exports_this_month: number
  by_format: { [key: string]: number }
  by_content_type: { [key: string]: number }
  by_user: { [key: string]: number }
  total_storage_used: number
  recent_exports: ExportLog[]
}

// =============================================================================
// SERVIÇO DE EXPORTAÇÃO
// =============================================================================

class ExportService {
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
  // EXPORTAÇÃO PRINCIPAL
  // =============================================================================

  async exportContent(request: ExportRequest): Promise<ExportResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('Erro ao exportar conteúdo')
      }

      const result = await response.json()
      
      // Log da exportação
      await this.logExport({
        content_id: request.content_id,
        content_type: request.content_type,
        format: request.format,
        file_name: result.file_name,
        file_size: result.file_size
      })

      toast.success(`Conteúdo exportado com sucesso: ${result.file_name}`)
      return result
    } catch (error) {
      console.error('Erro ao exportar conteúdo:', error)
      toast.error('Erro ao exportar conteúdo')
      throw error
    }
  }

  // =============================================================================
  // EXPORTAÇÃO POR FORMATO
  // =============================================================================

  async exportToPDF(content: ExportContent, options?: any): Promise<ExportResult> {
    const request: ExportRequest = {
      content_id: content.id,
      content_type: content.type,
      format: 'pdf',
      options: {
        include_header: true,
        include_footer: true,
        include_toc: true,
        include_metadata: true,
        custom_title: content.title,
        custom_author: content.user_name,
        language: content.metadata?.language || 'pt-BR',
        ...options
      }
    }

    return await this.exportContent(request)
  }

  async exportToMarkdown(content: ExportContent, options?: any): Promise<ExportResult> {
    const request: ExportRequest = {
      content_id: content.id,
      content_type: content.type,
      format: 'markdown',
      options: {
        include_metadata: true,
        custom_title: content.title,
        language: content.metadata?.language || 'pt-BR',
        ...options
      }
    }

    return await this.exportContent(request)
  }

  async exportToJSON(content: ExportContent, options?: any): Promise<ExportResult> {
    const request: ExportRequest = {
      content_id: content.id,
      content_type: content.type,
      format: 'json',
      options: {
        include_metadata: true,
        custom_title: content.title,
        language: content.metadata?.language || 'pt-BR',
        ...options
      }
    }

    return await this.exportContent(request)
  }

  // =============================================================================
  // EXPORTAÇÃO EM LOTE
  // =============================================================================

  async exportMultipleContents(
    contents: ExportContent[], 
    format: 'pdf' | 'markdown' | 'json',
    options?: any
  ): Promise<ExportResult[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/export/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          contents: contents.map(content => ({
            content_id: content.id,
            content_type: content.type
          })),
          format,
          options
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao exportar conteúdos em lote')
      }

      const results = await response.json()
      
      // Log das exportações
      for (const result of results) {
        await this.logExport({
          content_id: result.content_id,
          content_type: result.content_type,
          format,
          file_name: result.file_name,
          file_size: result.file_size
        })
      }

      toast.success(`${results.length} conteúdos exportados com sucesso`)
      return results
    } catch (error) {
      console.error('Erro ao exportar conteúdos em lote:', error)
      toast.error('Erro ao exportar conteúdos em lote')
      throw error
    }
  }

  // =============================================================================
  // DOWNLOAD E ARMAZENAMENTO
  // =============================================================================

  async downloadFile(downloadUrl: string, fileName: string): Promise<void> {
    try {
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error)
      toast.error('Erro ao baixar arquivo')
      throw error
    }
  }

  async uploadToStorage(file: File, path: string): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from('exports')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: urlData } = this.supabase.storage
        .from('exports')
        .getPublicUrl(path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      throw error
    }
  }

  async deleteFromStorage(path: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from('exports')
        .remove([path])

      if (error) throw error
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      throw error
    }
  }

  // =============================================================================
  // LOGS E AUDITORIA
  // =============================================================================

  async logExport(logData: {
    content_id: string
    content_type: string
    format: string
    file_name: string
    file_size: number
  }): Promise<void> {
    try {
      const log: Omit<ExportLog, 'id' | 'created_at'> = {
        user_id: this.getCurrentUserId(),
        user_name: this.getCurrentUserName(),
        organization_id: this.getCurrentOrgId(),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        ...logData
      }

      const { error } = await this.supabase
        .from('export_logs')
        .insert(log)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao registrar log de exportação:', error)
    }
  }

  async getExportLogs(filter?: {
    user_id?: string
    content_type?: string
    format?: string
    date_range?: { from: Date; to: Date }
  }): Promise<ExportLog[]> {
    try {
      let query = this.supabase
        .from('export_logs')
        .select('*')
        .eq('organization_id', this.getCurrentOrgId())
        .order('created_at', { ascending: false })

      if (filter?.user_id) {
        query = query.eq('user_id', filter.user_id)
      }

      if (filter?.content_type) {
        query = query.eq('content_type', filter.content_type)
      }

      if (filter?.format) {
        query = query.eq('format', filter.format)
      }

      if (filter?.date_range) {
        query = query
          .gte('created_at', filter.date_range.from.toISOString())
          .lte('created_at', filter.date_range.to.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs de exportação:', error)
      return []
    }
  }

  // =============================================================================
  // ESTATÍSTICAS
  // =============================================================================

  async getExportStats(): Promise<ExportStats> {
    try {
      const logs = await this.getExportLogs()
      
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getFullYear(), now.getMonth() - 1, now.getDate())

      const stats: ExportStats = {
        total_exports: logs.length,
        exports_today: logs.filter(log => new Date(log.created_at) >= today).length,
        exports_this_week: logs.filter(log => new Date(log.created_at) >= weekAgo).length,
        exports_this_month: logs.filter(log => new Date(log.created_at) >= monthAgo).length,
        by_format: this.aggregateByField(logs, 'format'),
        by_content_type: this.aggregateByField(logs, 'content_type'),
        by_user: this.aggregateByField(logs, 'user_id'),
        total_storage_used: logs.reduce((sum, log) => sum + log.file_size, 0),
        recent_exports: logs.slice(0, 10)
      }

      return stats
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return {
        total_exports: 0,
        exports_today: 0,
        exports_this_week: 0,
        exports_this_month: 0,
        by_format: {},
        by_content_type: {},
        by_user: {},
        total_storage_used: 0,
        recent_exports: []
      }
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  private aggregateByField(logs: ExportLog[], field: keyof ExportLog): { [key: string]: number } {
    const counts: { [key: string]: number } = {}
    
    logs.forEach(log => {
      const value = log[field] as string
      if (value) {
        counts[value] = (counts[value] || 0) + 1
      }
    })

    return counts
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      return 'unknown'
    }
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

  private getCurrentUserName(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gabi_user_name') || 'Usuário'
    }
    return 'Usuário'
  }

  private getCurrentOrgId(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gabi_org_id') || ''
    }
    return ''
  }

  // =============================================================================
  // MÉTODOS PÚBLICOS PARA FORMATOS
  // =============================================================================

  getFormatIcon(format: string): string {
    const icons = {
      pdf: '📄',
      markdown: '📝',
      json: '🔢'
    }
    return icons[format as keyof typeof icons] || '📄'
  }

  getFormatName(format: string): string {
    const names = {
      pdf: 'PDF',
      markdown: 'Markdown',
      json: 'JSON'
    }
    return names[format as keyof typeof names] || 'PDF'
  }

  getFormatDescription(format: string): string {
    const descriptions = {
      pdf: 'Documento formatado para impressão e distribuição',
      markdown: 'Texto estruturado para edição técnica',
      json: 'Dados estruturados para integração'
    }
    return descriptions[format as keyof typeof descriptions] || ''
  }

  getContentTypeIcon(type: string): string {
    const icons = {
      chat: '💬',
      task: '⚡',
      report: '📊',
      analysis: '🔍',
      summary: '📋'
    }
    return icons[type as keyof typeof icons] || '📄'
  }

  getContentTypeName(type: string): string {
    const names = {
      chat: 'Conversa',
      task: 'Tarefa',
      report: 'Relatório',
      analysis: 'Análise',
      summary: 'Resumo'
    }
    return names[type as keyof typeof names] || 'Conteúdo'
  }
}

// =============================================================================
// INSTÂNCIA SINGLETON
// =============================================================================

export const exportService = new ExportService() 