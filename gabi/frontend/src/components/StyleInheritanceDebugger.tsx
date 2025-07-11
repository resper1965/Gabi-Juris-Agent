import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  FileText, 
  Settings, 
  ArrowDown, 
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Eye,
  Copy,
  Download,
  RefreshCw,
  Zap,
  Palette,
  Target,
  Users,
  Database
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  StyleInheritanceResult, 
  StyleInheritanceStep, 
  StyleLog,
  getStyleDisplayName,
  getStyleDescription,
  getStyleIcon,
  styleInheritanceService
} from '@/services/styleInheritanceService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface StyleInheritanceDebuggerProps {
  inheritanceResult: StyleInheritanceResult
  showDetails?: boolean
  onRefresh?: () => void
}

interface StyleInheritanceHistoryProps {
  userId?: string
  baseId?: string
  agentId?: string
  limit?: number
}

// =============================================================================
// COMPONENTE PRINCIPAL DE DEBUG
// =============================================================================

export default function StyleInheritanceDebugger({
  inheritanceResult,
  showDetails = true,
  onRefresh
}: StyleInheritanceDebuggerProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)

  // =============================================================================
  // RENDERIZAÇÃO DE COMPONENTES
  // =============================================================================

  const renderInheritanceChain = () => (
    <div className="space-y-4">
      {inheritanceResult.inheritance_chain.map((step, index) => (
        <div key={index} className="relative">
          <div className="flex items-start space-x-4">
            {/* Ícone do nível */}
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.style ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {getLevelIcon(step.level)}
              </div>
            </div>

            {/* Conteúdo do passo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium capitalize">{step.level}</h4>
                {step.style && (
                  <Badge variant="outline" className="text-xs">
                    {getStyleDisplayName(step.style)}
                  </Badge>
                )}
                {!step.style && (
                  <Badge variant="secondary" className="text-xs">
                    Sem estilo
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {step.reason}
              </p>
              
              {step.style && (
                <div className="text-xs text-gray-500">
                  {step.style.description || getStyleDescription(step.style)}
                </div>
              )}
              
              <div className="text-xs text-gray-400 mt-1">
                {new Date(step.timestamp).toLocaleString('pt-BR')}
              </div>
            </div>

            {/* Indicador de resultado final */}
            {index === inheritanceResult.inheritance_chain.length - 1 && (
              <div className="flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>

          {/* Linha conectora */}
          {index < inheritanceResult.inheritance_chain.length - 1 && (
            <div className="absolute left-4 top-8 w-0.5 h-4 bg-gray-200 dark:bg-gray-700"></div>
          )}
        </div>
      ))}
    </div>
  )

  const renderStyleDetails = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Estilo Final Aplicado</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Informações Básicas</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Nome:</span>
                  <span className="font-medium">{getStyleDisplayName(inheritanceResult.final_style)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span className="font-medium">{inheritanceResult.final_style.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confiança:</span>
                  <span className="font-medium">
                    {Math.round(inheritanceResult.confidence_score * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fonte:</span>
                  <Badge variant="outline" className="capitalize">
                    {inheritanceResult.source}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Características</h4>
              <div className="space-y-2 text-sm">
                {inheritanceResult.final_style.vocabulary_complexity && (
                  <div className="flex justify-between">
                    <span>Complexidade:</span>
                    <Badge variant="outline" className="capitalize">
                      {inheritanceResult.final_style.vocabulary_complexity}
                    </Badge>
                  </div>
                )}
                {inheritanceResult.final_style.tone && (
                  <div className="flex justify-between">
                    <span>Tom:</span>
                    <Badge variant="outline" className="capitalize">
                      {inheritanceResult.final_style.tone}
                    </Badge>
                  </div>
                )}
                {inheritanceResult.final_style.structure_preference && (
                  <div className="flex justify-between">
                    <span>Estrutura:</span>
                    <Badge variant="outline" className="capitalize">
                      {inheritanceResult.final_style.structure_preference.replace('_', ' ')}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {inheritanceResult.final_style.description && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h5 className="font-medium mb-2">Descrição</h5>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {inheritanceResult.final_style.description}
              </p>
            </div>
          )}

          {inheritanceResult.final_style.custom_prompt && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h5 className="font-medium mb-2">Prompt Personalizado</h5>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-mono">
                {inheritanceResult.final_style.custom_prompt}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Detalhes da Fonte</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {inheritanceResult.source_details.agent_id && (
              <div className="flex justify-between">
                <span>Agente:</span>
                <span className="font-medium">{inheritanceResult.source_details.agent_name}</span>
              </div>
            )}
            {inheritanceResult.source_details.base_id && (
              <div className="flex justify-between">
                <span>Base:</span>
                <span className="font-medium">{inheritanceResult.source_details.base_name}</span>
              </div>
            )}
            {inheritanceResult.source_details.organization_id && (
              <div className="flex justify-between">
                <span>Organização:</span>
                <span className="font-medium">{inheritanceResult.source_details.organization_id}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>ID da Resposta:</span>
              <span className="font-mono text-xs">{inheritanceResult.response_id}</span>
            </div>
            <div className="flex justify-between">
              <span>Aplicado em:</span>
              <span className="text-gray-600">
                {new Date(inheritanceResult.applied_at).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderJsonView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Dados JSON</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded overflow-auto">
            {JSON.stringify(inheritanceResult, null, 2)}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Debug de Herança de Estilo</h3>
        </div>
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(inheritanceResult, null, 2))
              toast.success('Dados copiados para a área de transferência!')
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar JSON
          </Button>
        </div>
      </div>

      {showDetails ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="chain">Cadeia de Herança</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Estilo Final</p>
                      <p className="font-bold">{getStyleDisplayName(inheritanceResult.final_style)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Fonte</p>
                      <p className="font-bold capitalize">{inheritanceResult.source}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Confiança</p>
                      <p className="font-bold">{Math.round(inheritanceResult.confidence_score * 100)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Estilo aplicado:</strong> {getStyleDisplayName(inheritanceResult.final_style)} 
                (fonte: {inheritanceResult.source}) - {inheritanceResult.final_style.description || getStyleDescription(inheritanceResult.final_style)}
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="chain" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowDown className="w-5 h-5" />
                  <span>Cadeia de Herança de Estilo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderInheritanceChain()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {renderStyleDetails()}
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            {renderJsonView()}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Estilo aplicado:</strong> {getStyleDisplayName(inheritanceResult.final_style)} 
              (fonte: {inheritanceResult.source})
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// COMPONENTE DE HISTÓRICO
// =============================================================================

export function StyleInheritanceHistory({
  userId,
  baseId,
  agentId,
  limit = 20
}: StyleInheritanceHistoryProps) {
  const [logs, setLogs] = useState<StyleLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [userId, baseId, agentId, limit])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const history = await styleInheritanceService.getStyleInheritanceHistory(
        userId,
        baseId,
        agentId,
        limit
      )
      setLogs(history)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      toast.error('Erro ao carregar histórico de herança de estilo')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Histórico de Herança de Estilo</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadHistory}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {logs.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Nenhum log de herança de estilo encontrado para os filtros aplicados.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.response_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="capitalize">
                      {log.inheritance_result.source}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {getStyleDisplayName(log.inheritance_result.final_style)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
                
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {log.inheritance_result.final_style.description || 
                   getStyleDescription(log.inheritance_result.final_style)}
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>ID: {log.response_id}</span>
                  <span>{log.generated_content_length} chars • {log.processing_time}ms</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

const getLevelIcon = (level: string) => {
  const icons: Record<string, React.ReactNode> = {
    request: <Eye className="w-4 h-4" />,
    agent: <Brain className="w-4 h-4" />,
    base: <Database className="w-4 h-4" />,
    organization: <Users className="w-4 h-4" />,
    fallback: <Settings className="w-4 h-4" />
  }
  
  return icons[level] || <Info className="w-4 h-4" />
} 