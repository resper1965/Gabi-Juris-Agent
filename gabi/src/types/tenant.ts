// Tipos para arquitetura multi-tenant do GABI

export interface Organization {
  id: string
  name: string
  slug: string
  domain?: string
  logo?: string
  planType: PlanType
  maxUsers: number
  maxStorageGB: number
  isActive: boolean
  features: OrganizationFeatures
  security: SecurityConfig
  createdAt: Date
  updatedAt: Date
}

export type PlanType = 'basic' | 'professional' | 'enterprise'

export interface OrganizationFeatures {
  legalMode: boolean
  advancedExport: boolean
  customTemplates: boolean
  apiAccess: boolean
  auditLogs: boolean
  backupAutomated: boolean
  sso: boolean
  customBranding: boolean
}

export interface SecurityConfig {
  mfaRequired: boolean
  sessionTimeout: number // em minutos
  passwordPolicy: string
  ipWhitelist?: string[]
  allowedDomains?: string[]
}

export interface User {
  id: string
  organizationId: string
  email: string
  name: string
  role: UserRole
  departmentId?: string
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type UserRole = 
  | 'platform_admin'    // Super admin da plataforma
  | 'org_admin'         // Admin da organização
  | 'dept_manager'      // Gerente de departamento
  | 'team_lead'         // Líder de equipe
  | 'lawyer'            // Advogado
  | 'paralegal'         // Paralegal
  | 'user'              // Usuário regular

export interface Department {
  id: string
  organizationId: string
  name: string
  description?: string
  managerId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  organizationId: string
  userId: string
  departmentId?: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  category: TaskCategory
  dueDate?: Date
  assignedTo?: string[]
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskCategory = 'analysis' | 'review' | 'creation' | 'research'

export interface Document {
  id: string
  organizationId: string
  userId: string
  departmentId?: string
  title: string
  content?: string
  type: DocumentType
  status: DocumentStatus
  tags?: string[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export type DocumentType = 'contract' | 'petition' | 'report' | 'analysis' | 'template'
export type DocumentStatus = 'draft' | 'review' | 'approved' | 'archived'

export interface ExportJob {
  id: string
  organizationId: string
  userId: string
  type: ExportType
  format: ExportFormat
  status: ExportStatus
  filters?: Record<string, any>
  resultUrl?: string
  errorMessage?: string
  createdAt: Date
  completedAt?: Date
}

export type ExportType = 'tasks' | 'documents' | 'audit_logs' | 'reports'
export type ExportFormat = 'pdf' | 'docx' | 'xlsx' | 'csv'
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface AuditLog {
  id: string
  organizationId: string
  userId: string
  action: string
  resourceType: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

export interface Plan {
  id: string
  name: string
  priceMonthly: number
  priceYearly: number
  maxUsers: number
  maxStorageGB: number
  features: OrganizationFeatures
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TenantContext {
  organization: Organization
  user: User
  permissions: Permission[]
}

export interface Permission {
  resource: string
  actions: string[]
}

// Tipos para criação/edição
export interface CreateOrganizationData {
  name: string
  slug: string
  domain?: string
  planType?: PlanType
  maxUsers?: number
  maxStorageGB?: number
  adminData: {
    email: string
    name: string
    password: string
  }
}

export interface UpdateOrganizationData {
  name?: string
  domain?: string
  logo?: string
  planType?: PlanType
  features?: Partial<OrganizationFeatures>
  security?: Partial<SecurityConfig>
}

export interface CreateUserData {
  email: string
  name: string
  role: UserRole
  departmentId?: string
  password?: string
  sendInvitation?: boolean
}

export interface UpdateUserData {
  name?: string
  role?: UserRole
  departmentId?: string
  isActive?: boolean
}

// Tipos para queries e filtros
export interface OrganizationFilters {
  isActive?: boolean
  planType?: PlanType
  search?: string
}

export interface UserFilters {
  organizationId: string
  role?: UserRole
  departmentId?: string
  isActive?: boolean
  search?: string
}

export interface TaskFilters {
  organizationId: string
  userId?: string
  departmentId?: string
  priority?: TaskPriority
  status?: TaskStatus
  category?: TaskCategory
  dueDateFrom?: Date
  dueDateTo?: Date
  search?: string
}

// Tipos para métricas e analytics
export interface OrganizationMetrics {
  totalUsers: number
  activeUsers: number
  totalTasks: number
  completedTasks: number
  totalDocuments: number
  storageUsedGB: number
  storageLimitGB: number
  lastActivityAt?: Date
}

export interface PlatformMetrics {
  totalOrganizations: number
  activeOrganizations: number
  totalUsers: number
  totalTasks: number
  totalDocuments: number
  revenueMonthly: number
  revenueYearly: number
}

// Tipos para configurações globais
export interface PlatformConfig {
  id: string
  key: string
  value: any
  description?: string
  updatedAt: Date
}

// Tipos para notificações
export interface Notification {
  id: string
  organizationId: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  createdAt: Date
}

export type NotificationType = 
  | 'task_assigned'
  | 'task_due_soon'
  | 'document_shared'
  | 'export_completed'
  | 'quota_warning'
  | 'system_alert' 