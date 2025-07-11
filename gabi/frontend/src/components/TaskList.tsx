import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  X, 
  Play, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Bot,
  Database,
  Palette,
  Zap,
  Download,
  Copy,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  BarChart3
} from 'lucide-react'
import { useTasksContext } from '@/hooks/useTasks'
import { Task, TaskFilter, TaskLog } from '@/services/taskService'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface TaskListProps {
  className?: string
  showFilters?: boolean
  showStats?: boolean
  maxTasks?: number
}

interface TaskDetailsProps {
  task: Task
  isOpen: boolean
  onClose: () => void
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function TaskList({ 
  className, 
  showFilters = true, 
  showStats = true,
  maxTasks = 50 
}: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [filters, setFilters] = useState<TaskFilter>({})
  const [sortColumn, setSortColumn] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  
  const {
    tasks,
    stats,
    loading,
    getTasks,
    cancelTask,
    retryTask,
    getTaskLogs
  } = useTasksContext()

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    if (filters || searchTerm) {
      getTasks({ ...filters, search: searchTerm })
    }
  }, [filters, searchTerm])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task)
    setShowDetails(true)
  }

  const handleCancelTask = async (taskId: string) => {
    try {
      await cancelTask(taskId)
    } catch (error) {
      console.error('Erro ao cancelar tarefa:', error)
    }
  }

  const handleRetryTask = async (taskId: string) => {
    try {
      await retryTask(taskId)
    } catch (error) {
      console.error('Erro ao reiniciar tarefa:', error)
    }
  }

  const handleCopyResult = (result: string) => {
    navigator.clipboard.writeText(result)
  }

  const handleDownloadResult = (task: Task) => {
    if (task.result) {
      const blob = new Blob([task.result], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${task.title}_resultado.txt`
      a.click()
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      processing: <RefreshCw className="w-4 h-4 animate-spin" />,
      completed: <CheckCircle className="w-4 h-4" />,
      failed: <AlertTriangle className="w-4 h-4" />,
      cancelled: <X className="w-4 h-4" />
    }
    return icons[status as keyof typeof icons] || icons.pending
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[status as keyof typeof colors] || colors.pending
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 border-gray-200',
      medium: 'bg-blue-100 text-blue-800 border-blue-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diff = end.getTime() - start.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  // =============================================================================
  // FILTRAGEM E ORDENAÇÃO
  // =============================================================================

  const filteredAndSortedTasks = tasks
    .filter(task => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          task.title.toLowerCase().includes(searchLower) ||
          task.prompt.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
    .sort((a, b) => {
      const aValue = a[sortColumn as keyof Task]
      const bValue = b[sortColumn as keyof Task]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })
    .slice(0, maxTasks)

  // =============================================================================
  // RENDERIZAÇÃO
  // =============================================================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_tasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recent_tasks} esta semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed_tasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0}% de sucesso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Processamento</CardTitle>
              <RefreshCw className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.processing_tasks}</div>
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
                {Math.round(stats.avg_completion_time / 1000)}s
              </div>
              <p className="text-xs text-muted-foreground">
                Por tarefa
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filtros e Busca</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({})
                  setSearchTerm('')
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar tarefas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Status</Label>
                <Select
                  value={filters.status?.[0] || ''}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    status: value ? [value] : undefined 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Prioridade</Label>
                <Select
                  value={filters.priority?.[0] || ''}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    priority: value ? [value] : undefined 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as prioridades</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Ordenar por</Label>
                <Select
                  value={sortColumn}
                  onValueChange={setSortColumn}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Data de Criação</SelectItem>
                    <SelectItem value="title">Título</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="priority">Prioridade</SelectItem>
                    <SelectItem value="progress">Progresso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Tarefas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tarefas ({filteredAndSortedTasks.length})</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => getTasks()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAndSortedTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Carregando tarefas...' : 'Nenhuma tarefa encontrada'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium">{task.title}</h3>
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusIcon(task.status)}
                          <span className="ml-1">{task.status}</span>
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {task.prompt}
                      </p>

                      {task.status === 'processing' && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progresso</span>
                            <span>{task.progress}%</span>
                          </div>
                          <Progress value={task.progress} className="h-2" />
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Bot className="w-3 h-3" />
                          <span>Agente {task.agent_id}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Database className="w-3 h-3" />
                          <span>{task.knowledge_base_ids.length} bases</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(task.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                        </div>
                        {task.started_at && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(task.started_at, task.completed_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(task)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {task.status === 'processing' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelTask(task.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {task.status === 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetryTask(task.id)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {task.status === 'completed' && task.result && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyResult(task.result!)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadResult(task)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {task.error_message && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">Erro:</span>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {task.error_message}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false)
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}

// =============================================================================
// COMPONENTE DE DETALHES DA TAREFA
// =============================================================================

function TaskDetails({ task, isOpen, onClose }: TaskDetailsProps) {
  const [logs, setLogs] = useState<TaskLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  
  const { getTaskLogs } = useTasksContext()

  useEffect(() => {
    if (isOpen && task) {
      loadLogs()
    }
  }, [isOpen, task])

  const loadLogs = async () => {
    try {
      setLoadingLogs(true)
      const taskLogs = await getTaskLogs(task.id)
      setLogs(taskLogs)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    } finally {
      setLoadingLogs(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>Detalhes da Tarefa</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Informações Gerais</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Título:</strong> {task.title}</div>
                <div><strong>Status:</strong> {task.status}</div>
                <div><strong>Prioridade:</strong> {task.priority}</div>
                <div><strong>Criada em:</strong> {format(new Date(task.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                {task.started_at && (
                  <div><strong>Iniciada em:</strong> {format(new Date(task.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                )}
                {task.completed_at && (
                  <div><strong>Concluída em:</strong> {format(new Date(task.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Configuração</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Agente:</strong> {task.agent_id}</div>
                <div><strong>Bases:</strong> {task.knowledge_base_ids.length}</div>
                {task.style_id && <div><strong>Estilo:</strong> {task.style_id}</div>}
                {task.tokens_used && <div><strong>Tokens:</strong> {task.tokens_used.toLocaleString()}</div>}
                {task.cost && <div><strong>Custo:</strong> ${task.cost.toFixed(4)}</div>}
              </div>
            </div>
          </div>

          {/* Prompt */}
          <div>
            <h3 className="font-medium mb-2">Comando Executado</h3>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-sm">{task.prompt}</p>
            </div>
          </div>

          {/* Resultado */}
          {task.result && (
            <div>
              <h3 className="font-medium mb-2">Resultado</h3>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <pre className="text-sm whitespace-pre-wrap">{task.result}</pre>
              </div>
            </div>
          )}

          {/* Logs */}
          <div>
            <h3 className="font-medium mb-2">Logs de Execução</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {loadingLogs ? (
                <div className="text-center py-4 text-gray-500">Carregando logs...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Nenhum log disponível</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2 text-sm">
                    <span className="text-gray-500">
                      {format(new Date(log.timestamp), 'HH:mm:ss')}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      log.level === 'error' ? 'bg-red-100 text-red-800' :
                      log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      log.level === 'success' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 