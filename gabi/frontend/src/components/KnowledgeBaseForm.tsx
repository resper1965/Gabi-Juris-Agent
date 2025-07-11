import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BookOpen, 
  FileText, 
  Settings, 
  Globe, 
  Users, 
  Brain,
  Copy,
  Edit,
  Eye,
  EyeOff,
  Upload,
  Database,
  Link,
  Cloud,
  Code,
  Palette,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface AgentConfig {
  id: string
  name: string
  description?: string
  model: string
  temperature: number
  max_tokens: number
  use_style_profile: boolean
  custom_prompt?: string
  is_active: boolean
}

interface StyleProfile {
  mode: 'preset' | 'inferred'
  preset?: 'juridico' | 'didatico' | 'neutro' | 'cientifico' | 'comercial' | 'outro'
  inferred_from_base_id?: string
  description?: string
  confidence_score?: number
  analyzed_documents?: number
  vocabulary_complexity?: 'baixo' | 'medio' | 'alto'
  tone?: 'formal' | 'neutro' | 'informal'
  structure_preference?: 'paragrafos_curtos' | 'paragrafos_medios' | 'paragrafos_longos'
}

interface KnowledgeBase {
  id?: string
  name: string
  description?: string
  source_type: 'upload' | 'gdrive' | 'sharepoint' | 's3' | 'api' | 'manual'
  visibility: 'private' | 'organization' | 'public'
  style_profile: StyleProfile
  language: 'pt' | 'en' | 'es' | 'fr' | 'de'
  agents: AgentConfig[]
  created_at?: string
  updated_at?: string
  document_count?: number
  status?: 'active' | 'inactive' | 'processing'
}

interface ExistingBase {
  id: string
  name: string
  description?: string
  document_count: number
  style_profile: StyleProfile
  language: string
  created_at: string
}

// =============================================================================
// DADOS MOCKADOS PARA DESENVOLVIMENTO
// =============================================================================

const mockExistingBases: ExistingBase[] = [
  {
    id: 'b0239-fisc-contratos-v1',
    name: 'Contratos Fiscais',
    description: 'Base de conhecimento sobre contratos e legislação fiscal',
    document_count: 156,
    style_profile: {
      mode: 'inferred',
      description: 'Linguagem objetiva, estrutura em parágrafos curtos, vocabulário técnico da área fiscal-contratual e tom neutro-institucional',
      confidence_score: 0.89,
      analyzed_documents: 142,
      vocabulary_complexity: 'alto',
      tone: 'formal',
      structure_preference: 'paragrafos_curtos'
    },
    language: 'pt',
    created_at: '2024-01-15T10:30:00.000Z'
  },
  {
    id: 'b0240-manual-procedimentos',
    name: 'Manual de Procedimentos RH',
    description: 'Procedimentos e políticas de recursos humanos',
    document_count: 89,
    style_profile: {
      mode: 'preset',
      preset: 'didatico',
      description: 'Linguagem clara e didática, explicações passo a passo, tom amigável e acessível',
      confidence_score: 0.95,
      analyzed_documents: 89,
      vocabulary_complexity: 'medio',
      tone: 'neutro',
      structure_preference: 'paragrafos_medios'
    },
    language: 'pt',
    created_at: '2024-02-20T14:15:00.000Z'
  },
  {
    id: 'b0241-relatorios-tecnicos',
    name: 'Relatórios Técnicos',
    description: 'Relatórios técnicos e científicos',
    document_count: 234,
    style_profile: {
      mode: 'inferred',
      description: 'Linguagem técnica precisa, estrutura formal, vocabulário especializado, tom científico',
      confidence_score: 0.92,
      analyzed_documents: 210,
      vocabulary_complexity: 'alto',
      tone: 'formal',
      structure_preference: 'paragrafos_longos'
    },
    language: 'pt',
    created_at: '2024-03-10T09:45:00.000Z'
  }
]

