import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import { Document, DocumentIndexRequest } from '../types/oauth'

// =============================================================================
// SERVIÇO N8N - WORKFLOWS AUTOMATIZADOS
// =============================================================================

export interface N8NWorkflow {
  id: string
  name: string
  active: boolean
  nodes: N8NNode[]
  connections: Record<string, any>
  settings: Record<string, any>
  versionId: string
}

export interface N8NNode {
  id: string
  name: string
  type: string
  typeVersion: number
  position: [number, number]
  parameters: Record<string, any>
}

export interface N8NExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed' | 'waiting'
  data: any
  startedAt: Date
  finishedAt?: Date
  error?: string
}

export interface DocumentProcessingJob {
  id: string
  documentId: string
  userId: string
  source: 'google' | 'sharepoint' | 'manual'
  workflowId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: 'low' | 'normal' | 'high'
  metadata: {
    originalName: string
    fileSize: number
    mimeType: string
    extractionMethod: string
  }
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  error?: string
}

export class N8NService {
  private n8nClient = axios.create({
    baseURL: process.env.N8N_BASE_URL || 'http://localhost:5678',
    headers: {
      'X-N8N-API-KEY': process.env.N8N_API_KEY || '',
      'Content-Type': 'application/json'
    }
  })

  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // =============================================================================
  // WORKFLOWS DE DOCUMENTOS
  // =============================================================================

  async createDocumentProcessingWorkflow(): Promise<N8NWorkflow> {
    try {
      const workflow = {
        name: 'Document Processing - Gabi',
        active: true,
        nodes: [
          // Trigger node - Webhook
          {
            id: 'trigger',
            name: 'Document Processing Trigger',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [0, 0],
            parameters: {
              httpMethod: 'POST',
              path: 'document-processing',
              responseMode: 'responseNode',
              options: {}
            }
          },
          // Google Drive node
          {
            id: 'google-drive',
            name: 'Google Drive - Get File',
            type: 'n8n-nodes-base.googleDrive',
            typeVersion: 2,
            position: [300, 0],
            parameters: {
              operation: 'get',
              fileId: '={{ $json.documentId }}',
              options: {}
            }
          },
          // SharePoint node
          {
            id: 'sharepoint',
            name: 'SharePoint - Get File',
            type: 'n8n-nodes-base.microsoftSharePoint',
            typeVersion: 1,
            position: [300, 100],
            parameters: {
              operation: 'get',
              fileId: '={{ $json.documentId }}',
              options: {}
            }
          },
          // Text extraction node
          {
            id: 'text-extraction',
            name: 'Text Extraction',
            type: 'n8n-nodes-base.code',
            typeVersion: 2,
            position: [600, 50],
            parameters: {
              jsCode: `
                const fileData = $input.all()[0].json;
                const mimeType = fileData.mimeType || '';
                
                let extractedText = '';
                
                if (mimeType.includes('google-apps.document')) {
                  // Google Docs - extract from content
                  extractedText = fileData.content || '';
                } else if (mimeType.includes('pdf')) {
                  // PDF - use PDF extraction
                  extractedText = $('PDF Text Extraction').extractText(fileData.content);
                } else if (mimeType.includes('wordprocessingml')) {
                  // Word document - extract text
                  extractedText = $('Word Text Extraction').extractText(fileData.content);
                }
                
                return {
                  text: extractedText,
                  wordCount: extractedText.split(/\s+/).filter(w => w.length > 0).length,
                  metadata: {
                    mimeType,
                    originalName: fileData.name,
                    fileSize: fileData.size,
                    extractionMethod: 'n8n-workflow'
                  }
                };
              `
            }
          },
          // Vector indexing node
          {
            id: 'vector-indexing',
            name: 'Vector Indexing - MCP',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 4,
            position: [900, 50],
            parameters: {
              method: 'POST',
              url: 'http://localhost:8080/upload',
              sendHeaders: true,
              headerParameters: {
                parameters: [
                  {
                    name: 'Content-Type',
                    value: 'application/json'
                  }
                ]
              },
              sendBody: true,
              bodyParameters: {
                parameters: [
                  {
                    name: 'text',
                    value: '={{ $json.text }}'
                  },
                  {
                    name: 'metadata',
                    value: '={{ $json.metadata }}'
                  }
                ]
              }
            }
          },
          // Database update node
          {
            id: 'db-update',
            name: 'Update Database',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 4,
            position: [1200, 50],
            parameters: {
              method: 'PUT',
              url: '{{ $env.GABI_GATEWAY_URL }}/api/v1/docs/{{ $json.documentId }}/status',
              sendHeaders: true,
              headerParameters: {
                parameters: [
                  {
                    name: 'Authorization',
                    value: 'Bearer {{ $env.GABI_API_KEY }}'
                  },
                  {
                    name: 'Content-Type',
                    value: 'application/json'
                  }
                ]
              },
              sendBody: true,
              bodyParameters: {
                parameters: [
                  {
                    name: 'status',
                    value: 'indexed'
                  },
                  {
                    name: 'indexId',
                    value: '={{ $json.indexId }}'
                  }
                ]
              }
            }
          },
          // Response node
          {
            id: 'response',
            name: 'Response',
            type: 'n8n-nodes-base.respondToWebhook',
            typeVersion: 1,
            position: [1500, 50],
            parameters: {
              respondWith: 'json',
              responseBody: '={{ { success: true, data: $json } }}'
            }
          }
        ],
        connections: {
          'Document Processing Trigger': {
            main: [
              [
                {
                  node: 'Google Drive - Get File',
                  type: 'main',
                  index: 0
                },
                {
                  node: 'SharePoint - Get File',
                  type: 'main',
                  index: 0
                }
              ]
            ]
          },
          'Google Drive - Get File': {
            main: [
              [
                {
                  node: 'Text Extraction',
                  type: 'main',
                  index: 0
                }
              ]
            ]
          },
          'SharePoint - Get File': {
            main: [
              [
                {
                  node: 'Text Extraction',
                  type: 'main',
                  index: 0
                }
              ]
            ]
          },
          'Text Extraction': {
            main: [
              [
                {
                  node: 'Vector Indexing - MCP',
                  type: 'main',
                  index: 0
                }
              ]
            ]
          },
          'Vector Indexing - MCP': {
            main: [
              [
                {
                  node: 'Update Database',
                  type: 'main',
                  index: 0
                }
              ]
            ]
          },
          'Update Database': {
            main: [
              [
                {
                  node: 'Response',
                  type: 'main',
                  index: 0
                }
              ]
            ]
          }
        },
        settings: {
          executionOrder: 'v1'
        }
      }

      const response = await this.n8nClient.post('/api/v1/workflows', workflow)
      return response.data
    } catch (error) {
      console.error('Erro ao criar workflow de processamento:', error)
      throw error
    }
  }

