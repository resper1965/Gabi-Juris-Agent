import axios from 'axios'
import { EvoAIWorkflow, WorkflowStep } from '../types'
import { evoaiConfig } from '../config'

// =============================================================================
// SERVIÇO EVOAI
// =============================================================================

class EvoAIService {
  private client: any
  private isConnected: boolean = false

  constructor() {
    this.initializeClient()
  }

  // =============================================================================
  // INICIALIZAÇÃO
  // =============================================================================

  private async initializeClient(): Promise<void> {
    try {
      // Em produção, usar cliente EvoAI oficial
      // Por enquanto, simula conexão
      this.isConnected = true
    } catch (error) {
      console.error('Erro ao inicializar cliente EvoAI:', error)
      this.isConnected = false
    }
  }

  // =============================================================================
  // OPERAÇÕES PRINCIPAIS
  // =============================================================================

  async executeWorkflow(workflowId: string, input: any): Promise<any> {
    try {
      if (!this.isConnected) {
        throw new Error('Cliente EvoAI não conectado')
      }

      // Simula execução de workflow
      const workflow = await this.getWorkflow(workflowId)
      
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} não encontrado`)
      }

      console.log(`Executando workflow ${workflowId} com input:`, input)

      // Simula processamento do workflow
      const result = await this.processWorkflowSteps(workflow.steps, input)

      return {
        workflowId,
        result,
        timestamp: new Date().toISOString(),
        executionTime: Math.random() * 5000 + 1000 // 1-6 segundos
      }
    } catch (error) {
      console.error(`Erro ao executar workflow ${workflowId}:`, error)
      throw error
    }
  }

  async listWorkflows(): Promise<EvoAIWorkflow[]> {
    try {
      if (!this.isConnected) {
        throw new Error('Cliente EvoAI não conectado')
      }

      // Simula lista de workflows
      const workflows: EvoAIWorkflow[] = [
        {
          id: 'analise-contrato',
          name: 'Análise de Contrato',
          description: 'Workflow para análise automática de contratos',
          isActive: true,
          steps: [
            {
              id: 'extract-text',
              type: 'action',
              config: { action: 'extract_text', input: 'contract_file' },
              next: ['analyze-clauses']
            },
            {
              id: 'analyze-clauses',
              type: 'agent',
              config: { agent: 'contratos', model: 'gpt-4' },
              next: ['generate-report']
            },
            {
              id: 'generate-report',
              type: 'action',
              config: { action: 'generate_report', format: 'pdf' }
            }
          ]
        },
        {
          id: 'calculo-prazos',
          name: 'Cálculo de Prazos',
          description: 'Workflow para cálculo automático de prazos processuais',
          isActive: true,
          steps: [
            {
              id: 'identify-process',
              type: 'agent',
              config: { agent: 'prazos', model: 'gpt-3.5-turbo' },
              next: ['calculate-deadlines']
            },
            {
              id: 'calculate-deadlines',
              type: 'action',
              config: { action: 'calculate_deadlines', rules: 'civil_code' }
            }
          ]
        },
        {
          id: 'consulta-juridica',
          name: 'Consulta Jurídica',
          description: 'Workflow para consultas jurídicas com múltiplos agentes',
          isActive: true,
          steps: [
            {
              id: 'classify-query',
              type: 'agent',
              config: { agent: 'juridico-geral', model: 'gpt-4' },
              next: ['route-to-specialist']
            },
            {
              id: 'route-to-specialist',
              type: 'condition',
              config: { 
                condition: 'query_type',
                routes: {
                  'tributario': 'tributario-agent',
                  'trabalhista': 'trabalhista-agent',
                  'civil': 'civil-agent'
                }
              }
            },
            {
              id: 'tributario-agent',
              type: 'agent',
              config: { agent: 'tributario', model: 'gpt-4' }
            },
            {
              id: 'trabalhista-agent',
              type: 'agent',
              config: { agent: 'trabalhista', model: 'gpt-4' }
            },
            {
              id: 'civil-agent',
              type: 'agent',
              config: { agent: 'civil', model: 'gpt-4' }
            }
          ]
        }
      ]

      return workflows
    } catch (error) {
      console.error('Erro ao listar workflows:', error)
      return []
    }
  }

  async getWorkflow(workflowId: string): Promise<EvoAIWorkflow | null> {
    try {
      const workflows = await this.listWorkflows()
      return workflows.find(w => w.id === workflowId) || null
    } catch (error) {
      console.error(`Erro ao buscar workflow ${workflowId}:`, error)
      return null
    }
  }

  // =============================================================================
  // OPERAÇÕES DE WORKFLOW
  // =============================================================================

  private async processWorkflowSteps(steps: WorkflowStep[], input: any): Promise<any> {
    const context = { ...input }
    const results = []

    for (const step of steps) {
      try {
        const stepResult = await this.executeStep(step, context)
        results.push({
          stepId: step.id,
          type: step.type,
          result: stepResult,
          timestamp: new Date().toISOString()
        })

        // Atualiza contexto com resultado do step
        context[step.id] = stepResult

        // Processa próximos steps se houver
        if (step.next && step.next.length > 0) {
          const nextSteps = steps.filter(s => step.next?.includes(s.id))
          const nextResults = await this.processWorkflowSteps(nextSteps, context)
          results.push(...nextResults)
        }
      } catch (error) {
        console.error(`Erro no step ${step.id}:`, error)
        results.push({
          stepId: step.id,
          type: step.type,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }

    return results
  }

  private async executeStep(step: WorkflowStep, context: any): Promise<any> {
    switch (step.type) {
      case 'agent':
        return this.executeAgentStep(step, context)
      case 'action':
        return this.executeActionStep(step, context)
      case 'condition':
        return this.executeConditionStep(step, context)
      default:
        throw new Error(`Tipo de step não suportado: ${step.type}`)
    }
  }

  private async executeAgentStep(step: WorkflowStep, context: any): Promise<any> {
    const { agent, model } = step.config
    
    // Simula chamada para agente MCP
    console.log(`Executando agente ${agent} com modelo ${model}`)
    
    return {
      agent,
      model,
      response: `Resposta simulada do agente ${agent}`,
      confidence: 0.85
    }
  }

  private async executeActionStep(step: WorkflowStep, context: any): Promise<any> {
    const { action, ...params } = step.config
    
    console.log(`Executando ação ${action} com parâmetros:`, params)
    
    // Simula diferentes ações
    switch (action) {
      case 'extract_text':
        return { extractedText: 'Texto extraído do documento' }
      case 'generate_report':
        return { reportUrl: 'https://example.com/report.pdf' }
      case 'calculate_deadlines':
        return { deadlines: ['2024-02-15', '2024-03-01'] }
      default:
        return { action, result: 'Ação executada com sucesso' }
    }
  }

  private async executeConditionStep(step: WorkflowStep, context: any): Promise<any> {
    const { condition, routes } = step.config
    
    console.log(`Executando condição ${condition} com rotas:`, routes)
    
    // Simula lógica de roteamento
    const queryType = context.queryType || 'civil'
    const route = routes[queryType] || 'default'
    
    return {
      condition,
      selectedRoute: route,
      queryType
    }
  }

  // =============================================================================
  // OPERAÇÕES DE ADMINISTRAÇÃO
  // =============================================================================

  async createWorkflow(workflow: Omit<EvoAIWorkflow, 'id'>): Promise<EvoAIWorkflow> {
    try {
      if (!this.isConnected) {
        throw new Error('Cliente EvoAI não conectado')
      }

      const newWorkflow: EvoAIWorkflow = {
        ...workflow,
        id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      console.log('Criando workflow:', newWorkflow)
      
      // Em produção, salvar no EvoAI
      return newWorkflow
    } catch (error) {
      console.error('Erro ao criar workflow:', error)
      throw error
    }
  }

  async updateWorkflow(workflowId: string, updates: Partial<EvoAIWorkflow>): Promise<EvoAIWorkflow | null> {
    try {
      const workflow = await this.getWorkflow(workflowId)
      
      if (!workflow) {
        return null
      }

      const updatedWorkflow = { ...workflow, ...updates }
      
      console.log(`Atualizando workflow ${workflowId}:`, updatedWorkflow)
      
      // Em produção, atualizar no EvoAI
      return updatedWorkflow
    } catch (error) {
      console.error(`Erro ao atualizar workflow ${workflowId}:`, error)
      throw error
    }
  }

  async deleteWorkflow(workflowId: string): Promise<boolean> {
    try {
      const workflow = await this.getWorkflow(workflowId)
      
      if (!workflow) {
        return false
      }

      console.log(`Removendo workflow ${workflowId}`)
      
      // Em produção, remover do EvoAI
      return true
    } catch (error) {
      console.error(`Erro ao remover workflow ${workflowId}:`, error)
      return false
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false
      }

      // Testa conexão com EvoAI
      const response = await axios.get(`${evoaiConfig.url}/health`, {
        headers: {
          'Authorization': `Bearer ${evoaiConfig.apiKey}`
        },
        timeout: 5000
      })

      return response.status === 200
    } catch (error) {
      console.error('Erro no health check do EvoAI:', error)
      return false
    }
  }

  async getWorkflowStats(workflowId: string): Promise<{
    executions: number
    avgExecutionTime: number
    successRate: number
    lastExecuted: string
  }> {
    try {
      // Simula estatísticas do workflow
      return {
        executions: Math.floor(Math.random() * 1000) + 100,
        avgExecutionTime: Math.random() * 5000 + 1000,
        successRate: 0.85 + Math.random() * 0.15,
        lastExecuted: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Erro ao obter estatísticas do workflow ${workflowId}:`, error)
      throw error
    }
  }
}

// Exporta uma instância singleton
export const evoaiService = new EvoAIService() 