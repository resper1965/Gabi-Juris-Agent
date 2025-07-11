import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Calendar,
  Download,
  Upload,
  Archive,
  Trash2,
  RotateCcw,
  MoreHorizontal,
  Clock,
  User,
  Bot,
  FileText,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Copy,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { useChatHistory } from '@/hooks/useChatHistory'
import { ChatSession, ChatMessage, ChatHistoryFilters } from '@/services/chatHistoryService'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface ChatHistoryProps {
  userId: string
  organizationId: string
  onSessionSelect?: (session: ChatSession) => void
  onMessageRegenerate?: (messageId: string) => void
  className?: string
}

interface SessionCardProps {
  session: ChatSession
  onSelect: () => void
  onArchive: () => void
  onDelete: () => void
  onRestore: () => void
  onExport: () => void
  isSelected?: boolean
}

interface MessageViewerProps {
  messages: ChatMessage[]
  onRegenerate: (messageId: string) => void
  onCopy: (content: string) => void
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ChatHistory({ 
  userId, 
  organizationId, 
  onSessionSelect,
  onMessageRegenerate,
  className 
}: ChatHistoryProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [showMessageViewer, setShowMessageViewer] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // =============================================================================
  // HOOKS
  // =============================================================================

  const {
    sessions,
    currentSession,
    messages,
    stats,
    loading,
    loadingMessages,
    loadingStats,
    error,
    filters,
    loadSession,
    updateSession,
    archiveSession,
    deleteSession,
    restoreSession,
    setFilters,
    clearFilters,
    searchSessions,
    loadStats,
    refreshSessions,
    exportSession
  } = useChatHistory({
    userId,
    organizationId,
    autoRefresh: true
  })

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    if (searchQuery) {
      searchSessions(searchQuery)
    } else {
      setFilters({ ...filters, search: undefined })
    }
  }, [searchQuery])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSessionSelect = async (session: ChatSession) => {
    try {
      await loadSession(session.id)
      setSelectedSession(session)
      onSessionSelect?.(session)
    } catch (error) {
      console.error('Erro ao selecionar sessão:', error)
    }
  }

  const handleArchiveSession = async (sessionId: string) => {
    await archiveSession(sessionId)
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId)
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null)
    }
  }

  const handleRestoreSession = async (sessionId: string) => {
    await restoreSession(sessionId)
  }

  const handleExportSession = async (sessionId: string) => {
    await exportSession(sessionId)
  }

  const handleRegenerateMessage = (messageId: string) => {
    onMessageRegenerate?.(messageId)
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Mensagem copiada!')
  }

  const handleFilterChange = (key: keyof ChatHistoryFilters, value: any) => {
    setFilters({ ...filters, [key]: value })
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'all') {
      setFilters({ ...filters, status: undefined })
    } else if (tab === 'active') {
      setFilters({ ...filters, status: 'active' })
    } else if (tab === 'archived') {
      setFilters({ ...filters, status: 'archived' })
    }
  }

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderFilters = () => (
    <div className="space-y-4 p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filtros</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Agente</label>
            <Select
              value={filters.agent_id || ''}
              onValueChange={(value) => handleFilterChange('agent_id', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os agentes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os agentes</SelectItem>
                <SelectItem value="gpt-4">GPT-4 Generalista</SelectItem>
                <SelectItem value="claude">Claude Jurídico</SelectItem>
                <SelectItem value="gemini">Gemini Técnico</SelectItem>
                <SelectItem value="gabi">Gabi Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Estilo</label>
            <Select
              value={filters.style_id || ''}
              onValueChange={(value) => handleFilterChange('style_id', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os estilos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os estilos</SelectItem>
                <SelectItem value="neutro">Neutro</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="didatico">Didático</SelectItem>
                <SelectItem value="juridico">Jurídico</SelectItem>
                <SelectItem value="executivo">Executivo</SelectItem>
                <SelectItem value="resumido">Resumido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Período</label>
            <Select
              value={filters.date_range ? 'custom' : ''}
              onValueChange={(value) => {
                if (value === 'today') {
                  const today = new Date().toISOString().split('T')[0]
                  handleFilterChange('date_range', { start: today, end: today })
                } else if (value === 'week') {
                  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                  const now = new Date().toISOString()
                  handleFilterChange('date_range', { start: weekAgo, end: now })
                } else if (value === 'month') {
                  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                  const now = new Date().toISOString()
                  handleFilterChange('date_range', { start: monthAgo, end: now })
                } else {
                  handleFilterChange('date_range', undefined)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todo período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todo período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
        >
          Limpar filtros
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshSessions}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
    </div>
  )

  const renderStats = () => {
    if (!stats) return null

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total_sessions}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total de conversas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.active_sessions}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Ativas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.total_messages}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Mensagens</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.total_tokens}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Tokens</div>
        </div>
      </div>
    )
  }

  const renderSessionCard = ({ 
    session, 
    onSelect, 
    onArchive, 
    onDelete, 
    onRestore, 
    onExport,
    isSelected 
  }: SessionCardProps) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate mb-1">{session.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {session.summary || 'Sem resumo disponível'}
            </p>
            
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {session.agent_id}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {session.style_id}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {session.base_ids.length} bases
              </Badge>
            </div>

            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {formatDistanceToNow(new Date(session.started_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </div>
          </div>

          <div className="flex items-center space-x-1 ml-2">
            {session.status === 'archived' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRestore()
                }}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onArchive()
                  }}
                >
                  <Archive className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onExport()
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderMessageViewer = ({ messages, onRegenerate, onCopy }: MessageViewerProps) => (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {messages.map((message) => (
        <div key={message.id} className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {message.sender === 'user' ? (
                <User className="w-4 h-4 text-blue-600" />
              ) : (
                <Bot className="w-4 h-4 text-green-600" />
              )}
              <span className="text-sm font-medium">
                {message.sender === 'user' ? 'Você' : 'GABI'}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleString('pt-BR')}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              {message.sender === 'agent' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRegenerate(message.id)}
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(message.content)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          
          {message.used_docs && message.used_docs.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 mb-1">Fontes utilizadas:</div>
              <div className="space-y-1">
                {message.used_docs.slice(0, 3).map((doc, index) => (
                  <div key={index} className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded">
                    {doc.title} ({doc.search_type})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Histórico de Conversas</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie e visualize suas conversas anteriores
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => loadStats()}
          disabled={loadingStats}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Estatísticas
        </Button>
      </div>

      {/* Estatísticas */}
      {renderStats()}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar conversas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtros */}
      {renderFilters()}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">Todas ({sessions.length})</TabsTrigger>
          <TabsTrigger value="active">Ativas ({sessions.filter(s => s.status === 'active').length})</TabsTrigger>
          <TabsTrigger value="archived">Arquivadas ({sessions.filter(s => s.status === 'archived').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Lista de sessões */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Nenhuma conversa encontrada
          </h3>
          <p className="text-gray-500">
            {searchQuery || Object.keys(filters).length > 0 
              ? 'Tente ajustar os filtros de busca'
              : 'Comece uma nova conversa para ver o histórico aqui'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id}>
              {renderSessionCard({
                session,
                onSelect: () => handleSessionSelect(session),
                onArchive: () => handleArchiveSession(session.id),
                onDelete: () => handleDeleteSession(session.id),
                onRestore: () => handleRestoreSession(session.id),
                onExport: () => handleExportSession(session.id),
                isSelected: selectedSession?.id === session.id
              })}
            </div>
          ))}
        </div>
      )}

      {/* Visualizador de mensagens */}
      {selectedSession && messages.length > 0 && (
        <Dialog open={showMessageViewer} onOpenChange={setShowMessageViewer}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              Visualizar mensagens desta conversa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedSession.title}</DialogTitle>
            </DialogHeader>
            {renderMessageViewer({
              messages,
              onRegenerate: handleRegenerateMessage,
              onCopy: handleCopyMessage
            })}
          </DialogContent>
        </Dialog>
      )}

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
} 