import React, { useState, useEffect } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Sparkles, 
  FileText, 
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
  Clock,
  Brain,
  FileType,
  Languages
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DocumentEnrichment } from '@/components/DocumentEnrichment'
import { useDocumentEnrichment } from '@/hooks/useDocumentEnrichment'
import { EnrichmentStats } from '@/services/documentEnrichmentService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface DocumentEnrichmentPageProps {}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const DocumentEnrichmentPage: NextPage<DocumentEnrichmentPageProps> = () => {
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
  } = useDocumentEnrichment({
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
        <h1 className="text-3xl font-bold">Enriquecimento Semântico</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Geração automática de título, sumário e tópicos-chave para documentos
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
                <Sparkles className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enriquecidos</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.enriched_documents}
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
                    {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.pending_enrichment}
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
                <Globe className="w-5 h-5" />
                <span>Por Idioma</span>
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
                  {Object.entries(stats.by_idioma).map(([idioma, count]) => (
                    <div key={idioma} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{idioma}</span>
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
                <Tag className="w-5 h-5" />
                <span>Top Tópicos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.by_topico)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([topico, count]) => (
                    <div key={topico} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{topico}</span>
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
                <span>Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tempo Médio</span>
                  <span className="text-sm">
                    {loadingStats ? <Skeleton className="h-4 w-12" /> : `${stats.avg_processing_time.toFixed(1)}ms`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recentes</span>
                  <span className="text-sm">
                    {loadingStats ? <Skeleton className="h-4 w-12" /> : stats.recent_enrichments}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Duplicados</span>
                  <span className="text-sm">
                    {loadingStats ? <Skeleton className="h-4 w-12" /> : stats.duplicate_titles}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderFeatures = () => (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Funcionalidades do Enriquecimento Semântico</h2>
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
              Geração automática de títulos, sumários e tópicos usando GPT-4 ou Claude
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold">Indexação Avançada</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tópicos-chave para melhorar busca e navegação nos documentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Languages className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold">Multilíngue</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Suporte a múltiplos idiomas com detecção automática
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
          <span>Pipeline de Enriquecimento</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-sm">1. Documento</h4>
            <p className="text-xs text-gray-500">Conteúdo extraído</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Brain className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-medium text-sm">2. Análise IA</h4>
            <p className="text-xs text-gray-500">Geração semântica</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-medium text-sm">3. Validação</h4>
            <p className="text-xs text-gray-500">Verificação de duplicatas</p>
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

  const renderExamples = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5" />
          <span>Exemplos de Enriquecimento</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-sm">Documento Jurídico</h4>
            <p className="text-xs text-gray-600 mt-1">
              <strong>Título:</strong> "Guia de Boas Práticas da LGPD para Escritórios de Advocacia"
            </p>
            <p className="text-xs text-gray-600">
              <strong>Sumário:</strong> "Este documento apresenta recomendações práticas para a implementação da LGPD em escritórios de advocacia, abordando desde a coleta de dados até o atendimento a titulares."
            </p>
            <p className="text-xs text-gray-600">
              <strong>Tópicos:</strong> LGPD, advocacia, dados pessoais, compliance, titulares
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-sm">Documento Técnico</h4>
            <p className="text-xs text-gray-600 mt-1">
              <strong>Título:</strong> "Arquitetura de Microserviços: Padrões e Melhores Práticas"
            </p>
            <p className="text-xs text-gray-600">
              <strong>Sumário:</strong> "Guia completo sobre arquitetura de microserviços, incluindo padrões de design, estratégias de comunicação e práticas recomendadas para implementação."
            </p>
            <p className="text-xs text-gray-600">
              <strong>Tópicos:</strong> microserviços, arquitetura, padrões, API, containers
            </p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium text-sm">Documento Educacional</h4>
            <p className="text-xs text-gray-600 mt-1">
              <strong>Título:</strong> "Introdução à Inteligência Artificial para Iniciantes"
            </p>
            <p className="text-xs text-gray-600">
              <strong>Sumário:</strong> "Material didático introdutório sobre IA, conceitos básicos, aplicações práticas e tendências atuais do mercado."
            </p>
            <p className="text-xs text-gray-600">
              <strong>Tópicos:</strong> inteligência artificial, machine learning, algoritmos, aplicações
            </p>
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

        {/* Exemplos */}
        {renderExamples()}

        {/* Componente principal */}
        <DocumentEnrichment 
          organizationId={user.organization_id}
          className="mt-6"
        />
      </div>
    </ProtectedRoute>
  )
}

export default DocumentEnrichmentPage 