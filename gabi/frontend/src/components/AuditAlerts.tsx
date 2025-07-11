import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Shield,
  TrendingUp,
  Users,
  Database,
  FileText,
  Settings,
  Bell,
  Zap,
  AlertCircle,
  XCircle,
  Check,
  MoreHorizontal,
  Filter,
  RefreshCw,
  Download,
  ExternalLink,
  Copy,
  Globe,
  Monitor,
  Activity,
  BarChart3,
  Calendar,
  Clock as ClockIcon,
  User,
  Shield as ShieldIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Clock as ClockIcon2
} from 'lucide-react'
import { auditService, AuditAlert, AuditEvent } from '@/services/auditService'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface AuditAlertsProps {
  className?: string
  showFilters?: boolean
  maxItems?: number
  readOnly?: boolean
}

interface AlertDetailsProps {
  alert: AuditAlert
  isOpen: boolean
  onClose: () => void
  onAcknowledge: (alertId: string) => void
  onResolve: (alertId: string) => void
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AuditAlerts({ 
  className, 
  showFilters = true, 
  maxItems = 50,
  readOnly = false
}: AuditAlertsProps) {
  const [alerts, setAlerts] = useState<AuditAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: [] as string[],
    severity: [] as string[],
    alert_type: [] as string[]
  })
  const [selectedAlert, setSelectedAlert] = useState<AuditAlert | null>(null)
  const [showAlertDetails, setShowAlertDetails] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    acknowledged: 0,
    resolved: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  })

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    loadAlerts()
  }, [])

  useEffect(() => {
    if (filters) {
      loadAlerts()
    }
  }, [filters])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const alertsData = await auditService.getAuditAlerts(filters)
      setAlerts(alertsData)
      
      // Calcular estatísticas
      const statsData = {
        total: alertsData.length,
        active: alertsData.filter(a => a.status === 'active').length,
        acknowledged: alertsData.filter(a => a.status === 'acknowledged').length,
        resolved: alertsData.filter(a => a.status === 'resolved').length,
        critical: alertsData.filter(a => a.severity === 'critical').length,
        high: alertsData.filter(a => a.severity === 'high').length,
        medium: alertsData.filter(a => a.severity === 'medium').length,
        low: alertsData.filter(a => a.severity === 'low').length
      }
      setStats(statsData)
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewAlertDetails = (alert: AuditAlert) => {
    setSelectedAlert(alert)
    setShowAlertDetails(true)
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const userId = localStorage.getItem('gabi_user_id') || 'unknown'
      await auditService.acknowledgeAlert(alertId, userId)
      await loadAlerts()
      setShowAlertDetails(false)
      setSelectedAlert(null)
    } catch (error) {
      console.error('Erro ao reconhecer alerta:', error)
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      const userId = localStorage.getItem('gabi_user_id') || 'unknown'
      await auditService.resolveAlert(alertId, userId)
      await loadAlerts()
      setShowAlertDetails(false)
      setSelectedAlert(null)
    } catch (error) {
      console.error('Erro ao resolver alerta:', error)
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const getAlertIcon = (alertType: string) => {
    const icons = {
      anomaly: <TrendingUp className="w-5 h-5" />,
      threshold: <BarChart3 className="w-5 h-5" />,
      pattern: <Activity className="w-5 h-5" />,
      compliance: <Shield className="w-5 h-5" />
    }
    return icons[alertType as keyof typeof icons] || <AlertTriangle className="w-5 h-5" />
  }

  const getAlertTypeName = (alertType: string) => {
    const names = {
      anomaly: 'Anomalia',
      threshold: 'Limite',
      pattern: 'Padrão',
      compliance: 'Conformidade'
    }
    return names[alertType as keyof typeof names] || 'Alerta'
  }

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[severity as keyof typeof colors] || colors.low
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-red-100 text-red-800 border-red-200',
      acknowledged: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      false_positive: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[status as keyof typeof colors] || colors.active
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      active: <AlertTriangle className="w-4 h-4" />,
      acknowledged: <Clock className="w-4 h-4" />,
      resolved: <CheckCircle className="w-4 h-4" />,
      false_positive: <XCircle className="w-4 h-4" />
    }
    return icons[status as keyof typeof icons] || <AlertTriangle className="w-4 h-4" />
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
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alertas</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Altos</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filtros de Alertas</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({
                    status: [],
                    severity: [],
                    alert_type: []
                  })
                }}
              >
                Limpar Filtros
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm">Status</Label>
                <Select
                  value={filters.status[0] || ''}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    status: value ? [value] : [] 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="acknowledged">Reconhecido</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="false_positive">Falso Positivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Severidade</Label>
                <Select
                  value={filters.severity[0] || ''}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    severity: value ? [value] : [] 
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
                <Label className="text-sm">Tipo de Alerta</Label>
                <Select
                  value={filters.alert_type[0] || ''}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    alert_type: value ? [value] : [] 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value="anomaly">Anomalia</SelectItem>
                    <SelectItem value="threshold">Limite</SelectItem>
                    <SelectItem value="pattern">Padrão</SelectItem>
                    <SelectItem value="compliance">Conformidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Alertas de Auditoria ({alerts.length})</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAlerts}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Carregando alertas...' : 'Nenhum alerta encontrado'}
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.slice(0, maxItems).map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg">{getAlertIcon(alert.alert_type)}</span>
                        <h3 className="font-medium">{alert.title}</h3>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge className={getStatusColor(alert.status)}>
                          {getStatusIcon(alert.status)}
                          {alert.status === 'active' ? 'Ativo' : 
                           alert.status === 'acknowledged' ? 'Reconhecido' : 
                           alert.status === 'resolved' ? 'Resolvido' : 
                           'Falso Positivo'}
                        </Badge>
                        <Badge className={getRiskColor(alert.risk_score)}>
                          Risk: {formatRiskScore(alert.risk_score)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {alert.description}
                      </p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Activity className="w-3 h-3" />
                          <span>{alert.events.length} eventos relacionados</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Shield className="w-3 h-3" />
                          <span>{alert.compliance_impact.length} impactos de compliance</span>
                        </div>
                      </div>

                      {alert.compliance_impact.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-gray-500">Impacto Compliance:</span>
                            {alert.compliance_impact.map((impact, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {impact}
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
                        onClick={() => handleViewAlertDetails(alert)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Alerta */}
      {selectedAlert && (
        <AlertDetails
          alert={selectedAlert}
          isOpen={showAlertDetails}
          onClose={() => {
            setShowAlertDetails(false)
            setSelectedAlert(null)
          }}
          onAcknowledge={handleAcknowledgeAlert}
          onResolve={handleResolveAlert}
        />
      )}
    </div>
  )
}

// =============================================================================
// COMPONENTE DE DETALHES DO ALERTA
// =============================================================================

function AlertDetails({ alert, isOpen, onClose, onAcknowledge, onResolve }: AlertDetailsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Detalhes do Alerta</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Informações do Alerta</h3>
              <div className="space-y-2 text-sm">
                <div><strong>ID:</strong> {alert.id}</div>
                <div><strong>Título:</strong> {alert.title}</div>
                <div><strong>Tipo:</strong> {getAlertTypeName(alert.alert_type)}</div>
                <div><strong>Severidade:</strong> {alert.severity}</div>
                <div><strong>Status:</strong> {alert.status}</div>
                <div><strong>Risk Score:</strong> {alert.risk_score}/10</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Timeline</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Criado:</strong> {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</div>
                {alert.acknowledged_at && (
                  <div><strong>Reconhecido:</strong> {format(new Date(alert.acknowledged_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</div>
                )}
                {alert.resolved_at && (
                  <div><strong>Resolvido:</strong> {format(new Date(alert.resolved_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</div>
                )}
                {alert.acknowledged_by && (
                  <div><strong>Reconhecido por:</strong> {alert.acknowledged_by}</div>
                )}
                {alert.resolved_by && (
                  <div><strong>Resolvido por:</strong> {alert.resolved_by}</div>
                )}
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <h3 className="font-medium mb-2">Descrição</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <p className="text-sm">{alert.description}</p>
            </div>
          </div>

          {/* Impacto de Compliance */}
          {alert.compliance_impact.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Impacto de Compliance</h3>
              <div className="flex flex-wrap gap-2">
                {alert.compliance_impact.map((impact, index) => (
                  <Badge key={index} variant="outline">
                    {impact}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Ações Recomendadas */}
          {alert.recommended_actions.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Ações Recomendadas</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {alert.recommended_actions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Eventos Relacionados */}
          {alert.events.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Eventos Relacionados ({alert.events.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {alert.events.map((event) => (
                  <div key={event.id} className="border rounded p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>{auditService.getEventTypeName(event.event_type)}</strong>
                        <span className="text-gray-500 ml-2">- {event.description}</span>
                      </div>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {event.user_name} • {format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          {alert.status === 'active' && (
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onAcknowledge(alert.id)}
              >
                <Check className="w-4 h-4 mr-2" />
                Reconhecer
              </Button>
              <Button
                variant="outline"
                onClick={() => onResolve(alert.id)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Resolver
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 