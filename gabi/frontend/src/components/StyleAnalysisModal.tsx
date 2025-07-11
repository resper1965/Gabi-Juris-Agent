import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Brain, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Info,
  Copy,
  Download,
  Sparkles,
  Palette,
  Target,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { StyleAnalysisResult } from '@/services/knowledgeBaseService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface StyleAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  analysisResult: StyleAnalysisResult | null
  baseName: string
  onApplyStyle?: (analysis: StyleAnalysisResult) => void
}

interface StyleMetrics {
  vocabulary_complexity: {
    score: number
    label: string
    description: string
    color: string
  }
  tone: {
    score: number
    label: string
    description: string
    color: string
  }
  structure: {
    score: number
    label: string
    description: string
    color: string
  }
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function StyleAnalysisModal({
  isOpen,
  onClose,
  analysisResult,
  baseName,
  onApplyStyle
}: StyleAnalysisModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)

  // =============================================================================
  // CÁLCULO DE MÉTRICAS
  // =============================================================================

  const calculateMetrics = (): StyleMetrics => {
    if (!analysisResult) return {
      vocabulary_complexity: { score: 0, label: '', description: '', color: '' },
      tone: { score: 0, label: '', description: '', color: '' },
      structure: { score: 0, label: '', description: '', color: '' }
    }

    const vocabularyScores = {
      baixo: { score: 0.3, label: 'Baixo', description: 'Linguagem simples e acessível', color: 'bg-green-500' },
      medio: { score: 0.6, label: 'Médio', description: 'Linguagem equilibrada', color: 'bg-yellow-500' },
      alto: { score: 0.9, label: 'Alto', description: 'Linguagem técnica e especializada', color: 'bg-blue-500' }
    }

    const toneScores = {
      informal: { score: 0.2, label: 'Informal', description: 'Tom casual e amigável', color: 'bg-green-500' },
      neutro: { score: 0.5, label: 'Neutro', description: 'Tom equilibrado', color: 'bg-yellow-500' },
      formal: { score: 0.8, label: 'Formal', description: 'Tom profissional e institucional', color: 'bg-blue-500' }
    }

    const structureScores = {
      paragrafos_curtos: { score: 0.3, label: 'Parágrafos Curtos', description: 'Estrutura concisa', color: 'bg-green-500' },
      paragrafos_medios: { score: 0.6, label: 'Parágrafos Médios', description: 'Estrutura equilibrada', color: 'bg-yellow-500' },
      paragrafos_longos: { score: 0.9, label: 'Parágrafos Longos', description: 'Estrutura detalhada', color: 'bg-blue-500' }
    }

    return {
      vocabulary_complexity: vocabularyScores[analysisResult.vocabulary_complexity] || vocabularyScores.medio,
      tone: toneScores[analysisResult.tone] || toneScores.neutro,
      structure: structureScores[analysisResult.structure_preference] || structureScores.paragrafos_medios
    }
  }

