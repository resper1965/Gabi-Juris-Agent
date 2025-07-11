import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { 
  documentEnrichmentService, 
  DocumentEnrichment, 
  EnrichmentRequest,
  EnrichmentResponse,
  EnrichmentFilters,
  EnrichmentStats
} from '@/services/documentEnrichmentService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface UseDocumentEnrichmentOptions {
  organizationId: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface EnrichmentState {
  enrichments: DocumentEnrichment[]
  currentEnrichment: DocumentEnrichment | null
  stats: EnrichmentStats | null
  loading: boolean
  loadingStats: boolean
  error: string | null
  filters: EnrichmentFilters
}

interface EnrichmentActions {
  // Enriquecimento automático
  enrichDocument: (request: EnrichmentRequest) => Promise<EnrichmentResponse>
  forceRegenerate: (documentId: string) => Promise<EnrichmentResponse>
  
  // Gestão de enriquecimentos
  getEnrichment: (documentId: string) => Promise<DocumentEnrichment | null>
  updateEnrichment: (enrichmentId: string, updates: Partial<DocumentEnrichment>) => Promise<void>
  getEnrichments: (filters?: EnrichmentFilters) => Promise<void>
  
  // Busca e filtragem
  searchByTopicos: (topicos: string[]) => Promise<DocumentEnrichment[]>
  searchByTitulo: (titulo: string) => Promise<DocumentEnrichment[]>
  
  // Estatísticas
  loadStats: () => Promise<void>
  
  // Filtros
  setFilters: (filters: EnrichmentFilters) => void
  clearFilters: () => void
  
  // Utilitários
  refreshEnrichments: () => Promise<void>
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useDocumentEnrichment(options: UseDocumentEnrichmentOptions): EnrichmentState & EnrichmentActions {
  const {
    organizationId,
    autoRefresh = true,
    refreshInterval = 60000 // 1 minuto
  } = options

  // =============================================================================
  // ESTADO
  // =============================================================================

  const [state, setState] = useState<EnrichmentState>({
    enrichments: [],
    currentEnrichment: null,
    stats: null,
    loading: false,
    loadingStats: false,
    error: null,
    filters: {}
  })

  // =============================================================================
  // INICIALIZAÇÃO
  // =============================================================================

  useEffect(() => {
    if (organizationId) {
      loadInitialData()
    }
  }, [organizationId])

  useEffect(() => {
    if (autoRefresh && organizationId) {
      const interval = setInterval(() => {
        refreshEnrichments()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, organizationId, refreshInterval])

  // =============================================================================
  // FUNÇÕES PRINCIPAIS
  // =============================================================================

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      await Promise.all([
        getEnrichments(),
        loadStats()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
      setState(prev => ({
        ...prev,
        error: 'Erro ao carregar enriquecimentos'
      }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const refreshEnrichments = async () => {
    try {
      await getEnrichments(state.filters)
    } catch (error) {
      console.error('Erro ao atualizar enriquecimentos:', error)
    }
  }

  // =============================================================================
  // ENRIQUECIMENTO AUTOMÁTICO
  // =============================================================================

  const enrichDocument = useCallback(async (request: EnrichmentRequest): Promise<EnrichmentResponse> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const response = await documentEnrichmentService.enrichDocument(request)

      // Atualizar lista de enriquecimentos
      setState(prev => ({
        ...prev,
        enrichments: [response.enrichment, ...prev.enrichments],
        currentEnrichment: response.enrichment,
        loading: false
      }))

      // Mostrar warnings se houver
      if (response.warnings && response.warnings.length > 0) {
        response.warnings.forEach(warning => {
          toast.warning(warning)
        })
      }

      toast.success('Documento enriquecido com sucesso')
      return response
    } catch (error) {
      console.error('Erro no enriquecimento:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro no enriquecimento do documento'
      }))
      toast.error('Erro no enriquecimento do documento')
      throw error
    }
  }, [])

  const forceRegenerate = useCallback(async (documentId: string): Promise<EnrichmentResponse> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const response = await documentEnrichmentService.enrichDocument({
        document_id: documentId,
        content: '', // Será obtido do documento
        force_regeneration: true
      })

      // Atualizar enriquecimento na lista
      setState(prev => ({
        ...prev,
        enrichments: prev.enrichments.map(enrichment =>
          enrichment.document_id === documentId 
            ? response.enrichment 
            : enrichment
        ),
        currentEnrichment: response.enrichment,
        loading: false
      }))

      toast.success('Documento reenriquecido com sucesso')
      return response
    } catch (error) {
      console.error('Erro no reenriquecimento:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro no reenriquecimento do documento'
      }))
      toast.error('Erro no reenriquecimento do documento')
      throw error
    }
  }, [])

