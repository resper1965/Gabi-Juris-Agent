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
  History, 
  BarChart3, 
  Download,
  Upload,
  Filter,
  Search,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Database,
  Palette,
  Bot,
  RefreshCw,
  Plus,
  Archive,
  Trash2,
  RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ChatHistory } from '@/components/ChatHistory'
import { useChatHistory } from '@/hooks/useChatHistory'
import { ChatSession, ChatHistoryStats } from '@/services/chatHistoryService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface ChatHistoryPageProps {}

interface HistoryStats {
  totalSessions: number
  activeSessions: number
  archivedSessions: number
  totalMessages: number
  totalTokens: number
  avgSessionDuration: number
  mostUsedAgents: Array<{ agent_id: string; count: number }>
  mostUsedBases: Array<{ base_id: string; count: number }>
  mostUsedStyles: Array<{ style_id: string; count: number }>
}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const ChatHistoryPage: NextPage<ChatHistoryPageProps> = () => {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [showStats, setShowStats] = useState(false)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  // =============================================================================
  // HOOKS
  // =============================================================================

  const {
    sessions,
    stats,
    loading: historyLoading,
    loadingStats,
    error,
    loadStats,
    importSession
  } = useChatHistory({
    userId: user?.id || '',
    organizationId: user?.organization_id || '',
    autoRefresh: true
  })

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    if (user?.id && user?.organization_id) {
      loadStats()
    }
  }, [user?.id, user?.organization_id])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSessionSelect = (session: ChatSession) => {
    setSelectedSession(session)
    // Navegar para o chat com a sessão selecionada
    router.push(`/hybrid-chat?session=${session.id}`)
  }

  const handleMessageRegenerate = (messageId: string) => {
    // Implementar regeneração de mensagem
    toast.info('Funcionalidade de regeneração será implementada')
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/json') {
      setImportFile(file)
    } else {
      toast.error('Por favor, selecione um arquivo JSON válido')
    }
  }

  const handleImportSession = async () => {
    if (!importFile) return

    try {
      const text = await importFile.text()
      const importData = JSON.parse(text)
      
      await importSession(importData)
      setShowImportDialog(false)
      setImportFile(null)
      
      toast.success('Conversa importada com sucesso!')
    } catch (error) {
      console.error('Erro ao importar sessão:', error)
      toast.error('Erro ao importar conversa. Verifique o formato do arquivo.')
    }
  }

  const handleNewChat = () => {
    router.push('/hybrid-chat')
  }

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold">Histórico de Conversas</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualize, gerencie e reutilize suas conversas anteriores com a GABI
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
          onClick={() => setShowImportDialog(true)}
        >
          <Upload className="w-4 h-4 mr-2" />
          Importar
        </Button>
        <Button
          onClick={handleNewChat}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Conversa
        </Button>
      </div>
    </div>
  )

  const renderDetailedStats = () => {
    if (!showStats || !stats) return null

    return (
      <div className="mb-6 space-y-6">
        {/* Cards principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Conversas</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.total_sessions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ativas</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.active_sessions}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mensagens</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.total_messages}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tokens</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? <Skeleton className="h-8 w-16" /> : stats.total_tokens.toLocaleString()}
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
                <Bot className="w-5 h-5" />
                <span>Agentes Mais Utilizados</span>
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
                  {stats.most_used_agents.map((agent, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{agent.agent_id}</span>
                      <Badge variant="outline">{agent.count} usos</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Bases Mais Utilizadas</span>
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
                  {stats.most_used_bases.map((base, index) => (
                    <div key={index} className="flex items-center justify-between">
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
                <Palette className="w-5 h-5" />
                <span>Estilos Mais Utilizados</span>
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
                  {stats.most_used_styles.map((style, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{style.style_id}</span>
                      <Badge variant="outline">{style.count} usos</Badge>
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
      <h2 className="text-xl font-semibold mb-4">Funcionalidades do Histórico</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold">Rastreabilidade Completa</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Todas as conversas são registradas com entradas, saídas e documentos utilizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold">Reuso de Contexto</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Reabra conversas anteriores e continue de onde parou
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold">Exportação e Backup</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Exporte conversas para backup ou compartilhamento
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderImportDialog = () => (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
      showImportDialog ? 'block' : 'hidden'
    }`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Importar Conversa</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Selecionar arquivo JSON
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleImportSession}
              disabled={!importFile}
            >
              Importar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false)
                setImportFile(null)
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
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

        {/* Histórico principal */}
        <ChatHistory
          userId={user.id}
          organizationId={user.organization_id}
          onSessionSelect={handleSessionSelect}
          onMessageRegenerate={handleMessageRegenerate}
        />

        {/* Dialog de importação */}
        {renderImportDialog()}

        {/* Erro */}
        {error && (
          <Alert className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </ProtectedRoute>
  )
}

export default ChatHistoryPage 