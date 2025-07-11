import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Trash2, 
  Eye, 
  Calendar,
  FileText,
  FileCode,
  FileJson,
  User,
  Database,
  Bot,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Download as DownloadIcon,
  Archive,
  MoreHorizontal
} from 'lucide-react'
import { exportService, ExportLog, ExportStats } from '@/services/exportService'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface ExportHistoryProps {
  className?: string
  showStats?: boolean
  showFilters?: boolean
  maxItems?: number
}

interface ExportFilter {
  content_type?: string
  format?: string
  user_id?: string
  date_range?: {
    from: Date
    to: Date
  }
  search?: string
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExportHistory({ 
  className, 
  showStats = true, 
  showFilters = true,
  maxItems = 50 
}: ExportHistoryProps) {
  const [logs, setLogs] = useState<ExportLog[]>([])
  const [stats, setStats] = useState<ExportStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<ExportFilter>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLog, setSelectedLog] = useState<ExportLog | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (filters || searchTerm) {
      loadLogs()
    }
  }, [filters, searchTerm])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadData = async () => {
    try {
      setLoading(true)
      const [logsData, statsData] = await Promise.all([
        exportService.getExportLogs(),
        exportService.getExportStats()
      ])
      setLogs(logsData)
      setStats(statsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    try {
      const logsData = await exportService.getExportLogs({
        ...filters,
        search: searchTerm
      })
      setLogs(logsData)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    }
  }

  const handleViewDetails = (log: ExportLog) => {
    setSelectedLog(log)
    setShowDetails(true)
  }

  const handleDownload = async (log: ExportLog) => {
    try {
      // Em produção, isso seria um link direto para o arquivo
      // Por enquanto, simulamos o download
      const blob = new Blob(['Conteúdo do arquivo'], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = log.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error)
    }
  }

  const handleDelete = async (log: ExportLog) => {
    if (confirm('Tem certeza que deseja excluir este registro de exportação?')) {
      try {
        // Em produção, isso deletaria o arquivo e o registro
        setLogs(prev => prev.filter(l => l.id !== log.id))
      } catch (error) {
        console.error('Erro ao deletar registro:', error)
      }
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const getFormatIcon = (format: string) => {
    const icons = {
      pdf: <FileText className="w-4 h-4" />,
      markdown: <FileCode className="w-4 h-4" />,
      json: <FileJson className="w-4 h-4" />
    }
    return icons[format as keyof typeof icons] || <FileText className="w-4 h-4" />
  }

  const getFormatColor = (format: string) => {
    const colors = {
      pdf: 'bg-red-100 text-red-800 border-red-200',
      markdown: 'bg-blue-100 text-blue-800 border-blue-200',
      json: 'bg-green-100 text-green-800 border-green-200'
    }
    return colors[format as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getContentTypeIcon = (type: string) => {
    const icons = {
      chat: '💬',
      task: '⚡',
      report: '📊',
      analysis: '🔍',
      summary: '📋'
    }
    return icons[type as keyof typeof icons] || '📄'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredLogs = logs
    .filter(log => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          log.file_name.toLowerCase().includes(searchLower) ||
          log.user_name.toLowerCase().includes(searchLower) ||
          log.content_type.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
    .slice(0, maxItems)

  // =============================================================================
  // RENDERIZAÇÃO
  // =============================================================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Exportações</CardTitle>
              <DownloadIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_exports}</div>
              <p className="text-xs text-muted-foreground">
                {stats.exports_today} hoje
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.exports_this_week}</div>
              <p className="text-xs text-muted-foreground">
                +12% vs semana anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Armazenamento</CardTitle>
              <Database className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatFileSize(stats.total_storage_used)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total utilizado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formato Mais Usado</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(stats.by_format).length > 0 
                  ? Object.entries(stats.by_format).sort(([,a], [,b]) => b - a)[0][0].toUpperCase()
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Formato preferido
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filtros e Busca</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({})
                  setSearchTerm('')
                }}
              >
                Limpar Filtros
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar exportações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Tipo de Conteúdo</Label>
                <Select
                  value={filters.content_type || ''}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    content_type: value || undefined 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value="chat">Conversa</SelectItem>
                    <SelectItem value="task">Tarefa</SelectItem>
                    <SelectItem value="report">Relatório</SelectItem>
                    <SelectItem value="analysis">Análise</SelectItem>
                    <SelectItem value="summary">Resumo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Formato</Label>
                <Select
                  value={filters.format || ''}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    format: value || undefined 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os formatos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os formatos</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Usuário</Label>
                <Select
                  value={filters.user_id || ''}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    user_id: value || undefined 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os usuários</SelectItem>
                    {Array.from(new Set(logs.map(log => log.user_id))).map(userId => (
                      <SelectItem key={userId} value={userId}>
                        {logs.find(log => log.user_id === userId)?.user_name || userId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Exportações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico de Exportações ({filteredLogs.length})</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Carregando exportações...' : 'Nenhuma exportação encontrada'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg">{getContentTypeIcon(log.content_type)}</span>
                        <h3 className="font-medium">{log.file_name}</h3>
                        <Badge className={getFormatColor(log.format)}>
                          {getFormatIcon(log.format)}
                          <span className="ml-1">{log.format.toUpperCase()}</span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{log.user_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Database className="w-3 h-3" />
                          <span>{formatFileSize(log.file_size)}</span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="capitalize">{log.content_type}</span> • {log.content_id}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(log)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(log)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {selectedLog && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Detalhes da Exportação</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Informações do Arquivo</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Nome:</strong> {selectedLog.file_name}</div>
                    <div><strong>Formato:</strong> {selectedLog.format.toUpperCase()}</div>
                    <div><strong>Tamanho:</strong> {formatFileSize(selectedLog.file_size)}</div>
                    <div><strong>Data:</strong> {format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Informações do Conteúdo</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Tipo:</strong> {selectedLog.content_type}</div>
                    <div><strong>ID do Conteúdo:</strong> {selectedLog.content_id}</div>
                    <div><strong>Usuário:</strong> {selectedLog.user_name}</div>
                    <div><strong>Organização:</strong> {selectedLog.organization_id}</div>
                  </div>
                </div>
              </div>

              {selectedLog.ip_address && (
                <div>
                  <h3 className="font-medium mb-2">Informações Técnicas</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>IP:</strong> {selectedLog.ip_address}</div>
                    <div><strong>User Agent:</strong> {selectedLog.user_agent}</div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 