import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface LanguageConfig {
  code: string
  name: string
  native_name: string
  flag: string
  direction: 'ltr' | 'rtl'
  is_default: boolean
  is_enabled: boolean
}

export interface DocumentTranslation {
  id: string
  document_id: string
  source_language: string
  target_language: string
  original_content: string
  translated_content: string
  translation_hash: string
  translation_quality: number
  translation_model: string
  translation_time: number
  translated_at: string
  is_manual: boolean
  metadata: {
    tokens_used?: number
    cost?: number
    provider?: string
    confidence?: number
  }
}

export interface TranslationRequest {
  document_id: string
  content: string
  source_language: string
  target_language: string
  force_retranslation?: boolean
  is_manual?: boolean
}

export interface TranslationResponse {
  success: boolean
  translation: DocumentTranslation
  warnings?: string[]
  processing_time: number
}

export interface LanguageDetection {
  detected_language: string
  confidence: number
  alternatives: Array<{
    language: string
    confidence: number
  }>
}

export interface MultilingualStats {
  total_documents: number
  translated_documents: number
  supported_languages: number
  avg_translation_time: number
  by_language: { [key: string]: number }
  by_quality: { [key: string]: number }
  recent_translations: number
  translation_errors: number
}

export interface UserLanguagePreference {
  user_id: string
  primary_language: string
  secondary_languages: string[]
  interface_language: string
  auto_translate: boolean
  translation_quality: 'fast' | 'balanced' | 'high'
  updated_at: string
}

// =============================================================================
// CONFIGURAÇÃO DE IDIOMAS SUPORTADOS
// =============================================================================

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    native_name: 'Português (Brasil)',
    flag: '🇧🇷',
    direction: 'ltr',
    is_default: true,
    is_enabled: true
  },
  {
    code: 'en',
    name: 'English',
    native_name: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    is_default: false,
    is_enabled: true
  },
  {
    code: 'es',
    name: 'Spanish',
    native_name: 'Español',
    flag: '🇪🇸',
    direction: 'ltr',
    is_default: false,
    is_enabled: true
  },
  {
    code: 'fr',
    name: 'French',
    native_name: 'Français',
    flag: '🇫🇷',
    direction: 'ltr',
    is_default: false,
    is_enabled: true
  },
  {
    code: 'de',
    name: 'German',
    native_name: 'Deutsch',
    flag: '🇩🇪',
    direction: 'ltr',
    is_default: false,
    is_enabled: true
  },
  {
    code: 'it',
    name: 'Italian',
    native_name: 'Italiano',
    flag: '🇮🇹',
    direction: 'ltr',
    is_default: false,
    is_enabled: true
  },
  {
    code: 'ja',
    name: 'Japanese',
    native_name: '日本語',
    flag: '🇯🇵',
    direction: 'ltr',
    is_default: false,
    is_enabled: true
  },
  {
    code: 'ko',
    name: 'Korean',
    native_name: '한국어',
    flag: '🇰🇷',
    direction: 'ltr',
    is_default: false,
    is_enabled: true
  },
  {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    native_name: '中文 (简体)',
    flag: '🇨🇳',
    direction: 'ltr',
    is_default: false,
    is_enabled: true
  },
  {
    code: 'ar',
    name: 'Arabic',
    native_name: 'العربية',
    flag: '🇸🇦',
    direction: 'rtl',
    is_default: false,
    is_enabled: true
  }
]

// =============================================================================
// SERVIÇO MULTILÍNGUE
// =============================================================================

class MultilingualService {
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
  // DETECÇÃO DE IDIOMA
  // =============================================================================

