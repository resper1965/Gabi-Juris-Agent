import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface Task {
  id: string
  user_id: string
  organization_id: string
  title: string
  prompt: string
  description?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  agent_id: string
  knowledge_base_ids: string[]
  style_id?: string
  result?: string
  result_file_url?: string
  progress: number
  estimated_time?: number
  tokens_used?: number
  cost?: number
  error_message?: string
  logs: TaskLog[]
  metadata: {
    model_used?: string
    processing_time?: number
    documents_processed?: number
    characters_processed?: number
    confidence_score?: number
  }
  created_at: string
  started_at?: string
  completed_at?: string
  updated_at: string
}

export interface TaskLog {
  id: string
  task_id: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  timestamp: string
  metadata?: any
}

export interface CreateTaskRequest {
  title: string
  prompt: string
  description?: string
  agent_id: string
  knowledge_base_ids: string[]
  style_id?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface TaskFilter {
  status?: string[]
  priority?: string[]
  agent_id?: string
  knowledge_base_ids?: string[]
  date_range?: {
    from: Date
    to: Date
  }
  search?: string
}

export interface TaskStats {
  total_tasks: number
  completed_tasks: number
  failed_tasks: number
  pending_tasks: number
  processing_tasks: number
  avg_completion_time: number
  total_tokens_used: number
  total_cost: number
  by_status: { [key: string]: number }
  by_priority: { [key: string]: number }
  by_agent: { [key: string]: number }
  recent_tasks: number
}

export interface TaskTemplate {
  id: string
  name: string
  description: string
  prompt_template: string
  category: 'analysis' | 'summary' | 'comparison' | 'extraction' | 'custom'
  suggested_agents: string[]
  suggested_bases: string[]
  suggested_styles: string[]
  is_public: boolean
  created_by: string
  usage_count: number
  created_at: string
}

// =============================================================================
// SERVIÇO DE TAREFAS
// =============================================================================

class TaskService {
  private supabase: any
  private apiBaseUrl: string

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  }

  // =============================================================================
  // CRIAÇÃO E GESTÃO DE TAREFAS
  // =============================================================================

