import React, { useState } from 'react'
import { NextPage } from 'next'
import { Head } from '@/components/Head'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  FileText, 
  FileCode, 
  FileJson,
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  TrendingUp,
  Activity,
  Database,
  Users,
  Settings,
  Archive,
  Upload,
  Download as DownloadIcon,
  FileArchive,
  PieChart,
  Calendar,
  Filter
} from 'lucide-react'
import { ExportHistory } from '@/components/ExportHistory'
import { exportService } from '@/services/exportService'
import { ExportStats, ExportLog } from '@/services/exportService'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface ExportFormat {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  features: string[]
}

interface ExportType {
  id: string
  name: string
  description: string
  icon: string
  examples: string[]
}

// =============================================================================
// DADOS MOCK
// =============================================================================

const exportFormats: ExportFormat[] = [
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Documento formatado para impressão e distribuição',
    icon: <FileText className="w-6 h-6" />,
    color: 'bg-red-100 text-red-800 border-red-200',
    features: [
      'Cabeçalho institucional com logomarca',
      'Numeração de páginas automática',
      'Sumário opcional',
      'Rodapé com metadados',
      'Estilo aplicado conforme configuração'
    ]
  },
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Texto estruturado para edição técnica',
    icon: <FileCode className="w-6 h-6" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    features: [
      'Texto limpo e estruturado',
      'Tags HTML básicas (h1, h2, listas)',
      'Referência de fonte/base utilizada',
      'Compatível com editores técnicos',
      'Fácil conversão para outros formatos'
    ]
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'Dados estruturados para integração',
    icon: <FileJson className="w-6 h-6" />,
    color: 'bg-green-100 text-green-800 border-green-200',
    features: [
      'Dados estruturados completos',
      'Metadados do agente e estilo',
      'Informações de base de conhecimento',
      'Compatível com APIs e sistemas',
      'Fácil processamento programático'
    ]
  }
]

