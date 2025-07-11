import { useState, useEffect, useCallback } from 'react'
import { auditService, AuditEvent, AuditFilter, AuditStats, AuditAlert, ChatSnapshot, TaskSnapshot } from '@/services/auditService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface UseAuditReturn {
  // Estado
  events: AuditEvent[]
  alerts: AuditAlert[]
  stats: AuditStats | null
  loading: boolean
  error: string | null
  
  // Filtros
  filters: AuditFilter
  setFilters: (filters: AuditFilter) => void
  clearFilters: () => void
  
  // Operações de eventos
  loadEvents: () => Promise<void>
  logEvent: (event: Omit<AuditEvent, 'id' | 'created_at'>) => Promise<void>
  logAuthenticationEvent: (data: any) => Promise<void>
  logChatEvent: (data: any) => Promise<void>
  logTaskEvent: (data: any) => Promise<void>
  logExportEvent: (data: any) => Promise<void>
  logDataAccessEvent: (data: any) => Promise<void>
  
  // Operações de alertas
  loadAlerts: () => Promise<void>
  acknowledgeAlert: (alertId: string) => Promise<void>
  resolveAlert: (alertId: string) => Promise<void>
  
  // Operações de snapshots
  getChatSnapshot: (chatId: string) => Promise<ChatSnapshot | null>
  getTaskSnapshot: (taskId: string) => Promise<TaskSnapshot | null>
  
  // Operações de estatísticas
  loadStats: () => Promise<void>
  
  // Operações de exportação
  exportLogs: (format: 'csv' | 'json') => Promise<void>
  
  // Utilitários
  getEventIcon: (eventType: string) => string
  getEventTypeName: (eventType: string) => string
  getSeverityColor: (severity: string) => string
  getStatusColor: (status: string) => string
  formatRiskScore: (score: number) => string
  getRiskColor: (score: number) => string
}

