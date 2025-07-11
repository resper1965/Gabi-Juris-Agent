import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  FileText, 
  Search, 
  Filter, 
  Brain,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  Settings,
  Eye,
  Edit,
  Copy,
  ExternalLink,
  Tag,
  Globe,
  BookOpen,
  Users,
  Zap,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Sparkles,
  FileType,
  Languages,
  Target,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { useDocumentEnrichment } from '@/hooks/useDocumentEnrichment'
import { DocumentEnrichment, EnrichmentFilters } from '@/services/documentEnrichmentService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface DocumentEnrichmentProps {
  organizationId: string
  className?: string
}

interface EnrichmentCardProps {
  enrichment: DocumentEnrichment
  onEdit: () => void
  onView: () => void
  onRegenerate: () => void
}

interface EnrichmentEditProps {
  enrichment: DocumentEnrichment
  onSave: (updates: Partial<DocumentEnrichment>) => void
  onClose: () => void
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function DocumentEnrichment({ organizationId, className }: DocumentEnrichmentProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEnrichment, setSelectedEnrichment] = useState<DocumentEnrichment | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // =============================================================================
  // HOOKS
  // =============================================================================

  const {
    enrichments,
    currentEnrichment,
    stats,
    loading,
    loadingStats,
    error,
    filters,
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
  } = useDocumentEnrichment({
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

  const handleEnrichmentSelect = (enrichment: DocumentEnrichment) => {
    setSelectedEnrichment(enrichment)
  }

  const handleEditEnrichment = async (enrichmentId: string, updates: Partial<DocumentEnrichment>) => {
    try {
      await updateEnrichment(enrichmentId, updates)
      setShowEditDialog(false)
    } catch (error) {
      console.error('Erro ao editar enriquecimento:', error)
    }
  }

  const handleForceRegenerate = async (documentId: string) => {
    try {
      await forceRegenerate(documentId)
    } catch (error) {
      console.error('Erro ao regenerar enriquecimento:', error)
    }
  }

  const handleFilterChange = (key: keyof EnrichmentFilters, value: any) => {
    setFilters({ ...filters, [key]: value })
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    getEnrichments()
  }

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderFilters = () => (
    <div className="space-y-4 p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filtros de Enriquecimento</h3>
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
            <label className="text-sm font-medium">Idioma</label>
            <Select
              value={filters.idioma || ''}
              onValueChange={(value) => handleFilterChange('idioma', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="pt-BR">Português</SelectItem>
                <SelectItem value="en">Inglês</SelectItem>
                <SelectItem value="es">Espanhol</SelectItem>
                <SelectItem value="fr">Francês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Confiança Mínima</label>
            <Select
              value={filters.confianca_minima?.toString() || ''}
              onValueChange={(value) => handleFilterChange('confianca_minima', value ? parseFloat(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer</SelectItem>
                <SelectItem value="0.8">Alta (80%+)</SelectItem>
                <SelectItem value="0.6">Média (60%+)</SelectItem>
                <SelectItem value="0.4">Baixa (40%+)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Títulos Duplicados</label>
            <Select
              value={filters.duplicado_titulo?.toString() || ''}
              onValueChange={(value) => handleFilterChange('duplicado_titulo', value === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="true">Duplicados</SelectItem>
                <SelectItem value="false">Únicos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Período</label>
            <div className="space-y-2">
              <Input
                type="date"
                placeholder="Data início"
                value={filters.data_inicio || ''}
                onChange={(e) => handleFilterChange('data_inicio', e.target.value || undefined)}
              />
              <Input
                type="date"
                placeholder="Data fim"
                value={filters.data_fim || ''}
                onChange={(e) => handleFilterChange('data_fim', e.target.value || undefined)}
              />
            </div>
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
          onClick={refreshEnrichments}
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
              <Sparkles className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enriquecidos</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.enriched_documents}
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
                  {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.pending_enrichment}
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

  const renderEnrichmentCard = ({ 
    enrichment, 
    onEdit, 
    onView, 
    onRegenerate 
  }: EnrichmentCardProps) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium mb-1 line-clamp-2">
              {enrichment.titulo}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Enriquecido em {new Date(enrichment.data_geracao).toLocaleDateString('pt-BR')}
            </p>
          </div>
          
          <div className="flex items-center space-x-1">
            <Badge variant="outline">
              {enrichment.idioma}
            </Badge>
            <Badge 
              variant={enrichment.confianca >= 0.8 ? 'default' : 
                      enrichment.confianca >= 0.6 ? 'secondary' : 'destructive'}
            >
              {Math.round(enrichment.confianca * 100)}% confiança
            </Badge>
            {enrichment.duplicado_titulo && (
              <Badge variant="destructive">
                Duplicado
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-3">
          <div>
            <span className="text-xs font-medium text-gray-500">Sumário:</span>
            <p className="text-sm mt-1 line-clamp-3">
              {enrichment.sumario}
            </p>
          </div>

          <div>
            <span className="text-xs font-medium text-gray-500">Tópicos-chave:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {enrichment.topicos.slice(0, 6).map((topico, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {topico}
                </Badge>
              ))}
              {enrichment.topicos.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{enrichment.topicos.length - 6}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium text-gray-500">Modelo:</span> {enrichment.modelo_utilizado}
            </div>
            <div>
              <span className="font-medium text-gray-500">Tempo:</span> {enrichment.metadata.processing_time}ms
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="w-3 h-3 mr-1" />
              Editar
            </Button>
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
              onClick={onRegenerate}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(enrichment.titulo)}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderEnrichmentEdit = ({ 
    enrichment, 
    onSave, 
    onClose 
  }: EnrichmentEditProps) => (
    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Enriquecimento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Título</label>
            <Input
              value={enrichment.titulo}
              onChange={(e) => setSelectedEnrichment(prev => 
                prev ? { ...prev, titulo: e.target.value } : null
              )}
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              {enrichment.titulo.length}/100 caracteres
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Sumário</label>
            <Textarea
              value={enrichment.sumario}
              onChange={(e) => setSelectedEnrichment(prev => 
                prev ? { ...prev, sumario: e.target.value } : null
              )}
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tópicos-chave</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {enrichment.topicos.map((topico, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {topico}
                  <button
                    onClick={() => {
                      const newTopicos = enrichment.topicos.filter((_, i) => i !== index)
                      setSelectedEnrichment(prev => 
                        prev ? { ...prev, topicos: newTopicos } : null
                      )
                    }}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Adicionar novo tópico"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const newTopico = e.currentTarget.value.trim()
                  setSelectedEnrichment(prev => 
                    prev ? { ...prev, topicos: [...prev.topicos, newTopico] } : null
                  )
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  if (selectedEnrichment) {
                    onSave({
                      titulo: selectedEnrichment.titulo,
                      sumario: selectedEnrichment.sumario,
                      topicos: selectedEnrichment.topicos
                    })
                  }
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Salvar
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
          <h2 className="text-2xl font-bold">Enriquecimento Semântico</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Geração automática de título, sumário e tópicos-chave
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
          placeholder="Buscar enriquecimentos..."
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
          <TabsTrigger value="all">Todos ({enrichments.length})</TabsTrigger>
          <TabsTrigger value="high-confidence">Alta Confiança ({stats?.high_confidence || 0})</TabsTrigger>
          <TabsTrigger value="low-confidence">Baixa Confiança ({stats?.low_confidence || 0})</TabsTrigger>
          <TabsTrigger value="duplicates">Duplicados ({stats?.duplicate_titles || 0})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Lista de enriquecimentos */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : enrichments.length === 0 ? (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Nenhum enriquecimento encontrado
          </h3>
          <p className="text-gray-500">
            Nenhum documento foi enriquecido com os filtros aplicados
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {enrichments.map((enrichment) => (
            <div key={enrichment.id}>
              {renderEnrichmentCard({
                enrichment,
                onEdit: () => {
                  setSelectedEnrichment(enrichment)
                  setShowEditDialog(true)
                },
                onView: () => {
                  setSelectedEnrichment(enrichment)
                },
                onRegenerate: () => {
                  handleForceRegenerate(enrichment.document_id)
                }
              })}
            </div>
          ))}
        </div>
      )}

      {/* Dialog de edição */}
      {selectedEnrichment && showEditDialog && (
        renderEnrichmentEdit({
          enrichment: selectedEnrichment,
          onSave: (updates) => handleEditEnrichment(selectedEnrichment.id, updates),
          onClose: () => setShowEditDialog(false)
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