const exportTypes: ExportType[] = [
  {
    id: 'chat',
    name: 'Conversas',
    description: 'Exportar conversas completas com GABI',
    icon: '💬',
    examples: [
      'Conversa sobre análise de contratos',
      'Discussão sobre procedimentos técnicos',
      'Sessão de perguntas e respostas'
    ]
  },
  {
    id: 'task',
    name: 'Tarefas',
    description: 'Resultados de tarefas executadas',
    icon: '⚡',
    examples: [
      'Resumo de documentos da semana',
      'Análise de inconsistências',
      'Extração de dados importantes'
    ]
  },
  {
    id: 'report',
    name: 'Relatórios',
    description: 'Relatórios gerados automaticamente',
    icon: '📊',
    examples: [
      'Relatório de performance',
      'Análise de tendências',
      'Dashboard de métricas'
    ]
  },
  {
    id: 'analysis',
    name: 'Análises',
    description: 'Análises detalhadas de conteúdo',
    icon: '🔍',
    examples: [
      'Análise comparativa de documentos',
      'Revisão de conformidade',
      'Identificação de padrões'
    ]
  },
  {
    id: 'summary',
    name: 'Resumos',
    description: 'Resumos executivos e sínteses',
    icon: '📋',
    examples: [
      'Resumo executivo de relatório',
      'Síntese de reunião',
      'Extrato de documento longo'
    ]
  }
]

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const ExportsPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<ExportStats | null>(null)
  const [loading, setLoading] = useState(false)

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadStats = async () => {
    try {
      setLoading(true)
      const statsData = await exportService.getExportStats()
      setStats(statsData)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const getFormatUsagePercentage = (format: string) => {
    if (!stats?.by_format || stats.total_exports === 0) return 0
    const count = stats.by_format[format] || 0
    return Math.round((count / stats.total_exports) * 100)
  }

  const getContentTypeUsagePercentage = (type: string) => {
    if (!stats?.by_content_type || stats.total_exports === 0) return 0
    const count = stats.by_content_type[type] || 0
    return Math.round((count / stats.total_exports) * 100)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // =============================================================================
  // RENDERIZAÇÃO
  // =============================================================================

  return (
    <>
      <Head title="Exportação de Conhecimento - GABI" />
      
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Exportação de Conhecimento</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Exporte conteúdos gerados pela GABI em múltiplos formatos
              </p>
            </div>
            <Button onClick={loadStats} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="formats">Formatos</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Exportações</CardTitle>
                    <DownloadIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total_exports || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.exports_today || 0} hoje
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.exports_this_week || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +15% vs semana anterior
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Armazenamento</CardTitle>
                    <Database className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatFileSize(stats?.total_storage_used || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total utilizado
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                    <Users className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats?.by_user ? Object.keys(stats.by_user).length : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Exportando conteúdo
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Format Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5" />
                    <span>Uso por Formato</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {exportFormats.map((format) => {
                      const percentage = getFormatUsagePercentage(format.id)
                      const count = stats?.by_format?.[format.id] || 0
                      
                      return (
                        <div key={format.id} className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${format.color}`}>
                              {format.icon}
                            </div>
                            <div>
                              <h3 className="font-medium">{format.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {count} exportações ({percentage}%)
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                format.id === 'pdf' ? 'bg-red-600' :
                                format.id === 'markdown' ? 'bg-blue-600' :
                                'bg-green-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Content Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Tipos de Conteúdo Exportados</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exportTypes.map((type) => {
                      const percentage = getContentTypeUsagePercentage(type.id)
                      const count = stats?.by_content_type?.[type.id] || 0
                      
                      return (
                        <div key={type.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <span className="text-2xl">{type.icon}</span>
                          <div className="flex-1">
                            <h3 className="font-medium">{type.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {count} exportações
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                              <div 
                                className="bg-blue-600 h-1 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Formats Tab */}
            <TabsContent value="formats" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {exportFormats.map((format) => (
                  <Card key={format.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg ${format.color}`}>
                          {format.icon}
                        </div>
                        <div>
                          <CardTitle className="text-xl">{format.name}</CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <h4 className="font-medium">Características:</h4>
                        <ul className="space-y-2">
                          {format.features.map((feature, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span>Uso atual:</span>
                            <span className="font-medium">
                              {getFormatUsagePercentage(format.id)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className={`h-2 rounded-full ${
                                format.id === 'pdf' ? 'bg-red-600' :
                                format.id === 'markdown' ? 'bg-blue-600' :
                                'bg-green-600'
                              }`}
                              style={{ width: `${getFormatUsagePercentage(format.id)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Usage Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Diretrizes de Uso</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Quando usar cada formato:</h3>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-red-100 text-red-800">PDF</Badge>
                          <div className="text-sm">
                            <strong>Distribuição e arquivamento:</strong> Relatórios finais, 
                            documentos para impressão, compartilhamento com stakeholders.
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-blue-100 text-blue-800">Markdown</Badge>
                          <div className="text-sm">
                            <strong>Edição e reuso:</strong> Documentação técnica, 
                            conteúdo para blogs, edição posterior.
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-green-100 text-green-800">JSON</Badge>
                          <div className="text-sm">
                            <strong>Integração:</strong> APIs, sistemas externos, 
                            processamento programático.
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-3">Melhores práticas:</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Sempre inclua metadados para rastreabilidade</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Use títulos descritivos para facilitar busca</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Configure o idioma adequado para o conteúdo</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Revise as opções antes de exportar</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <ExportHistory showStats={false} showFilters={true} maxItems={100} />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5" />
                      <span>Atividade Recente</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.recent_exports?.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className={`p-2 rounded-lg ${
                            log.format === 'pdf' ? 'bg-red-100' :
                            log.format === 'markdown' ? 'bg-blue-100' :
                            'bg-green-100'
                          }`}>
                            {exportService.getFormatIcon(log.format)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{log.file_name}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {log.user_name} • {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {log.format.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Storage Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="w-5 h-5" />
                      <span>Uso de Armazenamento</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Total utilizado</span>
                          <span className="font-medium">
                            {formatFileSize(stats?.total_storage_used || 0)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-blue-600 h-3 rounded-full"
                            style={{ width: '65%' }} // Mock data
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          65% de 1GB utilizado
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Arquivos:</span>
                          <div className="font-medium">{stats?.total_exports || 0}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Média por arquivo:</span>
                          <div className="font-medium">
                            {stats?.total_exports ? 
                              formatFileSize((stats.total_storage_used || 0) / stats.total_exports) : 
                              '0 Bytes'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Export Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Tendências de Exportação</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats?.exports_today || 0}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Hoje</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats?.exports_this_week || 0}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Esta Semana</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats?.exports_this_month || 0}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Este Mês</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium mb-2">Insights:</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>• PDF é o formato mais popular (45% das exportações)</li>
                      <li>• Conversas são o tipo de conteúdo mais exportado</li>
                      <li>• Pico de atividade às 14h-16h</li>
                      <li>• Crescimento de 15% no uso de Markdown este mês</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </>
  )
}

export default ExportsPage 