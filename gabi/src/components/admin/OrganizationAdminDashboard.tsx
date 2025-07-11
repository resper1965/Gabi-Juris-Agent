import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FileText, 
  CheckSquare, 
  Settings,
  Plus,
  Search,
  Filter,
  UserPlus,
  BarChart3,
  Shield
} from 'lucide-react'
import { TenantService } from '@/services/tenant'
import type { User, Organization, OrganizationMetrics } from '@/types/tenant'

interface OrganizationAdminDashboardProps {
  organizationId: string
}

export function OrganizationAdminDashboard({ organizationId }: OrganizationAdminDashboardProps) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [metrics, setMetrics] = useState<OrganizationMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [organizationId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [orgData, usersData, metricsData] = await Promise.all([
        TenantService.getOrganization(organizationId),
        TenantService.listOrganizationUsers(organizationId),
        TenantService.getOrganizationMetrics(organizationId)
      ])
      setOrganization(orgData)
      setUsers(usersData)
      setMetrics(metricsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !filterRole || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      org_admin: 'Admin',
      dept_manager: 'Gerente',
      team_lead: 'Líder',
      lawyer: 'Advogado',
      paralegal: 'Paralegal',
      user: 'Usuário'
    }
    return labels[role] || role
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      org_admin: 'bg-red-100 text-red-800',
      dept_manager: 'bg-blue-100 text-blue-800',
      team_lead: 'bg-green-100 text-green-800',
      lawyer: 'bg-purple-100 text-purple-800',
      paralegal: 'bg-orange-100 text-orange-800',
      user: 'bg-gray-100 text-gray-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Organização não encontrada</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{organization.name}</h1>
          <p className="text-gray-600">Administração da organização</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Métricas da Organização */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.activeUsers || 0} ativos • Limite: {organization.maxUsers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.completedTasks || 0} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalDocuments || 0}</div>
            <p className="text-xs text-muted-foreground">
              documentos criados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.storageUsedGB || 0} GB</div>
            <p className="text-xs text-muted-foreground">
              de {metrics?.storageLimitGB || 0} GB usado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informações da Organização */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Organização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <p className="text-sm text-gray-900">{organization.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Slug</label>
              <p className="text-sm text-gray-900">{organization.slug}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Domínio</label>
              <p className="text-sm text-gray-900">{organization.domain || 'Não configurado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Plano</label>
              <Badge variant="outline" className="mt-1">
                {organization.planType}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Badge variant={organization.isActive ? "default" : "secondary"} className="mt-1">
                {organization.isActive ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recursos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(organization.features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <Badge variant={enabled ? "default" : "secondary"}>
                    {enabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários da Organização</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="">Todos os roles</option>
              <option value="org_admin">Admin</option>
              <option value="dept_manager">Gerente</option>
              <option value="team_lead">Líder</option>
              <option value="lawyer">Advogado</option>
              <option value="paralegal">Paralegal</option>
              <option value="user">Usuário</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <UserPlus className="w-6 h-6 mb-2" />
              <span>Adicionar Usuário</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="w-6 h-6 mb-2" />
              <span>Relatórios</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Settings className="w-6 h-6 mb-2" />
              <span>Configurações</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 