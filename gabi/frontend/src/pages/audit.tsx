import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  AlertTriangle,
  Shield,
  Activity,
  BarChart3,
  TrendingUp,
  Users,
  Database,
  FileText,
  Settings,
  Bell,
  Zap,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  User,
  Globe,
  Monitor,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Filter,
  Search,
  ExternalLink,
  Copy,
  Bell as BellIcon,
  Shield as ShieldIcon,
  Activity as ActivityIcon,
  BarChart3 as BarChart3Icon,
  TrendingUp as TrendingUpIcon,
  Users as UsersIcon,
  Database as DatabaseIcon,
  FileText as FileTextIcon,
  Settings as SettingsIcon,
  Bell as BellIcon2,
  Zap as ZapIcon,
  Eye as EyeIcon,
  Download as DownloadIcon,
  RefreshCw as RefreshCwIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  User as UserIcon,
  Globe as GlobeIcon,
  Monitor as MonitorIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  AlertCircle as AlertCircleIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Filter as FilterIcon,
  Search as SearchIcon,
  ExternalLink as ExternalLinkIcon,
  Copy as CopyIcon
} from 'lucide-react'
import { AuditLogViewer } from '@/components/AuditLogViewer'
import { AuditAlerts } from '@/components/AuditAlerts'
import { auditService, AuditStats, AuditEvent } from '@/services/auditService'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface AuditDashboardProps {
  className?: string
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function AuditDashboard({ className }: AuditDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState('7d')
  const [recentEvents, setRecentEvents] = useState<AuditEvent[]>([])
  const [topRiskEvents, setTopRiskEvents] = useState<AuditEvent[]>([])

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    loadDashboardData()
  }, [dateRange])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const statsData = await auditService.getAuditStats()
      setStats(statsData)
      setRecentEvents(statsData.recent_events)
      setTopRiskEvents(statsData.top_risk_events)
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportDashboard = async (format: 'csv' | 'json') => {
    try {
      const data = await auditService.exportAuditLogs({}, format)
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_dashboard_${format}_${format(new Date(), 'yyyy-MM-dd')}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao exportar dashboard:', error)
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
  // RENDERIZAÇÃO
  // =============================================================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Auditoria</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitoramento completo de atividades e conformidade da plataforma GABI
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handleExportDashboard('csv')}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportDashboard('json')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Exportar JSON
          </Button>
          <Button
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Logs</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Alertas</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Conformidade</span>
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Estatísticas Principais */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_events}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.events_today} hoje • {stats.events_this_week} esta semana
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

          {/* Gráficos de Distribuição */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Tipo de Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.by_event_type).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{getEventIcon(type)}</span>
                          <span className="text-sm">{getEventTypeName(type)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${(count / stats.total_events) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Severidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.by_severity).map(([severity, count]) => (
                      <div key={severity} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(severity)}>
                            {severity}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                severity === 'critical' ? 'bg-red-600' :
                                severity === 'high' ? 'bg-orange-600' :
                                severity === 'medium' ? 'bg-yellow-600' :
                                'bg-green-600'
                              }`}
                              style={{ 
                                width: `${(count / stats.total_events) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Eventos Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getEventIcon(event.event_type)}</span>
                      <div>
                        <div className="font-medium">{getEventTypeName(event.event_type)}</div>
                        <div className="text-sm text-gray-500">{event.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {format(new Date(event.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Eventos de Alto Risco */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Alto Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topRiskEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getEventIcon(event.event_type)}</span>
                      <div>
                        <div className="font-medium">{getEventTypeName(event.event_type)}</div>
                        <div className="text-sm text-gray-500">{event.description}</div>
                        <div className="text-xs text-red-600">
                          Risk Score: {event.risk_score}/10
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        Alto Risco
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {format(new Date(event.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs">
          <AuditLogViewer 
            showFilters={true}
            showStats={false}
            maxItems={100}
          />
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alerts">
          <AuditAlerts 
            showFilters={true}
            maxItems={50}
          />
        </TabsContent>

        {/* Conformidade */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Conformidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* LGPD */}
                <div>
                  <h3 className="text-lg font-medium mb-3">LGPD (Lei Geral de Proteção de Dados)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Art. 5º - Definições</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Logs de autenticação e identificação de usuários
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Art. 20º - Portabilidade</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Rastreamento de exportações de dados
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Art. 37º - Relatório</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Registro de incidentes de segurança
                      </p>
                    </div>
                  </div>
                </div>

                {/* ISO 27001 */}
                <div>
                  <h3 className="text-lg font-medium mb-3">ISO 27001 - Gestão de Segurança da Informação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">A.9 - Controle de Acesso</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Auditoria de autenticação e autorização
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">A.12 - Operações</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Monitoramento de atividades do sistema
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">A.16 - Incidentes</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Detecção e resposta a incidentes
                      </p>
                    </div>
                  </div>
                </div>

                {/* ISO 27701 */}
                <div>
                  <h3 className="text-lg font-medium mb-3">ISO 27701 - Gestão de Privacidade</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">7.2.1 - Processamento</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Rastreamento de acesso a dados pessoais
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">7.2.2 - Transferência</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Monitoramento de transferências de dados
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">7.2.3 - Retenção</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Controle de retenção de dados pessoais
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 