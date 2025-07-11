import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Palette, 
  Target, 
  Eye, 
  Info,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { 
  StyleInheritanceResult, 
  getStyleDisplayName,
  getStyleDescription,
  getStyleIcon
} from '@/services/styleInheritanceService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface StyleInheritanceWidgetProps {
  inheritanceResult: StyleInheritanceResult
  showDetails?: boolean
  compact?: boolean
  className?: string
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function StyleInheritanceWidget({
  inheritanceResult,
  showDetails = false,
  compact = false,
  className = ''
}: StyleInheritanceWidgetProps) {
  const [expanded, setExpanded] = useState(false)

  // =============================================================================
  // RENDERIZAÇÃO COMPACTA
  // =============================================================================

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center space-x-2 ${className}`}>
              <span className="text-lg">
                {getStyleIcon(inheritanceResult.final_style.type)}
              </span>
              <Badge variant="outline" className="text-xs capitalize">
                {inheritanceResult.source}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">
                {getStyleDisplayName(inheritanceResult.final_style)}
              </div>
              <div className="text-xs text-gray-500">
                Fonte: {inheritanceResult.source}
              </div>
              <div className="text-xs text-gray-500">
                Confiança: {Math.round(inheritanceResult.confidence_score * 100)}%
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // =============================================================================
  // RENDERIZAÇÃO PADRÃO
  // =============================================================================

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-sm">Estilo Aplicado</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs capitalize">
              {inheritanceResult.source}
            </Badge>
            {showDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                <Eye className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {getStyleIcon(inheritanceResult.final_style.type)}
            </span>
            <span className="font-semibold">
              {getStyleDisplayName(inheritanceResult.final_style)}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {inheritanceResult.final_style.description || 
             getStyleDescription(inheritanceResult.final_style)}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Confiança: {Math.round(inheritanceResult.confidence_score * 100)}%</span>
            <span>{new Date(inheritanceResult.applied_at).toLocaleTimeString('pt-BR')}</span>
          </div>
        </div>

        {/* Detalhes Expandidos */}
        {showDetails && expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              {/* Características do Estilo */}
              <div>
                <h5 className="text-sm font-medium mb-2">Características</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {inheritanceResult.final_style.vocabulary_complexity && (
                    <div className="flex justify-between">
                      <span>Complexidade:</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {inheritanceResult.final_style.vocabulary_complexity}
                      </Badge>
                    </div>
                  )}
                  {inheritanceResult.final_style.tone && (
                    <div className="flex justify-between">
                      <span>Tom:</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {inheritanceResult.final_style.tone}
                      </Badge>
                    </div>
                  )}
                  {inheritanceResult.final_style.structure_preference && (
                    <div className="flex justify-between">
                      <span>Estrutura:</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {inheritanceResult.final_style.structure_preference.replace('_', ' ')}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Cadeia de Herança Simplificada */}
              <div>
                <h5 className="text-sm font-medium mb-2">Cadeia de Herança</h5>
                <div className="space-y-1">
                  {inheritanceResult.inheritance_chain.map((step, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        step.style ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <span className="capitalize">{step.level}</span>
                      {step.style && (
                        <span className="text-gray-500">
                          → {getStyleDisplayName(step.style)}
                        </span>
                      )}
                      {index === inheritanceResult.inheritance_chain.length - 1 && (
                        <CheckCircle className="w-3 h-3 text-green-500 ml-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalhes da Fonte */}
              <div>
                <h5 className="text-sm font-medium mb-2">Detalhes da Fonte</h5>
                <div className="space-y-1 text-xs">
                  {inheritanceResult.source_details.agent_name && (
                    <div className="flex justify-between">
                      <span>Agente:</span>
                      <span className="font-medium">{inheritanceResult.source_details.agent_name}</span>
                    </div>
                  )}
                  {inheritanceResult.source_details.base_name && (
                    <div className="flex justify-between">
                      <span>Base:</span>
                      <span className="font-medium">{inheritanceResult.source_details.base_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>ID da Resposta:</span>
                    <span className="font-mono text-xs">{inheritanceResult.response_id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// COMPONENTE DE STATUS RÁPIDO
// =============================================================================

export function StyleInheritanceStatus({
  inheritanceResult,
  showIcon = true
}: {
  inheritanceResult: StyleInheritanceResult
  showIcon?: boolean
}) {
  const getStatusColor = () => {
    if (inheritanceResult.confidence_score >= 0.8) return 'text-green-600'
    if (inheritanceResult.confidence_score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusIcon = () => {
    if (inheritanceResult.confidence_score >= 0.8) return <CheckCircle className="w-4 h-4" />
    if (inheritanceResult.confidence_score >= 0.6) return <AlertTriangle className="w-4 h-4" />
    return <AlertTriangle className="w-4 h-4" />
  }

  return (
    <div className="flex items-center space-x-2">
      {showIcon && (
        <span className="text-lg">
          {getStyleIcon(inheritanceResult.final_style.type)}
        </span>
      )}
      <div className="flex items-center space-x-1">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStyleDisplayName(inheritanceResult.final_style)}
        </span>
      </div>
      <Badge variant="outline" className="text-xs capitalize">
        {inheritanceResult.source}
      </Badge>
    </div>
  )
}

// =============================================================================
// COMPONENTE DE INDICADOR MINI
// =============================================================================

export function StyleInheritanceIndicator({
  inheritanceResult
}: {
  inheritanceResult: StyleInheritanceResult
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center space-x-1 cursor-help">
            <span className="text-sm">
              {getStyleIcon(inheritanceResult.final_style.type)}
            </span>
            <span className="text-xs text-gray-500">
              {inheritanceResult.source}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <div className="font-medium">
              {getStyleDisplayName(inheritanceResult.final_style)}
            </div>
            <div className="text-xs text-gray-500">
              {inheritanceResult.final_style.description || 
               getStyleDescription(inheritanceResult.final_style)}
            </div>
            <div className="text-xs text-gray-500">
              Confiança: {Math.round(inheritanceResult.confidence_score * 100)}%
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 