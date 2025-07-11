import React from 'react'
import { NextPage } from 'next'
import Head from 'next/head'
import KnowledgeBaseForm from '@/components/KnowledgeBaseForm'
import { useAdminAuth } from '@/hooks/useAdminAuth'

// =============================================================================
// PÁGINA DE CRIAÇÃO DE BASE DE CONHECIMENTO - GABI
// =============================================================================

const NewKnowledgeBasePage: NextPage = () => {
  const { user, loading, isAdmin } = useAdminAuth()

  // =============================================================================
  // RENDERIZAÇÃO DE CARREGAMENTO
  // =============================================================================

  if (loading) {
    return (
      <>
        <Head>
          <title>Carregando... | GABI</title>
        </Head>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Verificando permissões...</p>
          </div>
        </div>
      </>
    )
  }

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  return (
    <>
      <Head>
        <title>Nova Base de Conhecimento | GABI</title>
        <meta name="description" content="Criar nova base de conhecimento com estilo personalizável na GABI" />
      </Head>
      
      {isAdmin ? (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <KnowledgeBaseForm />
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Você não tem permissão para criar bases de conhecimento.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default NewKnowledgeBasePage 