  const metrics = calculateMetrics()

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleApplyStyle = async () => {
    if (!analysisResult || !onApplyStyle) return

    try {
      setLoading(true)
      await onApplyStyle(analysisResult)
      toast.success('Estilo aplicado com sucesso!')
      onClose()
    } catch (error) {
      console.error('Erro ao aplicar estilo:', error)
      toast.error('Erro ao aplicar estilo')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyAnalysis = () => {
    if (!analysisResult) return

    const analysisText = `
Análise de Estilo - ${baseName}

Confiança: ${Math.round(analysisResult.confidence_score * 100)}%
Documentos Analisados: ${analysisResult.analyzed_documents}
Tempo de Processamento: ${analysisResult.processing_time}ms

Métricas:
- Complexidade Vocabular: ${analysisResult.vocabulary_complexity}
- Tom: ${analysisResult.tone}
- Estrutura: ${analysisResult.structure_preference}

Descrição do Estilo:
${analysisResult.style_description}

Frases-Chave:
${analysisResult.key_phrases.join(', ')}

Termos Comuns:
${analysisResult.common_terms.join(', ')}
    `.trim()

    navigator.clipboard.writeText(analysisText)
    toast.success('Análise copiada para a área de transferência!')
  }

  const handleExportAnalysis = () => {
    if (!analysisResult) return

    const data = {
      base_name: baseName,
      analysis: analysisResult,
      generated_at: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analise-estilo-${baseName}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Análise exportada com sucesso!')
  }

  // =============================================================================
  // RENDERIZAÇÃO DE COMPONENTES
  // =============================================================================

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Resumo da Análise</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(analysisResult?.confidence_score * 100 || 0)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Confiança</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analysisResult?.analyzed_documents || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Documentos Analisados</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analysisResult?.processing_time || 0}ms
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tempo de Processamento</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Estilo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Métricas de Estilo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Complexidade Vocabular</span>
              <Badge variant="outline">{metrics.vocabulary_complexity.label}</Badge>
            </div>
            <Progress value={metrics.vocabulary_complexity.score * 100} className="mb-2" />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {metrics.vocabulary_complexity.description}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Tom</span>
              <Badge variant="outline">{metrics.tone.label}</Badge>
            </div>
            <Progress value={metrics.tone.score * 100} className="mb-2" />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {metrics.tone.description}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Estrutura</span>
              <Badge variant="outline">{metrics.structure.label}</Badge>
            </div>
            <Progress value={metrics.structure.score * 100} className="mb-2" />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {metrics.structure.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Descrição do Estilo */}
      {analysisResult?.style_description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Descrição do Estilo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {analysisResult.style_description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderDetails = () => (
    <div className="space-y-6">
      {/* Frases-Chave */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Frases-Chave Identificadas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysisResult?.key_phrases.map((phrase, index) => (
              <Badge key={index} variant="secondary">
                {phrase}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Termos Comuns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Termos Mais Frequentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysisResult?.common_terms.map((term, index) => (
              <Badge key={index} variant="outline">
                {term}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dados Técnicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Dados Técnicos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>ID da Análise:</span>
              <span className="font-mono text-gray-600 dark:text-gray-400">
                {analysisResult?.analysis_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Base Analisada:</span>
              <span className="font-mono text-gray-600 dark:text-gray-400">
                {analysisResult?.base_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Data da Análise:</span>
              <span className="text-gray-600 dark:text-gray-400">
                {analysisResult?.created_at ? 
                  new Date(analysisResult.created_at).toLocaleString('pt-BR') : 
                  'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span>Confiança da Análise:</span>
              <span className="text-gray-600 dark:text-gray-400">
                {Math.round((analysisResult?.confidence_score || 0) * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderRecommendations = () => (
    <div className="space-y-6">
      {/* Recomendações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>Recomendações de Uso</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium">Aplicação Ideal</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Este estilo é ideal para documentos {analysisResult?.tone === 'formal' ? 'formais e institucionais' : 
                analysisResult?.tone === 'neutro' ? 'com tom equilibrado' : 'com linguagem acessível'}.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium">Complexidade</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vocabulário {analysisResult?.vocabulary_complexity === 'alto' ? 'técnico e especializado' :
                analysisResult?.vocabulary_complexity === 'medio' ? 'equilibrado' : 'simples e acessível'}.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Target className="w-5 h-5 text-purple-500 mt-0.5" />
            <div>
              <h4 className="font-medium">Estrutura</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Prefere {analysisResult?.structure_preference === 'paragrafos_curtos' ? 'parágrafos curtos e objetivos' :
                analysisResult?.structure_preference === 'paragrafos_medios' ? 'parágrafos de tamanho médio' :
                'parágrafos longos e detalhados'}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {analysisResult && analysisResult.confidence_score < 0.7 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="w-5 h-5" />
              <span>Atenção</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              A confiança desta análise está abaixo do recomendado ({Math.round(analysisResult.confidence_score * 100)}%). 
              Considere analisar mais documentos ou ajustar manualmente o estilo.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sugestões de Melhoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Sugestões de Melhoria</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>• Adicione mais documentos para melhorar a precisão da análise</p>
            <p>• Revise e ajuste manualmente a descrição do estilo se necessário</p>
            <p>• Teste o estilo com diferentes tipos de consultas</p>
            <p>• Monitore o desempenho dos agentes com este estilo</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  if (!analysisResult) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Análise de Estilo</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Nenhuma análise disponível
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Análise de Estilo - {baseName}</span>
              </DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Análise detalhada do perfil textual da base de conhecimento
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAnalysis}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAnalysis}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh]">
            <TabsContent value="overview" className="mt-6">
              {renderOverview()}
            </TabsContent>

            <TabsContent value="details" className="mt-6">
              {renderDetails()}
            </TabsContent>

            <TabsContent value="recommendations" className="mt-6">
              {renderRecommendations()}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {onApplyStyle && (
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button 
              onClick={handleApplyStyle}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Aplicando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Aplicar Estilo
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 