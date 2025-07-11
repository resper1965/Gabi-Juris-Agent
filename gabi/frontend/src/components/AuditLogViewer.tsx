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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Download, 
  AlertTriangle,
  Shield,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Activity,
  Database,
  FileText,
  Settings,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Globe,
  Monitor,
  Zap
} from 'lucide-react'
import { auditService, AuditEvent, AuditFilter, AuditStats, ChatSnapshot, TaskSnapshot } from '@/services/auditService'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface AuditLogViewerProps {
  className?: string
  showFilters?: boolean
  showStats?: boolean
  maxItems?: number
  readOnly?: boolean
}

interface EventDetailsProps {
  event: AuditEvent
  isOpen: boolean
  onClose: () => void
}

interface SnapshotViewerProps {
  snapshot: ChatSnapshot | TaskSnapshot
  isOpen: boolean
  onClose: () => void
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AuditLogViewer({ 
  className, 
  showFilters = true, 
  showStats = true,
  maxItems = 100,
  readOnly = false
}: AuditLogViewerProps) {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<AuditFilter>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [selectedSnapshot, setSelectedSnapshot] = useState<ChatSnapshot | TaskSnapshot | null>(null)
  const [showSnapshot, setShowSnapshot] = useState(false)
  const [sortColumn, setSortColumn] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (filters || searchTerm) {
      loadEvents()
    }
  }, [filters, searchTerm])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadData = async () => {
    try {
      setLoading(true)
      const [eventsData, statsData] = await Promise.all([
        auditService.getAuditLogs(),
        auditService.getAuditStats()
      ])
      setEvents(eventsData)
      setStats(statsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      const eventsData = await auditService.getAuditLogs({
        ...filters,
        search: searchTerm
      })
      setEvents(eventsData)
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
    }
  }

  const handleViewEventDetails = (event: AuditEvent) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const handleViewSnapshot = async (event: AuditEvent) => {
    try {
      let snapshot: ChatSnapshot | TaskSnapshot | null = null
      
      if (event.resource_type === 'chat') {
        snapshot = await auditService.getChatSnapshot(event.resource_id)
      } else if (event.resource_type === 'task') {
        snapshot = await auditService.getTaskSnapshot(event.resource_id)
      }
      
      if (snapshot) {
        setSelectedSnapshot(snapshot)
        setShowSnapshot(true)
      }
    } catch (error) {
      console.error('Erro ao carregar snapshot:', error)
    }
  }

  const handleExportLogs = async (format: 'csv' | 'json') => {
    try {
      const data = await auditService.exportAuditLogs(filters, format)
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_logs_${format}_${format(new Date(), 'yyyy-MM-dd')}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao exportar logs:', error)
    }
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const getEventIcon = (eventType: string) => {
    return auditService.getEventTypeIcon(eventType)
  }

  const getEventTypeName = (eventType: string) => {
    return auditService.getEventTypeName(eventType)
  }

  const getSeverityColor = (severity: string) => {
    return auditService.getSeverityColor(severity)
  }

  const getStatusColor = (status: string) => {
    return auditService.getStatusColor(status)
  }

  const formatRiskScore = (score: number) => {
    if (score >= 8) return 'Alto'
    if (score >= 5) return 'Médio'
    return 'Baixo'
  }

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'bg-red-100 text-red-800 border-red-200'
    if (score >= 5) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  // =============================================================================
  // FILTRAGEM E ORDENAÇÃO
  // =============================================================================

  const filteredAndSortedEvents = events
    .sort((a, b) => {
      const aValue = a[sortColumn as keyof AuditEvent]
      const bValue = b[sortColumn as keyof AuditEvent]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
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
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_events}</div>
              <p className="text-xs text-muted-foreground">
                {stats.events_today} hoje
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos de Segurança</CardTitle>
              <Shield className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.security_events}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_events > 0 ? Math.round((stats.security_events / stats.total_events) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos de Privacidade</CardTitle>
              <User className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.privacy_events}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_events > 0 ? Math.round((stats.privacy_events / stats.total_events) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Score Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.risk_score_avg.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Pontuação média de risco
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
              <span>Filtros de Auditoria</span>
              <div className="flex items-center space-x-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportLogs('csv')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportLogs('json')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar JSON
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar eventos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Tipo de Evento</Label>
                <Select
                  value={filters.event_type?.[0] || ''}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    event_type: value ? [value] : undefined 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value="authentication">Autenticação</SelectItem>
                    <SelectItem value="data_access">Acesso a Dados</SelectItem>
                    <SelectItem value="data_modification">Modificação de Dados</SelectItem>
                    <SelectItem value="export">Exportação</SelectItem>
                    <SelectItem value="chat_interaction">Interação de Chat</SelectItem>
                    <SelectItem value="task_execution">Execução de Tarefa</SelectItem>
                    <SelectItem value="security_event">Evento de Segurança</SelectItem>
                    <SelectItem value="privacy_event">Evento de Privacidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Severidade</Label>
                <Select
                  value={filters.severity?.[0] || ''}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    severity: value ? [value] : undefined 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as severidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as severidades</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Status</Label>
                <Select
                  value={filters.status?.[0] || ''}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    status: value ? [value] : undefined 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="failure">Falha</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Logs de Auditoria ({filteredAndSortedEvents.length})</span>
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
          {filteredAndSortedEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Carregando eventos...' : 'Nenhum evento encontrado'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg">{getEventIcon(event.event_type)}</span>
                        <h3 className="font-medium">{getEventTypeName(event.event_type)}</h3>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status === 'success' ? <CheckCircle className="w-3 h-3 mr-1" /> : 
                           event.status === 'failure' ? <XCircle className="w-3 h-3 mr-1" /> : 
                           <AlertCircle className="w-3 h-3 mr-1" />}
                          {event.status}
                        </Badge>
                        <Badge className={getRiskColor(event.risk_score)}>
                          Risk: {formatRiskScore(event.risk_score)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {event.description}
                      </p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{event.user_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(event.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Globe className="w-3 h-3" />
                          <span>{event.ip_address}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Database className="w-3 h-3" />
                          <span>{event.resource_type}: {event.resource_id}</span>
                        </div>
                      </div>

                      {event.compliance_tags.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-gray-500">Compliance:</span>
                            {event.compliance_tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewEventDetails(event)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {(event.resource_type === 'chat' || event.resource_type === 'task') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSnapshot(event)}
                        >
                          <Monitor className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Evento */}
      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          isOpen={showEventDetails}
          onClose={() => {
            setShowEventDetails(false)
            setSelectedEvent(null)
          }}
        />
      )}

      {/* Modal de Snapshot */}
      {selectedSnapshot && (
        <SnapshotViewer
          snapshot={selectedSnapshot}
          isOpen={showSnapshot}
          onClose={() => {
            setShowSnapshot(false)
            setSelectedSnapshot(null)
          }}
        />
      )}
    </div>
  )
}

// =============================================================================
// COMPONENTE DE DETALHES DO EVENTO
// =============================================================================

function EventDetails({ event, isOpen, onClose }: EventDetailsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Detalhes do Evento de Auditoria</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Informações do Evento</h3>
              <div className="space-y-2 text-sm">
                <div><strong>ID:</strong> {event.id}</div>
                <div><strong>Tipo:</strong> {auditService.getEventTypeName(event.event_type)}</div>
                <div><strong>Categoria:</strong> {event.event_category}</div>
                <div><strong>Ação:</strong> {event.action}</div>
                <div><strong>Status:</strong> {event.status}</div>
                <div><strong>Severidade:</strong> {event.severity}</div>
                <div><strong>Risk Score:</strong> {event.risk_score}/10</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Informações do Usuário</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Usuário:</strong> {event.user_name}</div>
                <div><strong>Email:</strong> {event.user_email}</div>
                <div><strong>IP:</strong> {event.ip_address}</div>
                <div><strong>Session ID:</strong> {event.session_id}</div>
                <div><strong>User Agent:</strong> {event.user_agent}</div>
                <div><strong>Timestamp:</strong> {format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</div>
              </div>
            </div>
          </div>

          {/* Recurso */}
          <div>
            <h3 className="font-medium mb-2">Recurso Afetado</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Tipo:</strong> {event.resource_type}</div>
              <div><strong>ID:</strong> {event.resource_id}</div>
              <div><strong>Descrição:</strong> {event.description}</div>
            </div>
          </div>

          {/* Metadados */}
          <div>
            <h3 className="font-medium mb-2">Metadados</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </div>
          </div>

          {/* Tags de Compliance */}
          {event.compliance_tags.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Tags de Compliance</h3>
              <div className="flex flex-wrap gap-2">
                {event.compliance_tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// COMPONENTE DE VISUALIZAÇÃO DE SNAPSHOT
// =============================================================================

function SnapshotViewer({ snapshot, isOpen, onClose }: SnapshotViewerProps) {
  const isChatSnapshot = 'prompt' in snapshot && 'response' in snapshot

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Monitor className="w-5 h-5" />
            <span>Snapshot - {isChatSnapshot ? 'Chat' : 'Tarefa'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Informações Gerais</h3>
              <div className="space-y-2 text-sm">
                <div><strong>ID:</strong> {snapshot.id}</div>
                <div><strong>Usuário:</strong> {snapshot.user_id}</div>
                <div><strong>Agente:</strong> {isChatSnapshot ? snapshot.agent_name : snapshot.agent_name}</div>
                <div><strong>Bases:</strong> {isChatSnapshot ? snapshot.knowledge_base_names.join(', ') : snapshot.knowledge_base_names.join(', ')}</div>
                <div><strong>IP:</strong> {snapshot.ip_address}</div>
                <div><strong>Timestamp:</strong> {format(new Date(snapshot.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Métricas</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Tokens:</strong> {isChatSnapshot ? snapshot.tokens_used : snapshot.tokens_used}</div>
                <div><strong>Tempo:</strong> {isChatSnapshot ? snapshot.processing_time : snapshot.processing_time}s</div>
                {isChatSnapshot && <div><strong>Confiança:</strong> {snapshot.confidence_score}</div>}
                {!isChatSnapshot && <div><strong>Custo:</strong> ${snapshot.cost}</div>}
                <div><strong>Idioma:</strong> {isChatSnapshot ? snapshot.language : 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div>
            <h3 className="font-medium mb-2">Prompt/Entrada</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <p className="text-sm whitespace-pre-wrap">{isChatSnapshot ? snapshot.prompt : snapshot.prompt}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Resposta/Resultado</h3>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
              <p className="text-sm whitespace-pre-wrap">{isChatSnapshot ? snapshot.response : snapshot.result}</p>
            </div>
          </div>

          {/* Metadados */}
          <div>
            <h3 className="font-medium mb-2">Metadados</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(snapshot.metadata, null, 2)}
              </pre>
            </div>
          </div>

          {/* Logs (apenas para tarefas) */}
          {!isChatSnapshot && snapshot.logs && snapshot.logs.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Logs de Execução</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {snapshot.logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2 text-sm">
                    <span className="text-gray-500">
                      {format(new Date(log.timestamp), 'HH:mm:ss')}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      log.level === 'error' ? 'bg-red-100 text-red-800' :
                      log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      log.level === 'success' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 