const defaultAgents: AgentConfig[] = [
  {
    id: 'agent-1',
    name: 'Assistente Principal',
    description: 'Agente principal para consultas gerais',
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 2000,
    use_style_profile: true,
    is_active: true
  },
  {
    id: 'agent-2',
    name: 'Resumidor',
    description: 'Especializado em criar resumos',
    model: 'gpt-4',
    temperature: 0.5,
    max_tokens: 1000,
    use_style_profile: true,
    custom_prompt: 'Crie resumos concisos e objetivos',
    is_active: true
  },
  {
    id: 'agent-3',
    name: 'Analista',
    description: 'Para análises detalhadas e comparações',
    model: 'gpt-4',
    temperature: 0.3,
    max_tokens: 3000,
    use_style_profile: true,
    is_active: false
  }
]

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function KnowledgeBaseForm() {
  const [formData, setFormData] = useState<KnowledgeBase>({
    name: '',
    description: '',
    source_type: 'upload',
    visibility: 'private',
    style_profile: {
      mode: 'preset',
      preset: 'neutro'
    },
    language: 'pt',
    agents: [...defaultAgents]
  })

  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [showStylePreview, setShowStylePreview] = useState(false)
  const [selectedBaseForInference, setSelectedBaseForInference] = useState<ExistingBase | null>(null)
  const [inferenceResult, setInferenceResult] = useState<StyleProfile | null>(null)

  // =============================================================================
  // HANDLERS DE FORMULÁRIO
  // =============================================================================

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStyleProfileChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      style_profile: {
        ...prev.style_profile,
        [field]: value
      }
    }))
  }

  const handleAgentChange = (agentId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      agents: prev.agents.map(agent => 
        agent.id === agentId 
          ? { ...agent, [field]: value }
          : agent
      )
    }))
  }

  // =============================================================================
  // INFERÊNCIA DE ESTILO
  // =============================================================================

  const analyzeStyleFromBase = async (baseId: string) => {
    try {
      setAnalyzing(true)
      
      // Simular análise de estilo
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const selectedBase = mockExistingBases.find(b => b.id === baseId)
      if (!selectedBase) {
        toast.error('Base de conhecimento não encontrada')
        return
      }

      setSelectedBaseForInference(selectedBase)
      setInferenceResult(selectedBase.style_profile)
      
      // Aplicar estilo inferido ao formulário
      setFormData(prev => ({
        ...prev,
        style_profile: {
          mode: 'inferred',
          inferred_from_base_id: baseId,
          description: selectedBase.style_profile.description,
          confidence_score: selectedBase.style_profile.confidence_score,
          analyzed_documents: selectedBase.style_profile.analyzed_documents,
          vocabulary_complexity: selectedBase.style_profile.vocabulary_complexity,
          tone: selectedBase.style_profile.tone,
          structure_preference: selectedBase.style_profile.structure_preference
        }
      }))

      toast.success('Estilo analisado com sucesso!')
      
    } catch (error) {
      console.error('Erro ao analisar estilo:', error)
      toast.error('Erro ao analisar estilo da base')
    } finally {
      setAnalyzing(false)
    }
  }

  // =============================================================================
  // VALIDAÇÃO
  // =============================================================================

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Nome da base é obrigatório')
      return false
    }

    if (formData.style_profile.mode === 'inferred' && !formData.style_profile.inferred_from_base_id) {
      toast.error('Selecione uma base para inferir o estilo')
      return false
    }

    if (formData.style_profile.mode === 'preset' && !formData.style_profile.preset) {
      toast.error('Selecione um estilo predefinido')
      return false
    }

    if (formData.agents.length === 0) {
      toast.error('Adicione pelo menos um agente')
      return false
    }

    return true
  }

  // =============================================================================
  // SUBMISSÃO
  // =============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      
      // Simular envio para API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Dados do formulário:', formData)
      toast.success('Base de conhecimento criada com sucesso!')
      
      // Resetar formulário
      setFormData({
        name: '',
        description: '',
        source_type: 'upload',
        visibility: 'private',
        style_profile: {
          mode: 'preset',
          preset: 'neutro'
        },
        language: 'pt',
        agents: [...defaultAgents]
      })
      
    } catch (error) {
      console.error('Erro ao criar base:', error)
      toast.error('Erro ao criar base de conhecimento')
    } finally {
      setLoading(false)
    }
  }

  // =============================================================================
  // RENDERIZAÇÃO DE COMPONENTES
  // =============================================================================

  const renderStylePresetOptions = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { value: 'juridico', label: 'Jurídico', icon: '⚖️', desc: 'Linguagem formal e técnica' },
        { value: 'didatico', label: 'Didático', icon: '📚', desc: 'Linguagem clara e educativa' },
        { value: 'neutro', label: 'Neutro', icon: '📄', desc: 'Linguagem equilibrada' },
        { value: 'cientifico', label: 'Científico', icon: '🔬', desc: 'Linguagem técnica e precisa' },
        { value: 'comercial', label: 'Comercial', icon: '💼', desc: 'Linguagem persuasiva' },
        { value: 'outro', label: 'Outro', icon: '🎨', desc: 'Estilo personalizado' }
      ].map(preset => (
        <div
          key={preset.value}
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            formData.style_profile.preset === preset.value
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
          onClick={() => handleStyleProfileChange('preset', preset.value)}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{preset.icon}</span>
            <div>
              <h4 className="font-medium">{preset.label}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{preset.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderInferenceOptions = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Info className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Selecione uma base existente para inferir automaticamente o estilo textual
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {mockExistingBases.map(base => (
          <div
            key={base.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              formData.style_profile.inferred_from_base_id === base.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
            onClick={() => analyzeStyleFromBase(base.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{base.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {base.description}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{base.document_count} documentos</span>
                  <span>{base.language.toUpperCase()}</span>
                  <span>{base.style_profile.analyzed_documents} analisados</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {analyzing && formData.style_profile.inferred_from_base_id === base.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                ) : (
                  <Badge variant="outline">
                    {base.style_profile.confidence_score ? 
                      `${Math.round(base.style_profile.confidence_score * 100)}%` : 
                      'Analisado'
                    }
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderStylePreview = () => {
    if (!inferenceResult && formData.style_profile.mode === 'preset') {
      return (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selecione um estilo predefinido para ver a descrição
          </p>
        </div>
      )
    }

    const style = inferenceResult || formData.style_profile

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Complexidade Vocabular</h4>
            <Badge variant="outline" className="capitalize">
              {style.vocabulary_complexity || 'Não definido'}
            </Badge>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Tom</h4>
            <Badge variant="outline" className="capitalize">
              {style.tone || 'Não definido'}
            </Badge>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Estrutura</h4>
            <Badge variant="outline" className="capitalize">
              {style.structure_preference ? 
                style.structure_preference.replace('_', ' ') : 
                'Não definido'
              }
            </Badge>
          </div>
        </div>

        {style.description && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium mb-2">Descrição do Estilo</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {style.description}
            </p>
          </div>
        )}

        {style.confidence_score && (
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Confiança da análise: {Math.round(style.confidence_score * 100)}%
            </span>
          </div>
        )}
      </div>
    )
  }

  const renderAgentConfig = (agent: AgentConfig) => (
    <Card key={agent.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <Checkbox
              checked={agent.is_active}
              onCheckedChange={(checked) => handleAgentChange(agent.id, 'is_active', checked)}
            />
          </div>
          <Badge variant={agent.is_active ? 'default' : 'secondary'}>
            {agent.is_active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
        {agent.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{agent.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Modelo</label>
            <Select
              value={agent.model}
              onValueChange={(value) => handleAgentChange(agent.id, 'model', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude-3">Claude-3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Temperatura</label>
            <Input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={agent.temperature}
              onChange={(e) => handleAgentChange(agent.id, 'temperature', parseFloat(e.target.value))}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Max Tokens</label>
            <Input
              type="number"
              min="100"
              max="4000"
              step="100"
              value={agent.max_tokens}
              onChange={(e) => handleAgentChange(agent.id, 'max_tokens', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id={`use-style-${agent.id}`}
            checked={agent.use_style_profile}
            onCheckedChange={(checked) => handleAgentChange(agent.id, 'use_style_profile', checked)}
          />
          <label htmlFor={`use-style-${agent.id}`} className="text-sm">
            Usar perfil de estilo da base
          </label>
        </div>

        {!agent.use_style_profile && (
          <div>
            <label className="text-sm font-medium">Prompt Personalizado</label>
            <Textarea
              placeholder="Digite um prompt personalizado para este agente..."
              value={agent.custom_prompt || ''}
              onChange={(e) => handleAgentChange(agent.id, 'custom_prompt', e.target.value)}
              rows={3}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )

  // =============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================================

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Nova Base de Conhecimento</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure uma nova base de conhecimento com estilo personalizável
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Básico</span>
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Estilo</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>Agentes</span>
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Revisão</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Básico */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Informações Básicas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome da Base *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Cláusulas Comerciais"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descreva o propósito e conteúdo desta base..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tipo de Fonte</label>
                    <Select
                      value={formData.source_type}
                      onValueChange={(value) => handleInputChange('source_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upload">
                          <div className="flex items-center space-x-2">
                            <Upload className="w-4 h-4" />
                            <span>Upload Manual</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="gdrive">
                          <div className="flex items-center space-x-2">
                            <Database className="w-4 h-4" />
                            <span>Google Drive</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="sharepoint">
                          <div className="flex items-center space-x-2">
                            <Link className="w-4 h-4" />
                            <span>SharePoint</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="s3">
                          <div className="flex items-center space-x-2">
                            <Cloud className="w-4 h-4" />
                            <span>Amazon S3</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="api">
                          <div className="flex items-center space-x-2">
                            <Code className="w-4 h-4" />
                            <span>API Externa</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Visibilidade</label>
                    <Select
                      value={formData.visibility}
                      onValueChange={(value) => handleInputChange('visibility', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">
                          <div className="flex items-center space-x-2">
                            <EyeOff className="w-4 h-4" />
                            <span>Privada</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="organization">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>Organização</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="public">
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4" />
                            <span>Pública</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Idioma Principal</label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => handleInputChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português (PT)</SelectItem>
                      <SelectItem value="en">English (EN)</SelectItem>
                      <SelectItem value="es">Español (ES)</SelectItem>
                      <SelectItem value="fr">Français (FR)</SelectItem>
                      <SelectItem value="de">Deutsch (DE)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Estilo */}
          <TabsContent value="style" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>Perfil de Estilo Textual</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-4 block">Modo de Definição</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.style_profile.mode === 'preset'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => handleStyleProfileChange('mode', 'preset')}
                    >
                      <div className="flex items-center space-x-3">
                        <Settings className="w-6 h-6 text-blue-500" />
                        <div>
                          <h4 className="font-medium">Estilo Predefinido</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Escolha um estilo padrão
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.style_profile.mode === 'inferred'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => handleStyleProfileChange('mode', 'inferred')}
                    >
                      <div className="flex items-center space-x-3">
                        <Sparkles className="w-6 h-6 text-purple-500" />
                        <div>
                          <h4 className="font-medium">Inferir de Base Existente</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Analisar estilo automaticamente
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {formData.style_profile.mode === 'preset' && (
                  <div>
                    <label className="text-sm font-medium mb-4 block">Estilo Predefinido</label>
                    {renderStylePresetOptions()}
                  </div>
                )}

                {formData.style_profile.mode === 'inferred' && (
                  <div>
                    <label className="text-sm font-medium mb-4 block">Base para Inferência</label>
                    {renderInferenceOptions()}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Descrição Personalizada do Estilo</label>
                  <Textarea
                    value={formData.style_profile.description || ''}
                    onChange={(e) => handleStyleProfileChange('description', e.target.value)}
                    placeholder="Descreva ou ajuste o estilo textual..."
                    rows={3}
                  />
                </div>

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowStylePreview(!showStylePreview)}
                    className="w-full"
                  >
                    {showStylePreview ? 'Ocultar' : 'Visualizar'} Preview do Estilo
                  </Button>
                  
                  {showStylePreview && (
                    <div className="mt-4 p-4 border rounded-lg">
                      <h4 className="font-medium mb-3">Preview do Estilo</h4>
                      {renderStylePreview()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Agentes */}
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>Configuração de Agentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.agents.map(renderAgentConfig)}
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    const newAgent: AgentConfig = {
                      id: `agent-${Date.now()}`,
                      name: 'Novo Agente',
                      model: 'gpt-4',
                      temperature: 0.7,
                      max_tokens: 2000,
                      use_style_profile: true,
                      is_active: true
                    }
                    setFormData(prev => ({
                      ...prev,
                      agents: [...prev.agents, newAgent]
                    }))
                  }}
                >
                  Adicionar Agente
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Revisão */}
          <TabsContent value="review" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Revisão Final</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Informações Básicas</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Nome:</strong> {formData.name || 'Não definido'}</div>
                      <div><strong>Descrição:</strong> {formData.description || 'Não definida'}</div>
                      <div><strong>Tipo de Fonte:</strong> {formData.source_type}</div>
                      <div><strong>Visibilidade:</strong> {formData.visibility}</div>
                      <div><strong>Idioma:</strong> {formData.language.toUpperCase()}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Perfil de Estilo</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Modo:</strong> {formData.style_profile.mode}</div>
                      {formData.style_profile.preset && (
                        <div><strong>Estilo:</strong> {formData.style_profile.preset}</div>
                      )}
                      {formData.style_profile.inferred_from_base_id && (
                        <div><strong>Base Inferida:</strong> {formData.style_profile.inferred_from_base_id}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Agentes Configurados</h4>
                  <div className="space-y-2">
                    {formData.agents.map(agent => (
                      <div key={agent.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">{agent.name}</span>
                        <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                          {agent.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {formData.style_profile.mode === 'inferred' && formData.style_profile.inferred_from_base_id && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Importante:</strong> A base selecionada para inferência deve ter pelo menos 5 documentos 
                      com boa estrutura textual para garantir uma análise precisa do estilo.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline">
            Salvar Rascunho
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando...
              </>
            ) : (
              'Criar Base de Conhecimento'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 