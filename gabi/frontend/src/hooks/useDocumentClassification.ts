import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { 
  documentClassificationService, 
  DocumentClassification, 
  ClassificationRequest,
  ClassificationResponse,
  ClassificationFilters,
  ClassificationStats
} from '@/services/documentClassificationService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface UseDocumentClassificationOptions {
  organizationId: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface ClassificationState {
  classifications: DocumentClassification[]
  currentClassification: DocumentClassification | null
  stats: ClassificationStats | null
  pendingReviews: DocumentClassification[]
  loading: boolean
  loadingStats: boolean
  loadingReviews: boolean
  error: string | null
  filters: ClassificationFilters
}

interface ClassificationActions {
  // Classificação automática
  classifyDocument: (request: ClassificationRequest) => Promise<ClassificationResponse>
  forceReclassify: (documentId: string) => Promise<ClassificationResponse>
  
  // Gestão de classificações
  getClassification: (documentId: string) => Promise<DocumentClassification | null>
  updateClassification: (classificationId: string, updates: Partial<DocumentClassification>) => Promise<void>
  getClassifications: (filters?: ClassificationFilters) => Promise<void>
  
  // Validação assistida
  getPendingReviews: () => Promise<void>
  approveClassification: (classificationId: string, approvedData: Partial<DocumentClassification>) => Promise<void>
  rejectClassification: (classificationId: string, reason: string) => Promise<void>
  
  // Estatísticas
  loadStats: () => Promise<void>
  
  // Filtros
  setFilters: (filters: ClassificationFilters) => void
  clearFilters: () => void
  
