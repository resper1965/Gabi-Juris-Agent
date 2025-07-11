import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Shield, 
  FileText, 
  Users, 
  Settings, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import AdminDocumentPanel from '@/components/AdminDocumentPanel'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'moderator'
  avatar?: string
  last_login?: string
  created_at: string
}

interface SystemStats {
  total_documents: number
  total_users: number
  total_bases: number
  documents_today: number
  errors_today: number
  avg_processing_time: number
  system_health: 'healthy' | 'warning' | 'error'
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [activeTab, setActiveTab] = useState('documents')

  // =============================================================================
  // DADOS MOCKADOS PARA DESENVOLVIMENTO
  // =============================================================================

  const mockUser: User = {
    id: '1',
    email: 'admin@gabi.com',
    name: 'Administrador GABI',
    role: 'admin',
    avatar: 'https://github.com/shadcn.png',
    last_login: '2025-01-10T15:30:00.000Z',
    created_at: '2024-01-01T00:00:00.000Z'
  }

  const mockStats: SystemStats = {
    total_documents: 156,
    total_users: 24,
    total_bases: 6,
    documents_today: 12,
    errors_today: 2,
    avg_processing_time: 2.3,
    system_health: 'healthy'
  }

  // =============================================================================
  // EFEITOS E CARREGAMENTO
  // =============================================================================

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true)
      
      // Simular verificação de autenticação
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar se o usuário tem permissão de admin
      if (mockUser.role !== 'admin') {
        toast.error('Acesso negado. Apenas administradores podem acessar esta página.')
        // Redirecionar para página principal
        window.location.href = '/'
        return
      }
      
      setUser(mockUser)
      setStats(mockStats)
      
    } catch (error) {
      toast.error('Erro ao verificar autenticação')
      console.error('Erro de autenticação:', error)
    } finally {
      setLoading(false)
    }
  }

  // =============================================================================
  // RENDERIZAÇÃO DE COMPONENTES
  // =============================================================================

  const renderSystemHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Saudável</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Atenção</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Crítico</Badge>
      default:
        return <Badge variant="secondary">{health}</Badge>
    }
  }

  const renderQuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Documentos</p>
              <p className="text-2xl font-bold">{stats?.total_documents || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Usuários Ativos</p>
              <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Bases de Conhecimento</p>
              <p className="text-2xl font-bold">{stats?.total_bases || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Documentos Hoje</p>
              <p className="text-2xl font-bold">{stats?.documents_today || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderSystemStatus = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Status do Sistema</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="text-sm font-medium">Saúde do Sistema</span>
            {stats && renderSystemHealthBadge(stats.system_health)}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="text-sm font-medium">Erros Hoje</span>
            <span className="text-sm font-bold text-red-600">{stats?.errors_today || 0}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="text-sm font-medium">Tempo Médio de Processamento</span>
            <span className="text-sm font-bold">{stats?.avg_processing_time || 0}s</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-4">
              Você não tem permissão para acessar esta página.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bem-vindo, {user.name} • Último login: {new Date(user.last_login!).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="capitalize">
            {user.role}
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      {renderQuickStats()}

      {/* Status do sistema */}
      {renderSystemStatus()}

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="documents" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Documentos</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <AdminDocumentPanel />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Funcionalidade de gerenciamento de usuários será implementada em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics e Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Dashboard de analytics e relatórios será implementado em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Configurações avançadas do sistema serão implementadas em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 