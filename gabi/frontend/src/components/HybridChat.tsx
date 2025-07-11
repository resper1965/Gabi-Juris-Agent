import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Send, 
  Plus, 
  Settings, 
  Database, 
  Palette, 
  Bot, 
  Globe,
  Search,
  FileText,
  ExternalLink,
  Copy,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { useHybridChat } from '@/hooks/useHybridChat'
import { SearchResult, ChatMessage } from '@/services/hybridSearchService'
import { useGabiBases } from '@/hooks/useGabiChat'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface HybridChatProps {
  organizationId: string
  className?: string
}

interface MessageProps {
  message: ChatMessage
  onRegenerate?: () => void
  onCopy?: () => void
}

interface SourcesPanelProps {
  sources: SearchResult[]
  isOpen: boolean
  onToggle: () => void
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function HybridChat({ organizationId, className }: HybridChatProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showSources, setShowSources] = useState(false)
  const [selectedSources, setSelectedSources] = useState<SearchResult[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // =============================================================================
  // HOOKS
  // =============================================================================

  const { bases } = useGabiBases(organizationId)
  
  const {
    currentSession,
    sessions,
    messages,
    isSearching,
    isGenerating,
    searchResults,
    suggestions,
    relatedQueries,
    error,
    sendMessage,
    createNewSession,
    loadSession,
    updateSession,
    deleteSession,
    regenerateResponse,
    clearChat,
    setBases,
    setAgent,
    setStyle,
    setLanguage,
    cancelOperation
  } = useHybridChat({
    organizationId,
    initialBases: bases.map(b => b.id),
    initialAgent: 'gpt-4',
    initialStyle: 'neutro',
    initialLanguage: 'pt-BR'
  })

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (searchResults.length > 0) {
      setSelectedSources(searchResults.slice(0, 3))
    }
  }, [searchResults])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSearching || isGenerating) return

    const message = inputValue.trim()
    setInputValue('')
    
    await sendMessage(message)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleRegenerate = async (messageId: string) => {
    await regenerateResponse(messageId)
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Mensagem copiada!')
  }

  const handleCopySource = (source: SearchResult) => {
    navigator.clipboard.writeText(source.content)
    toast.success('Conteúdo da fonte copiado!')
  }

  const handleNewChat = async () => {
    await createNewSession()
    setInputValue('')
  }

  const handleLoadSession = async (sessionId: string) => {
    await loadSession(sessionId)
  }

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId)
  }

  const handleUpdateSessionTitle = async (sessionId: string, title: string) => {
    await updateSession({ title })
  }

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderMessage = ({ message, onRegenerate, onCopy }: MessageProps) => (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
        <div className={`rounded-lg px-4 py-3 ${
          message.role === 'user' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
        }`}>
          <div className="whitespace-pre-wrap">{message.content}</div>
          
          {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Fontes utilizadas:
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSources(!showSources)}
                >
                  {showSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
              
              {showSources && (
                <div className="mt-2 space-y-2">
                  {message.sources.map((source, index) => (
                    <div key={index} className="p-2 bg-white dark:bg-gray-900 rounded border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {source.metadata?.title || source.source}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopySource(source)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Badge variant="outline" className="text-xs">
                            {source.searchType}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {source.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className={`flex items-center space-x-2 mt-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString('pt-BR')}
          </span>
          
          {message.role === 'assistant' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRegenerate(message.id)}
                disabled={isGenerating}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyMessage(message.content)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  const renderSearchStatus = () => {
    if (!isSearching && !isGenerating) return null

    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center space-x-2">
          {isSearching && (
            <>
              <Search className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Buscando nas bases de conhecimento...
              </span>
            </>
          )}
          {isGenerating && (
            <>
              <Bot className="w-4 h-4 animate-pulse" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Gerando resposta...
              </span>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelOperation}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  const renderSuggestions = () => {
    if (suggestions.length === 0) return null

    return (
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sugestões:
        </h4>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => setInputValue(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const renderSettings = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações do Chat</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Bases de Conhecimento</label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {bases.map((base) => (
                <div key={base.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`base-${base.id}`}
                    checked={currentSession?.bases.includes(base.id) || false}
                    onChange={(e) => {
                      const currentBases = currentSession?.bases || []
                      const newBases = e.target.checked
                        ? [...currentBases, base.id]
                        : currentBases.filter(id => id !== base.id)
                      setBases(newBases)
                    }}
                  />
                  <label htmlFor={`base-${base.id}`} className="text-sm">
                    {base.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Agente IA</label>
            <Select
              value={currentSession?.agent || 'gpt-4'}
              onValueChange={setAgent}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4 Generalista</SelectItem>
                <SelectItem value="claude">Claude Jurídico</SelectItem>
                <SelectItem value="gemini">Gemini Técnico</SelectItem>
                <SelectItem value="gabi">Gabi Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Estilo de Resposta</label>
            <Select
              value={currentSession?.style || 'neutro'}
              onValueChange={setStyle}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
            <label className="text-sm font-medium">Idioma</label>
            <Select
              value={currentSession?.language || 'pt-BR'}
              onValueChange={setLanguage}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const renderSessionsList = () => (
    <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Conversas</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              currentSession?.id === session.id
                ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => handleLoadSession(session.id)}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium truncate">
                {session.title}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteSession(session.id)
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(session.updated_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  return (
    <div className={`flex h-screen ${className}`}>
      {/* Sidebar com sessões */}
      {renderSessionsList()}
      
      {/* Área principal do chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold">
              {currentSession?.title || 'Nova Conversa'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Bem-vindo ao GABI
                </h3>
                <p className="text-gray-500 mb-4">
                  Faça perguntas sobre suas bases de conhecimento
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => setInputValue('Como funciona o compliance ESG?')}
                  >
                    Exemplo: Como funciona o compliance ESG?
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setInputValue('Quais são os requisitos legais para...')}
                  >
                    Exemplo: Quais são os requisitos legais para...
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id}>
                  {renderMessage({
                    message,
                    onRegenerate: () => handleRegenerate(message.id),
                    onCopy: () => handleCopyMessage(message.content)
                  })}
                </div>
              ))}
              {renderSearchStatus()}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sugestões */}
        {renderSuggestions()}

        {/* Input de mensagem */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta..."
                disabled={isSearching || isGenerating}
                className="min-h-[44px]"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSearching || isGenerating}
              className="px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Configurações */}
      {renderSettings()}
    </div>
  )
} 