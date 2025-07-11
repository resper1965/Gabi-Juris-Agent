import React, { useState, useEffect } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  FileText, 
  Shield, 
  Tag, 
  Globe, 
  BookOpen, 
  Users, 
  Zap, 
  BarChart3, 
  Settings, 
  Plus, 
  RefreshCw, 
  TrendingUp, 
  Target, 
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DocumentClassification } from '@/components/DocumentClassification'
import { useDocumentClassification } from '@/hooks/useDocumentClassification'
import { ClassificationStats } from '@/services/documentClassificationService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface DocumentClassificationPageProps {}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const DocumentClassificationPage: NextPage<DocumentClassificationPageProps> = () => {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [showDetailedStats, setShowDetailedStats] = useState(false)

  // =============================================================================
  // HOOKS
  // =============================================================================

  const {
    stats,
    loadingStats,
    loadStats
  } = useDocumentClassification({
    organizationId: user?.organization_id || '',
    autoRefresh: true
  })

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    if (user?.organization_id) {
      loadStats()
    }
  }, [user?.organization_id])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleUploadDocument = () => {
    router.push('/admin/bases')
  }

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold">Classificação Automática</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sistema inteligente de classificação e indexação de documentos
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          onClick={() => setShowDetailedStats(!showDetailedStats)}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Estatísticas Detalhadas
        </Button>
        <Button
          variant="outline"
          onClick={() => loadStats()}
          disabled={loadingStats}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
        <Button
          onClick={handleUploadDocument}
        >
          <Plus className="w-4 h-4 mr-2" />
          Enviar Documento
        </Button>
      </div>
    </div>
  )

  const renderDetailedStats = () => {
    if (!showDetailedStats || !stats) return null

    return (
      <div className="mb-6 space-y-6">
        {/* Métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Documentos</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.total_documents}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Classificados</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.classified_documents}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.pending_review}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Alta Confiança</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.high_confidence}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Análises detalhadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Por Confidencialidade</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.by_confidencialidade).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{level}</span>
                      <Badge variant="outline">{count} docs</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Por Estilo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.by_estilo).slice(0, 5).map(([style, count]) => (
                    <div key={style} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{style}</span>
                      <Badge variant="outline">{count} docs</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Por Área</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.by_area).slice(0, 5).map(([area, count]) => (
                    <div key={area} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{area}</span>
                      <Badge variant="outline">{count} docs</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Performance do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Tempo Médio de Processamento</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> : `${stats.avg_processing_time.toFixed(1)}s`}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Classificações Recentes</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> : stats.recent_classifications}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> : 
                   stats.total_documents > 0 ? `${((stats.classified_documents / stats.total_documents) * 100).toFixed(1)}%` : '0%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderFeatures = () => (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Funcionalidades da Classificação Automática</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold">IA Inteligente</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Classificação automática usando GPT-4 ou Claude para análise semântica avançada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold">Segurança</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Detecção automática de confidencialidade e alertas de segurança
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold">Validação Humana</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sistema de revisão assistida para validação de classificações
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderPipeline = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>Pipeline de Classificação</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-sm">1. Ingestão</h4>
            <p className="text-xs text-gray-500">Documento recebido</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Brain className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-medium text-sm">2. Análise IA</h4>
            <p className="text-xs text-gray-500">Classificação automática</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-medium text-sm">3. Validação</h4>
            <p className="text-xs text-gray-500">Revisão humana</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Tag className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-sm">4. Indexação</h4>
            <p className="text-xs text-gray-500">Vetores atualizados</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  if (authLoading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!user?.organization_id) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-6">
          <Alert>
            <AlertDescription>
              Organização não configurada. Entre em contato com o administrador.
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        {/* Header */}
        {renderHeader()}

        {/* Estatísticas detalhadas */}
        {renderDetailedStats()}

        {/* Funcionalidades */}
        {renderFeatures()}

        {/* Pipeline */}
        {renderPipeline()}

        {/* Componente principal */}
        <DocumentClassification 
          organizationId={user.organization_id}
          className="mt-6"
        />
      </div>
    </ProtectedRoute>
  )
}

export default DocumentClassificationPage 