import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Zap, 
  Google, 
  Cloud, 
  Upload, 
  RefreshCw, 
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

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

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function DocumentStatusPanel() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<DocumentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [reindexing, setReindexing] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')

  // =============================================================================
  // CARREGAMENTO DE DADOS
  // =============================================================================

  useEffect(() => {
    if (user) {
      loadDocuments()
    }
  }, [user])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/docs/status')
      
      if (response.data.success) {
        setDocuments(response.data.data)
      } else {
        toast.error('Erro ao carregar documentos')
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
      toast.error('Falha ao carregar documentos')
    } finally {
      setLoading(false)
    }
  }

  // =============================================================================
  // FILTRAGEM E ORDENAÇÃO
  // =============================================================================

  const filteredAndSortedDocuments = documents
    .filter(doc => 
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()
      } else {
        return a.filename.localeCompare(b.filename)
      }
    })

  // =============================================================================
  // AÇÕES
  // =============================================================================

  const handleReindex = async (docId: string) => {
    try {
      setReindexing(docId)
      
      const response = await api.post(`/api/docs/reindex/${docId}`, {
        priority: 'normal'
      })
      
      if (response.data.success) {
        toast.success('Reindexação iniciada com sucesso')
        
        // Atualizar status localmente
        setDocuments(prev => prev.map(doc => 
          doc.docId === docId 
            ? { ...doc, status: 'pending' as const }
            : doc
        ))
        
        // Recarregar após um delay
        setTimeout(() => {
          loadDocuments()
        }, 3000)
      } else {
        toast.error('Erro ao iniciar reindexação')
      }
    } catch (error) {
      console.error('Erro na reindexação:', error)
      toast.error('Falha ao reindexar documento')
    } finally {
      setReindexing(null)
    }
  }

  const handleRefresh = () => {
    loadDocuments()
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const getOriginIcon = (origin: string) => {
    switch (origin) {
      case 'google':
        return <Google className="w-4 h-4 text-blue-500" />
      case 'sharepoint':
        return <Cloud className="w-4 h-4 text-green-500" />
      case 'manual':
        return <Upload className="w-4 h-4 text-purple-500" />
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
        return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Indexado</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">Processando</Badge>
      case 'error':
        return <Badge variant="destructive" className="text-xs">Erro</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Desconhecido</Badge>
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

  const getOriginLabel = (origin: string) => {
    switch (origin) {
      case 'google':
        return 'Google Drive'
      case 'sharepoint':
        return 'SharePoint'
      case 'manual':
        return 'Upload Manual'
      default:
        return 'Desconhecido'
    }
  }

  // =============================================================================
  // RENDERIZAÇÃO
  // =============================================================================

  return (
    <Card className="p-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-muted-foreground stroke-1" />
          <h3 className="font-semibold text-sm">Documentos Indexados</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Busca */}
      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar documentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      {/* Ordenação */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-muted-foreground">
          {filteredAndSortedDocuments.length} documento(s)
        </span>
        <div className="flex space-x-1">
          <Button
            variant={sortBy === 'date' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('date')}
            className="h-6 text-xs"
          >
            Data
          </Button>
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('name')}
            className="h-6 text-xs"
          >
            Nome
          </Button>
        </div>
      </div>

      {/* Lista de Documentos */}
      <ScrollArea className="max-h-[300px]">
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedDocuments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">
              {searchTerm ? 'Nenhum documento encontrado' : 'Nenhum documento indexado'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedDocuments.map((doc) => (
              <div
                key={doc.docId}
                className="flex items-center justify-between p-2 rounded bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {getOriginIcon(doc.origin)}
                    <span className="text-sm font-medium truncate" title={doc.filename}>
                      {doc.filename}
                    </span>
                    {getStatusBadge(doc.status)}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{getOriginLabel(doc.origin)}</span>
                    <span>•</span>
                    <span>Atualizado: {formatDate(doc.lastUpdate)}</span>
                  </div>
                  {doc.errorMessage && (
                    <div className="text-xs text-red-600 truncate" title={doc.errorMessage}>
                      Erro: {doc.errorMessage}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-2">
                  {doc.status !== 'indexed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReindex(doc.docId)}
                      disabled={reindexing === doc.docId || doc.status === 'pending'}
                      className="h-6 text-xs"
                    >
                      {reindexing === doc.docId ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        'Reindexar'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Estatísticas Rápidas */}
      {!loading && documents.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-green-600">
                {documents.filter(d => d.status === 'indexed').length}
              </div>
              <div className="text-muted-foreground">Indexados</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-yellow-600">
                {documents.filter(d => d.status === 'pending').length}
              </div>
              <div className="text-muted-foreground">Processando</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-600">
                {documents.filter(d => d.status === 'error').length}
              </div>
              <div className="text-muted-foreground">Erros</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
} 