  async createTask(request: CreateTaskRequest): Promise<Task> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('Erro ao criar tarefa')
      }

      const task = await response.json()
      
      // Adicionar log inicial
      await this.addTaskLog(task.id, 'info', 'Tarefa criada com sucesso')
      
      toast.success('Tarefa criada e iniciada com sucesso')
      return task
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      toast.error('Erro ao criar tarefa')
      throw error
    }
  }

  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', this.getCurrentOrgId())
        .order('created_at', { ascending: false })

      if (error) throw error

      let tasks = data || []

      // Aplicar filtros
      if (filter) {
        if (filter.status && filter.status.length > 0) {
          tasks = tasks.filter(task => filter.status!.includes(task.status))
        }

        if (filter.priority && filter.priority.length > 0) {
          tasks = tasks.filter(task => filter.priority!.includes(task.priority))
        }

        if (filter.agent_id) {
          tasks = tasks.filter(task => task.agent_id === filter.agent_id)
        }

        if (filter.knowledge_base_ids && filter.knowledge_base_ids.length > 0) {
          tasks = tasks.filter(task => 
            task.knowledge_base_ids.some(baseId => 
              filter.knowledge_base_ids!.includes(baseId)
            )
          )
        }

        if (filter.date_range) {
          tasks = tasks.filter(task => {
            const taskDate = new Date(task.created_at)
            return taskDate >= filter.date_range!.from && taskDate <= filter.date_range!.to
          })
        }

        if (filter.search) {
          const searchLower = filter.search.toLowerCase()
          tasks = tasks.filter(task =>
            task.title.toLowerCase().includes(searchLower) ||
            task.prompt.toLowerCase().includes(searchLower) ||
            task.description?.toLowerCase().includes(searchLower)
          )
        }
      }

      return tasks
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
      return []
    }
  }

  async getTask(taskId: string): Promise<Task | null> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar tarefa:', error)
      return null
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      throw error
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    try {
      await this.updateTask(taskId, { 
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })

      await this.addTaskLog(taskId, 'warning', 'Tarefa cancelada pelo usuário')
      toast.success('Tarefa cancelada com sucesso')
    } catch (error) {
      console.error('Erro ao cancelar tarefa:', error)
      toast.error('Erro ao cancelar tarefa')
      throw error
    }
  }

  async retryTask(taskId: string): Promise<void> {
    try {
      await this.updateTask(taskId, { 
        status: 'pending',
        progress: 0,
        error_message: null,
        started_at: null,
        completed_at: null
      })

      await this.addTaskLog(taskId, 'info', 'Tarefa reiniciada')

      // Disparar reprocessamento
      await fetch(`${this.apiBaseUrl}/tasks/${taskId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })

      toast.success('Tarefa reiniciada com sucesso')
    } catch (error) {
      console.error('Erro ao reiniciar tarefa:', error)
      toast.error('Erro ao reiniciar tarefa')
      throw error
    }
  }

  // =============================================================================
  // LOGS E MONITORAMENTO
  // =============================================================================

  async addTaskLog(taskId: string, level: string, message: string, metadata?: any): Promise<void> {
    try {
      const log: TaskLog = {
        id: `log_${Date.now()}`,
        task_id: taskId,
        level: level as any,
        message,
        timestamp: new Date().toISOString(),
        metadata
      }

      const { error } = await this.supabase
        .from('task_logs')
        .insert(log)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao adicionar log:', error)
    }
  }

  async getTaskLogs(taskId: string): Promise<TaskLog[]> {
    try {
      const { data, error } = await this.supabase
        .from('task_logs')
        .select('*')
        .eq('task_id', taskId)
        .order('timestamp', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
      return []
    }
  }

  // =============================================================================
  // ESTATÍSTICAS E ANALYTICS
  // =============================================================================

  async getTaskStats(): Promise<TaskStats> {
    try {
      const tasks = await this.getTasks()
      
      const stats: TaskStats = {
        total_tasks: tasks.length,
        completed_tasks: tasks.filter(t => t.status === 'completed').length,
        failed_tasks: tasks.filter(t => t.status === 'failed').length,
        pending_tasks: tasks.filter(t => t.status === 'pending').length,
        processing_tasks: tasks.filter(t => t.status === 'processing').length,
        avg_completion_time: this.calculateAverageCompletionTime(tasks),
        total_tokens_used: tasks.reduce((sum, t) => sum + (t.tokens_used || 0), 0),
        total_cost: tasks.reduce((sum, t) => sum + (t.cost || 0), 0),
        by_status: this.aggregateByField(tasks, 'status'),
        by_priority: this.aggregateByField(tasks, 'priority'),
        by_agent: this.aggregateByField(tasks, 'agent_id'),
        recent_tasks: tasks.filter(t => {
          const date = new Date(t.created_at)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return date > weekAgo
        }).length
      }

      return stats
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return {
        total_tasks: 0,
        completed_tasks: 0,
        failed_tasks: 0,
        pending_tasks: 0,
        processing_tasks: 0,
        avg_completion_time: 0,
        total_tokens_used: 0,
        total_cost: 0,
        by_status: {},
        by_priority: {},
        by_agent: {},
        recent_tasks: 0
      }
    }
  }

  // =============================================================================
  // TEMPLATES DE TAREFAS
  // =============================================================================

  async getTaskTemplates(): Promise<TaskTemplate[]> {
    try {
      const { data, error } = await this.supabase
        .from('task_templates')
        .select('*')
        .or('is_public.eq.true,created_by.eq.' + this.getCurrentUserId())
        .order('usage_count', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
      return []
    }
  }

  async createTaskFromTemplate(templateId: string, variables: any): Promise<Task> {
    try {
      const templates = await this.getTaskTemplates()
      const template = templates.find(t => t.id === templateId)
      
      if (!template) {
        throw new Error('Template não encontrado')
      }

      // Substituir variáveis no prompt
      let prompt = template.prompt_template
      Object.entries(variables).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value as string)
      })

      const request: CreateTaskRequest = {
        title: template.name,
        prompt,
        description: template.description,
        agent_id: template.suggested_agents[0] || '',
        knowledge_base_ids: template.suggested_bases,
        style_id: template.suggested_styles[0],
        priority: 'medium'
      }

      return await this.createTask(request)
    } catch (error) {
      console.error('Erro ao criar tarefa do template:', error)
      throw error
    }
  }

  // =============================================================================
  // WEBSOCKET E TEMPO REAL
  // =============================================================================

  subscribeToTaskUpdates(taskId: string, callback: (task: Task) => void) {
    return this.supabase
      .channel(`task-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `id=eq.${taskId}`
        },
        (payload: any) => {
          callback(payload.new as Task)
        }
      )
      .subscribe()
  }

  subscribeToNewTasks(callback: (task: Task) => void) {
    return this.supabase
      .channel('new-tasks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `organization_id=eq.${this.getCurrentOrgId()}`
        },
        (payload: any) => {
          callback(payload.new as Task)
        }
      )
      .subscribe()
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  private calculateAverageCompletionTime(tasks: Task[]): number {
    const completedTasks = tasks.filter(t => 
      t.status === 'completed' && t.started_at && t.completed_at
    )

    if (completedTasks.length === 0) return 0

    const totalTime = completedTasks.reduce((sum, task) => {
      const start = new Date(task.started_at!).getTime()
      const end = new Date(task.completed_at!).getTime()
      return sum + (end - start)
    }, 0)

    return totalTime / completedTasks.length
  }

  private aggregateByField(tasks: Task[], field: string): { [key: string]: number } {
    const counts: { [key: string]: number } = {}
    
    tasks.forEach(task => {
      const value = task[field as keyof Task]
      if (value) {
        counts[value as string] = (counts[value as string] || 0) + 1
      }
    })

    return counts
  }

  private getAuthToken(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gabi_token') || ''
    }
    return ''
  }

  private getCurrentUserId(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gabi_user_id') || ''
    }
    return ''
  }

  private getCurrentOrgId(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gabi_org_id') || ''
    }
    return ''
  }

  // =============================================================================
  // MÉTODOS PÚBLICOS PARA STATUS
  // =============================================================================

  getStatusColor(status: string): string {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[status as keyof typeof colors] || colors.pending
  }

  getPriorityColor(priority: string): string {
    const colors = {
      low: 'bg-gray-100 text-gray-800 border-gray-200',
      medium: 'bg-blue-100 text-blue-800 border-blue-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  getStatusIcon(status: string): string {
    const icons = {
      pending: '⏳',
      processing: '🔄',
      completed: '✅',
      failed: '❌',
      cancelled: '🚫'
    }
    return icons[status as keyof typeof icons] || icons.pending
  }
}

// =============================================================================
// INSTÂNCIA SINGLETON
// =============================================================================

export const taskService = new TaskService() 