  async detectLanguage(content: string): Promise<LanguageDetection> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/multilingual/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          content: content.substring(0, 1000), // Limitar para performance
          providers: ['openai', 'langdetect', 'fasttext']
        })
      })

      if (!response.ok) {
        throw new Error('Erro na detecção de idioma')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Erro na detecção de idioma:', error)
      // Fallback para português
      return {
        detected_language: 'pt-BR',
        confidence: 0.5,
        alternatives: []
      }
    }
  }

  // =============================================================================
  // TRADUÇÃO AUTOMÁTICA
  // =============================================================================

  async translateDocument(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const startTime = Date.now()

      // Verificar se já existe tradução
      if (!request.force_retranslation) {
        const existing = await this.getDocumentTranslation(
          request.document_id,
          request.target_language
        )
        if (existing) {
          return {
            success: true,
            translation: existing,
            processing_time: 0
          }
        }
      }

      // Gerar hash do conteúdo para evitar duplicatas
      const contentHash = await this.generateContentHash(request.content)

      // Verificar se já existe tradução com mesmo hash
      const existingByHash = await this.getTranslationByHash(contentHash, request.target_language)
      if (existingByHash && !request.force_retranslation) {
        return {
          success: true,
          translation: existingByHash,
          processing_time: Date.now() - startTime
        }
      }

      // Preparar prompt para tradução
      const translationPrompt = this.buildTranslationPrompt(
        request.content,
        request.source_language,
        request.target_language
      )

      // Chamar API de tradução
      const response = await fetch(`${this.apiBaseUrl}/multilingual/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          content: request.content,
          source_language: request.source_language,
          target_language: request.target_language,
          prompt: translationPrompt,
          quality: await this.getUserTranslationQuality()
        })
      })

      if (!response.ok) {
        throw new Error('Erro na tradução automática')
      }

      const translationResult = await response.json()

      // Criar objeto de tradução
      const translation: DocumentTranslation = {
        id: `trans_${Date.now()}`,
        document_id: request.document_id,
        source_language: request.source_language,
        target_language: request.target_language,
        original_content: request.content,
        translated_content: translationResult.translated_content,
        translation_hash: contentHash,
        translation_quality: translationResult.quality || 0.8,
        translation_model: translationResult.model || 'gpt-4',
        translation_time: Date.now() - startTime,
        translated_at: new Date().toISOString(),
        is_manual: request.is_manual || false,
        metadata: {
          tokens_used: translationResult.tokens_used,
          cost: translationResult.cost,
          provider: translationResult.provider,
          confidence: translationResult.confidence
        }
      }

      // Salvar tradução no banco
      await this.saveTranslation(translation)

      // Atualizar documento principal
      await this.updateDocumentWithTranslation(request.document_id, translation)

      // Atualizar vetores no Weaviate
      await this.updateVectorTranslation(request.document_id, translation)

      const processingTime = Date.now() - startTime

      return {
        success: true,
        translation,
        warnings: translationResult.warnings || [],
        processing_time: processingTime
      }

    } catch (error) {
      console.error('Erro na tradução:', error)
      throw new Error('Falha na tradução do documento')
    }
  }

  // =============================================================================
  // GESTÃO DE TRADUÇÕES
  // =============================================================================

  async getDocumentTranslation(
    documentId: string,
    targetLanguage: string
  ): Promise<DocumentTranslation | null> {
    try {
      const { data, error } = await this.supabase
        .from('document_translations')
        .select('*')
        .eq('document_id', documentId)
        .eq('target_language', targetLanguage)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar tradução:', error)
      return null
    }
  }

  async getTranslationByHash(
    contentHash: string,
    targetLanguage: string
  ): Promise<DocumentTranslation | null> {
    try {
      const { data, error } = await this.supabase
        .from('document_translations')
        .select('*')
        .eq('translation_hash', contentHash)
        .eq('target_language', targetLanguage)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar tradução por hash:', error)
      return null
    }
  }

  async saveTranslation(translation: DocumentTranslation): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('document_translations')
        .upsert(translation, { 
          onConflict: 'document_id,target_language' 
        })

      if (error) throw error

    } catch (error) {
      console.error('Erro ao salvar tradução:', error)
      throw new Error('Falha ao salvar tradução')
    }
  }

  async getTranslations(documentId: string): Promise<DocumentTranslation[]> {
    try {
      const { data, error } = await this.supabase
        .from('document_translations')
        .select('*')
        .eq('document_id', documentId)
        .order('translated_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar traduções:', error)
      return []
    }
  }

  // =============================================================================
  // PREFERÊNCIAS DE IDIOMA DO USUÁRIO
  // =============================================================================

  async getUserLanguagePreference(userId: string): Promise<UserLanguagePreference | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_language_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar preferências de idioma:', error)
      return null
    }
  }

  async updateUserLanguagePreference(
    userId: string,
    preferences: Partial<UserLanguagePreference>
  ): Promise<UserLanguagePreference> {
    try {
      const { data, error } = await this.supabase
        .from('user_language_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar preferências de idioma:', error)
      throw new Error('Falha ao atualizar preferências')
    }
  }

  async getDefaultLanguagePreference(): Promise<UserLanguagePreference> {
    return {
      user_id: '',
      primary_language: 'pt-BR',
      secondary_languages: ['en'],
      interface_language: 'pt-BR',
      auto_translate: true,
      translation_quality: 'balanced',
      updated_at: new Date().toISOString()
    }
  }

  // =============================================================================
  // ESTATÍSTICAS E ANALYTICS
  // =============================================================================

  async getMultilingualStats(organizationId: string): Promise<MultilingualStats> {
    try {
      const { data: translations, error } = await this.supabase
        .from('document_translations')
        .select('*')
        .eq('organization_id', organizationId)

      if (error) throw error

      const stats: MultilingualStats = {
        total_documents: translations.length,
        translated_documents: translations.filter(t => t.translation_quality > 0.7).length,
        supported_languages: SUPPORTED_LANGUAGES.filter(l => l.is_enabled).length,
        avg_translation_time: this.calculateAverageTranslationTime(translations),
        by_language: this.aggregateByField(translations, 'target_language'),
        by_quality: this.aggregateByQuality(translations),
        recent_translations: translations.filter(t => {
          const date = new Date(t.translated_at)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return date > weekAgo
        }).length,
        translation_errors: translations.filter(t => t.translation_quality < 0.5).length
      }

      return stats
    } catch (error) {
      console.error('Erro ao buscar estatísticas multilíngue:', error)
      return {
        total_documents: 0,
        translated_documents: 0,
        supported_languages: SUPPORTED_LANGUAGES.length,
        avg_translation_time: 0,
        by_language: {},
        by_quality: {},
        recent_translations: 0,
        translation_errors: 0
      }
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  private buildTranslationPrompt(
    content: string,
    sourceLanguage: string,
    targetLanguage: string
  ): string {
    const sourceLang = this.getLanguageName(sourceLanguage)
    const targetLang = this.getLanguageName(targetLanguage)

    return `
Traduza o seguinte conteúdo do ${sourceLang} para ${targetLang}.

CONTEÚDO ORIGINAL:
${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}

INSTRUÇÕES:
1. Mantenha o tom e estilo do texto original
2. Preserve formatação, números e nomes próprios
3. Traduza de forma natural e fluente
4. Mantenha a precisão técnica e terminologia específica
5. Se houver termos técnicos, use a tradução mais apropriada para o contexto

RESPONDA APENAS A TRADUÇÃO:
`
  }

  private async generateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private getLanguageName(languageCode: string): string {
    const language = SUPPORTED_LANGUAGES.find(l => l.code === languageCode)
    return language ? language.native_name : languageCode
  }

  private async getUserTranslationQuality(): Promise<string> {
    try {
      const userId = this.getCurrentUserId()
      if (!userId) return 'balanced'

      const preferences = await this.getUserLanguagePreference(userId)
      return preferences?.translation_quality || 'balanced'
    } catch (error) {
      return 'balanced'
    }
  }

  private async updateDocumentWithTranslation(
    documentId: string,
    translation: DocumentTranslation
  ): Promise<void> {
    try {
      const columnName = `translated_content_${translation.target_language.replace('-', '_')}`
      
      await this.supabase
        .from('documents')
        .update({
          [columnName]: translation.translated_content,
          lang_original: translation.source_language,
          lang_translated: this.supabase.sql`array_append(lang_translated, ${translation.target_language})`,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)

    } catch (error) {
      console.error('Erro ao atualizar documento com tradução:', error)
    }
  }

  private async updateVectorTranslation(
    documentId: string,
    translation: DocumentTranslation
  ): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/vectors/update-translation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          document_id: documentId,
          translation: {
            target_language: translation.target_language,
            translated_content: translation.translated_content,
            translation_quality: translation.translation_quality
          }
        })
      })

      if (!response.ok) {
        console.warn('Erro ao atualizar tradução dos vetores')
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

  private aggregateByQuality(translations: any[]): { [key: string]: number } {
    const counts: { [key: string]: number } = {
      'excellent': 0,
      'good': 0,
      'fair': 0,
      'poor': 0
    }
    
    translations.forEach(translation => {
      const quality = translation.translation_quality
      if (quality >= 0.9) counts.excellent++
      else if (quality >= 0.7) counts.good++
      else if (quality >= 0.5) counts.fair++
      else counts.poor++
    })

    return counts
  }

  private calculateAverageTranslationTime(translations: any[]): number {
    const validTimes = translations
      .map(t => t.translation_time)
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

  // =============================================================================
  // MÉTODOS PÚBLICOS PARA IDIOMAS
  // =============================================================================

  getSupportedLanguages(): LanguageConfig[] {
    return SUPPORTED_LANGUAGES.filter(lang => lang.is_enabled)
  }

  getLanguageByCode(code: string): LanguageConfig | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code)
  }

  getDefaultLanguage(): LanguageConfig {
    return SUPPORTED_LANGUAGES.find(lang => lang.is_default) || SUPPORTED_LANGUAGES[0]
  }

  isLanguageSupported(code: string): boolean {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === code && lang.is_enabled)
  }
}

// =============================================================================
// INSTÂNCIA SINGLETON
// =============================================================================

export const multilingualService = new MultilingualService() 