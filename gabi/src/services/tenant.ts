// Serviços para gerenciamento multi-tenant

import { supabase } from '@/lib/supabase'
import type { 
  Organization, 
  CreateOrganizationData, 
  UpdateOrganizationData,
  User,
  CreateUserData,
  UpdateUserData,
  OrganizationMetrics,
  PlatformMetrics
} from '@/types/tenant'

export class TenantService {
  // ===== ORGANIZAÇÕES =====
  
  /**
   * Criar nova organização
   */
  static async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    const { data: organization, error } = await supabase
      .from('organizations')
      .insert({
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        plan_type: data.planType || 'basic',
        max_users: data.maxUsers || 10,
        max_storage_gb: data.maxStorageGB || 5,
        features: {
          legalMode: true,
          advancedExport: false,
          customTemplates: false,
          apiAccess: false,
          auditLogs: true,
          backupAutomated: false,
          sso: false,
          customBranding: false
        },
        security: {
          mfaRequired: false,
          sessionTimeout: 480, // 8 horas
          passwordPolicy: 'default'
        }
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar organização: ${error.message}`)

    // Criar admin da organização
    await this.createOrganizationAdmin(organization.id, data.adminData)

    return this.mapOrganizationFromDB(organization)
  }

  /**
   * Obter organização por ID
   */
  static async getOrganization(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Erro ao buscar organização: ${error.message}`)
    }

