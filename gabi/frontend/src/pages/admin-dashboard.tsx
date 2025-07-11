import React, { useState, useEffect } from 'react'
import { NextPage } from 'next'
import { Head } from '@/components/Head'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  DatePickerWithRange 
} from '@/components/ui/date-range-picker'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { 
  Checkbox 
} from '@/components/ui/checkbox'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw, 
  FileText, 
  Database, 
  Users, 
  Palette, 
  Globe,
  Calendar,
  MoreHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react'
import { LanguageSelector } from '@/components/LanguageSelector'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface Document {
  id: string
  name: string
  base_name: string
  style_name: string
  language: string
  vectorization_status: 'pending' | 'processing' | 'completed' | 'failed'
  uploaded_at: string
  vectorized_at?: string
  file_size: number
  file_type: string
  organization_id: string
}

interface KnowledgeBase {
  id: string
  name: string
  description: string
  document_count: number
  is_active: boolean
  created_at: string
}

interface WritingStyle {
  id: string
  name: string
  description: string
  base_name: string
  usage_count: number
  is_active: boolean
}

interface DashboardStats {
  total_documents: number
  total_bases: number
  total_users: number
  total_styles: number
  documents_this_month: number
  vectorization_success_rate: number
  avg_processing_time: number
  languages_distribution: { [key: string]: number }
}

interface FilterState {
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  selectedBases: string[]
  selectedStyles: string[]
  selectedLanguages: string[]
  searchTerm: string
  statusFilter: string
}

// =============================================================================
// DADOS MOCK
// =============================================================================

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Manual de Procedimentos Jurídicos.pdf',
    base_name: 'Base Jurídica',
    style_name: 'Jurídico Moderno',
    language: 'pt-BR',
    vectorization_status: 'completed',
    uploaded_at: '2024-01-15T10:30:00Z',
    vectorized_at: '2024-01-15T10:35:00Z',
    file_size: 2048576,
    file_type: 'pdf',
    organization_id: 'org-1'
  },
  {
    id: '2',
    name: 'Relatório Técnico Anual.docx',
    base_name: 'Base Técnica',
    style_name: 'Técnico Formal',
    language: 'en',
    vectorization_status: 'processing',
    uploaded_at: '2024-01-15T11:00:00Z',
    file_size: 1048576,
    file_type: 'docx',
    organization_id: 'org-1'
  },
  {
    id: '3',
    name: 'Política de Segurança Interna.pdf',
    base_name: 'Base Interna',
    style_name: 'Corporativo',
    language: 'pt-BR',
    vectorization_status: 'completed',
    uploaded_at: '2024-01-14T09:15:00Z',
    vectorized_at: '2024-01-14T09:20:00Z',
    file_size: 1536000,
    file_type: 'pdf',
    organization_id: 'org-1'
  },
  {
    id: '4',
    name: 'Contrato Cliente XPTO.pdf',
    base_name: 'Base Cliente XPTO',
    style_name: 'Jurídico Tradicional',
    language: 'pt-BR',
    vectorization_status: 'failed',
    uploaded_at: '2024-01-13T14:20:00Z',
    file_size: 3072000,
    file_type: 'pdf',
    organization_id: 'org-1'
  },
  {
    id: '5',
    name: 'Technical Documentation.pdf',
    base_name: 'Base Técnica',
    style_name: 'Técnico Informal',
    language: 'en',
    vectorization_status: 'completed',
    uploaded_at: '2024-01-12T16:45:00Z',
    vectorized_at: '2024-01-12T16:50:00Z',
    file_size: 5120000,
    file_type: 'pdf',
    organization_id: 'org-1'
  }
]

const mockBases: KnowledgeBase[] = [
  { id: '1', name: 'Base Jurídica', description: 'Documentos jurídicos e contratos', document_count: 45, is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'Base Técnica', description: 'Documentação técnica e manuais', document_count: 38, is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: '3', name: 'Base Interna', description: 'Políticas e procedimentos internos', document_count: 23, is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: '4', name: 'Base Cliente XPTO', description: 'Documentos específicos do cliente XPTO', document_count: 12, is_active: true, created_at: '2024-01-01T00:00:00Z' }
]

const mockStyles: WritingStyle[] = [
  { id: '1', name: 'Jurídico Moderno', description: 'Estilo jurídico contemporâneo', base_name: 'Base Jurídica', usage_count: 25, is_active: true },
  { id: '2', name: 'Jurídico Tradicional', description: 'Estilo jurídico clássico', base_name: 'Base Jurídica', usage_count: 18, is_active: true },
  { id: '3', name: 'Técnico Formal', description: 'Documentação técnica formal', base_name: 'Base Técnica', usage_count: 22, is_active: true },
  { id: '4', name: 'Técnico Informal', description: 'Documentação técnica informal', base_name: 'Base Técnica', usage_count: 15, is_active: true },
  { id: '5', name: 'Corporativo', description: 'Estilo corporativo padrão', base_name: 'Base Interna', usage_count: 20, is_active: true }
]

