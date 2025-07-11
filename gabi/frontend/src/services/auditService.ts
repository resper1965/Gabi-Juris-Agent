import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface AuditEvent {
  id: string
  organization_id: string
  user_id: string
  user_name: string
  user_email: string
  event_type: AuditEventType
  event_category: AuditEventCategory
  resource_type: string
  resource_id: string
  action: string
  status: 'success' | 'failure' | 'warning'
  description: string
  metadata: AuditMetadata
  ip_address: string
  user_agent: string
  session_id: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  risk_score: number
  compliance_tags: string[]
  created_at: string
}

export type AuditEventType = 
  | 'authentication' | 'authorization' | 'data_access' | 'data_modification'
  | 'system_config' | 'user_management' | 'export' | 'import'
  | 'chat_interaction' | 'task_execution' | 'api_call' | 'file_operation'
  | 'security_event' | 'privacy_event' | 'compliance_event'

export type AuditEventCategory = 
  | 'security' | 'privacy' | 'compliance' | 'operational' | 'business'

export interface AuditMetadata {
  // Dados específicos do evento
  [key: string]: any
  
  // Campos comuns
  browser?: string
  os?: string
  location?: {
    country?: string
    city?: string
    coordinates?: [number, number]
  }
  duration?: number
  error_message?: string
  affected_records?: number
  data_size?: number
  permissions_required?: string[]
  permissions_granted?: string[]
  risk_factors?: string[]
}

export interface ChatSnapshot {
  id: string
  chat_id: string
  user_id: string
  organization_id: string
  prompt: string
  response: string
  agent_id: string
  agent_name: string
  knowledge_base_ids: string[]
  knowledge_base_names: string[]
  style_id?: string
  style_name?: string
  tokens_used: number
  processing_time: number
  confidence_score: number
  language: string
  ip_address: string
  user_agent: string
  session_id: string
  timestamp: string
  metadata: {
    model_used: string
    temperature: number
    max_tokens: number
    stop_sequences?: string[]
    system_prompt?: string
  }
  created_at: string
}

export interface TaskSnapshot {
  id: string
  task_id: string
  user_id: string
  organization_id: string
  title: string
  prompt: string
  result: string
  agent_id: string
  agent_name: string
  knowledge_base_ids: string[]
  knowledge_base_names: string[]
  style_id?: string
  style_name?: string
  status: string
  progress: number
  tokens_used: number
  processing_time: number
  cost: number
  ip_address: string
  user_agent: string
  session_id: string
  timestamp: string
  logs: TaskLog[]
  metadata: {
    model_used: string
    priority: string
    estimated_time: number
    error_message?: string
  }
  created_at: string
}

export interface TaskLog {
  id: string
  task_id: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  timestamp: string
  metadata?: any
}

export interface AuditFilter {
  event_type?: AuditEventType[]
  event_category?: AuditEventCategory[]
  user_id?: string
  resource_type?: string
  resource_id?: string
  status?: string[]
  severity?: string[]
  date_range?: {
    from: Date
    to: Date
  }
  ip_address?: string
  session_id?: string
  compliance_tags?: string[]
  risk_score_min?: number
  risk_score_max?: number
  search?: string
}

export interface AuditStats {
  total_events: number
  events_today: number
  events_this_week: number
  events_this_month: number
  by_event_type: { [key: string]: number }
  by_category: { [key: string]: number }
  by_severity: { [key: string]: number }
  by_status: { [key: string]: number }
  by_user: { [key: string]: number }
  risk_score_avg: number
  compliance_events: number
  security_events: number
  privacy_events: number
  recent_events: AuditEvent[]
  top_risk_events: AuditEvent[]
}

export interface AuditAlert {
  id: string
  organization_id: string
  alert_type: 'anomaly' | 'threshold' | 'pattern' | 'compliance'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'acknowledged' | 'resolved' | 'false_positive'
  events: AuditEvent[]
  risk_score: number
  compliance_impact: string[]
  recommended_actions: string[]
  created_at: string
  acknowledged_at?: string
  resolved_at?: string
  acknowledged_by?: string
  resolved_by?: string
}

export interface AuditRule {
  id: string
  organization_id: string
  name: string
  description: string
  event_type: AuditEventType
  conditions: AuditRuleCondition[]
  actions: AuditRuleAction[]
  enabled: boolean
  priority: number
  created_at: string
}

