import React, { useState, useEffect } from 'react'
import { NextPage } from 'next'
import { Head } from '@/components/Head'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { 
  Languages, 
  Globe, 
  Settings, 
  BarChart3, 
  RefreshCw, 
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Zap
} from 'lucide-react'
import { useMultilingual } from '@/hooks/useMultilingual'
import { LanguageSelector } from '@/components/LanguageSelector'
import { LanguageSettings } from '@/components/LanguageSelector'
import { 
  MultilingualStats, 
  DocumentTranslation,
  LanguageConfig,
  SUPPORTED_LANGUAGES
} from '@/services/multilingualService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface TranslationQueueItem {
  id: string
  document_id: string
  document_name: string
  source_language: string
  target_language: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  estimated_time?: number
  progress?: number
}

interface LanguageUsageStats {
  language: string
  documents_count: number
  translations_count: number
  avg_quality: number
  most_common_source: string
  usage_trend: 'increasing' | 'stable' | 'decreasing'
}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const MultilingualPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')
  const [translationQueue, setTranslationQueue] = useState<TranslationQueueItem[]>([])
  const [languageStats, setLanguageStats] = useState<LanguageUsageStats[]>([])
  
  // Mock data - em produção viria do hook
  const mockUserId = 'user-123'
  const mockOrgId = 'org-456'
  
  const {
    stats,
    loadingStats,
    loadStats,
    getSupportedLanguages
  } = useMultilingual({
    userId: mockUserId,
    organizationId: mockOrgId
  })

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    loadStats()
    loadMockData()
  }, [])

  // =============================================================================
  // MOCK DATA
  // =============================================================================

  const loadMockData = () => {
    // Mock translation queue
    setTranslationQueue([
      {
        id: '1',
        document_id: 'doc-1',
        document_name: 'Manual de Procedimentos.pdf',
        source_language: 'en',
        target_language: 'pt-BR',
        status: 'processing',
        priority: 'high',
        created_at: '2024-01-15T10:30:00Z',
        estimated_time: 120,
        progress: 65
      },
      {
        id: '2',
        document_id: 'doc-2',
        document_name: 'Relatório Anual.docx',
        source_language: 'es',
        target_language: 'en',
        status: 'pending',
        priority: 'medium',
        created_at: '2024-01-15T11:00:00Z'
      },
      {
        id: '3',
        document_id: 'doc-3',
        document_name: 'Política de Segurança.pdf',
        source_language: 'pt-BR',
        target_language: 'fr',
        status: 'completed',
        priority: 'low',
        created_at: '2024-01-15T09:15:00Z'
      }
    ])

    // Mock language stats
    setLanguageStats([
      {
        language: 'pt-BR',
        documents_count: 45,
        translations_count: 23,
        avg_quality: 0.92,
        most_common_source: 'en',
        usage_trend: 'increasing'
      },
      {
        language: 'en',
        documents_count: 38,
        translations_count: 31,
        avg_quality: 0.89,
        most_common_source: 'pt-BR',
        usage_trend: 'stable'
      },
      {
        language: 'es',
        documents_count: 12,
        translations_count: 8,
        avg_quality: 0.85,
        most_common_source: 'en',
        usage_trend: 'increasing'
      }
    ])
  }

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleRetryTranslation = (itemId: string) => {
    console.log('Retry translation:', itemId)
    // Implementar retry
  }

  const handleCancelTranslation = (itemId: string) => {
    console.log('Cancel translation:', itemId)
    // Implementar cancelamento
  }

  const handleExportStats = () => {
    console.log('Export stats')
    // Implementar exportação
  }

  // =============================================================================
  // RENDERIZAÇÃO
  // =============================================================================

  return (
    <>
      <Head title="Gestão Multilíngue - GABI" />
      
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gestão Multilíngue</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie traduções automáticas e configurações de idioma
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <LanguageSelector variant="button" />
              <Button onClick={handleExportStats}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="translations">Traduções</TabsTrigger>
              <TabsTrigger value="languages">Idiomas</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Documentos</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total_documents || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +12% em relação ao mês passado
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Documentos Traduzidos</CardTitle>
                    <Languages className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.translated_documents || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.total_documents ? Math.round((stats.translated_documents / stats.total_documents) * 100) : 0}% de cobertura
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Idiomas Suportados</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.supported_languages || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Idiomas ativos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.avg_translation_time ? Math.round(stats.avg_translation_time / 1000) : 0}s
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Por tradução
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Language Usage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Uso por Idioma</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {languageStats.map((stat) => (
                      <div key={stat.language} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">
                            {SUPPORTED_LANGUAGES.find(l => l.code === stat.language)?.flag}
                          </span>
                          <div>
                            <p className="font-medium">
                              {SUPPORTED_LANGUAGES.find(l => l.code === stat.language)?.native_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {stat.documents_count} documentos, {stat.translations_count} traduções
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {Math.round(stat.avg_quality * 100)}% qualidade
                          </Badge>
                          <Badge variant={
                            stat.usage_trend === 'increasing' ? 'default' :
                            stat.usage_trend === 'decreasing' ? 'destructive' : 'secondary'
                          }>
                            {stat.usage_trend === 'increasing' ? '↗' : 
                             stat.usage_trend === 'decreasing' ? '↘' : '→'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Translations Tab */}
            <TabsContent value="translations" className="space-y-6">
              {/* Queue Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os idiomas</SelectItem>
                      {getSupportedLanguages().map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.flag} {lang.native_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
                <Badge variant="outline">
                  {translationQueue.length} na fila
                </Badge>
              </div>

              {/* Translation Queue */}
              <Card>
                <CardHeader>
                  <CardTitle>Fila de Traduções</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {translationQueue.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {SUPPORTED_LANGUAGES.find(l => l.code === item.source_language)?.flag}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="text-lg">
                              {SUPPORTED_LANGUAGES.find(l => l.code === item.target_language)?.flag}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{item.document_name}</p>
                            <p className="text-sm text-gray-500">
                              Criado em {new Date(item.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge variant={
                            item.status === 'completed' ? 'default' :
                            item.status === 'processing' ? 'secondary' :
                            item.status === 'failed' ? 'destructive' : 'outline'
                          }>
                            {item.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {item.status === 'processing' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                            {item.status === 'failed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {item.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {item.status}
                          </Badge>
                          
                          {item.status === 'processing' && item.progress && (
                            <div className="w-24">
                              <Progress value={item.progress} className="h-2" />
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-1">
                            {item.status === 'failed' && (
                              <Button variant="outline" size="sm" onClick={() => handleRetryTranslation(item.id)}>
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                            {item.status === 'pending' && (
                              <Button variant="outline" size="sm" onClick={() => handleCancelTranslation(item.id)}>
                                <AlertTriangle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {translationQueue.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhuma tradução na fila
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Languages Tab */}
            <TabsContent value="languages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Idiomas Suportados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getSupportedLanguages().map((language) => (
                      <div key={language.code} className="p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{language.flag}</span>
                          <div className="flex-1">
                            <p className="font-medium">{language.native_name}</p>
                            <p className="text-sm text-gray-500">{language.name}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {language.is_default && (
                              <Badge variant="default">Padrão</Badge>
                            )}
                            <Badge variant={language.is_enabled ? 'default' : 'secondary'}>
                              {language.is_enabled ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <LanguageSettings />
              
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Avançadas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tradução Automática em Background</p>
                      <p className="text-sm text-gray-500">
                        Traduzir documentos automaticamente após ingestão
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Verificação de Duplicatas</p>
                      <p className="text-sm text-gray-500">
                        Evitar traduções duplicadas usando hash do conteúdo
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Logs Detalhados</p>
                      <p className="text-sm text-gray-500">
                        Registrar informações detalhadas de tradução
                      </p>
                    </div>
                    <Switch />
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

export default MultilingualPage 