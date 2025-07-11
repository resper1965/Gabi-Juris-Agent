import React, { useState, useEffect } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Database, 
  Palette, 
  Users, 
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Plus,
  Settings,
  BarChart3,
  FileText,
  Shield,
  Bell,
  Download,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Zap,
  Target,
  Globe,
  Building
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/AdminLayout'
import { useGabiAgents, useGabiBases, useGabiTenant } from '@/hooks/useGabiChat'
import { gabiApiService } from '@/services/gabiApiService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface AdminDashboardProps {}

interface DashboardStats {
  totalBases: number
  activeBases: number
  totalUsers: number
  activeUsers: number
  totalStyles: number
  activeStyles: number
  totalChats: number
  avgResponseTime: number
  errorRate: number
  lastIndexed: string
}

interface RecentActivity {
  id: string
  type: 'base_created' | 'base_updated' | 'style_trained' | 'user_invited' | 'error'
  description: string
  user: string
  timestamp: string
  severity: 'info' | 'warning' | 'error'
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error'
  lastCheck: string
  issues: string[]
  recommendations: string[]
}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const AdminDashboard: NextPage<AdminDashboardProps> = () => {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)

  // =============================================================================
  // HOOKS DE DADOS
  // =============================================================================

  const { agents, loading: agentsLoading, refreshAgents } = useGabiAgents(
    user?.organization_id || ''
  )

  const { bases, loading: basesLoading, refreshBases } = useGabiBases(
    user?.organization_id || ''
  )

  const { tenant, loading: tenantLoading } = useGabiTenant(
    user?.organization_id || ''
  )

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    if (user?.organization_id) {
      loadDashboardData()
    }
  }, [user?.organization_id])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Carregar dados em paralelo
      const [statsData, activityData, healthData] = await Promise.all([
        loadStats(),
        loadRecentActivity(),
        loadSystemHealth()
      ])

      setStats(statsData)
      setRecentActivity(activityData)
      setSystemHealth(healthData)

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
      toast.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (): Promise<DashboardStats> => {
    // Simular dados - em produção viria da API
    return {
      totalBases: bases.length,
      activeBases: bases.filter(b => b.is_active).length,
      totalUsers: 25,
      activeUsers: 18,
      totalStyles: 8,
      activeStyles: 6,
      totalChats: 150,
      avgResponseTime: 2.3,
      errorRate: 0.5,
      lastIndexed: new Date().toISOString()
    }
  }

  const loadRecentActivity = async (): Promise<RecentActivity[]> => {
    // Simular dados - em produção viria da API
    return [
      {
        id: '1',
        type: 'base_created',
        description: 'Nova base "ESG Compliance" criada',
        user: 'admin@company.com',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        severity: 'info'
      },
      {
        id: '2',
        type: 'style_trained',
        description: 'Estilo "Jurídico Formal" treinado da base Legal',
        user: 'admin@company.com',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        severity: 'info'
      },
      {
        id: '3',
        type: 'user_invited',
        description: 'Usuário convidado: maria@company.com',
        user: 'admin@company.com',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        severity: 'info'
      },
      {
        id: '4',
        type: 'error',
        description: 'Erro na indexação da base "Technical Docs"',
        user: 'system',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        severity: 'error'
      }
    ]
  }

  const loadSystemHealth = async (): Promise<SystemHealth> => {
    // Simular dados - em produção viria da API
    return {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      issues: [],
      recommendations: [
        'Considere reindexar a base "Legacy Docs" que não foi atualizada há 30 dias',
        'O estilo "Comercial" pode ser otimizado com mais dados de treinamento'
      ]
    }
  }

  const handleRefresh = async () => {
    await loadDashboardData()
    await Promise.all([refreshAgents(), refreshBases()])
    toast.success('Dashboard atualizado com sucesso!')
  }

  const handleNavigateTo = (path: string) => {
    router.push(path)
  }

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Bases de Conhecimento</p>
              <p className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : `${stats?.activeBases}/${stats?.totalBases}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Usuários Ativos</p>
              <p className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : `${stats?.activeUsers}/${stats?.totalUsers}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Estilos Disponíveis</p>
              <p className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : `${stats?.activeStyles}/${stats?.totalStyles}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sessões de Chat</p>
              <p className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : stats?.totalChats || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderPerformanceMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Tempo Médio de Resposta</span>
              <span className="font-semibold">
                {loading ? <Skeleton className="h-4 w-12" /> : `${stats?.avgResponseTime}s`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Taxa de Erro</span>
              <span className="font-semibold">
                {loading ? <Skeleton className="h-4 w-12" /> : `${stats?.errorRate}%`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Última Indexação</span>
              <span className="text-xs text-gray-500">
                {loading ? <Skeleton className="h-4 w-20" /> : 
                 stats?.lastIndexed ? new Date(stats.lastIndexed).toLocaleString('pt-BR') : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Saúde do Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : systemHealth ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {systemHealth.status === 'healthy' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {systemHealth.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                {systemHealth.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                <span className="text-sm font-medium capitalize">{systemHealth.status}</span>
              </div>
              {systemHealth.issues.length > 0 && (
                <div className="text-xs text-red-600">
                  {systemHealth.issues[0]}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Status não disponível</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Atividade Recente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))
            ) : (
              recentActivity.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.severity === 'error' ? 'bg-red-500' :
                    activity.severity === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <span className="truncate">{activity.description}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderQuickActions = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>Ações Rápidas</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            onClick={() => handleNavigateTo('/admin/bases')}
            className="h-20 flex-col space-y-2"
          >
            <Database className="w-6 h-6" />
            <span className="text-sm">Gerenciar Bases</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleNavigateTo('/admin/styles')}
            className="h-20 flex-col space-y-2"
          >
            <Palette className="w-6 h-6" />
            <span className="text-sm">Gerenciar Estilos</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleNavigateTo('/admin/users')}
            className="h-20 flex-col space-y-2"
          >
            <Users className="w-6 h-6" />
            <span className="text-sm">Gerenciar Usuários</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleNavigateTo('/admin/audit')}
            className="h-20 flex-col space-y-2"
          >
            <Activity className="w-6 h-6" />
            <span className="text-sm">Auditoria</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderRecentActivity = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Atividade Recente</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigateTo('/admin/audit')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Tudo
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.severity === 'error' ? 'bg-red-100 text-red-600' :
                  activity.severity === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {activity.type === 'base_created' && <Database className="w-4 h-4" />}
                  {activity.type === 'style_trained' && <Palette className="w-4 h-4" />}
                  {activity.type === 'user_invited' && <Users className="w-4 h-4" />}
                  {activity.type === 'error' && <AlertTriangle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{activity.user}</span>
                    <span>•</span>
                    <span>{new Date(activity.timestamp).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderSystemRecommendations = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Recomendações do Sistema</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : systemHealth?.recommendations ? (
          <div className="space-y-3">
            {systemHealth.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma recomendação no momento</p>
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

  if (!user?.organization_id) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <Alert>
            <AlertDescription>
              Organização não configurada. Entre em contato com o administrador.
            </AlertDescription>
          </Alert>
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
              <h1 className="text-3xl font-bold">Painel Administrativo</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie bases, estilos, usuários e monitore a plataforma GABI
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Informações da Organização */}
          {tenant && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">{tenant.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {tenant.domain}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {agents.length} agentes
                    </Badge>
                    <Badge variant="outline">
                      {bases.length} bases
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conteúdo Principal */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
              <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {renderStatsCards()}
              {renderQuickActions()}
              {renderRecentActivity()}
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {renderPerformanceMetrics()}
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              {renderRecentActivity()}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              {renderSystemRecommendations()}
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}

export default AdminDashboard 