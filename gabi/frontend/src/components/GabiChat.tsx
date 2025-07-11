import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  Bot, 
  User, 
  Database, 
  Settings, 
  RefreshCw,
  MessageSquare,
  FileText,
  Link,
  Copy,
  Download,
  Trash2,
  Plus,
  History,
  Palette,
  Target,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { useGabiChat } from '@/hooks/useGabiChat'
import { useAuth } from '@/hooks/useAuth'
import StyleInheritanceWidget from '@/components/StyleInheritanceWidget'
import { GabiMessage, GabiSource } from '@/services/gabiApiService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface GabiChatProps {
  tenantId: string
  agentId?: string
  baseIds?: string[]
  styleSource?: string
  className?: string
  showSettings?: boolean
  showHistory?: boolean
  compact?: boolean
}

interface ChatMessageProps {
  message: GabiMessage
  showStyleInfo?: boolean
  showSources?: boolean
}

interface ChatSourcesProps {
  sources: GabiSource[]
  showRelevance?: boolean
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function GabiChat({
  tenantId,
  agentId,
  baseIds,
  styleSource,
  className = '',
  showSettings = true,
  showHistory = true,
  compact = false
}: GabiChatProps) {
  const { user } = useAuth()
  const [inputValue, setInputValue] = useState('')
  const [selectedAgent, setSelectedAgent] = useState(agentId || '')
  const [selectedBases, setSelectedBases] = useState<string[]>(baseIds || [])
  const [selectedStyleSource, setSelectedStyleSource] = useState(styleSource || '')
  const [activeTab, setActiveTab] = useState('chat')
  const [showStyleOverride, setShowStyleOverride] = useState(false)
  const [styleOverride, setStyleOverride] = useState<any>(null)
  const [customInstructions, setCustomInstructions] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // =============================================================================
  // HOOK DO CHAT
  // =============================================================================

  const [chatState, chatActions] = useGabiChat({
    tenantId,
    agentId: selectedAgent,
    baseIds: selectedBases,
    styleSource: selectedStyleSource,
    autoConnect: true,
    enableHistory: showHistory
  })

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    scrollToBottom()
  }, [chatState.messages])

  useEffect(() => {
    if (agentId && !selectedAgent) {
      setSelectedAgent(agentId)
    }
    if (baseIds && selectedBases.length === 0) {
      setSelectedBases(baseIds)
    }
    if (styleSource && !selectedStyleSource) {
      setSelectedStyleSource(styleSource)
    }
  }, [agentId, baseIds, styleSource, selectedAgent, selectedBases, selectedStyleSource])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const question = inputValue.trim()
    setInputValue('')

    await chatActions.sendMessage(question, {
      styleOverride: showStyleOverride ? styleOverride : undefined,
      customInstructions: customInstructions || undefined
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCreateSession = async () => {
    await chatActions.createSession({
      agentId: selectedAgent,
      baseIds: selectedBases,
      styleSource: selectedStyleSource
    })
  }

  const handleDeleteSession = async () => {
    if (chatState.currentSession) {
      await chatActions.deleteSession(chatState.currentSession.chat_id)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para a área de transferência!')
  }

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderMessage = ({ message, showStyleInfo = true, showSources = true }: ChatMessageProps) => (
    <div key={message.id} className="space-y-4">
      {/* Mensagem do Usuário */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {message.question}
            </p>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(message.created_at).toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Resposta da GABI */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {message.answer}
            </p>
          </div>

          {/* Informações de Estilo */}
          {showStyleInfo && message.style_inheritance && (
            <div className="flex items-center space-x-2">
              <StyleInheritanceWidget
                inheritanceResult={message.style_inheritance}
                compact={true}
              />
              <div className="text-xs text-gray-500">
                {message.processing_time}ms • {message.tokens_used} tokens
              </div>
            </div>
          )}

          {/* Fontes */}
          {showSources && message.sources.length > 0 && (
            <ChatSources sources={message.sources} />
          )}

          <div className="text-xs text-gray-500">
            {new Date(message.created_at).toLocaleString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  )

  const renderChatArea = () => (
    <div className="flex flex-col h-full">
      {/* Cabeçalho do Chat */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold">Chat GABI</h3>
          {chatState.currentSession && (
            <Badge variant="outline" className="text-xs">
              {chatState.currentSession.chat_id.slice(-8)}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {chatState.sending && (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processando...</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToBottom}
          >
            <Target className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Área de Mensagens */}
      <ScrollArea className="flex-1 p-4">
        {chatState.loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : chatState.messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Bem-vindo ao GABI!
            </h3>
            <p className="text-gray-500 mb-4">
              Faça uma pergunta para começar a conversar com o assistente inteligente.
            </p>
            {!chatState.currentSession && (
              <Button onClick={handleCreateSession}>
                <Plus className="w-4 h-4 mr-2" />
                Iniciar Conversa
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {chatState.messages.map((message) => 
              renderMessage({ message, showStyleInfo: !compact, showSources: !compact })
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Área de Input */}
      <div className="p-4 border-t">
        <div className="space-y-3">
          <div className="flex space-x-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta..."
              className="flex-1 min-h-[60px] resize-none"
              disabled={chatState.sending || !chatState.isConnected}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || chatState.sending || !chatState.isConnected}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Opções Avançadas */}
          {!compact && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowStyleOverride(!showStyleOverride)}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <Palette className="w-3 h-3" />
                  <span>Estilo Personalizado</span>
                </button>
                <button
                  onClick={() => chatActions.retryLastMessage()}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Tentar Novamente</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                {chatState.currentSession && (
                  <span>Mensagens: {chatState.messages.length}</span>
                )}
                {chatState.sending && (
                  <span>Processando...</span>
                )}
              </div>
            </div>
          )}

          {/* Estilo Personalizado */}
          {showStyleOverride && !compact && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
              <label className="text-sm font-medium">Instruções Personalizadas</label>
              <Textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Instruções específicas para o estilo de resposta..."
                className="text-xs"
                rows={2}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Configurações do Chat</h3>
        
        {/* Agente */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium">Agente</label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um agente" />
            </SelectTrigger>
            <SelectContent>
              {chatState.agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <span>{agent.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bases de Conhecimento */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium">Bases de Conhecimento</label>
          <div className="grid grid-cols-2 gap-2">
            {chatState.bases.map((base) => (
              <div key={base.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={base.id}
                  checked={selectedBases.includes(base.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBases([...selectedBases, base.id])
                    } else {
                      setSelectedBases(selectedBases.filter(id => id !== base.id))
                    }
                  }}
                />
                <label htmlFor={base.id} className="text-sm">
                  {base.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Fonte de Estilo */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium">Fonte de Estilo</label>
          <Select value={selectedStyleSource} onValueChange={setSelectedStyleSource}>
            <SelectTrigger>
              <SelectValue placeholder="Estilo automático" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Estilo automático</SelectItem>
              {chatState.bases.map((base) => (
                <SelectItem key={base.id} value={base.id}>
                  {base.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ações */}
        <div className="flex space-x-2">
          <Button onClick={handleCreateSession} disabled={!selectedAgent || selectedBases.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Sessão
          </Button>
          {chatState.currentSession && (
            <Button variant="outline" onClick={handleDeleteSession}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Sessão
            </Button>
          )}
        </div>
      </div>

      {/* Informações da Sessão */}
      {chatState.currentSession && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium mb-2">Sessão Atual</h4>
          <div className="space-y-1 text-sm">
            <div>ID: {chatState.currentSession.chat_id}</div>
            <div>Mensagens: {chatState.currentSession.message_count}</div>
            <div>Criada: {new Date(chatState.currentSession.created_at).toLocaleString('pt-BR')}</div>
          </div>
        </div>
      )}
    </div>
  )

  const renderHistory = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Histórico de Mensagens</h3>
        <Button variant="outline" size="sm" onClick={() => chatActions.clearMessages()}>
          Limpar
        </Button>
      </div>

      <ScrollArea className="h-64">
        {chatState.messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma mensagem no histórico
          </div>
        ) : (
          <div className="space-y-4">
            {chatState.messages.map((message) => 
              renderMessage({ message, showStyleInfo: false, showSources: false })
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          {renderChatArea()}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-500" />
          <span>Chat GABI</span>
          {!chatState.isConnected && (
            <Badge variant="destructive">Desconectado</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            {showSettings && <TabsTrigger value="settings">Configurações</TabsTrigger>}
            {showHistory && <TabsTrigger value="history">Histórico</TabsTrigger>}
          </TabsList>

          <TabsContent value="chat" className="h-96">
            {renderChatArea()}
          </TabsContent>

          {showSettings && (
            <TabsContent value="settings">
              {renderSettings()}
            </TabsContent>
          )}

          {showHistory && (
            <TabsContent value="history">
              {renderHistory()}
            </TabsContent>
          )}
        </Tabs>

        {/* Alertas */}
        {chatState.error && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{chatState.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// COMPONENTE DE FONTES
// =============================================================================

function ChatSources({ sources, showRelevance = true }: ChatSourcesProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <FileText className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Fontes ({sources.length})
        </span>
      </div>
      
      <div className="space-y-2">
        {sources.map((source, index) => (
          <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <Link className="w-4 h-4 text-blue-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                >
                  {source.title}
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(source.url)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              
              {source.snippet && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {source.snippet}
                </p>
              )}
              
              {showRelevance && source.relevance_score && (
                <div className="flex items-center space-x-2 mt-1">
                  <div className="text-xs text-gray-500">Relevância:</div>
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div 
                      className="bg-green-500 h-1 rounded-full" 
                      style={{ width: `${source.relevance_score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round(source.relevance_score * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 