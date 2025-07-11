import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Mic, Smile } from 'lucide-react'
import { useChatStore } from '../stores/useChatStore'

export const MessageInput: React.FC = () => {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { sendMessage, isLoading } = useChatStore()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    const trimmedMessage = message.trim()
    setMessage('')
    setIsTyping(false)
    
    await sendMessage(trimmedMessage)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    setIsTyping(e.target.value.length > 0)
  }

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Input Container */}
        <div className="relative">
          <div className="flex items-end space-x-2 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-colors">
            {/* Attachment Button */}
            <button
              type="button"
              className="flex-shrink-0 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              title="Anexar arquivo"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="flex-1 min-h-[20px] max-h-32 resize-none bg-transparent border-none outline-none text-sm text-black dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
              rows={1}
              disabled={isLoading}
            />

            {/* Emoji Button */}
            <button
              type="button"
              className="flex-shrink-0 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              title="Emojis"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Voice Button */}
            <button
              type="button"
              className="flex-shrink-0 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              title="Gravar áudio"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isTyping || isLoading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isTyping && !isLoading
                ? 'bg-primary-500 hover:bg-primary-600 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Enviar</span>
          </button>
        </div>

        {/* Character Count */}
        {isTyping && (
          <div className="text-xs text-neutral-500 dark:text-neutral-400 text-right">
            {message.length} caracteres
          </div>
        )}
      </form>
    </div>
  )
} 