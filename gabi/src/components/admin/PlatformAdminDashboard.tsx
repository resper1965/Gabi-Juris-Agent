import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Building2, 
  FileText, 
  CheckSquare, 
  TrendingUp, 
  Settings,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import { TenantService } from '@/services/tenant'
import type { Organization, PlatformMetrics } from '@/types/tenant'

export function PlatformAdminDashboard() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [orgsData, metricsData] = await Promise.all([
        TenantService.listOrganizations(),
        TenantService.getPlatformMetrics()
      ])
      setOrganizations(orgsData)
      setMetrics(metricsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.slug.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterActive === null || org.isActive === filterActive
    return matchesSearch && matchesFilter
  })

  const handleToggleOrganizationStatus = async (orgId: string) => {
    try {
      await TenantService.toggleOrganizationStatus(orgId)
      await loadData() // Recarregar dados
    } catch (error) {
      console.error('Erro ao alterar status da organização:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard da Plataforma</h1>
          <p className="text-gray-600">Administração global do GABI</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Organização
        </Button>
      </div>

      {/* Métricas Globais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizações</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalOrganizations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.activeOrganizations || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              usuários registrados
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
              tarefas criadas
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
              documentos armazenados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Organizações */}
      <Card>
        <CardHeader>
          <CardTitle>Organizações</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar organizações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button
              variant={filterActive === null ? "default" : "outline"}
              onClick={() => setFilterActive(null)}
            >
              Todas
            </Button>
            <Button
              variant={filterActive === true ? "default" : "outline"}
              onClick={() => setFilterActive(true)}
            >
              Ativas
            </Button>
            <Button
              variant={filterActive === false ? "default" : "outline"}
              onClick={() => setFilterActive(false)}
            >
              Inativas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrganizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">{org.name}</h3>
                    <p className="text-sm text-gray-600">
                      {org.slug} • {org.domain || 'Sem domínio'}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={org.isActive ? "default" : "secondary"}>
                        {org.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Badge variant="outline">
                        {org.planType}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleOrganizationStatus(org.id)}
                  >
                    {org.isActive ? 'Desativar' : 'Ativar'}
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

      {/* Configurações da Plataforma */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Planos Disponíveis</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>Basic</span>
                  <Badge variant="outline">R$ 29/mês</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>Professional</span>
                  <Badge variant="outline">R$ 99/mês</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>Enterprise</span>
                  <Badge variant="outline">Sob consulta</Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Configurações Globais</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar Templates
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Relatórios Globais
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Gerenciar Admins
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 