interface UseAuditOptions {
  autoLoad?: boolean
  refreshInterval?: number
  maxEvents?: number
  filters?: AuditFilter
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useAudit(options: UseAuditOptions = {}): UseAuditReturn {
  const {
    autoLoad = true,
    refreshInterval,
    maxEvents = 100,
    filters: initialFilters = {}
  } = options

  // =============================================================================
  // ESTADO
  // =============================================================================

  const [events, setEvents] = useState<AuditEvent[]>([])
  const [alerts, setAlerts] = useState<AuditAlert[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<AuditFilter>(initialFilters)

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    if (autoLoad) {
      loadEvents()
      loadAlerts()
      loadStats()
    }
  }, [autoLoad])

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        loadEvents()
        loadAlerts()
        loadStats()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [refreshInterval])

  useEffect(() => {
    if (filters) {
      loadEvents()
    }
  }, [filters])

  // =============================================================================
  // OPERAÇÕES DE EVENTOS
  // =============================================================================

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const eventsData = await auditService.getAuditLogs(filters)
      setEvents(eventsData.slice(0, maxEvents))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos')
      console.error('Erro ao carregar eventos:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, maxEvents])

  const logEvent = useCallback(async (event: Omit<AuditEvent, 'id' | 'created_at'>) => {
    try {
      await auditService.logEvent(event)
      // Recarregar eventos após log
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar evento')
      console.error('Erro ao registrar evento:', err)
    }
  }, [loadEvents])

  const logAuthenticationEvent = useCallback(async (data: any) => {
    try {
      await auditService.logAuthenticationEvent(data)
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar evento de autenticação')
      console.error('Erro ao registrar evento de autenticação:', err)
    }
  }, [loadEvents])

  const logChatEvent = useCallback(async (data: any) => {
    try {
      await auditService.logChatEvent(data)
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar evento de chat')
      console.error('Erro ao registrar evento de chat:', err)
    }
  }, [loadEvents])

  const logTaskEvent = useCallback(async (data: any) => {
    try {
      await auditService.logTaskEvent(data)
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar evento de tarefa')
      console.error('Erro ao registrar evento de tarefa:', err)
    }
  }, [loadEvents])

  const logExportEvent = useCallback(async (data: any) => {
    try {
      await auditService.logExportEvent(data)
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar evento de exportação')
      console.error('Erro ao registrar evento de exportação:', err)
    }
  }, [loadEvents])

  const logDataAccessEvent = useCallback(async (data: any) => {
    try {
      await auditService.logDataAccessEvent(data)
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar evento de acesso')
      console.error('Erro ao registrar evento de acesso:', err)
    }
  }, [loadEvents])

  // =============================================================================
  // OPERAÇÕES DE ALERTAS
  // =============================================================================

  const loadAlerts = useCallback(async () => {
    try {
      setError(null)
      const alertsData = await auditService.getAuditAlerts()
      setAlerts(alertsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar alertas')
      console.error('Erro ao carregar alertas:', err)
    }
  }, [])

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const userId = localStorage.getItem('gabi_user_id') || 'unknown'
      await auditService.acknowledgeAlert(alertId, userId)
      await loadAlerts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reconhecer alerta')
      console.error('Erro ao reconhecer alerta:', err)
    }
  }, [loadAlerts])

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      const userId = localStorage.getItem('gabi_user_id') || 'unknown'
      await auditService.resolveAlert(alertId, userId)
      await loadAlerts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao resolver alerta')
      console.error('Erro ao resolver alerta:', err)
    }
  }, [loadAlerts])

  // =============================================================================
  // OPERAÇÕES DE SNAPSHOTS
  // =============================================================================

  const getChatSnapshot = useCallback(async (chatId: string): Promise<ChatSnapshot | null> => {
    try {
      return await auditService.getChatSnapshot(chatId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar snapshot do chat')
      console.error('Erro ao buscar snapshot do chat:', err)
      return null
    }
  }, [])

  const getTaskSnapshot = useCallback(async (taskId: string): Promise<TaskSnapshot | null> => {
    try {
      return await auditService.getTaskSnapshot(taskId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar snapshot da tarefa')
      console.error('Erro ao buscar snapshot da tarefa:', err)
      return null
    }
  }, [])

  // =============================================================================
  // OPERAÇÕES DE ESTATÍSTICAS
  // =============================================================================

  const loadStats = useCallback(async () => {
    try {
      setError(null)
      const statsData = await auditService.getAuditStats()
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
      console.error('Erro ao carregar estatísticas:', err)
    }
  }, [])

  // =============================================================================
  // OPERAÇÕES DE EXPORTAÇÃO
  // =============================================================================

  const exportLogs = useCallback(async (format: 'csv' | 'json') => {
    try {
      const data = await auditService.exportAuditLogs(filters, format)
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_logs_${format}_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar logs')
      console.error('Erro ao exportar logs:', err)
    }
  }, [filters])

  // =============================================================================
  // OPERAÇÕES DE FILTROS
  // =============================================================================

  const setFilters = useCallback((newFilters: AuditFilter) => {
    setFiltersState(newFilters)
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState({})
  }, [])

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const getEventIcon = useCallback((eventType: string) => {
    return auditService.getEventTypeIcon(eventType)
  }, [])

  const getEventTypeName = useCallback((eventType: string) => {
    return auditService.getEventTypeName(eventType)
  }, [])

  const getSeverityColor = useCallback((severity: string) => {
    return auditService.getSeverityColor(severity)
  }, [])

  const getStatusColor = useCallback((status: string) => {
    return auditService.getStatusColor(status)
  }, [])

  const formatRiskScore = useCallback((score: number) => {
    if (score >= 8) return 'Alto'
    if (score >= 5) return 'Médio'
    return 'Baixo'
  }, [])

  const getRiskColor = useCallback((score: number) => {
    if (score >= 8) return 'bg-red-100 text-red-800 border-red-200'
    if (score >= 5) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }, [])

  // =============================================================================
  // RETORNO
  // =============================================================================

  return {
    // Estado
    events,
    alerts,
    stats,
    loading,
    error,
    
    // Filtros
    filters,
    setFilters,
    clearFilters,
    
    // Operações de eventos
    loadEvents,
    logEvent,
    logAuthenticationEvent,
    logChatEvent,
    logTaskEvent,
    logExportEvent,
    logDataAccessEvent,
    
    // Operações de alertas
    loadAlerts,
    acknowledgeAlert,
    resolveAlert,
    
    // Operações de snapshots
    getChatSnapshot,
    getTaskSnapshot,
    
    // Operações de estatísticas
    loadStats,
    
    // Operações de exportação
    exportLogs,
    
    // Utilitários
    getEventIcon,
    getEventTypeName,
    getSeverityColor,
    getStatusColor,
    formatRiskScore,
    getRiskColor
  }
}

// =============================================================================
// HOOKS ESPECIALIZADOS
// =============================================================================

export function useAuditEvents(options: UseAuditOptions = {}) {
  const { events, loading, error, filters, setFilters, clearFilters, loadEvents } = useAudit(options)
  
  return {
    events,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    loadEvents
  }
}

export function useAuditAlerts(options: UseAuditOptions = {}) {
  const { alerts, loading, error, loadAlerts, acknowledgeAlert, resolveAlert } = useAudit(options)
  
  return {
    alerts,
    loading,
    error,
    loadAlerts,
    acknowledgeAlert,
    resolveAlert
  }
}

export function useAuditStats(options: UseAuditOptions = {}) {
  const { stats, loading, error, loadStats } = useAudit(options)
  
  return {
    stats,
    loading,
    error,
    loadStats
  }
}

export function useAuditLogging() {
  const { 
    logEvent, 
    logAuthenticationEvent, 
    logChatEvent, 
    logTaskEvent, 
    logExportEvent, 
    logDataAccessEvent 
  } = useAudit({ autoLoad: false })
  
  return {
    logEvent,
    logAuthenticationEvent,
    logChatEvent,
    logTaskEvent,
    logExportEvent,
    logDataAccessEvent
  }
}

// =============================================================================
// HOOKS PARA COMPONENTES ESPECÍFICOS
// =============================================================================

export function useAuditDashboard() {
  const {
    events,
    alerts,
    stats,
    loading,
    error,
    loadEvents,
    loadAlerts,
    loadStats,
    exportLogs
  } = useAudit({
    autoLoad: true,
    refreshInterval: 30000, // 30 segundos
    maxEvents: 50
  })

  return {
    events,
    alerts,
    stats,
    loading,
    error,
    loadEvents,
    loadAlerts,
    loadStats,
    exportLogs
  }
}

export function useAuditLogViewer() {
  const {
    events,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    loadEvents,
    getChatSnapshot,
    getTaskSnapshot,
    exportLogs
  } = useAudit({
    autoLoad: true,
    maxEvents: 100
  })

  return {
    events,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    loadEvents,
    getChatSnapshot,
    getTaskSnapshot,
    exportLogs
  }
}

export function useAuditAlertsManager() {
  const {
    alerts,
    loading,
    error,
    loadAlerts,
    acknowledgeAlert,
    resolveAlert
  } = useAudit({
    autoLoad: true,
    refreshInterval: 15000 // 15 segundos
  })

  return {
    alerts,
    loading,
    error,
    loadAlerts,
    acknowledgeAlert,
    resolveAlert
  }
} 