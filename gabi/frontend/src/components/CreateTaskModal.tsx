import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { 
  Checkbox 
} from '@/components/ui/checkbox'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Badge 
} from '@/components/ui/badge'
import { 
  Plus, 
  Bot, 
  Database, 
  Palette, 
  Zap, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Lightbulb,
  FileText,
  Search,
  Copy,
  BookOpen
} from 'lucide-react'
import { useTasksContext } from '@/hooks/useTasks'
import { CreateTaskRequest, TaskTemplate } from '@/services/taskService'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated?: (task: any) => void
}

interface KnowledgeBase {
  id: string
  name: string
  description: string
  document_count: number
}

interface Agent {
  id: string
  name: string
  description: string
  capabilities: string[]
  model: string
}

interface WritingStyle {
  id: string
  name: string
  description: string
  category: string
}

// =============================================================================
// DADOS MOCK
// =============================================================================

const mockBases: KnowledgeBase[] = [
  { id: '1', name: 'Base Jurídica', description: 'Documentos jurídicos e contratos', document_count: 45 },
  { id: '2', name: 'Base Técnica', description: 'Documentação técnica e manuais', document_count: 38 },
  { id: '3', name: 'Base Interna', description: 'Políticas e procedimentos internos', document_count: 23 },
  { id: '4', name: 'Base Cliente XPTO', description: 'Documentos específicos do cliente XPTO', document_count: 12 }
]

const mockAgents: Agent[] = [
  { 
    id: '1', 
    name: 'Analista Jurídico', 
    description: 'Especialista em análise de documentos jurídicos',
    capabilities: ['Análise contratual', 'Revisão legal', 'Extração de cláusulas'],
    model: 'gpt-4'
  },
  { 
    id: '2', 
    name: 'Técnico Especialista', 
    description: 'Especialista em documentação técnica',
    capabilities: ['Análise técnica', 'Resumo de manuais', 'Identificação de padrões'],
    model: 'gpt-4'
  },
  { 
    id: '3', 
    name: 'Assistente Geral', 
    description: 'Assistente para tarefas gerais',
    capabilities: ['Resumo', 'Análise', 'Comparação', 'Extração'],
    model: 'gpt-3.5-turbo'
  }
]

