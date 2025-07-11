import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Search,
  Filter,
  Download,
  Trash2
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

// =============================================================================
// TIPOS
// =============================================================================

interface DocumentStatus {
  docId: string
  origin: 'google' | 'sharepoint' | 'manual'
  filename: string
  status: 'pending' | 'indexed' | 'error'
  lastUpdate: string
  knowledgeBases: string[]
  vectorId?: string
  errorMessage?: string
}

interface DocumentStats {
  total: number
  indexed: number
  pending: number
  error: number
  byOrigin: {
    google: number
    sharepoint: number
    manual: number
  }
  byStatus: {
    pending: number
    indexed: number
    error: number
  }
  averageProcessingTime: number
  lastIndexed: string
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function DocumentsPanel() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<DocumentStatus[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [reindexing, setReindexing] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    origin: '',
    status: '',
    search: ''
  })

  // =============================================================================
  // CARREGAMENTO DE DADOS
  // =============================================================================

  useEffect(() => {
    if (user) {
      loadDocuments()
      loadStats()
    }
  }, [user, filters])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.origin) params.append('origin', filters.origin)
      if (filters.status) params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)

      const response = await api.get(`/docs/status?${params.toString()}`)
      
      if (response.data.success) {
        setDocuments(response.data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await api.get('/docs/stats')
      
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  // =============================================================================
  // AÇÕES
  // =============================================================================

  const handleReindex = async (docId: string) => {
    try {
      setReindexing(docId)
      
      const response = await api.post(`/docs/reindex/${docId}`, {
        priority: 'normal'
      })
      
      if (response.data.success) {
        // Recarregar documentos após reindexação
        setTimeout(() => {
          loadDocuments()
          loadStats()
        }, 2000)
      }
    } catch (error) {
      console.error('Erro na reindexação:', error)
    } finally {
      setReindexing(null)
    }
  }

  const handleRefresh = () => {
    loadDocuments()
    loadStats()
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const getOriginIcon = (origin: string) => {
    switch (origin) {
      case 'google':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'sharepoint':
        return <FileText className="w-4 h-4 text-green-500" />
      case 'manual':
        return <FileText className="w-4 h-4 text-purple-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'indexed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'indexed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Indexado</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Processando</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // =============================================================================
  // RENDERIZAÇÃO
  // =============================================================================

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documentos Indexados</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Indexados:</span>
                <span className="font-medium text-green-600">{stats.indexed}</span>
              </div>
              <div className="flex justify-between">
                <span>Processando:</span>
                <span className="font-medium text-yellow-600">{stats.pending}</span>
              </div>
              <div className="flex justify-between">
                <span>Erros:</span>
                <span className="font-medium text-red-600">{stats.error}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Buscar documentos..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="h-8"
                />
              </div>
              <Select
                value={filters.origin}
                onValueChange={(value) => setFilters(prev => ({ ...prev, origin: value }))}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="sharepoint">SharePoint</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="indexed">Indexados</SelectItem>
                  <SelectItem value="pending">Processando</SelectItem>
                  <SelectItem value="error">Erros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Carregando...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Nenhum documento encontrado</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.docId}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getOriginIcon(doc.origin)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.filename}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusIcon(doc.status)}
                        {getStatusBadge(doc.status)}
                        <span className="text-xs text-gray-500">
                          {formatDate(doc.lastUpdate)}
                        </span>
                      </div>
                      {doc.knowledgeBases.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doc.knowledgeBases.slice(0, 2).map((base, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {base}
                            </Badge>
                          ))}
                          {doc.knowledgeBases.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{doc.knowledgeBases.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReindex(doc.docId)}
                      disabled={reindexing === doc.docId || doc.status === 'pending'}
                    >
                      {reindexing === doc.docId ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 