import React, { useState } from 'react'
import { NextPage } from 'next'
import { Head } from '@/components/Head'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, 
  Zap, 
  Plus, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  TrendingUp,
  Activity,
  FileText,
  Database,
  Users,
  Sparkles,
  Lightbulb,
  BookOpen,
  Target,
  Award
} from 'lucide-react'
import { CreateTaskModal } from '@/components/CreateTaskModal'
import { TaskList } from '@/components/TaskList'
import { useTasks } from '@/hooks/useTasks'
import { Task, TaskStats } from '@/services/taskService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface TaskTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: React.ReactNode
  examples: string[]
}

// =============================================================================
// TEMPLATES DE TAREFAS
// =============================================================================

const taskTemplates: TaskTemplate[] = [
  {
    id: 'analysis',
    name: 'Análise de Documentos',
    description: 'Analise documentos e identifique pontos importantes',
    category: 'analysis',
    icon: <BookOpen className="w-5 h-5" />,
    examples: [
      'Analise os contratos vencendo este mês e destaque as cláusulas críticas',
      'Identifique inconsistências entre dois documentos técnicos',
      'Revise os documentos da base jurídica e liste os principais pontos de atenção'
    ]
  },
  {
    id: 'summary',
    name: 'Resumos Executivos',
    description: 'Crie resumos concisos de documentos e relatórios',
    category: 'summary',
    icon: <FileText className="w-5 h-5" />,
    examples: [
      'Crie um resumo executivo dos 5 documentos mais acessados da base técnica',
      'Resuma os principais pontos dos documentos da semana com estilo jurídico',
      'Faça um resumo dos procedimentos internos mais importantes'
    ]
  },
  {
    id: 'extraction',
    name: 'Extração de Dados',
    description: 'Extraia informações específicas de documentos',
    category: 'extraction',
    icon: <Target className="w-5 h-5" />,
    examples: [
      'Extraia todas as datas importantes dos documentos da base jurídica',
      'Identifique os valores monetários mencionados nos contratos',
      'Liste todas as responsabilidades das partes nos documentos analisados'
    ]
  },
  {
    id: 'comparison',
    name: 'Comparação e Análise',
    description: 'Compare documentos e identifique diferenças',
    category: 'comparison',
    icon: <TrendingUp className="w-5 h-5" />,
    examples: [
      'Compare dois contratos e identifique as principais diferenças',
      'Analise a evolução de políticas ao longo do tempo',
      'Identifique padrões entre documentos de diferentes períodos'
    ]
  },
  {
    id: 'review',
    name: 'Revisão e Validação',
    description: 'Revise documentos e valide informações',
    category: 'review',
    icon: <Award className="w-5 h-5" />,
    examples: [
      'Revise os documentos da semana com estilo jurídico clássico',
      'Valide se todos os contratos seguem o padrão da empresa',
      'Verifique a consistência de informações entre documentos relacionados'
    ]
  },
  {
    id: 'custom',
    name: 'Tarefas Personalizadas',
    description: 'Crie tarefas customizadas para necessidades específicas',
    category: 'custom',
    icon: <Sparkles className="w-5 h-5" />,
    examples: [
      'Crie uma análise personalizada baseada em critérios específicos',
      'Desenvolva um relatório customizado para stakeholders',
      'Execute uma tarefa única baseada em requisitos especiais'
    ]
  }
]

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const TasksPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  
  // Mock data - em produção viria do hook
  const mockUserId = 'user-123'
  const mockOrgId = 'org-456'
  
  const {
    tasks,
    stats,
    loading,
    getTasksByStatus,
    getRecentTasks
  } = useTasks({
    userId: mockUserId,
    organizationId: mockOrgId
  })

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleCreateTask = (template?: TaskTemplate) => {
    setSelectedTemplate(template || null)
    setShowCreateModal(true)
  }

  const handleTaskCreated = (task: Task) => {
    console.log('Tarefa criada:', task)
    // Atualizar lista de tarefas
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const getTasksByStatusCount = (status: string) => {
    return getTasksByStatus(status).length
  }

  const getRecentTasksCount = () => {
    return getRecentTasks(7).length
  }

  const getCompletionRate = () => {
    if (!stats) return 0
    return stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0
  }

  // =============================================================================
  // RENDERIZAÇÃO
  // =============================================================================

  return (
    <>
      <Head title="Tarefas com GABI - Assistente de Conhecimento" />
      
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Tarefas com GABI</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Crie comandos em linguagem natural e deixe a IA executar suas tarefas
              </p>
            </div>
            <Button onClick={() => handleCreateTask()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="tasks">Minhas Tarefas</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total_tasks || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {getRecentTasksCount()} esta semana
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {getCompletionRate()}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tarefas concluídas com sucesso
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Em Processamento</CardTitle>
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {getTasksByStatusCount('processing')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tarefas ativas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.avg_completion_time ? Math.round(stats.avg_completion_time / 1000) : 0}s
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Por tarefa
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Ações Rápidas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {taskTemplates.slice(0, 6).map((template) => (
                      <Card 
                        key={template.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleCreateTask(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                              {template.icon}
                            </div>
                            <div>
                              <h3 className="font-medium">{template.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {template.description}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Usar Template
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Tarefas Recentes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskList 
                    showFilters={false} 
                    showStats={false} 
                    maxTasks={5} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {taskTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          {template.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Exemplos de Comandos:</h4>
                        <div className="space-y-2">
                          {template.examples.map((example, index) => (
                            <div 
                              key={index}
                              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              onClick={() => handleCreateTask(template)}
                            >
                              "{example}"
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleCreateTask(template)}
                        className="w-full"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Usar Este Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-6">
              <TaskList />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Performance das Tarefas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Taxa de Sucesso</span>
                        <span className="font-medium">{getCompletionRate()}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${getCompletionRate()}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tempo Médio</span>
                        <span className="font-medium">
                          {stats?.avg_completion_time ? Math.round(stats.avg_completion_time / 1000) : 0}s
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tokens Utilizados</span>
                        <span className="font-medium">
                          {stats?.total_tokens_used ? stats.total_tokens_used.toLocaleString() : 0}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Custo Total</span>
                        <span className="font-medium">
                          ${stats?.total_cost ? stats.total_cost.toFixed(4) : '0.0000'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>Distribuição por Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['completed', 'processing', 'pending', 'failed', 'cancelled'].map((status) => {
                        const count = getTasksByStatusCount(status)
                        const percentage = stats?.total_tasks ? Math.round((count / stats.total_tasks) * 100) : 0
                        
                        const statusConfig = {
                          completed: { color: 'bg-green-600', label: 'Concluídas' },
                          processing: { color: 'bg-blue-600', label: 'Processando' },
                          pending: { color: 'bg-yellow-600', label: 'Pendentes' },
                          failed: { color: 'bg-red-600', label: 'Falharam' },
                          cancelled: { color: 'bg-gray-600', label: 'Canceladas' }
                        }
                        
                        const config = statusConfig[status as keyof typeof statusConfig]
                        
                        return (
                          <div key={status} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{config.label}</span>
                              <span className="font-medium">{count} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`${config.color} h-2 rounded-full`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Usage Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5" />
                    <span>Insights de Uso</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {getRecentTasksCount()}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Tarefas esta semana
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats?.by_agent ? Object.keys(stats.by_agent).length : 0}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Agentes utilizados
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats?.by_priority ? Object.keys(stats.by_priority).length : 0}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Níveis de prioridade
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal de Criação */}
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      </AdminLayout>
    </>
  )
}

export default TasksPage 