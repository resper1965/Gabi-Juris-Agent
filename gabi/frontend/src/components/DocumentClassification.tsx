import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Search, 
  Filter, 
  Brain,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  Settings,
  Eye,
  Edit,
  Copy,
  ExternalLink,
  Shield,
  Tag,
  Globe,
  BookOpen,
  Users,
  Zap,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import { useDocumentClassification } from '@/hooks/useDocumentClassification'
import { DocumentClassification, ClassificationFilters } from '@/services/documentClassificationService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface DocumentClassificationProps {
  organizationId: string
  className?: string
}

interface ClassificationCardProps {
  classification: DocumentClassification
  onApprove: () => void
  onReject: () => void
  onEdit: () => void
  onView: () => void
}

interface ClassificationReviewProps {
  classification: DocumentClassification
  onApprove: (data: Partial<DocumentClassification>) => void
  onReject: (reason: string) => void
  onClose: () => void
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function DocumentClassification({ organizationId, className }: DocumentClassificationProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [selectedClassification, setSelectedClassification] = useState<DocumentClassification | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // =============================================================================
  // HOOKS
  // =============================================================================

  const {
    classifications,
    currentClassification,
    stats,
    pendingReviews,
    loading,
    loadingStats,
    loadingReviews,
    error,
    filters,
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
  } = useDocumentClassification({
    organizationId,
    autoRefresh: true
  })

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    if (searchQuery) {
      // Implementar busca por texto
      console.log('Buscar:', searchQuery)
    }
  }, [searchQuery])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleClassificationSelect = (classification: DocumentClassification) => {
    setSelectedClassification(classification)
  }

  const handleApproveClassification = async (classificationId: string) => {
    try {
      await approveClassification(classificationId, {})
      setShowReviewDialog(false)
    } catch (error) {
      console.error('Erro ao aprovar classificação:', error)
    }
  }

  const handleRejectClassification = async (classificationId: string, reason: string) => {
    try {
      await rejectClassification(classificationId, reason)
      setShowReviewDialog(false)
    } catch (error) {
      console.error('Erro ao rejeitar classificação:', error)
    }
  }

  const handleForceReclassify = async (documentId: string) => {
    try {
      await forceReclassify(documentId)
    } catch (error) {
      console.error('Erro ao reclassificar:', error)
    }
  }

  const handleFilterChange = (key: keyof ClassificationFilters, value: any) => {
    setFilters({ ...filters, [key]: value })
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'pending') {
      getPendingReviews()
    } else {
      getClassifications()
    }
  }

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderFilters = () => (
    <div className="space-y-4 p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filtros de Classificação</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">Confidencialidade</label>
            <Select
              value={filters.confidencialidade?.[0] || ''}
              onValueChange={(value) => handleFilterChange('confidencialidade', value ? [value] : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Estilo</label>
            <Select
              value={filters.estilo?.[0] || ''}
              onValueChange={(value) => handleFilterChange('estilo', value ? [value] : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="juridico">Jurídico</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="didatico">Didático</SelectItem>
                <SelectItem value="informal">Informal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Área</label>
            <Select
              value={filters.area || ''}
              onValueChange={(value) => handleFilterChange('area', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="tecnologia">Tecnologia</SelectItem>
                <SelectItem value="juridico">Jurídico</SelectItem>
                <SelectItem value="rh">Recursos Humanos</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Nível Técnico</label>
            <Select
              value={filters.nivel_tecnico?.[0] || ''}
              onValueChange={(value) => handleFilterChange('nivel_tecnico', value ? [value] : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="basico">Básico</SelectItem>
                <SelectItem value="intermediario">Intermediário</SelectItem>
                <SelectItem value="avancado">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
        >
          Limpar filtros
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshClassifications}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
    </div>
  )

  const renderStats = () => {
    if (!stats) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Documentos</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.total_documents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Classificados</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.classified_documents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.pending_review}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alta Confiança</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.high_confidence}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderClassificationCard = ({ 
    classification, 
    onApprove, 
    onReject, 
    onEdit, 
    onView 
  }: ClassificationCardProps) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium mb-1">
              Documento {classification.document_id.substring(0, 8)}...
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Classificado em {new Date(classification.data_classificacao).toLocaleDateString('pt-BR')}
            </p>
          </div>
          
          <div className="flex items-center space-x-1">
            <Badge 
              variant={classification.confidencialidade === 'alta' ? 'destructive' : 
                      classification.confidencialidade === 'media' ? 'default' : 'secondary'}
            >
              {classification.confidencialidade}
            </Badge>
            <Badge variant="outline">
              {classification.confianca >= 0.8 ? 'Alta' : 
               classification.confianca >= 0.6 ? 'Média' : 'Baixa'} confiança
            </Badge>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div>
            <span className="text-xs font-medium text-gray-500">Bases sugeridas:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {classification.bases_sugeridas.map((base, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {base}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-gray-500">Tags:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {classification.tags.slice(0, 5).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {classification.tags.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{classification.tags.length - 5}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium text-gray-500">Estilo:</span> {classification.estilo}
            </div>
            <div>
              <span className="font-medium text-gray-500">Área:</span> {classification.area}
            </div>
            <div>
              <span className="font-medium text-gray-500">Nível:</span> {classification.nivel_tecnico}
            </div>
            <div>
              <span className="font-medium text-gray-500">Idioma:</span> {classification.idioma}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!classification.revisado_por_humano && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onApprove}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Aprovar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReject}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Rejeitar
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onView}
            >
              <Eye className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleForceReclassify(classification.document_id)}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderClassificationReview = ({ 
    classification, 
    onApprove, 
    onReject, 
    onClose 
  }: ClassificationReviewProps) => (
    <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisar Classificação</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Bases Sugeridas</label>
              <div className="mt-1 space-y-1">
                {classification.bases_sugeridas.map((base, index) => (
                  <Badge key={index} variant="outline">
                    {base}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Confidencialidade</label>
              <div className="mt-1">
                <Badge 
                  variant={classification.confidencialidade === 'alta' ? 'destructive' : 
                          classification.confidencialidade === 'media' ? 'default' : 'secondary'}
                >
                  {classification.confidencialidade}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Tags</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {classification.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Estilo</label>
              <p className="text-sm">{classification.estilo}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Área</label>
              <p className="text-sm">{classification.area}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => onApprove({})}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
              <Button
                variant="outline"
                onClick={() => onReject('Classificação incorreta')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Classificação Automática</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema inteligente de classificação e indexação de documentos
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => loadStats()}
            disabled={loadingStats}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Estatísticas
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {renderStats()}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar classificações..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtros */}
      {renderFilters()}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">Todas ({classifications.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({pendingReviews.length})</TabsTrigger>
          <TabsTrigger value="high-confidence">Alta Confiança ({stats?.high_confidence || 0})</TabsTrigger>
          <TabsTrigger value="low-confidence">Baixa Confiança ({stats?.low_confidence || 0})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Lista de classificações */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (activeTab === 'pending' ? pendingReviews : classifications).length === 0 ? (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Nenhuma classificação encontrada
          </h3>
          <p className="text-gray-500">
            {activeTab === 'pending' 
              ? 'Não há classificações pendentes de revisão'
              : 'Nenhuma classificação foi encontrada com os filtros aplicados'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(activeTab === 'pending' ? pendingReviews : classifications).map((classification) => (
            <div key={classification.id}>
              {renderClassificationCard({
                classification,
                onApprove: () => {
                  setSelectedClassification(classification)
                  setShowReviewDialog(true)
                },
                onReject: () => {
                  setSelectedClassification(classification)
                  setShowReviewDialog(true)
                },
                onEdit: () => {
                  setSelectedClassification(classification)
                },
                onView: () => {
                  setSelectedClassification(classification)
                }
              })}
            </div>
          ))}
        </div>
      )}

      {/* Dialog de revisão */}
      {selectedClassification && showReviewDialog && (
        renderClassificationReview({
          classification: selectedClassification,
          onApprove: (data) => handleApproveClassification(selectedClassification.id),
          onReject: (reason) => handleRejectClassification(selectedClassification.id, reason),
          onClose: () => setShowReviewDialog(false)
        })
      )}

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
} 