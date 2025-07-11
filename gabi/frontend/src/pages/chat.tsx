import React, { useState, useEffect } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bot, 
  Database, 
  Settings, 
  MessageSquare,
  Users,
  Building,
  Palette,
  Target,
  Zap,
  Activity,
  TrendingUp,
  FileText,
  RefreshCw,
  Plus,
  History,
  Download,
  Share2,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/AdminLayout'
import GabiChat from '@/components/GabiChat'
import { useGabiAgents, useGabiBases, useGabiTenant } from '@/hooks/useGabiChat'
import { gabiApiService } from '@/services/gabiApiService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface ChatPageProps {}

interface ChatPreset {
  id: string
  name: string
  description: string
  agentId: string
  baseIds: string[]
  styleSource?: string
  icon: string
}

// =============================================================================
// PRESETS DE CHAT
// =============================================================================

const CHAT_PRESETS: ChatPreset[] = [
  {
    id: 'general',
    name: 'Assistente Geral',
    description: 'Chat geral para perguntas e suporte',
    agentId: 'gpt4',
    baseIds: ['general', 'faq'],
    icon: '🤖'
  },
  {
    id: 'esg',
    name: 'Consultora ESG',
    description: 'Especializada em questões ESG e sustentabilidade',
    agentId: 'gpt4',
    baseIds: ['esg', 'sustainability', 'compliance'],
    styleSource: 'esg',
    icon: '🌱'
  },
  {
    id: 'legal',
    name: 'Assistente Jurídico',
    description: 'Suporte para questões legais e contratos',
    agentId: 'gpt4',
    baseIds: ['legal', 'contracts', 'compliance'],
    styleSource: 'legal',
    icon: '⚖️'
  },
  {
    id: 'technical',
    name: 'Suporte Técnico',
    description: 'Ajuda com questões técnicas e documentação',
    agentId: 'gpt4',
    baseIds: ['technical', 'documentation', 'api'],
    icon: '🔧'
  },
  {
    id: 'commercial',
    name: 'Assistente Comercial',
    description: 'Suporte para vendas e relacionamento com clientes',
    agentId: 'gpt4',
    baseIds: ['commercial', 'sales', 'customers'],
    styleSource: 'commercial',
    icon: '💼'
  }
]

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const ChatPage: NextPage<ChatPageProps> = () => {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [selectedPreset, setSelectedPreset] = useState<string>('general')
  const [customAgent, setCustomAgent] = useState<string>('')
  const [customBases, setCustomBases] = useState<string[]>([])
  const [customStyleSource, setCustomStyleSource] = useState<string>('')
  const [activeTab, setActiveTab] = useState('presets')
  const [chatStats, setChatStats] = useState<any>(null)

  // =============================================================================
  // HOOKS DE DADOS
  // =============================================================================

  const { agents, loading: agentsLoading, refreshAgents } = useGabiAgents(
    user?.organization_id || ''
  )

  const { bases, loading: basesLoading, refreshBases } = useGabiBases(
    user?.organization_id || ''
  )

  const { tenant, loading: tenantLoading } = useGabiTenant(
    user?.organization_id || ''
  )

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    if (user?.organization_id) {
      loadChatStats()
    }
  }, [user?.organization_id])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId)
    const preset = CHAT_PRESETS.find(p => p.id === presetId)
    if (preset) {
      setCustomAgent(preset.agentId)
      setCustomBases(preset.baseIds)
      setCustomStyleSource(preset.styleSource || '')
    }
  }

  const handleRefreshData = async () => {
    try {
      await Promise.all([
        refreshAgents(),
        refreshBases(),
        loadChatStats()
      ])
      toast.success('Dados atualizados com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar dados')
    }
  }

  const loadChatStats = async () => {
    try {
      // Aqui você pode implementar a lógica para carregar estatísticas do chat
      // Por exemplo, número de mensagens, tempo médio de resposta, etc.
      setChatStats({
        totalMessages: 0,
        avgResponseTime: 0,
        activeSessions: 0,
        popularTopics: []
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  // =============================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =============================================================================

  const renderPresets = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Presets de Chat</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Selecione um preset para iniciar rapidamente uma conversa especializada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHAT_PRESETS.map((preset) => (
          <Card
            key={preset.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedPreset === preset.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handlePresetChange(preset.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">{preset.icon}</span>
                <div>
                  <h4 className="font-semibold">{preset.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {preset.description}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs">
                  <Bot className="w-3 h-3" />
                  <span>Agente: {preset.agentId}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <Database className="w-3 h-3" />
                  <span>Bases: {preset.baseIds.length}</span>
                </div>
                {preset.styleSource && (
                  <div className="flex items-center space-x-2 text-xs">
                    <Palette className="w-3 h-3" />
                    <span>Estilo: {preset.styleSource}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderCustomConfig = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Configuração Personalizada</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Configure manualmente o agente, bases e estilo para sua conversa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agente */}
        <div className="space-y-2">
          <Label htmlFor="agent">Agente</Label>
          {agentsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={customAgent} onValueChange={setCustomAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um agente" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4" />
                      <span>{agent.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Fonte de Estilo */}
        <div className="space-y-2">
          <Label htmlFor="styleSource">Fonte de Estilo</Label>
          <Select value={customStyleSource} onValueChange={setCustomStyleSource}>
            <SelectTrigger>
              <SelectValue placeholder="Estilo automático" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Estilo automático</SelectItem>
              {bases.map((base) => (
                <SelectItem key={base.id} value={base.id}>
                  {base.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bases de Conhecimento */}
      <div className="space-y-2">
        <Label>Bases de Conhecimento</Label>
        {basesLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {bases.map((base) => (
              <div key={base.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={base.id}
                  checked={customBases.includes(base.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCustomBases([...customBases, base.id])
                    } else {
                      setCustomBases(customBases.filter(id => id !== base.id))
                    }
                  }}
                />
                <label htmlFor={base.id} className="text-sm cursor-pointer">
                  {base.name}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderStats = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Estatísticas do Chat</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Visão geral da atividade e performance do chat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Mensagens</p>
                <p className="text-2xl font-bold">
                  {chatStats?.totalMessages || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tempo Médio</p>
                <p className="text-2xl font-bold">
                  {chatStats?.avgResponseTime || 0}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sessões Ativas</p>
                <p className="text-2xl font-bold">
                  {chatStats?.activeSessions || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Satisfação</p>
                <p className="text-2xl font-bold">
                  {chatStats?.satisfaction || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  if (!user?.organization_id) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <Alert>
            <AlertDescription>
              Organização não configurada. Entre em contato com o administrador.
            </AlertDescription>
          </Alert>
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
              <h1 className="text-3xl font-bold">Chat GABI</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Assistente inteligente com herança de estilo e múltiplas bases de conhecimento
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleRefreshData}
                disabled={agentsLoading || basesLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${agentsLoading || basesLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Informações da Organização */}
          {tenant && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">{tenant.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {tenant.domain}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {agents.length} agentes
                    </Badge>
                    <Badge variant="outline">
                      {bases.length} bases
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conteúdo Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Painel de Configuração */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Configuração</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="presets">Presets</TabsTrigger>
                      <TabsTrigger value="custom">Personalizado</TabsTrigger>
                      <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="presets" className="mt-4">
                      {renderPresets()}
                    </TabsContent>

                    <TabsContent value="custom" className="mt-4">
                      {renderCustomConfig()}
                    </TabsContent>

                    <TabsContent value="stats" className="mt-4">
                      {renderStats()}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Área do Chat */}
            <div className="lg:col-span-2">
              <GabiChat
                tenantId={user.organization_id}
                agentId={customAgent || (selectedPreset ? CHAT_PRESETS.find(p => p.id === selectedPreset)?.agentId : undefined)}
                baseIds={customBases.length > 0 ? customBases : (selectedPreset ? CHAT_PRESETS.find(p => p.id === selectedPreset)?.baseIds : undefined)}
                styleSource={customStyleSource || (selectedPreset ? CHAT_PRESETS.find(p => p.id === selectedPreset)?.styleSource : undefined)}
                showSettings={false}
                showHistory={true}
              />
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}

export default ChatPage 