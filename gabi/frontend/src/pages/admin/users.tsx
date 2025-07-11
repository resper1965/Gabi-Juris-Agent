import React, { useState, useEffect } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Users, 
  Plus, 
  Mail, 
  Edit, 
  Trash2, 
  Eye,
  Shield,
  Lock,
  Unlock,
  Search,
  Filter,
  Calendar,
  Activity,
  UserCheck,
  UserX,
  Key,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Database,
  Palette,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/AdminLayout'
import { useGabiBases } from '@/hooks/useGabiChat'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface UsersPageProps {}

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'active' | 'pending' | 'suspended'
  created_at: string
  last_login?: string
  allowed_bases: string[]
  allowed_styles: string[]
  organization_id: string
}

interface UserFormData {
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  allowed_bases: string[]
  allowed_styles: string[]
  send_invitation: boolean
}

interface UserActivity {
  id: string
  user_id: string
  action: string
  details: string
  timestamp: string
  ip_address?: string
  user_agent?: string
}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const UsersPage: NextPage<UsersPageProps> = () => {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [userActivities, setUserActivities] = useState<Record<string, UserActivity[]>>({})
  const [loading, setLoading] = useState(false)

  // =============================================================================
  // HOOKS DE DADOS
  // =============================================================================

  const { bases, loading: basesLoading, refreshBases } = useGabiBases(
    currentUser?.organization_id || ''
  )

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    if (currentUser?.organization_id) {
      loadUsers()
    }
  }, [currentUser?.organization_id])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento de usuários - em produção viria da API
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@company.com',
          role: 'admin',
          status: 'active',
          created_at: new Date(Date.now() - 10000000000).toISOString(),
          last_login: new Date(Date.now() - 1000000).toISOString(),
          allowed_bases: ['paineiras', 'esg'],
          allowed_styles: ['juridico', 'didatico'],
          organization_id: currentUser?.organization_id || ''
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria@company.com',
          role: 'editor',
          status: 'active',
          created_at: new Date(Date.now() - 5000000000).toISOString(),
          last_login: new Date(Date.now() - 2000000).toISOString(),
          allowed_bases: ['paineiras'],
          allowed_styles: ['didatico'],
          organization_id: currentUser?.organization_id || ''
        },
        {
          id: '3',
          name: 'Pedro Costa',
          email: 'pedro@company.com',
          role: 'viewer',
          status: 'pending',
          created_at: new Date(Date.now() - 1000000000).toISOString(),
          allowed_bases: ['esg'],
          allowed_styles: ['institucional'],
          organization_id: currentUser?.organization_id || ''
        }
      ]

      setUsers(mockUsers)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async (formData: UserFormData) => {
    try {
      // Simular convite - em produção seria uma chamada para a API
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: 'pending',
        created_at: new Date().toISOString(),
        allowed_bases: formData.allowed_bases,
        allowed_styles: formData.allowed_styles,
        organization_id: currentUser?.organization_id || ''
      }

      setUsers(prev => [...prev, newUser])
      toast.success('Convite enviado com sucesso!')
      setShowInviteDialog(false)
    } catch (error) {
      toast.error('Erro ao enviar convite')
    }
  }

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      ))
      toast.success('Usuário atualizado com sucesso!')
      setShowEditDialog(false)
      setSelectedUser(null)
    } catch (error) {
      toast.error('Erro ao atualizar usuário')
    }
  }

  const handleToggleUserStatus = async (userId: string, newStatus: User['status']) => {
    try {
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ))
      toast.success(`Usuário ${newStatus === 'active' ? 'ativado' : 'suspenso'} com sucesso!`)
    } catch (error) {
      toast.error('Erro ao alterar status do usuário')
    }
  }

  const handleResetPassword = async (userId: string) => {
    try {
      // Simular reset de senha - em produção seria uma chamada para a API
      toast.success('E-mail de reset de senha enviado!')
    } catch (error) {
      toast.error('Erro ao enviar reset de senha')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      setUsers(prev => prev.filter(user => user.id !== userId))
      toast.success('Usuário excluído com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir usuário')
    }
  }

  const loadUserActivity = async (userId: string) => {
    try {
      // Simular carregamento de atividade - em produção viria da API
      const mockActivity: UserActivity[] = [
        {
          id: '1',
          user_id: userId,
          action: 'login',
          details: 'Login realizado com sucesso',
          timestamp: new Date(Date.now() - 1000000).toISOString(),
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0...'
        },
        {
          id: '2',
          user_id: userId,
          action: 'chat_session',
          details: 'Iniciou sessão de chat com agente Paineiras',
          timestamp: new Date(Date.now() - 2000000).toISOString()
        },
        {
          id: '3',
          user_id: userId,
          action: 'base_access',
          details: 'Acessou base de conhecimento ESG',
          timestamp: new Date(Date.now() - 3000000).toISOString()
        }
      ]

      setUserActivities(prev => ({
        ...prev,
        [userId]: mockActivity
      }))
    } catch (error) {
      console.error('Erro ao carregar atividade do usuário:', error)
    }
  }

  // =============================================================================
  // FILTROS E BUSCA
  // =============================================================================

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderFilters = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="role">Função</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => setShowInviteDialog(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Convidar Usuário
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderUserCard = (user: User) => {
    const activities = userActivities[user.id] || []

    return (
      <Card key={user.id} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={
                user.status === 'active' ? 'default' :
                user.status === 'pending' ? 'secondary' : 'destructive'
              }>
                {user.status === 'active' && <UserCheck className="w-3 h-3 mr-1" />}
                {user.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                {user.status === 'suspended' && <UserX className="w-3 h-3 mr-1" />}
                {user.status === 'active' ? 'Ativo' : 
                 user.status === 'pending' ? 'Pendente' : 'Suspenso'}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {user.role}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Informações */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Membro desde:</span>
                <span className="ml-2 font-medium">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Último login:</span>
                <span className="ml-2 font-medium">
                  {user.last_login ? 
                   new Date(user.last_login).toLocaleDateString('pt-BR') : 
                   'Nunca'}
                </span>
              </div>
            </div>

            {/* Permissões */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Database className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Bases permitidas:</span>
                <div className="flex flex-wrap gap-1">
                  {user.allowed_bases.map(baseId => (
                    <Badge key={baseId} variant="outline" className="text-xs">
                      {baseId}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Palette className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Estilos permitidos:</span>
                <div className="flex flex-wrap gap-1">
                  {user.allowed_styles.map(styleId => (
                    <Badge key={styleId} variant="outline" className="text-xs">
                      {styleId}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Atividade recente */}
            {activities.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Atividade Recente:</p>
                <div className="space-y-1">
                  {activities.slice(0, 2).map(activity => (
                    <div key={activity.id} className="flex items-center space-x-2 text-xs">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {activity.details}
                      </span>
                      <span className="text-gray-400">
                        {new Date(activity.timestamp).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(user)
                    loadUserActivity(user.id)
                  }}
                >
                  <Activity className="w-4 h-4 mr-1" />
                  Atividade
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResetPassword(user.id)}
                >
                  <Key className="w-4 h-4 mr-1" />
                  Reset Senha
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                {user.status === 'active' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleUserStatus(user.id, 'suspended')}
                  >
                    <Lock className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleUserStatus(user.id, 'active')}
                  >
                    <Unlock className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(user)
                    setShowEditDialog(true)
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderUserList = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhum usuário encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Convide seu primeiro usuário'
              }
            </p>
            {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
              <Button onClick={() => setShowInviteDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Convidar Primeiro Usuário
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(renderUserCard)}
        </div>
      )}
    </div>
  )

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  if (authLoading) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Usuários e Permissões</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie usuários, permissões e monitore atividades
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={loadUsers}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Filtros */}
          {renderFilters()}

          {/* Lista de Usuários */}
          {renderUserList()}

          {/* Diálogo de Convite */}
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Convidar Novo Usuário</DialogTitle>
              </DialogHeader>
              <UserForm
                bases={bases}
                onSubmit={handleInviteUser}
                onCancel={() => setShowInviteDialog(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Diálogo de Edição */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
              </DialogHeader>
              <UserForm
                user={selectedUser}
                bases={bases}
                onSubmit={(formData) => selectedUser && handleUpdateUser(selectedUser.id, formData)}
                onCancel={() => {
                  setShowEditDialog(false)
                  setSelectedUser(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}

// =============================================================================
// COMPONENTE DE FORMULÁRIO DE USUÁRIO
// =============================================================================

interface UserFormProps {
  user?: User | null
  bases: any[]
  onSubmit: (data: UserFormData) => Promise<void>
  onCancel: () => void
}

function UserForm({ user, bases, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'viewer',
    allowed_bases: user?.allowed_bases || [],
    allowed_styles: user?.allowed_styles || [],
    send_invitation: !user // Enviar convite apenas para novos usuários
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const toggleBase = (baseId: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_bases: prev.allowed_bases.includes(baseId)
        ? prev.allowed_bases.filter(id => id !== baseId)
        : [...prev.allowed_bases, baseId]
    }))
  }

  const toggleStyle = (styleId: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_styles: prev.allowed_styles.includes(styleId)
        ? prev.allowed_styles.filter(id => id !== styleId)
        : [...prev.allowed_styles, styleId]
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="role">Função</Label>
        <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Visualizador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Bases de Conhecimento Permitidas</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {bases.map((base) => (
            <div key={base.id} className="flex items-center space-x-2">
              <Checkbox
                id={`base-${base.id}`}
                checked={formData.allowed_bases.includes(base.id)}
                onCheckedChange={() => toggleBase(base.id)}
              />
              <Label htmlFor={`base-${base.id}`} className="text-sm">
                {base.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Estilos de Redação Permitidos</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {['juridico', 'didatico', 'institucional', 'comercial'].map((style) => (
            <div key={style} className="flex items-center space-x-2">
              <Checkbox
                id={`style-${style}`}
                checked={formData.allowed_styles.includes(style)}
                onCheckedChange={() => toggleStyle(style)}
              />
              <Label htmlFor={`style-${style}`} className="text-sm capitalize">
                {style.replace('_', ' ')}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {!user && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="send_invitation"
            checked={formData.send_invitation}
            onCheckedChange={(checked) => setFormData({ ...formData, send_invitation: checked as boolean })}
          />
          <Label htmlFor="send_invitation">Enviar convite por e-mail</Label>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {user ? 'Atualizar' : 'Convidar'} Usuário
        </Button>
      </div>
    </form>
  )
}

export default UsersPage 