import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { 
  Globe, 
  Check, 
  Settings,
  Languages,
  ChevronDown
} from 'lucide-react'
import { useMultilingualContext } from '@/hooks/useMultilingual'
import { LanguageConfig } from '@/services/multilingualService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface LanguageSelectorProps {
  className?: string
  showLabel?: boolean
  variant?: 'button' | 'badge' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function LanguageSelector({ 
  className, 
  showLabel = true, 
  variant = 'button',
  size = 'md'
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const {
    currentLanguage,
    userPreferences,
    setCurrentLanguage,
    getSupportedLanguages,
    updateUserPreferences
  } = useMultilingualContext()

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleLanguageChange = async (language: LanguageConfig) => {
    try {
      setCurrentLanguage(language)
      await updateUserPreferences({ 
        interface_language: language.code,
        primary_language: language.code
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Erro ao alterar idioma:', error)
    }
  }

  const handleTranslationQualityChange = async (quality: 'fast' | 'balanced' | 'high') => {
    try {
      await updateUserPreferences({ translation_quality: quality })
    } catch (error) {
      console.error('Erro ao alterar qualidade de tradução:', error)
    }
  }

  // =============================================================================
  // RENDERIZAÇÃO POR VARIANTE
  // =============================================================================

  const renderButtonVariant = () => (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size={size}
          className={`flex items-center space-x-2 ${className}`}
        >
          <Globe className="w-4 h-4" />
          {showLabel && (
            <span className="hidden sm:inline">
              {currentLanguage.native_name}
            </span>
          )}
          <span className="text-lg">{currentLanguage.flag}</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Selecionar Idioma</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {getSupportedLanguages().map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{language.flag}</span>
              <div className="flex flex-col">
                <span className="font-medium">{language.native_name}</span>
                <span className="text-xs text-gray-500">{language.name}</span>
              </div>
            </div>
            {currentLanguage.code === language.code && (
              <Check className="w-4 h-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Qualidade de Tradução</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {[
          { value: 'fast', label: 'Rápida', description: 'Tradução mais rápida' },
          { value: 'balanced', label: 'Equilibrada', description: 'Boa qualidade e velocidade' },
          { value: 'high', label: 'Alta', description: 'Melhor qualidade possível' }
        ].map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleTranslationQualityChange(option.value as any)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-gray-500">{option.description}</span>
            </div>
            {userPreferences?.translation_quality === option.value && (
              <Check className="w-4 h-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const renderBadgeVariant = () => (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Badge 
          variant="outline" 
          className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${className}`}
        >
          <span className="text-lg mr-1">{currentLanguage.flag}</span>
          {showLabel && currentLanguage.code.toUpperCase()}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Badge>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Idioma</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {getSupportedLanguages().map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{language.flag}</span>
              <span>{language.native_name}</span>
            </div>
            {currentLanguage.code === language.code && (
              <Check className="w-4 h-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const renderMinimalVariant = () => (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={`p-1 h-auto ${className}`}
        >
          <span className="text-lg">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Idioma</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {getSupportedLanguages().map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{language.flag}</span>
              <span>{language.native_name}</span>
            </div>
            {currentLanguage.code === language.code && (
              <Check className="w-4 h-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  switch (variant) {
    case 'badge':
      return renderBadgeVariant()
    case 'minimal':
      return renderMinimalVariant()
    default:
      return renderButtonVariant()
  }
}

// =============================================================================
// COMPONENTE DE CONFIGURAÇÕES DE IDIOMA
// =============================================================================

interface LanguageSettingsProps {
  className?: string
}

export function LanguageSettings({ className }: LanguageSettingsProps) {
  const {
    userPreferences,
    updateUserPreferences,
    getSupportedLanguages
  } = useMultilingualContext()

  const handleAutoTranslateChange = async (enabled: boolean) => {
    try {
      await updateUserPreferences({ auto_translate: enabled })
    } catch (error) {
      console.error('Erro ao alterar tradução automática:', error)
    }
  }

  const handleSecondaryLanguagesChange = async (languages: string[]) => {
    try {
      await updateUserPreferences({ secondary_languages: languages })
    } catch (error) {
      console.error('Erro ao alterar idiomas secundários:', error)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Configurações de Idioma</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Personalize suas preferências de idioma
          </p>
        </div>
        <Languages className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Tradução Automática</label>
            <p className="text-xs text-gray-500">
              Traduzir documentos automaticamente
            </p>
          </div>
          <Button
            variant={userPreferences?.auto_translate ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleAutoTranslateChange(!userPreferences?.auto_translate)}
          >
            {userPreferences?.auto_translate ? 'Ativada' : 'Desativada'}
          </Button>
        </div>

        <div>
          <label className="text-sm font-medium">Idiomas Secundários</label>
          <p className="text-xs text-gray-500 mb-2">
            Idiomas adicionais para tradução
          </p>
          <div className="flex flex-wrap gap-1">
            {getSupportedLanguages().map((language) => (
              <Badge
                key={language.code}
                variant={
                  userPreferences?.secondary_languages?.includes(language.code)
                    ? 'default'
                    : 'outline'
                }
                className="cursor-pointer"
                onClick={() => {
                  const current = userPreferences?.secondary_languages || []
                  const updated = current.includes(language.code)
                    ? current.filter(l => l !== language.code)
                    : [...current, language.code]
                  handleSecondaryLanguagesChange(updated)
                }}
              >
                <span className="mr-1">{language.flag}</span>
                {language.code.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 