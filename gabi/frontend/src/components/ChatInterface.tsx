import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  Bot, 
  User, 
  Settings, 
  Loader2, 
  MessageSquare,
  Database,
  Zap,
  Clock,
  Hash
} from 'lucide-react'
import { 
  sendChatMessage, 
  getAgents, 
  getKnowledgeBases,
  Agent,
  KnowledgeBase,
  ChatMessage as ChatMessageType,
  ChatResponse
} from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: {
    agentId?: string
    sessionId?: string
    tokens?: number
    latency?: number
  }
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string>('gpt4')
  const [selectedBases, setSelectedBases] = useState<string[]>(['legal', 'company'])
  const [agents, setAgents] = useState<Agent[]>([])
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Carregar agentes e bases de conhecimento
  useEffect(() => {
    const loadResources = async () => {
      try {
        const [agentsResponse, basesResponse] = await Promise.all([
          getAgents(),
          getKnowledgeBases()
        ])

        if (agentsResponse.success) {
          setAgents(agentsResponse.data)
        }

        if (basesResponse.success) {
          setKnowledgeBases(basesResponse.data)
        }
      } catch (error) {
        console.error('Erro ao carregar recursos:', error)
      }
    }

    loadResources()
  }, [])

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const chatData: ChatMessageType = {
        message: inputMessage,
        agentId: selectedAgent,
        bases: selectedBases
      }

      const response: ChatResponse = await sendChatMessage(chatData)

      if (response.success) {
        const assistantMessage: Message = {
          id: response.data.message.id,
          role: 'assistant',
          content: response.data.message.content,
          timestamp: response.data.message.timestamp,
          metadata: response.data.message.metadata
        }

        setMessages(prev => [...prev, assistantMessage])
        setSessionId(response.data.sessionId)
      } else {
        // Adicionar mensagem de erro
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Erro de conexão com o servidor. Verifique sua conexão e tente novamente.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleBase = (baseId: string) => {
    setSelectedBases(prev => 
      prev.includes(baseId) 
        ? prev.filter(id => id !== baseId)
        : [...prev, baseId]
    )
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Gabi</h1>
              <p className="text-sm text-muted-foreground">Assistente Jurídica Inteligente</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {sessionId && (
              <Badge variant="outline" className="text-xs">
                <Hash className="w-3 h-3 mr-1" />
                {sessionId.slice(0, 8)}...
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Configurações */}
        {showSettings && (
          <div className="w-80 border-r bg-card p-4">
            <h3 className="font-semibold mb-4">Configurações</h3>
            
            <div className="space-y-4">
              {/* Seleção de Agente */}
              <div>
                <Label className="text-sm font-medium">Agente</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3" />
                          {agent.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bases de Conhecimento */}
              <div>
                <Label className="text-sm font-medium">Bases de Conhecimento</Label>
                <div className="mt-2 space-y-2">
                  {knowledgeBases.map(base => (
                    <div key={base.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={base.id}
                        checked={selectedBases.includes(base.id)}
                        onCheckedChange={() => toggleBase(base.id)}
                      />
                      <Label htmlFor={base.id} className="text-sm flex items-center gap-2">
                        <Database className="w-3 h-3" />
                        {base.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Estatísticas */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Estatísticas</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Mensagens: {messages.length}</div>
                  <div>Agente: {agents.find(a => a.id === selectedAgent)?.name || selectedAgent}</div>
                  <div>Bases ativas: {selectedBases.length}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Principal */}
        <div className="flex-1 flex flex-col">
          {/* Área de Mensagens */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Bem-vindo ao Gabi!
                  </h3>
                  <p className="text-muted-foreground">
                    Faça uma pergunta sobre direito ou legislação para começar.
                  </p>
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="/gabi-avatar.png" />
                        <AvatarFallback>
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(message.timestamp)}
                        
                        {message.metadata?.tokens && (
                          <>
                            <span>•</span>
                            <span>{message.metadata.tokens} tokens</span>
                          </>
                        )}
                        
                        {message.metadata?.latency && (
                          <>
                            <span>•</span>
                            <span>{message.metadata.latency}ms</span>
                          </>
                        )}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/gabi-avatar.png" />
                    <AvatarFallback>
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Gabi está pensando...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input de Mensagem */}
          <div className="border-t bg-card p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Agente: {agents.find(a => a.id === selectedAgent)?.name || selectedAgent}</span>
                <span>•</span>
                <span>Bases: {selectedBases.length}</span>
                <span>•</span>
                <span>Pressione Enter para enviar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 