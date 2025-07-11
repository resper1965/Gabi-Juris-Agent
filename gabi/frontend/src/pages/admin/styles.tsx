import React, { useState, useEffect } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { 
  Palette, 
  Plus, 
  Brain, 
  Edit, 
  Trash2, 
  Eye,
  Play,
  Pause,
  Settings,
  Download,
  Upload,
  Search,
  Filter,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  FileText,
  Database,
  Sparkles,
  Copy,
  Star,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/AdminLayout'
import { useGabiBases } from '@/hooks/useGabiChat'
import { gabiApiService } from '@/services/gabiApiService'
import { 
  StyleConfig, 
  getStyleDisplayName, 
  getStyleDescription, 
  getStyleIcon 
} from '@/services/styleInheritanceService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface StylesPageProps {}

interface StyleFormData {
  name: string
  description: string
  type: StyleConfig['type']
  vocabulary_complexity: 'baixo' | 'medio' | 'alto'
  tone: 'formal' | 'neutro' | 'informal'
  structure_preference: 'paragrafos_curtos' | 'paragrafos_medios' | 'paragrafos_longos'
  custom_prompt: string
  is_default: boolean
  is_active: boolean
  base_id?: string // Para estilos inferidos
}

interface StyleTrainingStatus {
  style_id: string
  status: 'idle' | 'training' | 'completed' | 'error'
  progress: number
  error_message?: string
  created_at: string
  base_id?: string
}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const StylesPage: NextPage<StylesPageProps> = () => {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTrainDialog, setShowTrainDialog] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<StyleConfig | null>(null)
  const [styles, setStyles] = useState<StyleConfig[]>([])
  const [trainingStatuses, setTrainingStatuses] = useState<Record<string, StyleTrainingStatus>>({})
  const [loading, setLoading] = useState(false)

  // =============================================================================
  // HOOKS DE DADOS
  // =============================================================================

  const { bases, loading: basesLoading, refreshBases } = useGabiBases(
    user?.organization_id || ''
  )

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    if (user?.organization_id) {
      loadStyles()
    }
  }, [user?.organization_id])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadStyles = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento de estilos - em produção viria da API
      const mockStyles: StyleConfig[] = [
        {
          type: 'juridico',
          name: 'Estilo Jurídico Formal',
          description: 'Linguagem técnica e formal para documentos legais',
          vocabulary_complexity: 'alto',
          tone: 'formal',
          structure_preference: 'paragrafos_medios',
          custom_prompt: 'Responda de forma técnica e formal, utilizando terminologia jurídica apropriada.',
          confidence_score: 0.95,
          created_at: new Date().toISOString()
        },
        {
          type: 'didatico',
          name: 'Estilo Didático Paineiras',
          description: 'Estilo educacional inspirado na base Paineiras',
          vocabulary_complexity: 'medio',
          tone: 'neutro',
          structure_preference: 'paragrafos_curtos',
          custom_prompt: 'Explique de forma clara e didática, com exemplos práticos.',
          confidence_score: 0.88,
          base_id: 'paineiras',
          created_at: new Date().toISOString()
        },
        {
          type: 'institucional',
          name: 'Estilo Institucional ESG',
          description: 'Tom institucional para comunicação ESG',
          vocabulary_complexity: 'medio',
          tone: 'formal',
          structure_preference: 'paragrafos_medios',
          custom_prompt: 'Comunique de forma institucional e profissional, focando em sustentabilidade.',
          confidence_score: 0.92,
          base_id: 'esg',
          created_at: new Date().toISOString()
        }
      ]

      setStyles(mockStyles)
    } catch (error) {
      console.error('Erro ao carregar estilos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStyle = async (formData: StyleFormData) => {
    try {
      // Simular criação - em produção seria uma chamada para a API
      const newStyle: StyleConfig = {
        type: formData.type,
        name: formData.name,
        description: formData.description,
        vocabulary_complexity: formData.vocabulary_complexity,
        tone: formData.tone,
        structure_preference: formData.structure_preference,
        custom_prompt: formData.custom_prompt,
        confidence_score: 1.0,
        created_at: new Date().toISOString()
      }

      setStyles(prev => [...prev, newStyle])
      toast.success('Estilo criado com sucesso!')
      setShowCreateDialog(false)
    } catch (error) {
      toast.error('Erro ao criar estilo')
    }
  }

  const handleTrainStyle = async (baseId: string, styleName: string) => {
    try {
      const trainingId = `training_${Date.now()}`
      
      // Simular início do treinamento
      setTrainingStatuses(prev => ({
        ...prev,
        [trainingId]: {
          style_id: trainingId,
          status: 'training',
          progress: 0,
          base_id: baseId,
          created_at: new Date().toISOString()
        }
      }))

      toast.success('Treinamento de estilo iniciado!')

      // Simular progresso do treinamento
      const interval = setInterval(() => {
        setTrainingStatuses(prev => {
          const current = prev[trainingId]
          if (!current) return prev

          const newProgress = Math.min(current.progress + 10, 100)
          const newStatus = newProgress === 100 ? 'completed' : 'training'

          if (newStatus === 'completed') {
            clearInterval(interval)
            
            // Adicionar estilo treinado
            const trainedStyle: StyleConfig = {
              type: 'inspirado_em_base',
              name: styleName,
              description: `Estilo treinado da base ${baseId}`,
              vocabulary_complexity: 'medio',
              tone: 'neutro',
              structure_preference: 'paragrafos_medios',
              custom_prompt: `Responda no estilo característico da base ${baseId}.`,
              confidence_score: 0.85,
              base_id: baseId,
              created_at: new Date().toISOString()
            }

            setStyles(prev => [...prev, trainedStyle])
            toast.success('Estilo treinado com sucesso!')
          }

          return {
            ...prev,
            [trainingId]: {
              ...current,
              status: newStatus,
              progress: newProgress
            }
          }
        })
      }, 500)

    } catch (error) {
      toast.error('Erro ao iniciar treinamento')
    }
  }

  const handleToggleStyle = async (styleId: string, isActive: boolean) => {
    try {
      setStyles(prev => prev.map(style => 
        style.name === styleId 
          ? { ...style, is_active: isActive }
          : style
      ))
      toast.success(`Estilo ${isActive ? 'ativado' : 'desativado'} com sucesso!`)
    } catch (error) {
      toast.error('Erro ao alterar status do estilo')
    }
  }

  const handleSetDefault = async (styleId: string) => {
    try {
      setStyles(prev => prev.map(style => ({
        ...style,
        is_default: style.name === styleId
      })))
      toast.success('Estilo padrão definido com sucesso!')
    } catch (error) {
      toast.error('Erro ao definir estilo padrão')
    }
  }

  const handleDeleteStyle = async (styleId: string) => {
    try {
      setStyles(prev => prev.filter(style => style.name !== styleId))
      toast.success('Estilo excluído com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir estilo')
    }
  }

  // =============================================================================
  // FILTROS E BUSCA
  // =============================================================================

  const filteredStyles = styles.filter(style => {
    const matchesSearch = style.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         style.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || style.type === typeFilter
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && style.is_active !== false) ||
                         (statusFilter === 'inactive' && style.is_active === false)
    
    return matchesSearch && matchesType && matchesStatus
  })

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderFilters = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Buscar estilos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="juridico">Jurídico</SelectItem>
                <SelectItem value="didatico">Didático</SelectItem>
                <SelectItem value="institucional">Institucional</SelectItem>
                <SelectItem value="inspirado_em_base">Inferido</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end space-x-2">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Estilo
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTrainDialog(true)}
            >
              <Brain className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderStyleCard = (style: StyleConfig) => {
    const isTraining = Object.values(trainingStatuses).some(
      status => status.base_id === style.base_id && status.status === 'training'
    )

    return (
      <Card key={style.name} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">{getStyleIcon(style.type)}</span>
              </div>
              <div>
                <h3 className="font-semibold">{style.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {style.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {style.is_default && (
                <Badge variant="default">
                  <Star className="w-3 h-3 mr-1" />
                  Padrão
                </Badge>
              )}
              <Badge variant={style.is_active !== false ? "default" : "secondary"}>
                {style.is_active !== false ? 'Ativo' : 'Inativo'}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {style.type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Características */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Complexidade:</span>
                <span className="ml-2 font-medium capitalize">
                  {style.vocabulary_complexity}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Tom:</span>
                <span className="ml-2 font-medium capitalize">
                  {style.tone}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Confiança:</span>
                <span className="ml-2 font-medium">
                  {Math.round((style.confidence_score || 0) * 100)}%
                </span>
              </div>
            </div>

            {/* Base de origem */}
            {style.base_id && (
              <div className="flex items-center space-x-2 text-sm">
                <Database className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Inferido da base:</span>
                <span className="font-medium">{style.base_id}</span>
              </div>
            )}

            {/* Prompt personalizado */}
            {style.custom_prompt && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium mb-1">Prompt Personalizado:</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {style.custom_prompt}
                </p>
              </div>
            )}

            {/* Status de treinamento */}
            {isTraining && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Brain className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span>Treinando...</span>
                </div>
                <Progress value={Object.values(trainingStatuses).find(
                  status => status.base_id === style.base_id
                )?.progress || 0} />
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStyle(style)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(style.custom_prompt || '')}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                {!style.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(style.name || '')}
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStyle(style.name || '', style.is_active === false)}
                >
                  {style.is_active !== false ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStyle(style)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteStyle(style.name || '')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderStyleList = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredStyles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhum estilo encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Crie seu primeiro estilo de redação'
              }
            </p>
            {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
              <div className="flex items-center justify-center space-x-2">
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Estilo
                </Button>
                <Button variant="outline" onClick={() => setShowTrainDialog(true)}>
                  <Brain className="w-4 h-4 mr-2" />
                  Treinar da Base
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStyles.map(renderStyleCard)}
        </div>
      )}
    </div>
  )

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  if (authLoading) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Estilos de Redação</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie os estilos de redação e treine novos estilos a partir de bases
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={loadStyles}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Filtros */}
          {renderFilters()}

          {/* Lista de Estilos */}
          {renderStyleList()}

          {/* Diálogo de Criação/Edição */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedStyle ? 'Editar Estilo' : 'Novo Estilo de Redação'}
                </DialogTitle>
              </DialogHeader>
              <StyleForm
                style={selectedStyle}
                onSubmit={handleCreateStyle}
                onCancel={() => {
                  setShowCreateDialog(false)
                  setSelectedStyle(null)
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Diálogo de Treinamento */}
          <Dialog open={showTrainDialog} onOpenChange={setShowTrainDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Treinar Estilo da Base</DialogTitle>
              </DialogHeader>
              <TrainStyleForm
                bases={bases}
                onSubmit={handleTrainStyle}
                onCancel={() => setShowTrainDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}

// =============================================================================
// COMPONENTE DE FORMULÁRIO DE ESTILO
// =============================================================================

interface StyleFormProps {
  style?: StyleConfig | null
  onSubmit: (data: StyleFormData) => Promise<void>
  onCancel: () => void
}

function StyleForm({ style, onSubmit, onCancel }: StyleFormProps) {
  const [formData, setFormData] = useState<StyleFormData>({
    name: style?.name || '',
    description: style?.description || '',
    type: style?.type || 'custom',
    vocabulary_complexity: style?.vocabulary_complexity || 'medio',
    tone: style?.tone || 'neutro',
    structure_preference: style?.structure_preference || 'paragrafos_medios',
    custom_prompt: style?.custom_prompt || '',
    is_default: style?.is_default || false,
    is_active: style?.is_active !== false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Estilo</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="juridico">Jurídico</SelectItem>
              <SelectItem value="didatico">Didático</SelectItem>
              <SelectItem value="institucional">Institucional</SelectItem>
              <SelectItem value="comercial">Comercial</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="vocabulary">Complexidade do Vocabulário</Label>
          <Select value={formData.vocabulary_complexity} onValueChange={(value: any) => setFormData({ ...formData, vocabulary_complexity: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixo">Baixo</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tone">Tom</Label>
          <Select value={formData.tone} onValueChange={(value: any) => setFormData({ ...formData, tone: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="neutro">Neutro</SelectItem>
              <SelectItem value="informal">Informal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="structure">Preferência de Estrutura</Label>
          <Select value={formData.structure_preference} onValueChange={(value: any) => setFormData({ ...formData, structure_preference: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paragrafos_curtos">Parágrafos Curtos</SelectItem>
              <SelectItem value="paragrafos_medios">Parágrafos Médios</SelectItem>
              <SelectItem value="paragrafos_longos">Parágrafos Longos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="prompt">Prompt Personalizado</Label>
        <Textarea
          id="prompt"
          value={formData.custom_prompt}
          onChange={(e) => setFormData({ ...formData, custom_prompt: e.target.value })}
          rows={4}
          placeholder="Instruções específicas para o estilo de redação..."
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          <Label htmlFor="is_active">Estilo ativo</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_default"
            checked={formData.is_default}
            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
          />
          <Label htmlFor="is_default">Estilo padrão da organização</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {style ? 'Atualizar' : 'Criar'} Estilo
        </Button>
      </div>
    </form>
  )
}

// =============================================================================
// COMPONENTE DE FORMULÁRIO DE TREINAMENTO
// =============================================================================

interface TrainStyleFormProps {
  bases: any[]
  onSubmit: (baseId: string, styleName: string) => Promise<void>
  onCancel: () => void
}

function TrainStyleForm({ bases, onSubmit, onCancel }: TrainStyleFormProps) {
  const [selectedBase, setSelectedBase] = useState('')
  const [styleName, setStyleName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedBase && styleName) {
      await onSubmit(selectedBase, styleName)
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="base">Base de Conhecimento</Label>
        <Select value={selectedBase} onValueChange={setSelectedBase}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma base" />
          </SelectTrigger>
          <SelectContent>
            {bases.map((base) => (
              <SelectItem key={base.id} value={base.id}>
                {base.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="styleName">Nome do Estilo</Label>
        <Input
          id="styleName"
          value={styleName}
          onChange={(e) => setStyleName(e.target.value)}
          placeholder="Ex: Estilo Jurídico Paineiras"
          required
        />
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          O sistema analisará o conteúdo da base selecionada e criará um estilo 
          personalizado baseado nas características de escrita encontradas.
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!selectedBase || !styleName}>
          <Brain className="w-4 h-4 mr-2" />
          Iniciar Treinamento
        </Button>
      </div>
    </form>
  )
}

export default StylesPage 