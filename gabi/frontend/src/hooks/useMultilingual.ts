import { useState, useEffect, useCallback, useContext, createContext } from 'react'
import { toast } from 'sonner'
import { 
  multilingualService, 
  DocumentTranslation, 
  TranslationRequest,
  TranslationResponse,
  LanguageDetection,
  MultilingualStats,
  UserLanguagePreference,
  LanguageConfig,
  SUPPORTED_LANGUAGES
} from '@/services/multilingualService'

// =============================================================================
// CONTEXTO MULTILÍNGUE
// =============================================================================

interface MultilingualContextType {
  currentLanguage: LanguageConfig
  userPreferences: UserLanguagePreference | null
  setCurrentLanguage: (language: LanguageConfig) => void
  updateUserPreferences: (preferences: Partial<UserLanguagePreference>) => Promise<void>
  translateDocument: (request: TranslationRequest) => Promise<TranslationResponse>
  detectLanguage: (content: string) => Promise<LanguageDetection>
  getSupportedLanguages: () => LanguageConfig[]
  isTranslationAvailable: (documentId: string, language: string) => Promise<boolean>
}

const MultilingualContext = createContext<MultilingualContextType | null>(null)

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface UseMultilingualOptions {
  userId: string
  organizationId: string
  autoLoadPreferences?: boolean
}

interface MultilingualState {
  currentLanguage: LanguageConfig
  userPreferences: UserLanguagePreference | null
  translations: DocumentTranslation[]
  stats: MultilingualStats | null
  loading: boolean
  loadingPreferences: boolean
  loadingStats: boolean
  error: string | null
}

interface MultilingualActions {
  // Gestão de idioma
  setCurrentLanguage: (language: LanguageConfig) => void
  updateUserPreferences: (preferences: Partial<UserLanguagePreference>) => Promise<void>
  loadUserPreferences: () => Promise<void>
  
  // Tradução
  translateDocument: (request: TranslationRequest) => Promise<TranslationResponse>
  detectLanguage: (content: string) => Promise<LanguageDetection>
  getDocumentTranslation: (documentId: string, targetLanguage: string) => Promise<DocumentTranslation | null>
  getTranslations: (documentId: string) => Promise<DocumentTranslation[]>
  
  // Utilitários
  getSupportedLanguages: () => LanguageConfig[]
  isLanguageSupported: (code: string) => boolean
  isTranslationAvailable: (documentId: string, language: string) => Promise<boolean>
  
