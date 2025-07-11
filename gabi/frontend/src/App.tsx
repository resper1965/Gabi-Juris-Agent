import React from 'react'
import { useAuth } from './hooks/useAuth'
import LoginForm from '@/components/LoginForm'
import ChatInterface from '@/components/ChatInterface'
import { DocumentStatusPanel } from './components/DocumentStatusPanel'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="flex h-full">
      {/* Painel Lateral */}
      <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Personalização da Gabi */}
          {/* PersonalizationPanel */}
          
          {/* Status dos Documentos Indexados */}
          <DocumentStatusPanel />
        </div>
      </div>
      
      {/* Interface de Chat */}
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  )
} 