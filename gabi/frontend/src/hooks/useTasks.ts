import { useState, useEffect, useCallback, useContext, createContext } from 'react'
import { toast } from 'sonner'
import { 
  taskService, 
  Task, 
  CreateTaskRequest,
  TaskFilter,
  TaskStats,
  TaskTemplate,
  TaskLog
} from '@/services/taskService'

// =============================================================================
// CONTEXTO DE TAREFAS
// =============================================================================

interface TasksContextType {
  tasks: Task[]
  stats: TaskStats | null
  templates: TaskTemplate[]
  loading: boolean
  loadingStats: boolean
  error: string | null
  createTask: (request: CreateTaskRequest) => Promise<Task>
  getTasks: (filter?: TaskFilter) => Promise<Task[]>
  getTask: (taskId: string) => Promise<Task | null>
  cancelTask: (taskId: string) => Promise<void>
  retryTask: (taskId: string) => Promise<void>
  getTaskLogs: (taskId: string) => Promise<TaskLog[]>
  loadStats: () => Promise<void>
  loadTemplates: () => Promise<void>
  createTaskFromTemplate: (templateId: string, variables: any) => Promise<Task>
}

const TasksContext = createContext<TasksContextType | null>(null)

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface UseTasksOptions {
  userId: string
  organizationId: string
  autoLoad?: boolean
  autoSubscribe?: boolean
}

interface TasksState {
  tasks: Task[]
  stats: TaskStats | null
  templates: TaskTemplate[]
  loading: boolean
  loadingStats: boolean
  loadingTemplates: boolean
  error: string | null
}

interface TasksActions {
  // Gestão de tarefas
  createTask: (request: CreateTaskRequest) => Promise<Task>
  getTasks: (filter?: TaskFilter) => Promise<Task[]>
  getTask: (taskId: string) => Promise<Task | null>
  cancelTask: (taskId: string) => Promise<void>
  retryTask: (taskId: string) => Promise<void>
  
  // Logs e monitoramento
  getTaskLogs: (taskId: string) => Promise<TaskLog[]>
  
  // Estatísticas e templates
  loadStats: () => Promise<void>
  loadTemplates: () => Promise<void>
  createTaskFromTemplate: (templateId: string, variables: any) => Promise<Task>
  