  // Estatísticas
  loadStats: () => Promise<void>
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useMultilingual(options: UseMultilingualOptions): MultilingualState & MultilingualActions {
  const {
    userId,
    organizationId,
    autoLoadPreferences = true
  } = options

  // =============================================================================
  // ESTADO
  // =============================================================================

  const [state, setState] = useState<MultilingualState>({
    currentLanguage: multilingualService.getDefaultLanguage(),
    userPreferences: null,
    translations: [],
    stats: null,
    loading: false,
    loadingPreferences: false,
    loadingStats: false,
    error: null
  })

  // =============================================================================
  // INICIALIZAÇÃO
  // =============================================================================

  useEffect(() => {
    if (autoLoadPreferences && userId) {
      loadUserPreferences()
    }
  }, [userId, autoLoadPreferences])

  useEffect(() => {
    if (organizationId) {
      loadStats()
    }
  }, [organizationId])

  // =============================================================================
  // FUNÇÕES PRINCIPAIS
  // =============================================================================

  const loadUserPreferences = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loadingPreferences: true, error: null }))

      const preferences = await multilingualService.getUserLanguagePreference(userId)
      
      if (preferences) {
        const language = multilingualService.getLanguageByCode(preferences.interface_language) || 
                        multilingualService.getDefaultLanguage()
        
        setState(prev => ({
          ...prev,
          currentLanguage: language,
          userPreferences: preferences,
          loadingPreferences: false
        }))
      } else {
        // Criar preferências padrão
        const defaultPreferences = await multilingualService.getDefaultLanguagePreference()
        const updatedPreferences = await multilingualService.updateUserLanguagePreference(
          userId,
          { ...defaultPreferences, user_id: userId }
        )
        
        setState(prev => ({
          ...prev,
          currentLanguage: multilingualService.getDefaultLanguage(),
          userPreferences: updatedPreferences,
          loadingPreferences: false
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error)
      setState(prev => ({
        ...prev,
        loadingPreferences: false,
        error: 'Erro ao carregar preferências de idioma'
      }))
    }
  }, [userId])

  const setCurrentLanguage = useCallback((language: LanguageConfig) => {
    setState(prev => ({ ...prev, currentLanguage: language }))
    
    // Atualizar preferências do usuário
    if (state.userPreferences) {
      updateUserPreferences({ interface_language: language.code })
    }
  }, [state.userPreferences])

  const updateUserPreferences = useCallback(async (preferences: Partial<UserLanguagePreference>) => {
    try {
      const updatedPreferences = await multilingualService.updateUserLanguagePreference(
        userId,
        preferences
      )
      
      setState(prev => ({
        ...prev,
        userPreferences: updatedPreferences
      }))

      toast.success('Preferências de idioma atualizadas')
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error)
      toast.error('Erro ao atualizar preferências de idioma')
      throw error
    }
  }, [userId])

  // =============================================================================
  // TRADUÇÃO
  // =============================================================================

  const translateDocument = useCallback(async (request: TranslationRequest): Promise<TranslationResponse> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const response = await multilingualService.translateDocument(request)

      // Atualizar lista de traduções
      setState(prev => ({
        ...prev,
        translations: [response.translation, ...prev.translations],
        loading: false
      }))

      // Mostrar warnings se houver
      if (response.warnings && response.warnings.length > 0) {
        response.warnings.forEach(warning => {
          toast.warning(warning)
        })
      }

      toast.success('Documento traduzido com sucesso')
      return response
    } catch (error) {
      console.error('Erro na tradução:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro na tradução do documento'
      }))
      toast.error('Erro na tradução do documento')
      throw error
    }
  }, [])

  const detectLanguage = useCallback(async (content: string): Promise<LanguageDetection> => {
    try {
      const detection = await multilingualService.detectLanguage(content)
      return detection
    } catch (error) {
      console.error('Erro na detecção de idioma:', error)
      // Fallback para português
      return {
        detected_language: 'pt-BR',
        confidence: 0.5,
        alternatives: []
      }
    }
  }, [])

  const getDocumentTranslation = useCallback(async (
    documentId: string,
    targetLanguage: string
  ): Promise<DocumentTranslation | null> => {
    try {
      const translation = await multilingualService.getDocumentTranslation(documentId, targetLanguage)
      return translation
    } catch (error) {
      console.error('Erro ao buscar tradução:', error)
      return null
    }
  }, [])

  const getTranslations = useCallback(async (documentId: string): Promise<DocumentTranslation[]> => {
    try {
      const translations = await multilingualService.getTranslations(documentId)
      
      setState(prev => ({
        ...prev,
        translations
      }))
      
      return translations
    } catch (error) {
      console.error('Erro ao buscar traduções:', error)
      return []
    }
  }, [])

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const getSupportedLanguages = useCallback((): LanguageConfig[] => {
    return multilingualService.getSupportedLanguages()
  }, [])

  const isLanguageSupported = useCallback((code: string): boolean => {
    return multilingualService.isLanguageSupported(code)
  }, [])

  const isTranslationAvailable = useCallback(async (
    documentId: string,
    language: string
  ): Promise<boolean> => {
    try {
      const translation = await multilingualService.getDocumentTranslation(documentId, language)
      return translation !== null
    } catch (error) {
      return false
    }
  }, [])

  // =============================================================================
  // ESTATÍSTICAS
  // =============================================================================

  const loadStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loadingStats: true }))

      const stats = await multilingualService.getMultilingualStats(organizationId)
      
      setState(prev => ({
        ...prev,
        stats,
        loadingStats: false
      }))
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      setState(prev => ({
        ...prev,
        loadingStats: false,
        error: 'Erro ao carregar estatísticas multilíngue'
      }))
    }
  }, [organizationId])

  // =============================================================================
  // RETORNO
  // =============================================================================

  return {
    // Estado
    currentLanguage: state.currentLanguage,
    userPreferences: state.userPreferences,
    translations: state.translations,
    stats: state.stats,
    loading: state.loading,
    loadingPreferences: state.loadingPreferences,
    loadingStats: state.loadingStats,
    error: state.error,

    // Ações
    setCurrentLanguage,
    updateUserPreferences,
    loadUserPreferences,
    translateDocument,
    detectLanguage,
    getDocumentTranslation,
    getTranslations,
    getSupportedLanguages,
    isLanguageSupported,
    isTranslationAvailable,
    loadStats
  }
}

// =============================================================================
// HOOK PARA USAR O CONTEXTO
// =============================================================================

export function useMultilingualContext(): MultilingualContextType {
  const context = useContext(MultilingualContext)
  if (!context) {
    throw new Error('useMultilingualContext deve ser usado dentro de um MultilingualProvider')
  }
  return context
}

// =============================================================================
// PROVIDER DO CONTEXTO
// =============================================================================

interface MultilingualProviderProps {
  children: React.ReactNode
  userId: string
  organizationId: string
}

export function MultilingualProvider({ children, userId, organizationId }: MultilingualProviderProps) {
  const multilingual = useMultilingual({
    userId,
    organizationId,
    autoLoadPreferences: true
  })

  return (
    <MultilingualContext.Provider value={multilingual}>
      {children}
    </MultilingualContext.Provider>
  )
} 