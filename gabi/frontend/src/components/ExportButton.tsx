import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Checkbox 
} from '@/components/ui/checkbox'
import { 
  Label 
} from '@/components/ui/label'
import { 
  Input 
} from '@/components/ui/input'
import { 
  Textarea 
} from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Download, 
  FileText, 
  FileCode, 
  FileJson,
  Settings,
  Calendar,
  User,
  Database,
  Bot,
  Palette,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { exportService, ExportContent } from '@/services/exportService'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface ExportButtonProps {
  content: ExportContent
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  showLabel?: boolean
  onExportComplete?: (result: any) => void
}

interface ExportOptions {
  include_header: boolean
  include_footer: boolean
  include_toc: boolean
  include_metadata: boolean
  custom_title: string
  custom_author: string
  language: string
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExportButton({ 
  content, 
  variant = 'outline', 
  size = 'default',
  className = '',
  showLabel = true,
  onExportComplete 
}: ExportButtonProps) {
  const [showOptions, setShowOptions] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'markdown' | 'json'>('pdf')
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<ExportOptions>({
    include_header: true,
    include_footer: true,
    include_toc: true,
    include_metadata: true,
    custom_title: content.title,
    custom_author: content.user_name,
    language: content.metadata?.language || 'pt-BR'
  })

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleExport = async (format: 'pdf' | 'markdown' | 'json') => {
    try {
      setLoading(true)
      setSelectedFormat(format)

      let result
      switch (format) {
        case 'pdf':
          result = await exportService.exportToPDF(content, options)
          break
        case 'markdown':
          result = await exportService.exportToMarkdown(content, options)
          break
        case 'json':
          result = await exportService.exportToJSON(content, options)
          break
      }

      // Download automático
      await exportService.downloadFile(result.download_url, result.file_name)
      
      onExportComplete?.(result)
      setShowOptions(false)
    } catch (error) {
      console.error('Erro na exportação:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickExport = async (format: 'pdf' | 'markdown' | 'json') => {
    try {
      setLoading(true)

      let result
      switch (format) {
        case 'pdf':
          result = await exportService.exportToPDF(content)
          break
        case 'markdown':
          result = await exportService.exportToMarkdown(content)
          break
        case 'json':
          result = await exportService.exportToJSON(content)
          break
      }

      await exportService.downloadFile(result.download_url, result.file_name)
      onExportComplete?.(result)
    } catch (error) {
      console.error('Erro na exportação rápida:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const getFormatIcon = (format: string) => {
    const icons = {
      pdf: <FileText className="w-4 h-4" />,
      markdown: <FileCode className="w-4 h-4" />,
      json: <FileJson className="w-4 h-4" />
    }
    return icons[format as keyof typeof icons] || <FileText className="w-4 h-4" />
  }

  const getFormatName = (format: string) => {
    const names = {
      pdf: 'PDF',
      markdown: 'Markdown',
      json: 'JSON'
    }
    return names[format as keyof typeof names] || 'PDF'
  }

  const getFormatDescription = (format: string) => {
    const descriptions = {
      pdf: 'Documento formatado para impressão e distribuição',
      markdown: 'Texto estruturado para edição técnica',
      json: 'Dados estruturados para integração'
    }
    return descriptions[format as keyof typeof descriptions] || ''
  }

  // =============================================================================
  // RENDERIZAÇÃO
  // =============================================================================

  return (
    <>
      {/* Botão Principal */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size} 
            className={className}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {showLabel && 'Exportar'}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Escolha o formato</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => handleQuickExport('pdf')}>
            <FileText className="w-4 h-4 mr-2" />
            <div>
              <div className="font-medium">PDF</div>
              <div className="text-xs text-gray-500">Documento formatado</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleQuickExport('markdown')}>
            <FileCode className="w-4 h-4 mr-2" />
            <div>
              <div className="font-medium">Markdown</div>
              <div className="text-xs text-gray-500">Texto estruturado</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleQuickExport('json')}>
            <FileJson className="w-4 h-4 mr-2" />
            <div>
              <div className="font-medium">JSON</div>
              <div className="text-xs text-gray-500">Dados estruturados</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowOptions(true)}>
            <Settings className="w-4 h-4 mr-2" />
            <div>
              <div className="font-medium">Opções Avançadas</div>
              <div className="text-xs text-gray-500">Configurar exportação</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de Opções Avançadas */}
      <Dialog open={showOptions} onOpenChange={setShowOptions}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Configurar Exportação</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações do Conteúdo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conteúdo a Exportar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    {exportService.getContentTypeIcon(content.type)}
                  </div>
                  <div>
                    <h3 className="font-medium">{content.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {exportService.getContentTypeName(content.type)} • {format(new Date(content.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-gray-500" />
                    <span>{content.agent_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-gray-500" />
                    <span>{content.knowledge_base_names.length} bases</span>
                  </div>
                  {content.style_name && (
                    <div className="flex items-center space-x-2">
                      <Palette className="w-4 h-4 text-gray-500" />
                      <span>{content.style_name}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{content.user_name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Formato */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formato de Exportação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['pdf', 'markdown', 'json'] as const).map((format) => (
                    <Card 
                      key={format}
                      className={`cursor-pointer transition-colors ${
                        selectedFormat === format 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedFormat(format)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          {getFormatIcon(format)}
                          <span className="font-medium">{getFormatName(format)}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getFormatDescription(format)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Opções de Configuração */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Opções de Configuração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="custom_title">Título Personalizado</Label>
                    <Input
                      id="custom_title"
                      value={options.custom_title}
                      onChange={(e) => handleOptionChange('custom_title', e.target.value)}
                      placeholder="Título do documento"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom_author">Autor</Label>
                    <Input
                      id="custom_author"
                      value={options.custom_author}
                      onChange={(e) => handleOptionChange('custom_author', e.target.value)}
                      placeholder="Nome do autor"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={options.language}
                    onValueChange={(value) => handleOptionChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                      <SelectItem value="fr-FR">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Elementos Incluídos</Label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include_header"
                        checked={options.include_header}
                        onCheckedChange={(checked) => 
                          handleOptionChange('include_header', checked)
                        }
                      />
                      <Label htmlFor="include_header" className="text-sm">
                        Cabeçalho institucional (logomarca, nome da base)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include_footer"
                        checked={options.include_footer}
                        onCheckedChange={(checked) => 
                          handleOptionChange('include_footer', checked)
                        }
                      />
                      <Label htmlFor="include_footer" className="text-sm">
                        Rodapé (data, usuário, número de protocolo)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include_toc"
                        checked={options.include_toc}
                        onCheckedChange={(checked) => 
                          handleOptionChange('include_toc', checked)
                        }
                      />
                      <Label htmlFor="include_toc" className="text-sm">
                        Sumário (apenas para PDF)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include_metadata"
                        checked={options.include_metadata}
                        onCheckedChange={(checked) => 
                          handleOptionChange('include_metadata', checked)
                        }
                      />
                      <Label htmlFor="include_metadata" className="text-sm">
                        Metadados (agente, bases, estilo, tokens)
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview das Opções */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo da Exportação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Formato:</span>
                    <span className="font-medium">{getFormatName(selectedFormat)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Arquivo:</span>
                    <span className="font-medium">{options.custom_title}.{selectedFormat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Autor:</span>
                    <span className="font-medium">{options.custom_author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Idioma:</span>
                    <span className="font-medium">{options.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Elementos:</span>
                    <span className="font-medium">
                      {[
                        options.include_header && 'Cabeçalho',
                        options.include_footer && 'Rodapé',
                        options.include_toc && 'Sumário',
                        options.include_metadata && 'Metadados'
                      ].filter(Boolean).join(', ')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOptions(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => handleExport(selectedFormat)}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Exportar {getFormatName(selectedFormat)}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 