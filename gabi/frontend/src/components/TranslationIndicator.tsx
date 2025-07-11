import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Languages, 
  Globe, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Eye,
  Copy,
  Download,
  Settings
} from 'lucide-react'
import { useMultilingualContext } from '@/hooks/useMultilingual'
import { DocumentTranslation, LanguageConfig } from '@/services/multilingualService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface TranslationIndicatorProps {
  documentId: string
  originalLanguage: string
  className?: string
  variant?: 'badge' | 'button' | 'card'
  showDetails?: boolean
}

interface TranslationDetailsProps {
  documentId: string
  originalLanguage: string
  onClose: () => void
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function TranslationIndicator({ 
  documentId, 
  originalLanguage, 
  className,
  variant = 'badge',
  showDetails = false
}: TranslationIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [availableTranslations, setAvailableTranslations] = useState<DocumentTranslation[]>([])
  const [loading, setLoading] = useState(false)
  
  const {
    currentLanguage,
    userPreferences,
    getDocumentTranslation,
    getTranslations,
    translateDocument,
    isTranslationAvailable
  } = useMultilingualContext()

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleLoadTranslations = async () => {
    try {
      setLoading(true)
      const translations = await getTranslations(documentId)
      setAvailableTranslations(translations)
    } catch (error) {
      console.error('Erro ao carregar traduções:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTranslateDocument = async (targetLanguage: string) => {
    try {
      setLoading(true)
      
      // Buscar conteúdo original do documento (simulado)
      const originalContent = "Conteúdo original do documento..."
      
      await translateDocument({
        document_id: documentId,
        content: originalContent,
        source_language: originalLanguage,
        target_language: targetLanguage,
        is_manual: true
      })
      
      // Recarregar traduções
      await handleLoadTranslations()
      
    } catch (error) {
      console.error('Erro ao traduzir documento:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewTranslation = async (targetLanguage: string) => {
    try {
      const translation = await getDocumentTranslation(documentId, targetLanguage)
      if (translation) {
        // Implementar visualização da tradução
        console.log('Visualizar tradução:', translation)
      }
    } catch (error) {
      console.error('Erro ao visualizar tradução:', error)
    }
  }

  // =============================================================================
  // VERIFICAÇÕES
  // =============================================================================

  const isOriginalLanguage = originalLanguage === currentLanguage.code
  const hasTranslation = availableTranslations.some(t => t.target_language === currentLanguage.code)
  const isTranslated = !isOriginalLanguage && hasTranslation

  // =============================================================================
  // RENDERIZAÇÃO POR VARIANTE
  // =============================================================================

  const renderBadgeVariant = () => {
    if (isOriginalLanguage) {
      return (
        <Badge variant="outline" className={className}>
          <Globe className="w-3 h-3 mr-1" />
          Original
        </Badge>
      )
    }

    if (isTranslated) {
      return (
        <Badge variant="default" className={`${className} cursor-pointer`} onClick={() => setIsOpen(true)}>
          <Check className="w-3 h-3 mr-1" />
          Traduzido
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className={`${className} cursor-pointer`} onClick={() => setIsOpen(true)}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        Não traduzido
      </Badge>
    )
  }

  const renderButtonVariant = () => {
    if (isOriginalLanguage) {
      return (
        <Button variant="outline" size="sm" className={className}>
          <Globe className="w-4 h-4 mr-2" />
          Idioma Original
        </Button>
      )
    }

    if (isTranslated) {
      return (
        <Button variant="default" size="sm" className={className} onClick={() => setIsOpen(true)}>
          <Check className="w-4 h-4 mr-2" />
          Traduzido
        </Button>
      )
    }

    return (
      <Button variant="secondary" size="sm" className={className} onClick={() => setIsOpen(true)}>
        <Languages className="w-4 h-4 mr-2" />
        Traduzir
      </Button>
    )
  }

  const renderCardVariant = () => (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Languages className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Status de Tradução</p>
              <p className="text-xs text-gray-500">
                {isOriginalLanguage ? 'Documento no idioma original' : 
                 isTranslated ? 'Documento traduzido' : 'Tradução disponível'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  return (
    <>
      {variant === 'badge' && renderBadgeVariant()}
      {variant === 'button' && renderButtonVariant()}
      {variant === 'card' && renderCardVariant()}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Languages className="w-5 h-5" />
              <span>Traduções do Documento</span>
            </DialogTitle>
          </DialogHeader>
          
          <TranslationDetails
            documentId={documentId}
            originalLanguage={originalLanguage}
            onClose={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

// =============================================================================
// COMPONENTE DE DETALHES DE TRADUÇÃO
// =============================================================================

function TranslationDetails({ documentId, originalLanguage, onClose }: TranslationDetailsProps) {
  const [availableTranslations, setAvailableTranslations] = useState<DocumentTranslation[]>([])
  const [loading, setLoading] = useState(false)
  
  const {
    currentLanguage,
    userPreferences,
    getSupportedLanguages,
    translateDocument,
    getDocumentTranslation
  } = useMultilingualContext()

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleLoadTranslations = async () => {
    try {
      setLoading(true)
      // Implementar carregamento de traduções
      const translations: DocumentTranslation[] = []
      setAvailableTranslations(translations)
    } catch (error) {
      console.error('Erro ao carregar traduções:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTranslateToLanguage = async (targetLanguage: string) => {
    try {
      setLoading(true)
      
      // Buscar conteúdo original do documento (simulado)
      const originalContent = "Conteúdo original do documento..."
      
      await translateDocument({
        document_id: documentId,
        content: originalContent,
        source_language: originalLanguage,
        target_language: targetLanguage,
        is_manual: true
      })
      
      // Recarregar traduções
      await handleLoadTranslations()
      
    } catch (error) {
      console.error('Erro ao traduzir documento:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewTranslation = async (targetLanguage: string) => {
    try {
      const translation = await getDocumentTranslation(documentId, targetLanguage)
      if (translation) {
        // Implementar visualização da tradução
        console.log('Visualizar tradução:', translation)
      }
    } catch (error) {
      console.error('Erro ao visualizar tradução:', error)
    }
  }

  // =============================================================================
  // EFEITOS
  // =============================================================================

  React.useEffect(() => {
    handleLoadTranslations()
  }, [documentId])

  // =============================================================================
  // RENDERIZAÇÃO
  // =============================================================================

  const supportedLanguages = getSupportedLanguages()
  const originalLanguageConfig = supportedLanguages.find(l => l.code === originalLanguage)

  return (
    <div className="space-y-4">
      {/* Informações do idioma original */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{originalLanguageConfig?.flag}</span>
          <div>
            <p className="font-medium">Idioma Original</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {originalLanguageConfig?.native_name} ({originalLanguageConfig?.name})
            </p>
          </div>
        </div>
      </div>

      {/* Traduções disponíveis */}
      <div>
        <h4 className="font-medium mb-3">Traduções Disponíveis</h4>
        <div className="space-y-2">
          {availableTranslations.map((translation) => {
            const languageConfig = supportedLanguages.find(l => l.code === translation.target_language)
            return (
              <div key={translation.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{languageConfig?.flag}</span>
                  <div>
                    <p className="font-medium">{languageConfig?.native_name}</p>
                    <p className="text-sm text-gray-500">
                      Qualidade: {Math.round(translation.translation_quality * 100)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewTranslation(translation.target_language)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(translation.translated_content)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })}
          
          {availableTranslations.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhuma tradução disponível
            </p>
          )}
        </div>
      </div>

      {/* Traduzir para outros idiomas */}
      <div>
        <h4 className="font-medium mb-3">Traduzir para Outros Idiomas</h4>
        <div className="grid grid-cols-2 gap-2">
          {supportedLanguages
            .filter(lang => lang.code !== originalLanguage)
            .filter(lang => !availableTranslations.some(t => t.target_language === lang.code))
            .map((language) => (
              <Button
                key={language.code}
                variant="outline"
                size="sm"
                onClick={() => handleTranslateToLanguage(language.code)}
                disabled={loading}
                className="justify-start"
              >
                <span className="text-lg mr-2">{language.flag}</span>
                {language.native_name}
                {loading && <RefreshCw className="w-4 h-4 ml-2 animate-spin" />}
              </Button>
            ))}
        </div>
      </div>

      {/* Configurações de tradução */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Tradução Automática</p>
            <p className="text-xs text-gray-500">
              {userPreferences?.auto_translate ? 'Ativada' : 'Desativada'}
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>
    </div>
  )
} 