const mockStats: DashboardStats = {
  total_documents: 156,
  total_bases: 4,
  total_users: 23,
  total_styles: 5,
  documents_this_month: 45,
  vectorization_success_rate: 94.2,
  avg_processing_time: 3.5,
  languages_distribution: {
    'pt-BR': 89,
    'en': 45,
    'es': 12,
    'fr': 8,
    'de': 2
  }
}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

const AdminDashboardPage: NextPage = () => {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(mockDocuments)
  const [bases] = useState<KnowledgeBase[]>(mockBases)
  const [styles] = useState<WritingStyle[]>(mockStyles)
  const [stats] = useState<DashboardStats>(mockStats)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<string>('uploaded_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      from: undefined,
      to: undefined
    },
    selectedBases: [],
    selectedStyles: [],
    selectedLanguages: [],
    searchTerm: '',
    statusFilter: 'all'
  })

  const [showFilters, setShowFilters] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])

  // =============================================================================
  // EFEITOS
  // =============================================================================

  useEffect(() => {
    applyFilters()
  }, [filters, documents])

  // =============================================================================
  // FILTROS E BUSCA
  // =============================================================================

  const applyFilters = () => {
    let filtered = [...documents]

    // Filtro por data
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(doc => {
        const uploadDate = new Date(doc.uploaded_at)
        const from = filters.dateRange.from
        const to = filters.dateRange.to
        
        if (from && uploadDate < from) return false
        if (to && uploadDate > to) return false
        return true
      })
    }

    // Filtro por bases
    if (filters.selectedBases.length > 0) {
      filtered = filtered.filter(doc => 
        filters.selectedBases.includes(doc.base_name)
      )
    }

    // Filtro por estilos
    if (filters.selectedStyles.length > 0) {
      filtered = filtered.filter(doc => 
        filters.selectedStyles.includes(doc.style_name)
      )
    }

    // Filtro por idiomas
    if (filters.selectedLanguages.length > 0) {
      filtered = filtered.filter(doc => 
        filters.selectedLanguages.includes(doc.language)
      )
    }

    // Filtro por status
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(doc => 
        doc.vectorization_status === filters.statusFilter
      )
    }

    // Busca por texto
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchLower) ||
        doc.base_name.toLowerCase().includes(searchLower) ||
        doc.style_name.toLowerCase().includes(searchLower)
      )
    }

    // Ordenação
    filtered.sort((a, b) => {
      const aValue = a[sortColumn as keyof Document]
      const bValue = b[sortColumn as keyof Document]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return 0
    })

    setFilteredDocuments(filtered)
    setCurrentPage(1)
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const clearFilters = () => {
    setFilters({
      dateRange: { from: undefined, to: undefined },
      selectedBases: [],
      selectedStyles: [],
      selectedLanguages: [],
      searchTerm: '',
      statusFilter: 'all'
    })
  }

  // =============================================================================
  // AÇÕES
  // =============================================================================

  const handleReprocessDocument = (documentId: string) => {
    console.log('Reprocessar documento:', documentId)
    // Implementar reprocessamento
  }

  const handleViewDocument = (documentId: string) => {
    console.log('Visualizar documento:', documentId)
    // Implementar visualização
  }

  const handleExportDocuments = () => {
    const dataToExport = selectedDocuments.length > 0 
      ? filteredDocuments.filter(doc => selectedDocuments.includes(doc.id))
      : filteredDocuments

    const csvContent = [
      ['Nome', 'Base', 'Estilo', 'Idioma', 'Status', 'Data Upload', 'Data Vetorização'],
      ...dataToExport.map(doc => [
        doc.name,
        doc.base_name,
        doc.style_name,
        doc.language,
        doc.vectorization_status,
        format(new Date(doc.uploaded_at), 'dd/MM/yyyy HH:mm'),
        doc.vectorized_at ? format(new Date(doc.vectorized_at), 'dd/MM/yyyy HH:mm') : ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `documentos_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const handleSelectAll = () => {
    if (selectedDocuments.length === paginatedDocuments.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(paginatedDocuments.map(doc => doc.id))
    }
  }

  const handleSelectDocument = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    )
  }

  // =============================================================================
  // PAGINAÇÃO
  // =============================================================================

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: 'default', icon: CheckCircle, text: 'Concluído' },
      processing: { variant: 'secondary', icon: RefreshCw, text: 'Processando' },
      pending: { variant: 'outline', icon: Clock, text: 'Pendente' },
      failed: { variant: 'destructive', icon: AlertTriangle, text: 'Falhou' }
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon

    return (
      <Badge variant={config.variant as any}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // =============================================================================
  // RENDERIZAÇÃO
  // =============================================================================

  return (
    <>
      <Head title="Painel Administrativo - GABI" />
      
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Painel Administrativo</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Visão geral e gestão completa da plataforma GABI
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <LanguageSelector variant="badge" />
              <Button onClick={handleExportDocuments} disabled={filteredDocuments.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documentos Vetorizados</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_documents}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.documents_this_month} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bases Ativas</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_bases}</div>
                <p className="text-xs text-muted-foreground">
                  Todas operacionais
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Cadastrados</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_users}</div>
                <p className="text-xs text-muted-foreground">
                  Aprovados e ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estilos Únicos</CardTitle>
                <Palette className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_styles}</div>
                <p className="text-xs text-muted-foreground">
                  Configurados e ativos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Métricas Secundárias */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Taxa de Sucesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.vectorization_success_rate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Vetorização bem-sucedida
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tempo Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.avg_processing_time}s
                </div>
                <p className="text-xs text-muted-foreground">
                  Por documento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Distribuição por Idioma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.languages_distribution).map(([lang, count]) => (
                    <div key={lang} className="flex items-center justify-between">
                      <span className="text-sm">{lang}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Filtros e Busca</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Busca Rápida */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome, base ou estilo..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={filters.statusFilter}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, statusFilter: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtros Avançados */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                  {/* Filtro por Data */}
                  <div>
                    <Label className="text-sm font-medium">Período</Label>
                    <DatePickerWithRange
                      date={filters.dateRange}
                      onDateChange={(range) => setFilters(prev => ({ 
                        ...prev, 
                        dateRange: range 
                      }))}
                    />
                  </div>

                  {/* Filtro por Bases */}
                  <div>
                    <Label className="text-sm font-medium">Bases de Conhecimento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          {filters.selectedBases.length > 0 
                            ? `${filters.selectedBases.length} selecionadas`
                            : 'Selecionar bases'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56">
                        <div className="space-y-2">
                          {bases.map((base) => (
                            <div key={base.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={base.id}
                                checked={filters.selectedBases.includes(base.name)}
                                onCheckedChange={(checked) => {
                                  setFilters(prev => ({
                                    ...prev,
                                    selectedBases: checked
                                      ? [...prev.selectedBases, base.name]
                                      : prev.selectedBases.filter(b => b !== base.name)
                                  }))
                                }}
                              />
                              <Label htmlFor={base.id} className="text-sm">
                                {base.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Filtro por Estilos */}
                  <div>
                    <Label className="text-sm font-medium">Estilos de Escrita</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          {filters.selectedStyles.length > 0 
                            ? `${filters.selectedStyles.length} selecionados`
                            : 'Selecionar estilos'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56">
                        <div className="space-y-2">
                          {styles.map((style) => (
                            <div key={style.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={style.id}
                                checked={filters.selectedStyles.includes(style.name)}
                                onCheckedChange={(checked) => {
                                  setFilters(prev => ({
                                    ...prev,
                                    selectedStyles: checked
                                      ? [...prev.selectedStyles, style.name]
                                      : prev.selectedStyles.filter(s => s !== style.name)
                                  }))
                                }}
                              />
                              <Label htmlFor={style.id} className="text-sm">
                                {style.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Filtro por Idiomas */}
                  <div>
                    <Label className="text-sm font-medium">Idiomas</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          {filters.selectedLanguages.length > 0 
                            ? `${filters.selectedLanguages.length} selecionados`
                            : 'Selecionar idiomas'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56">
                        <div className="space-y-2">
                          {Object.keys(stats.languages_distribution).map((lang) => (
                            <div key={lang} className="flex items-center space-x-2">
                              <Checkbox
                                id={lang}
                                checked={filters.selectedLanguages.includes(lang)}
                                onCheckedChange={(checked) => {
                                  setFilters(prev => ({
                                    ...prev,
                                    selectedLanguages: checked
                                      ? [...prev.selectedLanguages, lang]
                                      : prev.selectedLanguages.filter(l => l !== lang)
                                  }))
                                }}
                              />
                              <Label htmlFor={lang} className="text-sm">
                                {lang} ({stats.languages_distribution[lang]})
                              </Label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabela de Documentos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Documentos ({filteredDocuments.length})
                  {selectedDocuments.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedDocuments.length} selecionados
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedDocuments.length === paginatedDocuments.length ? 'Desmarcar' : 'Marcar'} Todos
                  </Button>
                  {selectedDocuments.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportDocuments}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Selecionados
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedDocuments.length === paginatedDocuments.length && paginatedDocuments.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1"
                      >
                        Nome do Documento
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('base_name')}
                        className="flex items-center space-x-1"
                      >
                        Base Vinculada
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('style_name')}
                        className="flex items-center space-x-1"
                      >
                        Estilo Aplicado
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('language')}
                        className="flex items-center space-x-1"
                      >
                        Idioma
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('vectorization_status')}
                        className="flex items-center space-x-1"
                      >
                        Status
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('uploaded_at')}
                        className="flex items-center space-x-1"
                      >
                        Última Atualização
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDocuments.includes(document.id)}
                          onCheckedChange={() => handleSelectDocument(document.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{document.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{document.base_name}</Badge>
                      </TableCell>
                      <TableCell>{document.style_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Globe className="w-4 h-4" />
                          <span>{document.language}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(document.vectorization_status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(document.uploaded_at), 'dd/MM/yyyy', { locale: ptBR })}</div>
                          <div className="text-gray-500">
                            {format(new Date(document.uploaded_at), 'HH:mm')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(document.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReprocessDocument(document.id)}
                            disabled={document.vectorization_status === 'processing'}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredDocuments.length)} de {filteredDocuments.length} documentos
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  )
}

export default AdminDashboardPage 