export interface AuditRuleCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
}

export interface AuditRuleAction {
  type: 'alert' | 'block' | 'log' | 'notify' | 'webhook'
  config: {
    [key: string]: any
  }
}

// =============================================================================
// SERVIÇO DE AUDITORIA
// =============================================================================

class AuditService {
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
  // LOGGING DE EVENTOS
  // =============================================================================

  async logEvent(event: Omit<AuditEvent, 'id' | 'created_at'>): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/audit/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(event)
      })

      if (!response.ok) {
        throw new Error('Erro ao registrar evento de auditoria')
      }
    } catch (error) {
      console.error('Erro ao registrar evento de auditoria:', error)
      // Não mostrar toast para evitar spam
    }
  }

  async logAuthenticationEvent(data: {
    user_id: string
    user_name: string
    user_email: string
    action: 'login' | 'logout' | 'login_failed' | 'password_reset' | 'session_expired'
    status: 'success' | 'failure'
    ip_address: string
    user_agent: string
    session_id: string
    metadata?: any
  }): Promise<void> {
    const event: Omit<AuditEvent, 'id' | 'created_at'> = {
      organization_id: this.getCurrentOrgId(),
      user_id: data.user_id,
      user_name: data.user_name,
      user_email: data.user_email,
      event_type: 'authentication',
      event_category: 'security',
      resource_type: 'user',
      resource_id: data.user_id,
      action: data.action,
      status: data.status,
      description: `${data.action} ${data.status === 'success' ? 'bem-sucedido' : 'falhou'} para ${data.user_email}`,
      metadata: {
        ...data.metadata,
        browser: this.getBrowserInfo(),
        os: this.getOSInfo()
      },
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      session_id: data.session_id,
      timestamp: new Date().toISOString(),
      severity: this.calculateSeverity('authentication', data.action, data.status),
      risk_score: this.calculateRiskScore('authentication', data.action, data.status, data.metadata),
      compliance_tags: this.getComplianceTags('authentication', data.action)
    }

    await this.logEvent(event)
  }

  async logChatEvent(data: {
    user_id: string
    user_name: string
    user_email: string
    chat_id: string
    prompt: string
    response: string
    agent_id: string
    agent_name: string
    knowledge_base_ids: string[]
    knowledge_base_names: string[]
    style_id?: string
    style_name?: string
    tokens_used: number
    processing_time: number
    confidence_score: number
    language: string
    ip_address: string
    user_agent: string
    session_id: string
    metadata?: any
  }): Promise<void> {
    const event: Omit<AuditEvent, 'id' | 'created_at'> = {
      organization_id: this.getCurrentOrgId(),
      user_id: data.user_id,
      user_name: data.user_name,
      user_email: data.user_email,
      event_type: 'chat_interaction',
      event_category: 'operational',
      resource_type: 'chat',
      resource_id: data.chat_id,
      action: 'chat_message',
      status: 'success',
      description: `Interação de chat com ${data.agent_name} usando ${data.knowledge_base_names.length} bases`,
      metadata: {
        ...data.metadata,
        prompt_length: data.prompt.length,
        response_length: data.response.length,
        knowledge_bases: data.knowledge_base_names,
        style: data.style_name,
        browser: this.getBrowserInfo(),
        os: this.getOSInfo()
      },
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      session_id: data.session_id,
      timestamp: new Date().toISOString(),
      severity: this.calculateSeverity('chat_interaction', 'chat_message', 'success'),
      risk_score: this.calculateRiskScore('chat_interaction', 'chat_message', 'success', data.metadata),
      compliance_tags: this.getComplianceTags('chat_interaction', 'chat_message')
    }

    await this.logEvent(event)

    // Criar snapshot do chat
    await this.createChatSnapshot(data)
  }

  async logTaskEvent(data: {
    user_id: string
    user_name: string
    user_email: string
    task_id: string
    title: string
    prompt: string
    result: string
    agent_id: string
    agent_name: string
    knowledge_base_ids: string[]
    knowledge_base_names: string[]
    style_id?: string
    style_name?: string
    status: string
    progress: number
    tokens_used: number
    processing_time: number
    cost: number
    ip_address: string
    user_agent: string
    session_id: string
    logs: TaskLog[]
    metadata?: any
  }): Promise<void> {
    const event: Omit<AuditEvent, 'id' | 'created_at'> = {
      organization_id: this.getCurrentOrgId(),
      user_id: data.user_id,
      user_name: data.user_name,
      user_email: data.user_email,
      event_type: 'task_execution',
      event_category: 'operational',
      resource_type: 'task',
      resource_id: data.task_id,
      action: 'task_completed',
      status: data.status === 'completed' ? 'success' : 'failure',
      description: `Tarefa "${data.title}" ${data.status} usando ${data.agent_name}`,
      metadata: {
        ...data.metadata,
        prompt_length: data.prompt.length,
        result_length: data.result.length,
        knowledge_bases: data.knowledge_base_names,
        style: data.style_name,
        cost: data.cost,
        browser: this.getBrowserInfo(),
        os: this.getOSInfo()
      },
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      session_id: data.session_id,
      timestamp: new Date().toISOString(),
      severity: this.calculateSeverity('task_execution', 'task_completed', data.status === 'completed' ? 'success' : 'failure'),
      risk_score: this.calculateRiskScore('task_execution', 'task_completed', data.status === 'completed' ? 'success' : 'failure', data.metadata),
      compliance_tags: this.getComplianceTags('task_execution', 'task_completed')
    }

    await this.logEvent(event)

    // Criar snapshot da tarefa
    await this.createTaskSnapshot(data)
  }

  async logExportEvent(data: {
    user_id: string
    user_name: string
    user_email: string
    content_id: string
    content_type: string
    format: string
    file_name: string
    file_size: number
    ip_address: string
    user_agent: string
    session_id: string
    metadata?: any
  }): Promise<void> {
    const event: Omit<AuditEvent, 'id' | 'created_at'> = {
      organization_id: this.getCurrentOrgId(),
      user_id: data.user_id,
      user_name: data.user_name,
      user_email: data.user_email,
      event_type: 'export',
      event_category: 'privacy',
      resource_type: data.content_type,
      resource_id: data.content_id,
      action: 'content_export',
      status: 'success',
      description: `Exportação de ${data.content_type} em formato ${data.format}`,
      metadata: {
        ...data.metadata,
        file_size: data.file_size,
        browser: this.getBrowserInfo(),
        os: this.getOSInfo()
      },
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      session_id: data.session_id,
      timestamp: new Date().toISOString(),
      severity: this.calculateSeverity('export', 'content_export', 'success'),
      risk_score: this.calculateRiskScore('export', 'content_export', 'success', data.metadata),
      compliance_tags: this.getComplianceTags('export', 'content_export')
    }

    await this.logEvent(event)
  }

  async logDataAccessEvent(data: {
    user_id: string
    user_name: string
    user_email: string
    resource_type: string
    resource_id: string
    action: string
    status: 'success' | 'failure'
    ip_address: string
    user_agent: string
    session_id: string
    metadata?: any
  }): Promise<void> {
    const event: Omit<AuditEvent, 'id' | 'created_at'> = {
      organization_id: this.getCurrentOrgId(),
      user_id: data.user_id,
      user_name: data.user_name,
      user_email: data.user_email,
      event_type: 'data_access',
      event_category: 'privacy',
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      action: data.action,
      status: data.status,
      description: `Acesso a ${data.resource_type} ${data.action}`,
      metadata: {
        ...data.metadata,
        browser: this.getBrowserInfo(),
        os: this.getOSInfo()
      },
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      session_id: data.session_id,
      timestamp: new Date().toISOString(),
      severity: this.calculateSeverity('data_access', data.action, data.status),
      risk_score: this.calculateRiskScore('data_access', data.action, data.status, data.metadata),
      compliance_tags: this.getComplianceTags('data_access', data.action)
    }

    await this.logEvent(event)
  }

  // =============================================================================
  // SNAPSHOTS
  // =============================================================================

  async createChatSnapshot(data: any): Promise<void> {
    try {
      const snapshot: Omit<ChatSnapshot, 'id' | 'created_at'> = {
        chat_id: data.chat_id,
        user_id: data.user_id,
        organization_id: this.getCurrentOrgId(),
        prompt: data.prompt,
        response: data.response,
        agent_id: data.agent_id,
        agent_name: data.agent_name,
        knowledge_base_ids: data.knowledge_base_ids,
        knowledge_base_names: data.knowledge_base_names,
        style_id: data.style_id,
        style_name: data.style_name,
        tokens_used: data.tokens_used,
        processing_time: data.processing_time,
        confidence_score: data.confidence_score,
        language: data.language,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        session_id: data.session_id,
        timestamp: new Date().toISOString(),
        metadata: data.metadata || {}
      }

      const { error } = await this.supabase
        .from('chat_snapshots')
        .insert(snapshot)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao criar snapshot do chat:', error)
    }
  }

  async createTaskSnapshot(data: any): Promise<void> {
    try {
      const snapshot: Omit<TaskSnapshot, 'id' | 'created_at'> = {
        task_id: data.task_id,
        user_id: data.user_id,
        organization_id: this.getCurrentOrgId(),
        title: data.title,
        prompt: data.prompt,
        result: data.result,
        agent_id: data.agent_id,
        agent_name: data.agent_name,
        knowledge_base_ids: data.knowledge_base_ids,
        knowledge_base_names: data.knowledge_base_names,
        style_id: data.style_id,
        style_name: data.style_name,
        status: data.status,
        progress: data.progress,
        tokens_used: data.tokens_used,
        processing_time: data.processing_time,
        cost: data.cost,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        session_id: data.session_id,
        timestamp: new Date().toISOString(),
        logs: data.logs || [],
        metadata: data.metadata || {}
      }

      const { error } = await this.supabase
        .from('task_snapshots')
        .insert(snapshot)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao criar snapshot da tarefa:', error)
    }
  }

  // =============================================================================
  // CONSULTA DE LOGS
  // =============================================================================

  async getAuditLogs(filter?: AuditFilter): Promise<AuditEvent[]> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', this.getCurrentOrgId())
        .order('created_at', { ascending: false })

      if (filter) {
        if (filter.event_type && filter.event_type.length > 0) {
          query = query.in('event_type', filter.event_type)
        }

        if (filter.event_category && filter.event_category.length > 0) {
          query = query.in('event_category', filter.event_category)
        }

        if (filter.user_id) {
          query = query.eq('user_id', filter.user_id)
        }

        if (filter.resource_type) {
          query = query.eq('resource_type', filter.resource_type)
        }

        if (filter.resource_id) {
          query = query.eq('resource_id', filter.resource_id)
        }

        if (filter.status && filter.status.length > 0) {
          query = query.in('status', filter.status)
        }

        if (filter.severity && filter.severity.length > 0) {
          query = query.in('severity', filter.severity)
        }

        if (filter.date_range) {
          query = query
            .gte('created_at', filter.date_range.from.toISOString())
            .lte('created_at', filter.date_range.to.toISOString())
        }

        if (filter.ip_address) {
          query = query.eq('ip_address', filter.ip_address)
        }

        if (filter.session_id) {
          query = query.eq('session_id', filter.session_id)
        }

        if (filter.compliance_tags && filter.compliance_tags.length > 0) {
          query = query.overlaps('compliance_tags', filter.compliance_tags)
        }

        if (filter.risk_score_min !== undefined) {
          query = query.gte('risk_score', filter.risk_score_min)
        }

        if (filter.risk_score_max !== undefined) {
          query = query.lte('risk_score', filter.risk_score_max)
        }

        if (filter.search) {
          query = query.or(`description.ilike.%${filter.search}%,user_name.ilike.%${filter.search}%,resource_id.ilike.%${filter.search}%`)
        }
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error)
      return []
    }
  }

  async getChatSnapshot(chatId: string): Promise<ChatSnapshot | null> {
    try {
      const { data, error } = await this.supabase
        .from('chat_snapshots')
        .select('*')
        .eq('chat_id', chatId)
        .eq('organization_id', this.getCurrentOrgId())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar snapshot do chat:', error)
      return null
    }
  }

  async getTaskSnapshot(taskId: string): Promise<TaskSnapshot | null> {
    try {
      const { data, error } = await this.supabase
        .from('task_snapshots')
        .select('*')
        .eq('task_id', taskId)
        .eq('organization_id', this.getCurrentOrgId())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar snapshot da tarefa:', error)
      return null
    }
  }

  // =============================================================================
  // ESTATÍSTICAS E ANALYTICS
  // =============================================================================

  async getAuditStats(): Promise<AuditStats> {
    try {
      const logs = await this.getAuditLogs()
      
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getFullYear(), now.getMonth() - 1, now.getDate())

      const stats: AuditStats = {
        total_events: logs.length,
        events_today: logs.filter(log => new Date(log.created_at) >= today).length,
        events_this_week: logs.filter(log => new Date(log.created_at) >= weekAgo).length,
        events_this_month: logs.filter(log => new Date(log.created_at) >= monthAgo).length,
        by_event_type: this.aggregateByField(logs, 'event_type'),
        by_category: this.aggregateByField(logs, 'event_category'),
        by_severity: this.aggregateByField(logs, 'severity'),
        by_status: this.aggregateByField(logs, 'status'),
        by_user: this.aggregateByField(logs, 'user_id'),
        risk_score_avg: logs.length > 0 ? logs.reduce((sum, log) => sum + log.risk_score, 0) / logs.length : 0,
        compliance_events: logs.filter(log => log.event_category === 'compliance').length,
        security_events: logs.filter(log => log.event_category === 'security').length,
        privacy_events: logs.filter(log => log.event_category === 'privacy').length,
        recent_events: logs.slice(0, 10),
        top_risk_events: logs
          .filter(log => log.risk_score > 7)
          .sort((a, b) => b.risk_score - a.risk_score)
          .slice(0, 5)
      }

      return stats
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return {
        total_events: 0,
        events_today: 0,
        events_this_week: 0,
        events_this_month: 0,
        by_event_type: {},
        by_category: {},
        by_severity: {},
        by_status: {},
        by_user: {},
        risk_score_avg: 0,
        compliance_events: 0,
        security_events: 0,
        privacy_events: 0,
        recent_events: [],
        top_risk_events: []
      }
    }
  }

  // =============================================================================
  // ALERTAS E REGRAS
  // =============================================================================

  async getAuditAlerts(filter?: {
    status?: string[]
    severity?: string[]
    alert_type?: string[]
    date_range?: { from: Date; to: Date }
  }): Promise<AuditAlert[]> {
    try {
      let query = this.supabase
        .from('audit_alerts')
        .select('*')
        .eq('organization_id', this.getCurrentOrgId())
        .order('created_at', { ascending: false })

      if (filter) {
        if (filter.status && filter.status.length > 0) {
          query = query.in('status', filter.status)
        }

        if (filter.severity && filter.severity.length > 0) {
          query = query.in('severity', filter.severity)
        }

        if (filter.alert_type && filter.alert_type.length > 0) {
          query = query.in('alert_type', filter.alert_type)
        }

        if (filter.date_range) {
          query = query
            .gte('created_at', filter.date_range.from.toISOString())
            .lte('created_at', filter.date_range.to.toISOString())
        }
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar alertas:', error)
      return []
    }
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('audit_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userId
        })
        .eq('id', alertId)
        .eq('organization_id', this.getCurrentOrgId())

      if (error) throw error
    } catch (error) {
      console.error('Erro ao reconhecer alerta:', error)
      throw error
    }
  }

  async resolveAlert(alertId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('audit_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: userId
        })
        .eq('id', alertId)
        .eq('organization_id', this.getCurrentOrgId())

      if (error) throw error
    } catch (error) {
      console.error('Erro ao resolver alerta:', error)
      throw error
    }
  }

  // =============================================================================
  // EXPORTAÇÃO
  // =============================================================================

  async exportAuditLogs(filter?: AuditFilter, format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const logs = await this.getAuditLogs(filter)
      
      if (format === 'json') {
        return JSON.stringify(logs, null, 2)
      } else {
        // CSV
        const headers = [
          'ID', 'Usuário', 'Email', 'Tipo de Evento', 'Categoria', 'Recurso',
          'Ação', 'Status', 'Descrição', 'IP', 'Severidade', 'Risk Score',
          'Compliance Tags', 'Timestamp'
        ]
        
        const rows = logs.map(log => [
          log.id,
          log.user_name,
          log.user_email,
          log.event_type,
          log.event_category,
          `${log.resource_type}:${log.resource_id}`,
          log.action,
          log.status,
          log.description,
          log.ip_address,
          log.severity,
          log.risk_score,
          log.compliance_tags.join(', '),
          log.created_at
        ])
        
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      }
    } catch (error) {
      console.error('Erro ao exportar logs:', error)
      throw error
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  private calculateSeverity(eventType: string, action: string, status: string): 'low' | 'medium' | 'high' | 'critical' {
    // Lógica de cálculo de severidade baseada no tipo de evento, ação e status
    const severityMatrix: { [key: string]: { [key: string]: string } } = {
      authentication: {
        login: 'low',
        login_failed: 'medium',
        logout: 'low',
        password_reset: 'medium',
        session_expired: 'low'
      },
      data_access: {
        read: 'low',
        write: 'medium',
        delete: 'high',
        export: 'medium'
      },
      security_event: {
        unauthorized_access: 'critical',
        permission_escalation: 'critical',
        data_breach: 'critical'
      }
    }

    return (severityMatrix[eventType]?.[action] as any) || 'low'
  }

  private calculateRiskScore(eventType: string, action: string, status: string, metadata?: any): number {
    let score = 0

    // Base score por tipo de evento
    const baseScores: { [key: string]: number } = {
      authentication: 1,
      data_access: 2,
      data_modification: 3,
      export: 4,
      security_event: 8,
      privacy_event: 6
    }

    score += baseScores[eventType] || 1

    // Modificadores por ação
    if (action.includes('failed') || action.includes('unauthorized')) {
      score += 3
    }

    if (status === 'failure') {
      score += 2
    }

    // Modificadores por metadados
    if (metadata?.sensitive_data) {
      score += 2
    }

    if (metadata?.bulk_operation) {
      score += 1
    }

    return Math.min(score, 10) // Máximo 10
  }

  private getComplianceTags(eventType: string, action: string): string[] {
    const tags: string[] = []

    // Tags baseadas no tipo de evento
    if (eventType === 'authentication') {
      tags.push('lgpd-art-5', 'iso-27001-a-9')
    }

    if (eventType === 'data_access') {
      tags.push('lgpd-art-37', 'iso-27701-7-2-1')
    }

    if (eventType === 'export') {
      tags.push('lgpd-art-20', 'iso-27701-7-2-2')
    }

    if (eventType === 'security_event') {
      tags.push('iso-27001-a-12', 'iso-27001-a-16')
    }

    return tags
  }

  private getBrowserInfo(): string {
    if (typeof window === 'undefined') return 'unknown'
    
    const userAgent = navigator.userAgent
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Other'
  }

  private getOSInfo(): string {
    if (typeof window === 'undefined') return 'unknown'
    
    const userAgent = navigator.userAgent
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Other'
  }

  private aggregateByField(logs: AuditEvent[], field: keyof AuditEvent): { [key: string]: number } {
    const counts: { [key: string]: number } = {}
    
    logs.forEach(log => {
      const value = log[field] as string
      if (value) {
        counts[value] = (counts[value] || 0) + 1
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

  private getCurrentOrgId(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gabi_org_id') || ''
    }
    return ''
  }

  // =============================================================================
  // MÉTODOS PÚBLICOS PARA UI
  // =============================================================================

  getEventTypeIcon(eventType: string): string {
    const icons = {
      authentication: '🔐',
      authorization: '🔑',
      data_access: '👁️',
      data_modification: '✏️',
      system_config: '⚙️',
      user_management: '👥',
      export: '📤',
      import: '📥',
      chat_interaction: '💬',
      task_execution: '⚡',
      api_call: '🔌',
      file_operation: '📁',
      security_event: '🚨',
      privacy_event: '🛡️',
      compliance_event: '📋'
    }
    return icons[eventType as keyof typeof icons] || '📄'
  }

  getEventTypeName(eventType: string): string {
    const names = {
      authentication: 'Autenticação',
      authorization: 'Autorização',
      data_access: 'Acesso a Dados',
      data_modification: 'Modificação de Dados',
      system_config: 'Configuração do Sistema',
      user_management: 'Gestão de Usuários',
      export: 'Exportação',
      import: 'Importação',
      chat_interaction: 'Interação de Chat',
      task_execution: 'Execução de Tarefa',
      api_call: 'Chamada de API',
      file_operation: 'Operação de Arquivo',
      security_event: 'Evento de Segurança',
      privacy_event: 'Evento de Privacidade',
      compliance_event: 'Evento de Conformidade'
    }
    return names[eventType as keyof typeof names] || 'Evento'
  }

  getSeverityColor(severity: string): string {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[severity as keyof typeof colors] || colors.low
  }

  getStatusColor(status: string): string {
    const colors = {
      success: 'bg-green-100 text-green-800 border-green-200',
      failure: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    return colors[status as keyof typeof colors] || colors.success
  }
}

// =============================================================================
// INSTÂNCIA SINGLETON
// =============================================================================

export const auditService = new AuditService() 