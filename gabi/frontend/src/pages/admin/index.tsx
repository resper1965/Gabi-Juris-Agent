import React from 'react'
import { NextPage } from 'next'
import Head from 'next/head'
import AdminPage from '@/pages/AdminPage'
import { useAdminRoute } from '@/hooks/useAdminAuth'

// =============================================================================
// PÁGINA ADMINISTRATIVA - GABI
// =============================================================================

const AdminIndexPage: NextPage = () => {
  const { loading, isAdmin } = useAdminRoute()

  // =============================================================================
  // RENDERIZAÇÃO DE CARREGAMENTO
  // =============================================================================

  if (loading) {
    return (
      <>
        <Head>
          <title>Carregando... | GABI Admin</title>
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
        <title>Painel Administrativo | GABI</title>
        <meta name="description" content="Painel administrativo da GABI para gerenciamento de documentos e usuários" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      {isAdmin ? (
        <AdminPage />
      ) : (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Acesso Negado
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Você não tem permissão para acessar esta página.
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

export default AdminIndexPage 