  // Utilitários
  refreshClassifications: () => Promise<void>
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useDocumentClassification(options: UseDocumentClassificationOptions): ClassificationState & ClassificationActions {
  const {
    organizationId,
    autoRefresh = true,
    refreshInterval = 60000 // 1 minuto
  } = options

  // =============================================================================
  // ESTADO
  // =============================================================================

  const [state, setState] = useState<ClassificationState>({
    classifications: [],
    currentClassification: null,
    stats: null,
    pendingReviews: [],
    loading: false,
    loadingStats: false,
    loadingReviews: false,
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
        refreshClassifications()
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
        getClassifications(),
        loadStats(),
        getPendingReviews()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
      setState(prev => ({
        ...prev,
        error: 'Erro ao carregar classificações'
      }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const refreshClassifications = async () => {
    try {
      await getClassifications(state.filters)
    } catch (error) {
      console.error('Erro ao atualizar classificações:', error)
    }
  }

  // =============================================================================
  // CLASSIFICAÇÃO AUTOMÁTICA
  // =============================================================================

  const classifyDocument = useCallback(async (request: ClassificationRequest): Promise<ClassificationResponse> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const response = await documentClassificationService.classifyDocument(request)

      // Atualizar lista de classificações
      setState(prev => ({
        ...prev,
        classifications: [response.classification, ...prev.classifications],
        currentClassification: response.classification,
        loading: false
      }))

      // Mostrar warnings se houver
      if (response.warnings && response.warnings.length > 0) {
        response.warnings.forEach(warning => {
          toast.warning(warning)
        })
      }

      toast.success('Documento classificado com sucesso')
      return response
    } catch (error) {
      console.error('Erro na classificação:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro na classificação do documento'
      }))
      toast.error('Erro na classificação do documento')
      throw error
    }
  }, [])

  const forceReclassify = useCallback(async (documentId: string): Promise<ClassificationResponse> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const response = await documentClassificationService.classifyDocument({
        document_id: documentId,
        content: '', // Será obtido do documento
        force_reclassification: true
      })

      // Atualizar classificação na lista
      setState(prev => ({
        ...prev,
        classifications: prev.classifications.map(classification =>
          classification.document_id === documentId 
            ? response.classification 
            : classification
        ),
        currentClassification: response.classification,
        loading: false
      }))

      toast.success('Documento reclassificado com sucesso')
      return response
    } catch (error) {
      console.error('Erro na reclassificação:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro na reclassificação do documento'
      }))
      toast.error('Erro na reclassificação do documento')
      throw error
    }
  }, [])

  // =============================================================================
  // GESTÃO DE CLASSIFICAÇÕES
  // =============================================================================

  const getClassification = useCallback(async (documentId: string): Promise<DocumentClassification | null> => {
    try {
      const classification = await documentClassificationService.getDocumentClassification(documentId)
      
      if (classification) {
        setState(prev => ({
          ...prev,
          currentClassification: classification
        }))
      }

      return classification
    } catch (error) {
      console.error('Erro ao buscar classificação:', error)
      return null
    }
  }, [])

  const updateClassification = useCallback(async (
    classificationId: string, 
    updates: Partial<DocumentClassification>
  ): Promise<void> => {
    try {
      const updatedClassification = await documentClassificationService.updateClassification(
        classificationId,
        updates
      )

      // Atualizar na lista
      setState(prev => ({
        ...prev,
        classifications: prev.classifications.map(classification =>
          classification.id === classificationId 
            ? updatedClassification 
            : classification
        ),
        currentClassification: prev.currentClassification?.id === classificationId 
          ? updatedClassification 
          : prev.currentClassification
      }))

      toast.success('Classificação atualizada com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar classificação:', error)
      toast.error('Erro ao atualizar classificação')
      throw error
    }
  }, [])

  const getClassifications = useCallback(async (filters?: ClassificationFilters) => {
    try {
      const classifications = await documentClassificationService.getClassifications(
        filters || state.filters
      )
      
      setState(prev => ({
        ...prev,
        classifications,
        filters: filters || prev.filters
      }))
    } catch (error) {
      console.error('Erro ao buscar classificações:', error)
      setState(prev => ({
        ...prev,
        error: 'Erro ao buscar classificações'
      }))
    }
  }, [state.filters])

  // =============================================================================
  // VALIDAÇÃO ASSISTIDA
  // =============================================================================

  const getPendingReviews = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loadingReviews: true }))

      const pendingReviews = await documentClassificationService.getPendingReviews(organizationId)
      
      setState(prev => ({
        ...prev,
        pendingReviews,
        loadingReviews: false
      }))
    } catch (error) {
      console.error('Erro ao buscar revisões pendentes:', error)
      setState(prev => ({
        ...prev,
        loadingReviews: false,
        error: 'Erro ao buscar revisões pendentes'
      }))
    }
  }, [organizationId])

  const approveClassification = useCallback(async (
    classificationId: string,
    approvedData: Partial<DocumentClassification>
  ): Promise<void> => {
    try {
      await documentClassificationService.approveClassification(classificationId, approvedData)

      // Remover das revisões pendentes
      setState(prev => ({
        ...prev,
        pendingReviews: prev.pendingReviews.filter(
          review => review.id !== classificationId
        )
      }))

      // Atualizar na lista principal
      await getClassifications()
    } catch (error) {
      console.error('Erro ao aprovar classificação:', error)
      throw error
    }
  }, [getClassifications])

  const rejectClassification = useCallback(async (
    classificationId: string,
    reason: string
  ): Promise<void> => {
    try {
      await documentClassificationService.rejectClassification(classificationId, reason)

      // Remover das revisões pendentes
      setState(prev => ({
        ...prev,
        pendingReviews: prev.pendingReviews.filter(
          review => review.id !== classificationId
        )
      }))

      // Atualizar na lista principal
      await getClassifications()
    } catch (error) {
      console.error('Erro ao rejeitar classificação:', error)
      throw error
    }
  }, [getClassifications])

  // =============================================================================
  // ESTATÍSTICAS
  // =============================================================================

  const loadStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loadingStats: true }))

      const stats = await documentClassificationService.getClassificationStats(organizationId)
      
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

  const setFilters = useCallback((filters: ClassificationFilters) => {
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
    classifications: state.classifications,
    currentClassification: state.currentClassification,
    stats: state.stats,
    pendingReviews: state.pendingReviews,
    loading: state.loading,
    loadingStats: state.loadingStats,
    loadingReviews: state.loadingReviews,
    error: state.error,
    filters: state.filters,

    // Ações
    classifyDocument,
    forceReclassify,
    getClassification,
    updateClassification,
    getClassifications,
    getPendingReviews,
    approveClassification,
    rejectClassification,
    loadStats,
    setFilters,
    clearFilters,
    refreshClassifications
  }
} 