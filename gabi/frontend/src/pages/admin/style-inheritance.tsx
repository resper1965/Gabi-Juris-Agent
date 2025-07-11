import React, { useState, useEffect } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  Palette, 
  BarChart3, 
  Clock, 
  Users, 
  Database,
  Target,
  TrendingUp,
  RefreshCw,
  Download,
  Eye,
  Filter,
  Search,
  Calendar,
  PieChart,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/AdminLayout'
import StyleInheritanceDebugger, { StyleInheritanceHistory } from '@/components/StyleInheritanceDebugger'
import { 
  useStyleInheritanceDebug, 
  useStyleInheritanceStats 
} from '@/hooks/useStyleInheritance'
import { 
  StyleInheritanceResult, 
  getStyleDisplayName,
  getStyleIcon
} from '@/services/styleInheritanceService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface StyleInheritancePageProps {}

interface FilterOptions {
  period: 'day' | 'week' | 'month' | 'year'
  source?: 'request' | 'agent' | 'base' | 'organization' | 'fallback'
  styleType?: string
  userId?: string
  baseId?: string
  agentId?: string
}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const StyleInheritancePage: NextPage<StyleInheritancePageProps> = () => {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [filters, setFilters] = useState<FilterOptions>({
    period: 'month'
  })
  const [selectedResult, setSelectedResult] = useState<StyleInheritanceResult | null>(null)

  // =============================================================================
  // HOOKS ESPECIALIZADOS
  // =============================================================================

  const {
    state: inheritanceState,
    actions: inheritanceActions,
    debugMode,
    selectedLog,
    toggleDebugMode,
    selectLog,
    exportLogs
  } = useStyleInheritanceDebug({
    organizationId: user?.organization_id || '',
    userId: user?.id || '',
    autoLog: true,
    enableCache: true
  })

  const { stats, loading: statsLoading, loadStats } = useStyleInheritanceStats(
    user?.organization_id || ''
  )

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    if (user?.organization_id) {
      loadStats(filters.period)
      inheritanceActions.loadHistory(filters.baseId, filters.agentId)
    }
  }, [user?.organization_id, filters, loadStats, inheritanceActions])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleRefresh = () => {
    loadStats(filters.period)
    inheritanceActions.loadHistory(filters.baseId, filters.agentId)
    toast.success('Dados atualizados com sucesso!')
  }

  const handleExportData = () => {
    exportLogs()
  }

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Requisições</p>
              <p className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.total_requests || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Confiança Média</p>
              <p className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : 
                 stats ? `${Math.round(stats.avg_confidence * 100)}%` : '0%'}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Estilos Únicos</p>
              <p className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : 
                 stats ? Object.keys(stats.style_distribution).length : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Fallback</p>
              <p className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : 
                 stats ? `${Math.round((stats.source_distribution.fallback || 0) / stats.total_requests * 100)}%` : '0%'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderStyleDistribution = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PieChart className="w-5 h-5" />
          <span>Distribuição de Estilos</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {statsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : stats?.most_used_styles ? (
          <div className="space-y-3">
            {stats.most_used_styles.slice(0, 10).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getStyleIcon(item.style as any)}</span>
                  <span className="font-medium">{getStyleDisplayName({ type: item.style as any })}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(item.count / stats.total_requests) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              Nenhum dado de distribuição disponível.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )

  const renderSourceDistribution = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Distribuição por Fonte</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {statsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : stats?.source_distribution ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.source_distribution).map(([source, count]) => (
              <div key={source} className="text-center">
                <div className="text-2xl font-bold text-blue-500">{count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {source}
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round((count / stats.total_requests) * 100)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              Nenhum dado de fonte disponível.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )

  const renderFilters = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="w-5 h-5" />
          <span>Filtros</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="period">Período</Label>
            <Select value={filters.period} onValueChange={(value: any) => handleFilterChange('period', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Último dia</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="year">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="source">Fonte</Label>
            <Select value={filters.source || ''} onValueChange={(value: any) => handleFilterChange('source', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as fontes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as fontes</SelectItem>
                <SelectItem value="request">Requisição</SelectItem>
                <SelectItem value="agent">Agente</SelectItem>
                <SelectItem value="base">Base</SelectItem>
                <SelectItem value="organization">Organização</SelectItem>
                <SelectItem value="fallback">Fallback</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="baseId">Base de Conhecimento</Label>
            <Input
              id="baseId"
              placeholder="ID da base"
              value={filters.baseId || ''}
              onChange={(e) => handleFilterChange('baseId', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="agentId">Agente</Label>
            <Input
              id="agentId"
              placeholder="ID do agente"
              value={filters.agentId || ''}
              onChange={(e) => handleFilterChange('agentId', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderActions = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-2">
        <Button
          variant={debugMode ? "default" : "outline"}
          size="sm"
          onClick={toggleDebugMode}
        >
          <Eye className="w-4 h-4 mr-2" />
          {debugMode ? 'Modo Debug Ativo' : 'Ativar Debug'}
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={inheritanceState.loading || statsLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${inheritanceState.loading || statsLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportData}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>
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
              <h1 className="text-3xl font-bold">Herança de Estilo</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Monitoramento e análise da herança e fallback de estilos textuais
              </p>
            </div>
          </div>

          {/* Ações */}
          {renderActions()}

          {/* Filtros */}
          {renderFilters()}

          {/* Conteúdo Principal */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="debug">Debug</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {renderStatsCards()}
              {renderStyleDistribution()}
              {renderSourceDistribution()}
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              {renderStatsCards()}
              {renderStyleDistribution()}
              {renderSourceDistribution()}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <StyleInheritanceHistory
                userId={user?.id}
                baseId={filters.baseId}
                agentId={filters.agentId}
                limit={50}
              />
            </TabsContent>

            <TabsContent value="debug" className="space-y-6">
              {debugMode ? (
                <div className="space-y-6">
                  {selectedLog ? (
                    <StyleInheritanceDebugger
                      inheritanceResult={selectedLog.inheritance_result}
                      showDetails={true}
                      onRefresh={handleRefresh}
                    />
                  ) : (
                    <Alert>
                      <AlertDescription>
                        Selecione um log do histórico para visualizar os detalhes de debug.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Ative o modo debug para visualizar informações detalhadas de herança de estilo.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}

export default StyleInheritancePage 