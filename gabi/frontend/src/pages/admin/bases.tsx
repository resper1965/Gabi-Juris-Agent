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
import { 
  Database, 
  Plus, 
  RefreshCw, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Link,
  Settings,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  BarChart3,
  Zap,
  Globe,
  Cloud,
  HardDrive
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/AdminLayout'
import { useGabiBases } from '@/hooks/useGabiChat'
import { gabiApiService, GabiBase } from '@/services/gabiApiService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface BasesPageProps {}

interface BaseFormData {
  name: string
  description: string
  type: 'google_drive' | 'sharepoint' | 's3' | 'api' | 'upload'
  source_id: string
  tags: string[]
  is_active: boolean
  auto_index: boolean
  index_schedule: string
}

interface BaseStatus {
  base_id: string
  status: 'active' | 'indexing' | 'error' | 'pending'
  last_indexed: string
  document_count: number
  error_message?: string
  progress?: number
}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const BasesPage: NextPage<BasesPageProps> = () => {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedBase, setSelectedBase] = useState<GabiBase | null>(null)
  const [baseStatuses, setBaseStatuses] = useState<Record<string, BaseStatus>>({})
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
      loadBaseStatuses()
    }
  }, [user?.organization_id, bases])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadBaseStatuses = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento de status - em produção viria da API
      const statuses: Record<string, BaseStatus> = {}
      
      bases.forEach(base => {
        statuses[base.id] = {
          base_id: base.id,
          status: base.is_active ? 'active' : 'pending',
          last_indexed: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
          document_count: Math.floor(Math.random() * 1000) + 10,
          progress: Math.random() * 100
        }
      })

      setBaseStatuses(statuses)
    } catch (error) {
      console.error('Erro ao carregar status das bases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBase = async (formData: BaseFormData) => {
    try {
      // Simular criação - em produção seria uma chamada para a API
      toast.success('Base criada com sucesso!')
      setShowCreateDialog(false)
      await refreshBases()
    } catch (error) {
      toast.error('Erro ao criar base')
    }
  }

  const handleReindexBase = async (baseId: string) => {
    try {
      // Simular reindexação - em produção seria uma chamada para a API
      toast.success('Reindexação iniciada!')
      
      // Atualizar status
      setBaseStatuses(prev => ({
        ...prev,
        [baseId]: {
          ...prev[baseId],
          status: 'indexing',
          progress: 0
        }
      }))
    } catch (error) {
      toast.error('Erro ao iniciar reindexação')
    }
  }

  const handleToggleBase = async (baseId: string, isActive: boolean) => {
    try {
      // Simular toggle - em produção seria uma chamada para a API
      toast.success(`Base ${isActive ? 'ativada' : 'desativada'} com sucesso!`)
      await refreshBases()
    } catch (error) {
      toast.error('Erro ao alterar status da base')
    }
  }

  const handleDeleteBase = async (baseId: string) => {
    try {
      // Simular exclusão - em produção seria uma chamada para a API
      toast.success('Base excluída com sucesso!')
      await refreshBases()
    } catch (error) {
      toast.error('Erro ao excluir base')
    }
  }

  // =============================================================================
  // FILTROS E BUSCA
  // =============================================================================

  const filteredBases = bases.filter(base => {
    const matchesSearch = base.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         base.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && base.is_active) ||
                         (statusFilter === 'inactive' && !base.is_active)
    
    const matchesType = typeFilter === 'all' || base.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
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
                placeholder="Buscar bases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="google_drive">Google Drive</SelectItem>
                <SelectItem value="sharepoint">SharePoint</SelectItem>
                <SelectItem value="s3">S3</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Base
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderBaseCard = (base: GabiBase) => {
    const status = baseStatuses[base.id]
    
    return (
      <Card key={base.id} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                {base.type === 'google_drive' && <Globe className="w-5 h-5 text-blue-600" />}
                {base.type === 'sharepoint' && <Cloud className="w-5 h-5 text-blue-600" />}
                {base.type === 's3' && <HardDrive className="w-5 h-5 text-blue-600" />}
                {base.type === 'api' && <Link className="w-5 h-5 text-blue-600" />}
                {base.type === 'upload' && <Upload className="w-5 h-5 text-blue-600" />}
              </div>
              <div>
                <h3 className="font-semibold">{base.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {base.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={base.is_active ? "default" : "secondary"}>
                {base.is_active ? 'Ativa' : 'Inativa'}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {base.type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Status e Progresso */}
            {status && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Status:</span>
                  <div className="flex items-center space-x-2">
                    {status.status === 'active' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {status.status === 'indexing' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                    {status.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    {status.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                    <span className="capitalize">{status.status}</span>
                  </div>
                </div>
                
                {status.status === 'indexing' && status.progress !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progresso</span>
                      <span>{Math.round(status.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all" 
                        style={{ width: `${status.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Documentos:</span>
                <span className="ml-2 font-medium">{status?.document_count || 0}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Última indexação:</span>
                <span className="ml-2 font-medium">
                  {status?.last_indexed ? 
                   new Date(status.last_indexed).toLocaleDateString('pt-BR') : 
                   'Nunca'}
                </span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReindexBase(base.id)}
                  disabled={status?.status === 'indexing'}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reindexar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBase(base)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Detalhes
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleBase(base.id, !base.is_active)}
                >
                  {base.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBase(base)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteBase(base.id)}
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

  const renderBaseList = () => (
    <div className="space-y-4">
      {basesLoading ? (
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
      ) : filteredBases.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhuma base encontrada
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Crie sua primeira base de conhecimento'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Base
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBases.map(renderBaseCard)}
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
              <h1 className="text-3xl font-bold">Bases de Conhecimento</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie as bases de conhecimento conectadas à plataforma
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={loadBaseStatuses}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Filtros */}
          {renderFilters()}

          {/* Lista de Bases */}
          {renderBaseList()}

          {/* Diálogo de Criação/Edição */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedBase ? 'Editar Base' : 'Nova Base de Conhecimento'}
                </DialogTitle>
              </DialogHeader>
              <BaseForm
                base={selectedBase}
                onSubmit={handleCreateBase}
                onCancel={() => {
                  setShowCreateDialog(false)
                  setSelectedBase(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}

// =============================================================================
// COMPONENTE DE FORMULÁRIO
// =============================================================================

interface BaseFormProps {
  base?: GabiBase | null
  onSubmit: (data: BaseFormData) => Promise<void>
  onCancel: () => void
}

function BaseForm({ base, onSubmit, onCancel }: BaseFormProps) {
  const [formData, setFormData] = useState<BaseFormData>({
    name: base?.name || '',
    description: base?.description || '',
    type: base?.type || 'google_drive',
    source_id: '',
    tags: [],
    is_active: base?.is_active || true,
    auto_index: true,
    index_schedule: 'daily'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome da Base</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="type">Tipo de Fonte</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google_drive">Google Drive</SelectItem>
              <SelectItem value="sharepoint">SharePoint</SelectItem>
              <SelectItem value="s3">Amazon S3</SelectItem>
              <SelectItem value="api">API Externa</SelectItem>
              <SelectItem value="upload">Upload Manual</SelectItem>
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

      <div>
        <Label htmlFor="source_id">Identificador da Fonte</Label>
        <Input
          id="source_id"
          value={formData.source_id}
          onChange={(e) => setFormData({ ...formData, source_id: e.target.value })}
          placeholder="URL, ID da pasta, endpoint da API..."
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="index_schedule">Agendamento de Indexação</Label>
          <Select value={formData.index_schedule} onValueChange={(value) => setFormData({ ...formData, index_schedule: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="hourly">A cada hora</SelectItem>
              <SelectItem value="daily">Diário</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          <Label htmlFor="is_active">Base ativa</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {base ? 'Atualizar' : 'Criar'} Base
        </Button>
      </div>
    </form>
  )
}

export default BasesPage 