const mockStyles: WritingStyle[] = [
  { id: '1', name: 'Jurídico Moderno', description: 'Estilo jurídico contemporâneo', category: 'jurídico' },
  { id: '2', name: 'Jurídico Tradicional', description: 'Estilo jurídico clássico', category: 'jurídico' },
  { id: '3', name: 'Técnico Formal', description: 'Documentação técnica formal', category: 'técnico' },
  { id: '4', name: 'Técnico Informal', description: 'Documentação técnica informal', category: 'técnico' },
  { id: '5', name: 'Corporativo', description: 'Estilo corporativo padrão', category: 'corporativo' }
]

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function CreateTaskModal({ isOpen, onClose, onTaskCreated }: CreateTaskModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'template'>('manual')
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [templateVariables, setTemplateVariables] = useState<{ [key: string]: string }>({})
  
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    prompt: '',
    description: '',
    agent_id: '',
    knowledge_base_ids: [],
    style_id: '',
    priority: 'medium'
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)

  const { createTask, createTaskFromTemplate, templates } = useTasksContext()

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleInputChange = (field: keyof CreateTaskRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBaseSelection = (baseId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      knowledge_base_ids: checked
        ? [...prev.knowledge_base_ids, baseId]
        : prev.knowledge_base_ids.filter(id => id !== baseId)
    }))
  }

  const handleTemplateSelection = (template: TaskTemplate) => {
    setSelectedTemplate(template)
    setActiveTab('template')
    
    // Preencher dados do template
    setFormData(prev => ({
      ...prev,
      title: template.name,
      prompt: template.prompt_template,
      description: template.description,
      agent_id: template.suggested_agents[0] || '',
      knowledge_base_ids: template.suggested_bases,
      style_id: template.suggested_styles[0] || ''
    }))
  }

  const handleTemplateVariableChange = (variable: string, value: string) => {
    setTemplateVariables(prev => ({ ...prev, [variable]: value }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      if (activeTab === 'template' && selectedTemplate) {
        // Criar tarefa do template
        const task = await createTaskFromTemplate(selectedTemplate.id, templateVariables)
        onTaskCreated?.(task)
      } else {
        // Criar tarefa manual
        const task = await createTask(formData)
        onTaskCreated?.(task)
      }

      handleClose()
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      prompt: '',
      description: '',
      agent_id: '',
      knowledge_base_ids: [],
      style_id: '',
      priority: 'medium'
    })
    setSelectedTemplate(null)
    setTemplateVariables({})
    setActiveTab('manual')
    setShowAdvanced(false)
    onClose()
  }

  const handlePromptSuggestion = (suggestion: string) => {
    setFormData(prev => ({ ...prev, prompt: suggestion }))
  }

  // =============================================================================
  // SUGESTÕES DE PROMPTS
  // =============================================================================

  const promptSuggestions = [
    {
      category: 'Análise',
      suggestions: [
        'Analise os documentos da base jurídica e identifique os principais pontos de atenção',
        'Revise os contratos vencendo este mês e destaque as cláusulas críticas',
        'Compare dois documentos técnicos e identifique inconsistências'
      ]
    },
    {
      category: 'Resumo',
      suggestions: [
        'Crie um resumo executivo dos 5 documentos mais acessados da base técnica',
        'Resuma os principais pontos dos documentos da semana com estilo jurídico',
        'Faça um resumo dos procedimentos internos mais importantes'
      ]
    },
    {
      category: 'Extração',
      suggestions: [
        'Extraia todas as datas importantes dos documentos da base jurídica',
        'Identifique os valores monetários mencionados nos contratos',
        'Liste todas as responsabilidades das partes nos documentos analisados'
      ]
    }
  ]

  // =============================================================================
  // VALIDAÇÃO
  // =============================================================================

  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.prompt.trim() !== '' &&
      formData.agent_id !== '' &&
      formData.knowledge_base_ids.length > 0
    )
  }

  // =============================================================================
  // RENDERIZAÇÃO
  // =============================================================================

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>Criar Nova Tarefa com GABI</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Criar Manualmente
            </button>
            <button
              onClick={() => setActiveTab('template')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'template'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Usar Template
            </button>
          </div>

          {/* Conteúdo Manual */}
          {activeTab === 'manual' && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título da Tarefa</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Resumo dos documentos da semana"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Prompt */}
              <div>
                <Label htmlFor="prompt">Comando para GABI</Label>
                <Textarea
                  id="prompt"
                  placeholder="Descreva o que você quer que a GABI faça... Ex: 'Resuma todos os documentos da base jurídica desta semana'"
                  value={formData.prompt}
                  onChange={(e) => handleInputChange('prompt', e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                
                {/* Sugestões de Prompts */}
                <div className="mt-3">
                  <Label className="text-sm text-gray-600 dark:text-gray-400">
                    Sugestões de comandos:
                  </Label>
                  <div className="mt-2 space-y-2">
                    {promptSuggestions.map((category, index) => (
                      <div key={index}>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {category.category}
                        </h4>
                        <div className="space-y-1">
                          {category.suggestions.map((suggestion, sIndex) => (
                            <button
                              key={sIndex}
                              onClick={() => handlePromptSuggestion(suggestion)}
                              className="block w-full text-left text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Adicione detalhes adicionais sobre a tarefa..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                />
              </div>

              {/* Configurações */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Agente */}
                <div>
                  <Label htmlFor="agent">Agente IA</Label>
                  <Select
                    value={formData.agent_id}
                    onValueChange={(value) => handleInputChange('agent_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockAgents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          <div className="flex items-center space-x-2">
                            <Bot className="w-4 h-4" />
                            <span>{agent.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bases de Conhecimento */}
                <div>
                  <Label>Bases de Conhecimento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {formData.knowledge_base_ids.length > 0 
                          ? `${formData.knowledge_base_ids.length} selecionadas`
                          : 'Selecionar bases'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        {mockBases.map((base) => (
                          <div key={base.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={base.id}
                              checked={formData.knowledge_base_ids.includes(base.id)}
                              onCheckedChange={(checked) => 
                                handleBaseSelection(base.id, checked as boolean)
                              }
                            />
                            <Label htmlFor={base.id} className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{base.name}</span>
                                <Badge variant="outline">{base.document_count}</Badge>
                              </div>
                              <p className="text-xs text-gray-500">{base.description}</p>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Estilo de Escrita */}
                <div>
                  <Label htmlFor="style">Estilo de Resposta</Label>
                  <Select
                    value={formData.style_id}
                    onValueChange={(value) => handleInputChange('style_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Estilo padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockStyles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          <div className="flex items-center space-x-2">
                            <Palette className="w-4 h-4" />
                            <span>{style.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Conteúdo Template */}
          {activeTab === 'template' && (
            <div className="space-y-6">
              {selectedTemplate ? (
                <div>
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Template Selecionado</h3>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4" />
                          <span>{selectedTemplate.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {selectedTemplate.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Bot className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">Agente: {mockAgents.find(a => a.id === formData.agent_id)?.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Database className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">Bases: {formData.knowledge_base_ids.length}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Palette className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">Estilo: {mockStyles.find(s => s.id === formData.style_id)?.name}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Variáveis do Template */}
                  {selectedTemplate.prompt_template.includes('{{') && (
                    <div>
                      <Label className="text-sm font-medium">Configurar Variáveis</Label>
                      <div className="mt-2 space-y-3">
                        {Object.keys(templateVariables).map((variable) => (
                          <div key={variable}>
                            <Label htmlFor={variable} className="text-sm">
                              {variable.charAt(0).toUpperCase() + variable.slice(1)}
                            </Label>
                            <Input
                              id={variable}
                              value={templateVariables[variable]}
                              onChange={(e) => handleTemplateVariableChange(variable, e.target.value)}
                              placeholder={`Digite o valor para ${variable}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-title">Título da Tarefa</Label>
                      <Input
                        id="template-title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-priority">Prioridade</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => handleInputChange('priority', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card 
                      key={template.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleTemplateSelection(template)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4" />
                          <span>{template.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {template.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{template.category}</Badge>
                          <span className="text-xs text-gray-500">
                            {template.usage_count} usos
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid() || loading}
            className="flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Criando...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Criar Tarefa</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 