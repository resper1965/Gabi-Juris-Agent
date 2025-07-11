import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard,
  Database,
  Palette,
  Users,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // =============================================================================
  // NAVEGAÇÃO
  // =============================================================================

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      label: 'Bases de Conhecimento',
      href: '/admin/bases',
      icon: <Database className="w-5 h-5" />
    },
    {
      label: 'Estilos de Redação',
      href: '/admin/styles',
      icon: <Palette className="w-5 h-5" />
    },
    {
      label: 'Usuários e Permissões',
      href: '/admin/users',
      icon: <Users className="w-5 h-5" />
    },
    {
      label: 'Auditoria e Logs',
      href: '/admin/audit',
      icon: <Activity className="w-5 h-5" />,
      badge: '3'
    }
  ]

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logout realizado com sucesso!')
      router.push('/login')
    } catch (error) {
      toast.error('Erro ao fazer logout')
    }
  }

  const isActiveRoute = (href: string) => {
    return router.pathname === href
  }

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderSidebar = () => (
    <div className={`
      fixed left-0 top-0 z-40 h-screen transition-transform duration-300 ease-in-out
      ${sidebarCollapsed ? 'w-16' : 'w-64'}
      ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
      bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
    `}>
      {/* Header da Sidebar */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">GABI Admin</span>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
              ${isActiveRoute(item.href)
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }
            `}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!sidebarCollapsed && (
              <>
                <span className="ml-3 flex-1">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer da Sidebar */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'usuario@company.com'}
              </p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start"
        >
          <LogOut className="w-4 h-4" />
          {!sidebarCollapsed && <span className="ml-2">Sair</span>}
        </Button>
      </div>
    </div>
  )

  const renderHeader = () => (
    <header className="
      fixed top-0 right-0 z-30 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700
      transition-all duration-300 ease-in-out
      ${sidebarCollapsed ? 'left-16' : 'left-64'}
      md:left-64
    ">
      <div className="flex items-center justify-between h-full px-4">
        {/* Botão do menu mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Busca */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Ações do header */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
              3
            </Badge>
          </Button>
          
          <Button variant="ghost" size="sm">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )

  const renderOverlay = () => (
    <div
      className={`
        fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity duration-300
        ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        md:hidden
      `}
      onClick={() => setMobileMenuOpen(false)}
    />
  )

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      {renderSidebar()}

      {/* Overlay para mobile */}
      {renderOverlay()}

      {/* Header */}
      {renderHeader()}

      {/* Conteúdo principal */}
      <main className={`
        pt-16 transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'ml-16' : 'ml-64'}
        md:ml-64
      `}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
} 