    return this.mapOrganizationFromDB(data)
  }

  /**
   * Obter organização por slug
   */
  static async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Erro ao buscar organização: ${error.message}`)
    }

    return this.mapOrganizationFromDB(data)
  }

  /**
   * Listar organizações (apenas para platform admin)
   */
  static async listOrganizations(filters?: {
    isActive?: boolean
    planType?: string
    search?: string
  }): Promise<Organization[]> {
    let query = supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    if (filters?.planType) {
      query = query.eq('plan_type', filters.planType)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw new Error(`Erro ao listar organizações: ${error.message}`)

    return data.map(this.mapOrganizationFromDB)
  }

  /**
   * Atualizar organização
   */
  static async updateOrganization(
    id: string, 
    data: UpdateOrganizationData
  ): Promise<Organization> {
    const updateData: any = {}
    
    if (data.name) updateData.name = data.name
    if (data.domain) updateData.domain = data.domain
    if (data.logo) updateData.logo = data.logo
    if (data.planType) updateData.plan_type = data.planType
    if (data.features) updateData.features = data.features
    if (data.security) updateData.security = data.security

    const { data: organization, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar organização: ${error.message}`)

    return this.mapOrganizationFromDB(organization)
  }

  /**
   * Desativar/ativar organização
   */
  static async toggleOrganizationStatus(id: string): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw new Error(`Erro ao desativar organização: ${error.message}`)
  }

  // ===== USUÁRIOS =====

  /**
   * Criar usuário da organização
   */
  static async createOrganizationUser(
    organizationId: string,
    data: CreateUserData
  ): Promise<User> {
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        organization_id: organizationId,
        email: data.email,
        name: data.name,
        role: data.role,
        department_id: data.departmentId
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar usuário: ${error.message}`)

    return this.mapUserFromDB(user)
  }

  /**
   * Criar admin da organização
   */
  static async createOrganizationAdmin(
    organizationId: string,
    adminData: { email: string; name: string; password: string }
  ): Promise<User> {
    // Criar usuário
    const user = await this.createOrganizationUser(organizationId, {
      email: adminData.email,
      name: adminData.name,
      role: 'org_admin'
    })

    // Criar conta de autenticação
    const { error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true,
      user_metadata: {
        organization_id: organizationId,
        role: 'org_admin'
      }
    })

    if (authError) {
      // Rollback: remover usuário criado
      await supabase.from('users').delete().eq('id', user.id)
      throw new Error(`Erro ao criar conta de autenticação: ${authError.message}`)
    }

    return user
  }

  /**
   * Listar usuários da organização
   */
  static async listOrganizationUsers(
    organizationId: string,
    filters?: {
      role?: string
      departmentId?: string
      isActive?: boolean
      search?: string
    }
  ): Promise<User[]> {
    let query = supabase
      .from('users')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (filters?.role) {
      query = query.eq('role', filters.role)
    }

    if (filters?.departmentId) {
      query = query.eq('department_id', filters.departmentId)
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw new Error(`Erro ao listar usuários: ${error.message}`)

    return data.map(this.mapUserFromDB)
  }

  /**
   * Atualizar usuário
   */
  static async updateUser(
    id: string,
    data: UpdateUserData
  ): Promise<User> {
    const updateData: any = {}
    
    if (data.name) updateData.name = data.name
    if (data.role) updateData.role = data.role
    if (data.departmentId) updateData.department_id = data.departmentId
    if (data.isActive !== undefined) updateData.is_active = data.isActive

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`)

    return this.mapUserFromDB(user)
  }

  // ===== MÉTRICAS =====

  /**
   * Obter métricas da organização
   */
  static async getOrganizationMetrics(organizationId: string): Promise<OrganizationMetrics> {
    // Contar usuários
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    // Contar tarefas
    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    const { count: completedTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'completed')

    // Contar documentos
    const { count: totalDocuments } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    // Calcular uso de storage (simplificado)
    const { data: storageData } = await supabase
      .from('documents')
      .select('content')
      .eq('organization_id', organizationId)

    const storageUsedGB = storageData 
      ? storageData.reduce((acc, doc) => acc + (doc.content?.length || 0), 0) / (1024 * 1024 * 1024)
      : 0

    // Obter organização para limites
    const organization = await this.getOrganization(organizationId)

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalTasks: totalTasks || 0,
      completedTasks: completedTasks || 0,
      totalDocuments: totalDocuments || 0,
      storageUsedGB: Math.round(storageUsedGB * 100) / 100,
      storageLimitGB: organization?.maxStorageGB || 5,
      lastActivityAt: new Date() // TODO: implementar tracking real
    }
  }

  /**
   * Obter métricas da plataforma (apenas para platform admin)
   */
  static async getPlatformMetrics(): Promise<PlatformMetrics> {
    // Contar organizações
    const { count: totalOrganizations } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })

    const { count: activeOrganizations } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Contar usuários
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Contar tarefas
    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })

    // Contar documentos
    const { count: totalDocuments } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })

    return {
      totalOrganizations: totalOrganizations || 0,
      activeOrganizations: activeOrganizations || 0,
      totalUsers: totalUsers || 0,
      totalTasks: totalTasks || 0,
      totalDocuments: totalDocuments || 0,
      revenueMonthly: 0, // TODO: implementar cálculo de receita
      revenueYearly: 0
    }
  }

  // ===== UTILITÁRIOS =====

  /**
   * Verificar se usuário tem permissão
   */
  static async checkPermission(
    userId: string,
    organizationId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .single()

    if (!user) return false

    // Permissões baseadas em role
    const permissions = this.getRolePermissions(user.role)
    return permissions.some(p => p.resource === resource && p.actions.includes(action))
  }

  /**
   * Obter permissões por role
   */
  private static getRolePermissions(role: string) {
    const permissions: Record<string, { resource: string; actions: string[] }[]> = {
      platform_admin: [
        { resource: '*', actions: ['*'] }
      ],
      org_admin: [
        { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'tasks', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'documents', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'exports', actions: ['create', 'read'] },
        { resource: 'audit_logs', actions: ['read'] },
        { resource: 'organization', actions: ['read', 'update'] }
      ],
      dept_manager: [
        { resource: 'users', actions: ['read', 'update'] },
        { resource: 'tasks', actions: ['create', 'read', 'update'] },
        { resource: 'documents', actions: ['create', 'read', 'update'] },
        { resource: 'exports', actions: ['create', 'read'] }
      ],
      user: [
        { resource: 'tasks', actions: ['create', 'read', 'update'] },
        { resource: 'documents', actions: ['create', 'read', 'update'] },
        { resource: 'exports', actions: ['create', 'read'] }
      ]
    }

    return permissions[role] || []
  }

  // ===== MAPPERS =====

  private static mapOrganizationFromDB(data: any): Organization {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      domain: data.domain,
      logo: data.logo,
      planType: data.plan_type,
      maxUsers: data.max_users,
      maxStorageGB: data.max_storage_gb,
      isActive: data.is_active,
      features: data.features,
      security: data.security,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  private static mapUserFromDB(data: any): User {
    return {
      id: data.id,
      organizationId: data.organization_id,
      email: data.email,
      name: data.name,
      role: data.role,
      departmentId: data.department_id,
      isActive: data.is_active,
      lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
} 