import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Trash2, 
  Upload, 
  Eye, 
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Settings,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface Document {
  id: string
  filename: string
  base_id: string
  source: 'google' | 'sharepoint' | 'manual'
  status: 'indexed' | 'pending' | 'error' | 'deleted'
  last_modified: string
  created_at: string
  vector_id?: string
  error_message?: string
  metadata?: {
    file_size?: number
    mime_type?: string
    parent_folder?: string
    owner?: string
    language?: string
  }
  event: 'created' | 'modified' | 'deleted'
  processing_time?: number
}

interface DocumentFilters {
  search: string
  sources: string[]
  statuses: string[]
  bases: string[]
}

interface AdminStats {
  total_documents: number
  indexed: number
  pending: number
  error: number
  by_source: {
    google: number
    sharepoint: number
    manual: number
  }
  by_base: Record<string, number>
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function AdminDocumentPanel() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    sources: [],
    statuses: [],
    bases: []
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [processing, setProcessing] = useState<string[]>([])

  const itemsPerPage = 20

  // =============================================================================
  // DADOS MOCKADOS PARA DESENVOLVIMENTO
  // =============================================================================

  const mockDocuments: Document[] = [
    {
      id: '1',
      filename: 'contrato-empresarial-2024.pdf',
      base_id: 'legal',
      source: 'google',
      status: 'indexed',
      last_modified: '2025-01-10T14:30:00.000Z',
      created_at: '2025-01-10T14:25:00.000Z',
      vector_id: 'vec_123456',
      metadata: {
        file_size: 2048576,
        mime_type: 'application/pdf',
        parent_folder: '/Contratos/2024',
        owner: 'joao@empresa.com',
        language: 'pt-BR'
      },
      event: 'created',
      processing_time: 2500
    },
    {
      id: '2',
      filename: 'relatorio-financeiro-q4.docx',
      base_id: 'financeiro',
      source: 'sharepoint',
      status: 'pending',
      last_modified: '2025-01-10T15:00:00.000Z',
      created_at: '2025-01-10T14:55:00.000Z',
      metadata: {
        file_size: 1048576,
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        parent_folder: '/Documentos/Financeiro',
        owner: 'maria@empresa.com',
        language: 'pt-BR'
      },
      event: 'modified',
      processing_time: 1800
    },
    {
      id: '3',
      filename: 'manual-procedimentos.pdf',
      base_id: 'rh',
      source: 'manual',
      status: 'error',
      last_modified: '2025-01-10T13:45:00.000Z',
      created_at: '2025-01-10T13:40:00.000Z',
      error_message: 'Erro na extração de texto: arquivo corrompido',
      metadata: {
        file_size: 5120000,
        mime_type: 'application/pdf',
        language: 'pt-BR'
      },
      event: 'created',
      processing_time: 5000
    },
    {
      id: '4',
      filename: 'política-segurança.docx',
      base_id: 'ti',
      source: 'google',
      status: 'indexed',
      last_modified: '2025-01-10T12:20:00.000Z',
      created_at: '2025-01-10T12:15:00.000Z',
      vector_id: 'vec_789012',
      metadata: {
        file_size: 1536000,
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        parent_folder: '/Políticas',
        owner: 'admin@empresa.com',
        language: 'pt-BR'
      },
      event: 'created',
      processing_time: 3200
    },
    {
      id: '5',
      filename: 'budget-2025.xlsx',
      base_id: 'financeiro',
      source: 'sharepoint',
      status: 'deleted',
      last_modified: '2025-01-10T11:30:00.000Z',
      created_at: '2025-01-10T11:25:00.000Z',
      metadata: {
        file_size: 2048000,
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        parent_folder: '/Planilhas',
        owner: 'financeiro@empresa.com',
        language: 'pt-BR'
      },
      event: 'deleted'
    }
  ]

