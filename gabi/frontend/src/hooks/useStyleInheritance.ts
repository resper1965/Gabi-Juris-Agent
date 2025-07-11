import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { 
  StyleInheritanceResult, 
  RequestStyle, 
  AgentStyle, 
  BaseStyle,
  StyleLog,
  styleInheritanceService
} from '@/services/styleInheritanceService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface UseStyleInheritanceOptions {
  organizationId: string
  userId: string
  autoLog?: boolean
  enableCache?: boolean
}

interface StyleInheritanceState {
  result: StyleInheritanceResult | null
  loading: boolean
  error: string | null
  history: StyleLog[]
  stats: {
    total_requests: number
    style_distribution: Record<string, number>
    source_distribution: Record<string, number>
    avg_confidence: number
    most_used_styles: Array<{ style: string; count: number }>
  } | null
}

interface StyleInheritanceActions {
  determineStyle: (
    requestStyle: RequestStyle,
    agentStyle: AgentStyle,
    baseStyles: BaseStyle[],
    requestId: string
  ) => Promise<StyleInheritanceResult | null>
  
  logInheritance: (
    inheritanceResult: StyleInheritanceResult,
    requestId: string,
    generatedContentLength: number,
    processingTime: number
  ) => Promise<void>
  
  loadHistory: (
    baseId?: string,
    agentId?: string,
    limit?: number
  ) => Promise<void>
  
  loadStats: (period?: 'day' | 'week' | 'month' | 'year') => Promise<void>
  
  clearCache: () => void
  
  reset: () => void
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useStyleInheritance(options: UseStyleInheritanceOptions): [
  StyleInheritanceState,
  StyleInheritanceActions
] {
  const { organizationId, userId, autoLog = true, enableCache = true } = options

  const [state, setState] = useState<StyleInheritanceState>({
    result: null,
    loading: false,
    error: null,
    history: [],
    stats: null
  })

  // =============================================================================
  // AÇÕES PRINCIPAIS
  // =============================================================================

  const determineStyle = useCallback(async (
    requestStyle: RequestStyle,
    agentStyle: AgentStyle,
    baseStyles: BaseStyle[],
    requestId: string
  ): Promise<StyleInheritanceResult | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const result = await styleInheritanceService.determineStyle(
        requestStyle,
        agentStyle,
        baseStyles,
        organizationId,
        requestId
      )

      setState(prev => ({ 
        ...prev, 
        result, 
        loading: false 
      }))

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }))
      
      toast.error(`Erro ao determinar estilo: ${errorMessage}`)
      return null
    }
  }, [organizationId])

  const logInheritance = useCallback(async (
    inheritanceResult: StyleInheritanceResult,
    requestId: string,
    generatedContentLength: number,
    processingTime: number
  ): Promise<void> => {
    try {
      await styleInheritanceService.logStyleInheritance(
        inheritanceResult,
        userId,
        requestId,
        generatedContentLength,
        processingTime
      )

      // Atualizar histórico local
      const newLog: StyleLog = {
        response_id: inheritanceResult.response_id,
        request_id: requestId,
        user_id: userId,
        inheritance_result: inheritanceResult,
        generated_content_length: generatedContentLength,
        processing_time: processingTime,
        created_at: new Date().toISOString()
      }

      setState(prev => ({
        ...prev,
        history: [newLog, ...prev.history.slice(0, 49)] // Manter apenas os 50 mais recentes
      }))

    } catch (error) {
      console.error('Erro ao registrar log de herança:', error)
      // Não falhar a operação por erro de log
    }
  }, [userId])

  const loadHistory = useCallback(async (
    baseId?: string,
    agentId?: string,
    limit: number = 20
  ): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true }))

      const history = await styleInheritanceService.getStyleInheritanceHistory(
        userId,
        baseId,
        agentId,
        limit
      )

      setState(prev => ({ 
        ...prev, 
        history, 
        loading: false 
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }))
      
      toast.error(`Erro ao carregar histórico: ${errorMessage}`)
    }
  }, [userId])

  const loadStats = useCallback(async (
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true }))

      const stats = await styleInheritanceService.getStyleUsageStats(
        organizationId,
        period
      )

      setState(prev => ({ 
        ...prev, 
        stats, 
        loading: false 
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }))
      
      toast.error(`Erro ao carregar estatísticas: ${errorMessage}`)
    }
  }, [organizationId])

  const clearCache = useCallback((): void => {
    if (enableCache) {
      styleInheritanceService.clearCache()
      toast.success('Cache de estilos limpo com sucesso!')
    }
  }, [enableCache])

  const reset = useCallback((): void => {
    setState({
      result: null,
      loading: false,
      error: null,
      history: [],
      stats: null
    })
  }, [])

  // =============================================================================
  // EFEITOS AUTOMÁTICOS
  // =============================================================================

  useEffect(() => {
    // Carregar estatísticas iniciais
    loadStats()
  }, [loadStats])

  // =============================================================================
  // WRAPPER PARA DETERMINAÇÃO COM LOG AUTOMÁTICO
  // =============================================================================

  const determineStyleWithLog = useCallback(async (
    requestStyle: RequestStyle,
    agentStyle: AgentStyle,
    baseStyles: BaseStyle[],
    requestId: string,
    generatedContentLength: number = 0,
    processingTime: number = 0
  ): Promise<StyleInheritanceResult | null> => {
    const result = await determineStyle(requestStyle, agentStyle, baseStyles, requestId)
    
    if (result && autoLog) {
      await logInheritance(result, requestId, generatedContentLength, processingTime)
    }
    
    return result
  }, [determineStyle, logInheritance, autoLog])

  // =============================================================================
  // RETORNO DO HOOK
  // =============================================================================

  const actions: StyleInheritanceActions = {
    determineStyle: determineStyleWithLog,
    logInheritance,
    loadHistory,
    loadStats,
    clearCache,
    reset
  }

  return [state, actions]
}