  // Utilitários
  getTasksByStatus: (status: string) => Task[]
  getTasksByPriority: (priority: string) => Task[]
  getRecentTasks: (days?: number) => Task[]
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useTasks(options: UseTasksOptions): TasksState & TasksActions {
  const {
    userId,
    organizationId,
    autoLoad = true,
    autoSubscribe = true
  } = options

  // =============================================================================
  // ESTADO
  // =============================================================================

  const [state, setState] = useState<TasksState>({
    tasks: [],
    stats: null,
    templates: [],
    loading: false,
    loadingStats: false,
    loadingTemplates: false,
    error: null
  })

  // =============================================================================
  // INICIALIZAÇÃO
  // =============================================================================

  useEffect(() => {
    if (autoLoad && userId && organizationId) {
      loadInitialData()
    }
  }, [userId, organizationId, autoLoad])

  useEffect(() => {
    if (autoSubscribe && organizationId) {
      const subscription = taskService.subscribeToNewTasks((newTask) => {
        setState(prev => ({
          ...prev,
          tasks: [newTask, ...prev.tasks]
        }))
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [organizationId, autoSubscribe])

  // =============================================================================
  // FUNÇÕES PRINCIPAIS
  // =============================================================================

  const loadInitialData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const [tasks, stats, templates] = await Promise.all([
        taskService.getTasks(),
        taskService.getTaskStats(),
        taskService.getTaskTemplates()
      ])

      setState(prev => ({
        ...prev,
        tasks,
        stats,
        templates,
        loading: false
      }))
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao carregar tarefas'
      }))
    }
  }, [])

  const createTask = useCallback(async (request: CreateTaskRequest): Promise<Task> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const task = await taskService.createTask(request)

      setState(prev => ({
        ...prev,
        tasks: [task, ...prev.tasks],
        loading: false
      }))

      return task
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao criar tarefa'
      }))
      throw error
    }
  }, [])

  const getTasks = useCallback(async (filter?: TaskFilter): Promise<Task[]> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const tasks = await taskService.getTasks(filter)

      setState(prev => ({
        ...prev,
        tasks,
        loading: false
      }))

      return tasks
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao buscar tarefas'
      }))
      return []
    }
  }, [])

  const getTask = useCallback(async (taskId: string): Promise<Task | null> => {
    try {
      const task = await taskService.getTask(taskId)
      return task
    } catch (error) {
      console.error('Erro ao buscar tarefa:', error)
      return null
    }
  }, [])

  const cancelTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      await taskService.cancelTask(taskId)

      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskId
            ? { ...task, status: 'cancelled', completed_at: new Date().toISOString() }
            : task
        )
      }))
    } catch (error) {
      console.error('Erro ao cancelar tarefa:', error)
      throw error
    }
  }, [])

  const retryTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      await taskService.retryTask(taskId)

      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskId
            ? { 
                ...task, 
                status: 'pending', 
                progress: 0, 
                error_message: null,
                started_at: null,
                completed_at: null
              }
            : task
        )
      }))
    } catch (error) {
      console.error('Erro ao reiniciar tarefa:', error)
      throw error
    }
  }, [])

  const getTaskLogs = useCallback(async (taskId: string): Promise<TaskLog[]> => {
    try {
      const logs = await taskService.getTaskLogs(taskId)
      return logs
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
      return []
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loadingStats: true }))

      const stats = await taskService.getTaskStats()

      setState(prev => ({
        ...prev,
        stats,
        loadingStats: false
      }))
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      setState(prev => ({
        ...prev,
        loadingStats: false,
        error: 'Erro ao carregar estatísticas'
      }))
    }
  }, [])

  const loadTemplates = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loadingTemplates: true }))

      const templates = await taskService.getTaskTemplates()

      setState(prev => ({
        ...prev,
        templates,
        loadingTemplates: false
      }))
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      setState(prev => ({
        ...prev,
        loadingTemplates: false,
        error: 'Erro ao carregar templates'
      }))
    }
  }, [])

  const createTaskFromTemplate = useCallback(async (
    templateId: string, 
    variables: any
  ): Promise<Task> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const task = await taskService.createTaskFromTemplate(templateId, variables)

      setState(prev => ({
        ...prev,
        tasks: [task, ...prev.tasks],
        loading: false
      }))

      return task
    } catch (error) {
      console.error('Erro ao criar tarefa do template:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao criar tarefa do template'
      }))
      throw error
    }
  }, [])

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const getTasksByStatus = useCallback((status: string): Task[] => {
    return state.tasks.filter(task => task.status === status)
  }, [state.tasks])

  const getTasksByPriority = useCallback((priority: string): Task[] => {
    return state.tasks.filter(task => task.priority === priority)
  }, [state.tasks])

  const getRecentTasks = useCallback((days: number = 7): Task[] => {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return state.tasks.filter(task => new Date(task.created_at) > cutoffDate)
  }, [state.tasks])

  // =============================================================================
  // RETORNO
  // =============================================================================

  return {
    // Estado
    tasks: state.tasks,
    stats: state.stats,
    templates: state.templates,
    loading: state.loading,
    loadingStats: state.loadingStats,
    loadingTemplates: state.loadingTemplates,
    error: state.error,

    // Ações
    createTask,
    getTasks,
    getTask,
    cancelTask,
    retryTask,
    getTaskLogs,
    loadStats,
    loadTemplates,
    createTaskFromTemplate,
    getTasksByStatus,
    getTasksByPriority,
    getRecentTasks
  }
}

// =============================================================================
// HOOK PARA USAR O CONTEXTO
// =============================================================================

export function useTasksContext(): TasksContextType {
  const context = useContext(TasksContext)
  if (!context) {
    throw new Error('useTasksContext deve ser usado dentro de um TasksProvider')
  }
  return context
}

// =============================================================================
// PROVIDER DO CONTEXTO
// =============================================================================

interface TasksProviderProps {
  children: React.ReactNode
  userId: string
  organizationId: string
  autoLoad?: boolean
  autoSubscribe?: boolean
}

export function TasksProvider({ 
  children, 
  userId, 
  organizationId, 
  autoLoad = true,
  autoSubscribe = true 
}: TasksProviderProps) {
  const tasks = useTasks({
    userId,
    organizationId,
    autoLoad,
    autoSubscribe
  })

  return (
    <TasksContext.Provider value={tasks}>
      {children}
    </TasksContext.Provider>
  )
} 