  const mockStats: AdminStats = {
    total_documents: 156,
    indexed: 89,
    pending: 12,
    error: 5,
    by_source: {
      google: 67,
      sharepoint: 45,
      manual: 44
    },
    by_base: {
      legal: 23,
      financeiro: 34,
      rh: 18,
      ti: 28,
      marketing: 15,
      vendas: 38
    }
  }

  // =============================================================================
  // EFEITOS E CARREGAMENTO
  // =============================================================================

  useEffect(() => {
    loadDocuments()
    loadStats()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [documents, filters])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000))
      setDocuments(mockDocuments)
    } catch (error) {
      toast.error('Erro ao carregar documentos')
      console.error('Erro ao carregar documentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 500))
      setStats(mockStats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  // =============================================================================
  // FILTROS E PESQUISA
  // =============================================================================

  const applyFilters = () => {
    let filtered = [...documents]

    // Filtro de pesquisa
    if (filters.search) {
      filtered = filtered.filter(doc => 
        doc.filename.toLowerCase().includes(filters.search.toLowerCase()) ||
        doc.base_id.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Filtro de origem
    if (filters.sources.length > 0) {
      filtered = filtered.filter(doc => filters.sources.includes(doc.source))
    }

    // Filtro de status
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(doc => filters.statuses.includes(doc.status))
    }

    // Filtro de base
    if (filters.bases.length > 0) {
      filtered = filtered.filter(doc => filters.bases.includes(doc.base_id))
    }

    setFilteredDocuments(filtered)
    setTotalPages(Math.ceil(filtered.length / itemsPerPage))
    setCurrentPage(1)
  }

  const getPaginatedDocuments = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredDocuments.slice(startIndex, endIndex)
  }

  // =============================================================================
  // AÇÕES DE DOCUMENTOS
  // =============================================================================

  const handleReprocess = async (documentId: string) => {
    try {
      setProcessing(prev => [...prev, documentId])
      
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Atualizar status do documento
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'pending' as const, error_message: undefined }
          : doc
      ))
      
      toast.success('Documento enviado para reprocessamento')
    } catch (error) {
      toast.error('Erro ao reprocessar documento')
      console.error('Erro ao reprocessar:', error)
    } finally {
      setProcessing(prev => prev.filter(id => id !== documentId))
    }
  }

  const handleRemove = async (documentId: string) => {
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Remover documento da lista
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      
      toast.success('Documento removido com sucesso')
    } catch (error) {
      toast.error('Erro ao remover documento')
      console.error('Erro ao remover:', error)
    }
  }

  const handleResend = async (documentId: string) => {
    try {
      setProcessing(prev => [...prev, documentId])
      
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Atualizar status do documento
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'indexed' as const, vector_id: `vec_${Date.now()}` }
          : doc
      ))
      
      toast.success('Documento reenviado para vetorização')
    } catch (error) {
      toast.error('Erro ao reenviar documento')
      console.error('Erro ao reenviar:', error)
    } finally {
      setProcessing(prev => prev.filter(id => id !== documentId))
    }
  }

  // =============================================================================
  // RENDERIZAÇÃO DE COMPONENTES
  // =============================================================================

  const renderSourceIcon = (source: string) => {
    switch (source) {
      case 'google':
        return <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs">G</div>
      case 'sharepoint':
        return <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs">S</div>
      case 'manual':
        return <div className="w-6 h-6 bg-gray-500 rounded flex items-center justify-center text-white text-xs">M</div>
      default:
        return <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-white text-xs">?</div>
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'indexed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Indexado</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Aguardando</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>
      case 'deleted':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100"><Trash2 className="w-3 h-3 mr-1" />Removido</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const renderDocumentRow = (document: Document) => {
    const isProcessing = processing.includes(document.id)
    
    return (
      <TableRow key={document.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
        <TableCell className="font-medium">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="truncate max-w-xs" title={document.filename}>
              {document.filename}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{document.base_id}</Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            {renderSourceIcon(document.source)}
            <span className="capitalize">{document.source}</span>
          </div>
        </TableCell>
        <TableCell>
          {new Date(document.last_modified).toLocaleDateString('pt-BR')}
        </TableCell>
        <TableCell>
          {renderStatusBadge(document.status)}
        </TableCell>
        <TableCell>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDocument(document)}
              disabled={isProcessing}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReprocess(document.id)}
              disabled={isProcessing || document.status === 'deleted'}
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleResend(document.id)}
              disabled={isProcessing || document.status === 'deleted'}
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(document.id)}
              disabled={isProcessing}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold">{stats?.total_documents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Indexados</p>
                <p className="text-2xl font-bold text-green-600">{stats?.indexed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aguardando</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Erros</p>
                <p className="text-2xl font-bold text-red-600">{stats?.error || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pesquisar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome ou base..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Origem</label>
              <div className="space-y-2">
                {['google', 'sharepoint', 'manual'].map(source => (
                  <div key={source} className="flex items-center space-x-2">
                    <Checkbox
                      id={`source-${source}`}
                      checked={filters.sources.includes(source)}
                      onCheckedChange={(checked) => {
                        setFilters(prev => ({
                          ...prev,
                          sources: checked 
                            ? [...prev.sources, source]
                            : prev.sources.filter(s => s !== source)
                        }))
                      }}
                    />
                    <label htmlFor={`source-${source}`} className="text-sm capitalize">
                      {source}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="space-y-2">
                {['indexed', 'pending', 'error', 'deleted'].map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.statuses.includes(status)}
                      onCheckedChange={(checked) => {
                        setFilters(prev => ({
                          ...prev,
                          statuses: checked 
                            ? [...prev.statuses, status]
                            : prev.statuses.filter(s => s !== status)
                        }))
                      }}
                    />
                    <label htmlFor={`status-${status}`} className="text-sm capitalize">
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Base de Conhecimento</label>
              <Select
                value={filters.bases[0] || ''}
                onValueChange={(value) => {
                  setFilters(prev => ({
                    ...prev,
                    bases: value ? [value] : []
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {Object.keys(stats?.by_base || {}).map(base => (
                    <SelectItem key={base} value={base}>
                      {base} ({stats?.by_base[base]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de documentos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documentos ({filteredDocuments.length})</CardTitle>
            <Button onClick={loadDocuments} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Modificado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getPaginatedDocuments().map(renderDocumentRow)}
            </TableBody>
          </Table>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes */}
      {selectedDocument && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Detalhes do Documento</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="info" className="w-full">
              <TabsList>
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="metadata">Metadados</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome do arquivo</label>
                    <p className="text-sm text-gray-600">{selectedDocument.filename}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Base de conhecimento</label>
                    <p className="text-sm text-gray-600">{selectedDocument.base_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Origem</label>
                    <p className="text-sm text-gray-600 capitalize">{selectedDocument.source}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="mt-1">{renderStatusBadge(selectedDocument.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Criado em</label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedDocument.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Modificado em</label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedDocument.last_modified).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  {selectedDocument.vector_id && (
                    <div>
                      <label className="text-sm font-medium">ID do Vetor</label>
                      <p className="text-sm text-gray-600 font-mono">{selectedDocument.vector_id}</p>
                    </div>
                  )}
                  {selectedDocument.processing_time && (
                    <div>
                      <label className="text-sm font-medium">Tempo de Processamento</label>
                      <p className="text-sm text-gray-600">{selectedDocument.processing_time}ms</p>
                    </div>
                  )}
                </div>
                
                {selectedDocument.error_message && (
                  <div>
                    <label className="text-sm font-medium text-red-600">Mensagem de Erro</label>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{selectedDocument.error_message}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="metadata">
                <ScrollArea className="h-64">
                  <pre className="text-sm bg-gray-50 p-4 rounded">
                    {JSON.stringify(selectedDocument.metadata, null, 2)}
                  </pre>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="logs">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Logs de processamento não disponíveis no modo de desenvolvimento.</p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Logs
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 