// =============================================================================
// HOOKS ESPECIALIZADOS
// =============================================================================

export function useStyleInheritanceDebug(options: UseStyleInheritanceOptions) {
  const [state, actions] = useStyleInheritance(options)
  const [debugMode, setDebugMode] = useState(false)
  const [selectedLog, setSelectedLog] = useState<StyleLog | null>(null)

  const toggleDebugMode = useCallback(() => {
    setDebugMode(prev => !prev)
  }, [])

  const selectLog = useCallback((log: StyleLog | null) => {
    setSelectedLog(log)
  }, [])

  const exportLogs = useCallback(() => {
    if (state.history.length === 0) {
      toast.error('Nenhum log para exportar')
      return
    }

    const dataStr = JSON.stringify(state.history, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `style-inheritance-logs-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    toast.success('Logs exportados com sucesso!')
  }, [state.history])

  return {
    state,
    actions,
    debugMode,
    selectedLog,
    toggleDebugMode,
    selectLog,
    exportLogs
  }
}

export function useStyleInheritanceStats(organizationId: string) {
  const [stats, setStats] = useState<{
    total_requests: number
    style_distribution: Record<string, number>
    source_distribution: Record<string, number>
    avg_confidence: number
    most_used_styles: Array<{ style: string; count: number }>
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async (
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ) => {
    try {
      setLoading(true)
      setError(null)

      const result = await styleInheritanceService.getStyleUsageStats(
        organizationId,
        period
      )

      setStats(result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error(`Erro ao carregar estatísticas: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return {
    stats,
    loading,
    error,
    loadStats
  }
}

// =============================================================================
// HOOKS DE VALIDAÇÃO
// =============================================================================

export function useStyleValidation() {
  const [validationResults, setValidationResults] = useState<{
    compatible: boolean
    issues: string[]
    recommendations: string[]
  } | null>(null)

  const validateStyle = useCallback((
    style: any,
    targetLanguage: string = 'pt',
    contentType: 'response' | 'summary' | 'document' | 'report' = 'response'
  ) => {
    const result = styleInheritanceService.validateStyleCompatibility(
      style,
      targetLanguage,
      contentType
    )
    
    setValidationResults(result)
    return result
  }, [])

  const clearValidation = useCallback(() => {
    setValidationResults(null)
  }, [])

  return {
    validationResults,
    validateStyle,
    clearValidation
  }
} 