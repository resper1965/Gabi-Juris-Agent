import React, { useState, useEffect } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageSquare, 
  Database, 
  Palette, 
  Bot, 
  Globe,
  Search,
  FileText,
  BarChart3,
  Settings,
  Plus,
  RefreshCw,
  TrendingUp,
  Zap,
  Target,
  Shield,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { HybridChat } from '@/components/HybridChat'
import { useGabiBases, useGabiAgents } from '@/hooks/useGabiChat'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface HybridChatPageProps {}

interface ChatStats {
  totalSessions: number
  activeSessions: number
  totalMessages: number
  avgResponseTime: number
  searchAccuracy: number
  mostUsedBases: Array<{ base_id: string; count: number }>
  mostUsedAgents: Array<{ agent: string; count: number }>
}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const HybridChatPage: NextPage<HybridChatPageProps> = () => {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [showStats, setShowStats] = useState(false)
  const [stats, setStats] = useState<ChatStats | null>(null)
  const [loading, setLoading] = useState(false)

  // =============================================================================
  // HOOKS DE DADOS
  // =============================================================================

  const { bases, loading: basesLoading, refreshBases } = useGabiBases(
    user?.organization_id || ''
  )

  const { agents, loading: agentsLoading, refreshAgents } = useGabiAgents(
    user?.organization_id || ''
  )

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    if (user?.organization_id) {
      loadChatStats()
    }
  }, [user?.organization_id])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadChatStats = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento de estatísticas - em produção viria da API
      const mockStats: ChatStats = {
        totalSessions: 25,
        activeSessions: 8,
        totalMessages: 150,
        avgResponseTime: 2.3,
        searchAccuracy: 94.5,
        mostUsedBases: [
          { base_id: 'paineiras', count: 45 },
          { base_id: 'esg', count: 32 },
          { base_id: 'legal', count: 28 }
        ],
        mostUsedAgents: [
          { agent: 'gpt-4', count: 60 },
          { agent: 'claude', count: 25 },
          { agent: 'gabi', count: 15 }
        ]
      }

      setStats(mockStats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold">Chat Híbrido GABI</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Busca inteligente combinando semântica e lexical em suas bases de conhecimento
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          onClick={() => setShowStats(!showStats)}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Estatísticas
        </Button>
        <Button
          variant="outline"
          onClick={loadChatStats}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
    </div>
  )

  const renderStats = () => {
    if (!showStats || !stats) return null

    return (
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sessões</p>
                  <p className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-16" /> : `${stats.activeSessions}/${stats.totalSessions}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mensagens</p>
                  <p className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-16" /> : stats.totalMessages}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Precisão</p>
                  <p className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-16" /> : `${stats.searchAccuracy}%`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tempo Médio</p>
                  <p className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-16" /> : `${stats.avgResponseTime}s`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Bases Mais Utilizadas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.mostUsedBases.map((base) => (
                    <div key={base.base_id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{base.base_id}</span>
                      <Badge variant="outline">{base.count} usos</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="w-5 h-5" />
                <span>Agentes Mais Utilizados</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.mostUsedAgents.map((agent) => (
                    <div key={agent.agent} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{agent.agent}</span>
                      <Badge variant="outline">{agent.count} usos</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderFeatures = () => (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Funcionalidades do Chat Híbrido</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold">Busca Híbrida</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Combina busca semântica (RAG) com busca lexical para resultados mais precisos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold">Múltiplas Bases</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pesquise simultaneamente em várias bases de conhecimento da organização
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold">Estilos Personalizados</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Escolha o estilo de resposta: formal, didático, jurídico ou personalizado
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderQuickStart = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>Início Rápido</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Exemplos de Perguntas</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push('/hybrid-chat?q=Como funciona o compliance ESG?')}
              >
                "Como funciona o compliance ESG?"
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push('/hybrid-chat?q=Quais são os requisitos legais para...')}
              >
                "Quais são os requisitos legais para..."
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push('/hybrid-chat?q=Explique as políticas de sustentabilidade')}
              >
                "Explique as políticas de sustentabilidade"
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Configurações Recomendadas</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-500" />
                <span>Bases: Paineiras + ESG</span>
              </div>
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-green-500" />
                <span>Agente: GPT-4 Generalista</span>
              </div>
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-purple-500" />
                <span>Estilo: Didático</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-orange-500" />
                <span>Idioma: Português</span>
              </div>
            </div>
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
      <div className="h-screen flex flex-col">
        {/* Header com estatísticas */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto p-6">
            {renderHeader()}
            {renderStats()}
            {renderFeatures()}
            {renderQuickStart()}
          </div>
        </div>

        {/* Chat principal */}
        <div className="flex-1">
          <HybridChat 
            organizationId={user.organization_id}
            className="h-full"
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default HybridChatPage 