  // =============================================================================
  // EXECUÇÃO DE WORKFLOWS
  // =============================================================================

  async triggerDocumentProcessing(documentId: string, source: 'google' | 'sharepoint' | 'manual', metadata: any): Promise<N8NExecution> {
    try {
      const payload = {
        documentId,
        source,
        metadata,
        timestamp: new Date().toISOString()
      }

      const response = await this.n8nClient.post('/webhook/document-processing', payload)
      
      return {
        id: response.data.executionId,
        workflowId: response.data.workflowId,
        status: 'running',
        data: payload,
        startedAt: new Date()
      }
    } catch (error) {
      console.error('Erro ao disparar processamento:', error)
      throw error
    }
  }

  async getExecutionStatus(executionId: string): Promise<N8NExecution> {
    try {
      const response = await this.n8nClient.get(`/api/v1/executions/${executionId}`)
      return response.data
    } catch (error) {
      console.error('Erro ao obter status da execução:', error)
      throw error
    }
  }

  // =============================================================================
  // FILA DE PROCESSAMENTO
  // =============================================================================

  async addToProcessingQueue(documentId: string, userId: string, source: 'google' | 'sharepoint' | 'manual', priority: 'low' | 'normal' | 'high' = 'normal'): Promise<DocumentProcessingJob> {
    try {
      const job: DocumentProcessingJob = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        documentId,
        userId,
        source,
        workflowId: process.env.N8N_DOCUMENT_WORKFLOW_ID || '',
        status: 'pending',
        priority,
        metadata: {
          originalName: '',
          fileSize: 0,
          mimeType: '',
          extractionMethod: 'n8n-workflow'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const { data, error } = await this.supabase
        .from('document_processing_jobs')
        .insert({
          id: job.id,
          document_id: job.documentId,
          user_id: job.userId,
          source: job.source,
          workflow_id: job.workflowId,
          status: job.status,
          priority: job.priority,
          metadata: job.metadata,
          created_at: job.createdAt,
          updated_at: job.updatedAt
        })
        .select()
        .single()

      if (error) throw error

      return job
    } catch (error) {
      console.error('Erro ao adicionar à fila de processamento:', error)
      throw error
    }
  }

  async getProcessingQueue(userId?: string): Promise<DocumentProcessingJob[]> {
    try {
      let query = this.supabase
        .from('document_processing_jobs')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error

      return data.map(job => ({
        id: job.id,
        documentId: job.document_id,
        userId: job.user_id,
        source: job.source,
        workflowId: job.workflow_id,
        status: job.status,
        priority: job.priority,
        metadata: job.metadata,
        createdAt: new Date(job.created_at),
        updatedAt: new Date(job.updated_at),
        completedAt: job.completed_at ? new Date(job.completed_at) : undefined,
        error: job.error
      }))
    } catch (error) {
      console.error('Erro ao obter fila de processamento:', error)
      throw error
    }
  }

  async updateJobStatus(jobId: string, status: DocumentProcessingJob['status'], error?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date()
      }

      if (status === 'completed') {
        updateData.completed_at = new Date()
      }

      if (error) {
        updateData.error = error
      }

      const { error: dbError } = await this.supabase
        .from('document_processing_jobs')
        .update(updateData)
        .eq('id', jobId)

      if (dbError) throw dbError
    } catch (error) {
      console.error('Erro ao atualizar status do job:', error)
      throw error
    }
  }

  // =============================================================================
  // REINDEXAÇÃO EM LOTE
  // =============================================================================

  async reindexDocuments(userId: string, source?: 'google' | 'sharepoint' | 'all'): Promise<{
    total: number
    processed: number
    failed: number
    jobs: DocumentProcessingJob[]
  }> {
    try {
      // Buscar documentos para reindexação
      let query = this.supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)

      if (source && source !== 'all') {
        query = query.eq('source', source)
      }

      const { data: documents, error } = await query

      if (error) throw error

      const jobs: DocumentProcessingJob[] = []
      let processed = 0
      let failed = 0

      // Criar jobs de reindexação
      for (const doc of documents) {
        try {
          const job = await this.addToProcessingQueue(
            doc.id,
            userId,
            doc.source as 'google' | 'sharepoint',
            'normal'
          )
          jobs.push(job)
          processed++
        } catch (error) {
          console.error(`Erro ao criar job para documento ${doc.id}:`, error)
          failed++
        }
      }

      return {
        total: documents.length,
        processed,
        failed,
        jobs
      }
    } catch (error) {
      console.error('Erro na reindexação em lote:', error)
      throw error
    }
  }

  // =============================================================================
  // MONITORAMENTO E ESTATÍSTICAS
  // =============================================================================

  async getProcessingStats(userId?: string): Promise<{
    pending: number
    processing: number
    completed: number
    failed: number
    averageProcessingTime: number
  }> {
    try {
      let query = this.supabase
        .from('document_processing_jobs')
        .select('*')

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: jobs, error } = await query

      if (error) throw error

      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        averageProcessingTime: 0
      }

      let totalProcessingTime = 0
      let completedCount = 0

      jobs.forEach(job => {
        stats[job.status as keyof typeof stats]++

        if (job.status === 'completed' && job.completed_at) {
          const processingTime = new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()
          totalProcessingTime += processingTime
          completedCount++
        }
      })

      if (completedCount > 0) {
        stats.averageProcessingTime = totalProcessingTime / completedCount
      }

      return stats
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      throw error
    }
  }

  // =============================================================================
  // WORKFLOWS ESPECIALIZADOS
  // =============================================================================

  async createReindexWorkflow(): Promise<N8NWorkflow> {
    try {
      const workflow = {
        name: 'Document Reindexing - Gabi',
        active: true,
        nodes: [
          // Trigger - Schedule
          {
            id: 'trigger',
            name: 'Reindex Trigger',
            type: 'n8n-nodes-base.cron',
            typeVersion: 1,
            position: [0, 0],
            parameters: {
              rule: {
                hour: 2,
                minute: 0
              }
            }
          },
          // Get documents to reindex
          {
            id: 'get-documents',
            name: 'Get Documents for Reindex',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 4,
            position: [300, 0],
            parameters: {
              method: 'GET',
              url: '{{ $env.GABI_GATEWAY_URL }}/api/v1/docs/reindex-candidates',
              sendHeaders: true,
              headerParameters: {
                parameters: [
                  {
                    name: 'Authorization',
                    value: 'Bearer {{ $env.GABI_API_KEY }}'
                  }
                ]
              }
            }
          },
          // Process each document
          {
            id: 'process-documents',
            name: 'Process Documents',
            type: 'n8n-nodes-base.splitInBatches',
            typeVersion: 2,
            position: [600, 0],
            parameters: {
              batchSize: 10,
              options: {}
            }
          },
          // Trigger processing for each document
          {
            id: 'trigger-processing',
            name: 'Trigger Processing',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 4,
            position: [900, 0],
            parameters: {
              method: 'POST',
              url: '{{ $env.GABI_GATEWAY_URL }}/api/v1/docs/reindex',
              sendHeaders: true,
              headerParameters: {
                parameters: [
                  {
                    name: 'Authorization',
                    value: 'Bearer {{ $env.GABI_API_KEY }}'
                  },
                  {
                    name: 'Content-Type',
                    value: 'application/json'
                  }
                ]
              },
              sendBody: true,
              bodyParameters: {
                parameters: [
                  {
                    name: 'documentId',
                    value: '={{ $json.id }}'
                  },
                  {
                    name: 'userId',
                    value: '={{ $json.userId }}'
                  },
                  {
                    name: 'source',
                    value: '={{ $json.source }}'
                  }
                ]
              }
            }
          }
        ],
        connections: {
          'Reindex Trigger': {
            main: [
              [
                {
                  node: 'Get Documents for Reindex',
                  type: 'main',
                  index: 0
                }
              ]
            ]
          },
          'Get Documents for Reindex': {
            main: [
              [
                {
                  node: 'Process Documents',
                  type: 'main',
                  index: 0
                }
              ]
            ]
          },
          'Process Documents': {
            main: [
              [
                {
                  node: 'Trigger Processing',
                  type: 'main',
                  index: 0
                }
              ]
            ]
          }
        },
        settings: {
          executionOrder: 'v1'
        }
      }

      const response = await this.n8nClient.post('/api/v1/workflows', workflow)
      return response.data
    } catch (error) {
      console.error('Erro ao criar workflow de reindexação:', error)
      throw error
    }
  }
} 