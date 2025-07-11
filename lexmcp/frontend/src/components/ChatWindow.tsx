import React, { useRef, useEffect } from 'react'
import { Bot, User, Clock } from 'lucide-react'
import { useChatStore, useSelectedAgent } from '../stores/useChatStore'

export const ChatWindow: React.FC = () => {
  const { messages, isLoading } = useChatStore()
  const selectedAgent = useSelectedAgent()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getMessageIcon = (role: string) => {
    switch (role) {
      case 'user':
        return <User className="w-6 h-6 text-chat-user" />
      case 'assistant':
        return <Bot className="w-6 h-6 text-chat-assistant" />
      default:
        return <Bot className="w-6 h-6 text-chat-system" />
    }
  }

  const getMessageBubbleClass = (role: string) => {
    switch (role) {
      case 'user':
        return 'bg-chat-user text-white ml-auto'
      case 'assistant':
        return 'bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 text-black dark:text-white'
      default:
        return 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {selectedAgent ? (
              <>
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-black dark:text-white">
                    {selectedAgent.name}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {selectedAgent.description}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-neutral-500 dark:text-neutral-400">
                Selecione um agente para começar
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span>{messages.length} mensagens</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-black">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-black dark:text-white mb-2">
              Bem-vindo ao Gabi
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
              Selecione um agente e uma base de conhecimento para começar a conversar. 
              Nossos agentes especializados estão prontos para ajudá-lo com questões jurídicas.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 animate-fade-in ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {getMessageIcon(message.role)}
              </div>

              {/* Message Bubble */}
              <div className={`flex-1 max-w-3xl`}>
                <div className={`rounded-lg px-4 py-3 ${getMessageBubbleClass(message.role)}`}>
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  
                  {/* Metadata */}
                  {message.metadata && (
                    <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(message.timestamp)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {message.metadata.tokens && (
                            <span>{message.metadata.tokens} tokens</span>
                          )}
                          {message.metadata.latency && (
                            <span>{message.metadata.latency}ms</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3 animate-fade-in">
            <div className="flex-shrink-0">
              <Bot className="w-6 h-6 text-chat-assistant" />
            </div>
            <div className="flex-1 max-w-3xl">
              <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    Digitando...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
} 