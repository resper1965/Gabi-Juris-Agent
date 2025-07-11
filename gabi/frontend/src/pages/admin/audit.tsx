import React, { useState, useEffect } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Download, 
  Search, 
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Database,
  Palette,
  MessageSquare,
  Shield,
  FileText,
  BarChart3,
  RefreshCw,
  Eye,
  ExternalLink,
  Bell,
  Zap,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/AdminLayout'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface AuditPageProps {}

interface AuditLog {
  id: string
  timestamp: string
  user_id: string
  user_name: string
  action: string
  category: 'admin' | 'base' | 'style' | 'chat' | 'user' | 'system'
  severity: 'info' | 'warning' | 'error'
  details: string
  metadata: Record<string, any>
  ip_address?: string
  user_agent?: string
}

interface AuditStats {
  total_logs: number
  errors_today: number
  active_users: number
  avg_response_time: number
  top_actions: Array<{ action: string; count: number }>
  error_rate: number
}

interface Alert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  description: string
  timestamp: string
  resolved: boolean
  severity: 'low' | 'medium' | 'high'
}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const AuditPage: NextPage<AuditPageProps> = () => {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('7d')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showReportDialog, setShowReportDialog] = useState(false)

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    if (user?.organization_id) {
      loadAuditData()
    }
  }, [user?.organization_id, dateFilter])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadAuditData = async () => {
    try {
      setLoading(true)

      // Carregar dados em paralelo
      const [logsData, statsData, alertsData] = await Promise.all([
        loadAuditLogs(),
        loadAuditStats(),
        loadAlerts()
      ])

      setLogs(logsData)
      setStats(statsData)
      setAlerts(alertsData)

    } catch (error) {
      console.error('Erro ao carregar dados de auditoria:', error)
      toast.error('Erro ao carregar dados de auditoria')
    } finally {
      setLoading(false)
    }
  }

  const loadAuditLogs = async (): Promise<AuditLog[]> => {
    // Simular carregamento de logs - em produção viria da API
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        user_id: 'user_1',
        user_name: 'João Silva',
        action: 'base_created',
        category: 'base',
        severity: 'info',
        details: 'Nova base "ESG Compliance" criada',
        metadata: { base_id: 'esg', base_name: 'ESG Compliance' },
        ip_address: '192.168.1.100'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        user_id: 'user_2',
        user_name: 'Maria Santos',
        action: 'style_trained',
        category: 'style',
        severity: 'info',
        details: 'Estilo "Jurídico Formal" treinado da base Legal',
        metadata: { style_id: 'juridico', base_id: 'legal' },
        ip_address: '192.168.1.101'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        user_id: 'user_1',
        user_name: 'João Silva',
        action: 'user_invited',
        category: 'user',
        severity: 'info',
        details: 'Usuário convidado: maria@company.com',
        metadata: { invited_email: 'maria@company.com', role: 'editor' },
        ip_address: '192.168.1.100'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        user_id: 'system',
        user_name: 'Sistema',
        action: 'indexing_error',
        category: 'system',
        severity: 'error',
        details: 'Erro na indexação da base "Technical Docs"',
        metadata: { base_id: 'tech', error: 'Connection timeout' },
        ip_address: '127.0.0.1'
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        user_id: 'user_3',
        user_name: 'Pedro Costa',
        action: 'chat_session',
        category: 'chat',
        severity: 'info',
        details: 'Sessão de chat iniciada com agente Paineiras',
        metadata: { agent_id: 'paineiras', session_id: 'sess_123' },
        ip_address: '192.168.1.102'
      }
    ]

    return mockLogs
  }

  const loadAuditStats = async (): Promise<AuditStats> => {
    // Simular estatísticas - em produção viria da API
    return {
      total_logs: 1250,
      errors_today: 3,
      active_users: 18,
      avg_response_time: 2.3,
      top_actions: [
        { action: 'chat_session', count: 450 },
        { action: 'base_access', count: 320 },
        { action: 'style_used', count: 180 },
        { action: 'user_login', count: 150 }
      ],
      error_rate: 0.5
    }
  }

  const loadAlerts = async (): Promise<Alert[]> => {
    // Simular alertas - em produção viria da API
    return [
      {
        id: '1',
        type: 'error',
        title: 'Erro de Indexação',
        description: 'Falha na indexação da base "Technical Docs"',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        resolved: false,
        severity: 'high'
      },
      {
        id: '2',
        type: 'warning',
        title: 'Alta Taxa de Erro',
        description: 'Taxa de erro aumentou para 2.5% nas últimas 2 horas',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        resolved: false,
        severity: 'medium'
      },
      {
        id: '3',
        type: 'info',
        title: 'Manutenção Programada',
        description: 'Manutenção do sistema agendada para amanhã às 2h',
        timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
        resolved: false,
        severity: 'low'
      }
    ]
  }

  const handleExportLogs = async () => {
    try {
      // Simular exportação - em produção seria uma chamada para a API
      toast.success('Logs exportados com sucesso!')
    } catch (error) {
      toast.error('Erro ao exportar logs')
    }
  }

  const handleReportIncident = async (alertId: string) => {
    try {
      // Simular reporte - em produção seria uma chamada para a API
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ))
      toast.success('Incidente reportado com sucesso!')
    } catch (error) {
      toast.error('Erro ao reportar incidente')
    }
  }

  // =============================================================================
  // FILTROS E BUSCA
  // =============================================================================

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter
    
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter
    
    const matchesUser = userFilter === 'all' || log.user_id === userFilter
    
    return matchesSearch && matchesCategory && matchesSeverity && matchesUser
  })

  const filteredAlerts = alerts.filter(alert => !alert.resolved)

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderFilters = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Buscar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="admin">Administrativo</SelectItem>
                <SelectItem value="base">Base</SelectItem>
                <SelectItem value="style">Estilo</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="severity">Severidade</Label>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Período</Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end space-x-2">
            <Button
              variant="outline"
              onClick={handleExportLogs}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowReportDialog(true)}
            >
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Logs</p>
              <p className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : stats?.total_logs || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Erros Hoje</p>
              <p className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : stats?.errors_today || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Usuários Ativos</p>
              <p className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : stats?.active_users || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tempo Médio</p>
              <p className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : `${stats?.avg_response_time || 0}s`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderLogItem = (log: AuditLog) => (
    <div key={log.id} className="flex items-start space-x-3 p-4 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        log.severity === 'error' ? 'bg-red-100 text-red-600' :
        log.severity === 'warning' ? 'bg-yellow-100 text-yellow-600' :
        'bg-green-100 text-green-600'
      }`}>
        {log.category === 'admin' && <Shield className="w-4 h-4" />}
        {log.category === 'base' && <Database className="w-4 h-4" />}
        {log.category === 'style' && <Palette className="w-4 h-4" />}
        {log.category === 'chat' && <MessageSquare className="w-4 h-4" />}
        {log.category === 'user' && <User className="w-4 h-4" />}
        {log.category === 'system' && <Zap className="w-4 h-4" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{log.details}</p>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs capitalize">
              {log.category}
            </Badge>
            <Badge variant={
              log.severity === 'error' ? 'destructive' :
              log.severity === 'warning' ? 'secondary' : 'default'
            } className="text-xs">
              {log.severity}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
          <span className="flex items-center space-x-1">
            <User className="w-3 h-3" />
            <span>{log.user_name}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
          </span>
          {log.ip_address && (
            <span className="flex items-center space-x-1">
              <ExternalLink className="w-3 h-3" />
              <span>{log.ip_address}</span>
            </span>
          )}
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSelectedLog(log)}
      >
        <Eye className="w-4 h-4" />
      </Button>
    </div>
  )

  const renderAlerts = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <span>Alertas Ativos</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum alerta ativo</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map(alert => (
              <div key={alert.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  alert.type === 'error' ? 'bg-red-100 text-red-600' :
                  alert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{alert.title}</h4>
                    <Badge variant="outline" className="text-xs capitalize">
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString('pt-BR')}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReportIncident(alert.id)}
                    >
                      Reportar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
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
              <h1 className="text-3xl font-bold">Auditoria e Logs</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Monitore atividades, logs e alertas do sistema
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={loadAuditData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          {renderStats()}

          {/* Filtros */}
          {renderFilters()}

          {/* Conteúdo Principal */}
          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
              <TabsTrigger value="alerts">Alertas</TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logs de Auditoria</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-start space-x-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum log encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {filteredLogs.map(renderLogItem)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              {renderAlerts()}
            </TabsContent>
          </Tabs>

          {/* Diálogo de Detalhes do Log */}
          <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalhes do Log</DialogTitle>
              </DialogHeader>
              {selectedLog && (
                <div className="space-y-4">
                  <div>
                    <Label>Descrição</Label>
                    <p className="text-sm">{selectedLog.details}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Usuário</Label>
                      <p className="text-sm">{selectedLog.user_name}</p>
                    </div>
                    <div>
                      <Label>Ação</Label>
                      <p className="text-sm">{selectedLog.action}</p>
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <p className="text-sm capitalize">{selectedLog.category}</p>
                    </div>
                    <div>
                      <Label>Severidade</Label>
                      <p className="text-sm capitalize">{selectedLog.severity}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Timestamp</Label>
                    <p className="text-sm">{new Date(selectedLog.timestamp).toLocaleString('pt-BR')}</p>
                  </div>
                  
                  {selectedLog.ip_address && (
                    <div>
                      <Label>Endereço IP</Label>
                      <p className="text-sm">{selectedLog.ip_address}</p>
                    </div>
                  )}
                  
                  {Object.keys(selectedLog.metadata).length > 0 && (
                    <div>
                      <Label>Metadados</Label>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}

export default AuditPage 