  // =============================================================================
  // GESTÃO DE ENRIQUECIMENTOS
  // =============================================================================

  const getEnrichment = useCallback(async (documentId: string): Promise<DocumentEnrichment | null> => {
    try {
      const enrichment = await documentEnrichmentService.getDocumentEnrichment(documentId)
      
      if (enrichment) {
        setState(prev => ({
          ...prev,
          currentEnrichment: enrichment
        }))
      }

      return enrichment
    } catch (error) {
      console.error('Erro ao buscar enriquecimento:', error)
      return null
    }
  }, [])

  const updateEnrichment = useCallback(async (
    enrichmentId: string, 
    updates: Partial<DocumentEnrichment>
  ): Promise<void> => {
    try {
      const updatedEnrichment = await documentEnrichmentService.updateEnrichment(
        enrichmentId,
        updates
      )

      // Atualizar na lista
      setState(prev => ({
        ...prev,
        enrichments: prev.enrichments.map(enrichment =>
          enrichment.id === enrichmentId 
            ? updatedEnrichment 
            : enrichment
        ),
        currentEnrichment: prev.currentEnrichment?.id === enrichmentId 
          ? updatedEnrichment 
          : prev.currentEnrichment
      }))

      toast.success('Enriquecimento atualizado com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar enriquecimento:', error)
      toast.error('Erro ao atualizar enriquecimento')
      throw error
    }
  }, [])

  const getEnrichments = useCallback(async (filters?: EnrichmentFilters) => {
    try {
      const enrichments = await documentEnrichmentService.getEnrichments(
        filters || state.filters
      )
      
      setState(prev => ({
        ...prev,
        enrichments,
        filters: filters || prev.filters
      }))
    } catch (error) {
      console.error('Erro ao buscar enriquecimentos:', error)
      setState(prev => ({
        ...prev,
        error: 'Erro ao buscar enriquecimentos'
      }))
    }
  }, [state.filters])

  // =============================================================================
  // BUSCA E FILTRAGEM
  // =============================================================================

  const searchByTopicos = useCallback(async (topicos: string[]): Promise<DocumentEnrichment[]> => {
    try {
      const results = await documentEnrichmentService.searchByTopicos(topicos, organizationId)
      return results
    } catch (error) {
      console.error('Erro na busca por tópicos:', error)
      return []
    }
  }, [organizationId])

  const searchByTitulo = useCallback(async (titulo: string): Promise<DocumentEnrichment[]> => {
    try {
      const results = await documentEnrichmentService.searchByTitulo(titulo, organizationId)
      return results
    } catch (error) {
      console.error('Erro na busca por título:', error)
      return []
    }
  }, [organizationId])

  // =============================================================================
  // ESTATÍSTICAS
  // =============================================================================

  const loadStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loadingStats: true }))

      const stats = await documentEnrichmentService.getEnrichmentStats(organizationId)
      
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
        error: 'Erro ao carregar estatísticas'
      }))
    }
  }, [organizationId])

  // =============================================================================
  // FILTROS
  // =============================================================================

  const setFilters = useCallback((filters: EnrichmentFilters) => {
    setState(prev => ({ ...prev, filters }))
  }, [])

  const clearFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: {} }))
  }, [])

  // =============================================================================
  // RETORNO
  // =============================================================================

  return {
    // Estado
    enrichments: state.enrichments,
    currentEnrichment: state.currentEnrichment,
    stats: state.stats,
    loading: state.loading,
    loadingStats: state.loadingStats,
    error: state.error,
    filters: state.filters,

    // Ações
    enrichDocument,
    forceRegenerate,
    getEnrichment,
    updateEnrichment,
    getEnrichments,
    searchByTopicos,
    searchByTitulo,
    loadStats,
    setFilters,
    clearFilters,
    refreshEnrichments
  }
} 