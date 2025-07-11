import { Router, Request, Response } from 'express'
import { AuthMiddleware } from '../middleware/auth'
import { RBACMiddleware } from '../middleware/rbac'
import { APIResponse } from '../types'
import { gabiConfig, personalizationConfig } from '../config'

const router = Router()

// =============================================================================
// ROTAS DE PERSONALIZAÇÃO
// =============================================================================

/**
 * @route   GET /personalization/config
 * @desc    Obtém configurações de personalização disponíveis
 * @access  Private
 */
router.get('/config', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const response: APIResponse<{
      allowCustomName: boolean
      allowCustomAvatar: boolean
      allowCustomPersonality: boolean
      maxCustomLength: {
        name: number
        description: number
        personality: number
      }
      defaultConfig: {
        name: string
        description: string
        avatar: string
        personality: string
        capabilities: string[]
      }
    }> = {
      success: true,
      data: {
        allowCustomName: personalizationConfig.allowCustomName,
        allowCustomAvatar: personalizationConfig.allowCustomAvatar,
        allowCustomPersonality: personalizationConfig.allowCustomPersonality,
        maxCustomLength: personalizationConfig.maxCustomLength,
        defaultConfig: {
          name: gabiConfig.name,
          description: gabiConfig.description,
          avatar: gabiConfig.avatar,
          personality: gabiConfig.personality,
          capabilities: gabiConfig.capabilities
        }
      },
      timestamp: new Date()
    }

    res.json(response)
  } catch (error) {
    console.error('Erro ao obter configurações de personalização:', error)
    
    const response: APIResponse = {
      success: false,
      error: 'Erro ao obter configurações',
      timestamp: new Date()
    }
    
    res.status(500).json(response)
  }
})

/**
 * @route   GET /personalization/assistant
 * @desc    Obtém configuração atual da assistente do usuário
 * @access  Private
 */
router.get('/assistant', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user

    // Busca personalização do usuário (implementação futura)
    const userPersonalization = await getUserPersonalization(user.id)

    const response: APIResponse<{
      name: string
      description: string
      avatar: string
      personality: string
      capabilities: string[]
      isCustomized: boolean
    }> = {
      success: true,
      data: {
        name: userPersonalization?.name || gabiConfig.name,
        description: userPersonalization?.description || gabiConfig.description,
        avatar: userPersonalization?.avatar || gabiConfig.avatar,
        personality: userPersonalization?.personality || gabiConfig.personality,
        capabilities: gabiConfig.capabilities,
        isCustomized: !!userPersonalization
      },
      timestamp: new Date()
    }

    res.json(response)
  } catch (error) {
    console.error('Erro ao obter personalização da assistente:', error)
    
    const response: APIResponse = {
      success: false,
      error: 'Erro ao obter personalização',
      timestamp: new Date()
    }
    
    res.status(500).json(response)
  }
})

/**
 * @route   PUT /personalization/assistant
 * @desc    Atualiza personalização da assistente do usuário
 * @access  Private
 */
router.put('/assistant', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user
    const { name, description, avatar, personality } = req.body

    // Validações
    const validationErrors = validatePersonalizationData({
      name,
      description,
      avatar,
      personality
    })

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: validationErrors,
        timestamp: new Date()
      })
    }

    // Salva personalização (implementação futura)
    const personalization = await saveUserPersonalization(user.id, {
      name: name || gabiConfig.name,
      description: description || gabiConfig.description,
      avatar: avatar || gabiConfig.avatar,
      personality: personality || gabiConfig.personality
    })

    const response: APIResponse<{
      name: string
      description: string
      avatar: string
      personality: string
      capabilities: string[]
      isCustomized: boolean
    }> = {
      success: true,
      data: {
        name: personalization.name,
        description: personalization.description,
        avatar: personalization.avatar,
        personality: personalization.personality,
        capabilities: gabiConfig.capabilities,
        isCustomized: true
      },
      message: 'Personalização atualizada com sucesso',
      timestamp: new Date()
    }

    res.json(response)
  } catch (error) {
    console.error('Erro ao atualizar personalização:', error)
    
    const response: APIResponse = {
      success: false,
      error: 'Erro ao atualizar personalização',
      timestamp: new Date()
    }
    
    res.status(500).json(response)
  }
})

/**
 * @route   DELETE /personalization/assistant
 * @desc    Remove personalização da assistente (volta para padrão)
 * @access  Private
 */
router.delete('/assistant', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user

    // Remove personalização (implementação futura)
    await removeUserPersonalization(user.id)

    const response: APIResponse<{
      name: string
      description: string
      avatar: string
      personality: string
      capabilities: string[]
      isCustomized: boolean
    }> = {
      success: true,
      data: {
        name: gabiConfig.name,
        description: gabiConfig.description,
        avatar: gabiConfig.avatar,
        personality: gabiConfig.personality,
        capabilities: gabiConfig.capabilities,
        isCustomized: false
      },
      message: 'Personalização removida, usando configuração padrão',
      timestamp: new Date()
    }

    res.json(response)
  } catch (error) {
    console.error('Erro ao remover personalização:', error)
    
    const response: APIResponse = {
      success: false,
      error: 'Erro ao remover personalização',
      timestamp: new Date()
    }
    
    res.status(500).json(response)
  }
})

/**
 * @route   POST /personalization/avatar/upload
 * @desc    Faz upload de avatar personalizado
 * @access  Private
 */
router.post('/avatar/upload', 
  AuthMiddleware.requireAuth, 
  RBACMiddleware.requirePermission('personalization:write'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as any
      const user = authReq.user
      const { avatarData, avatarType } = req.body

      if (!avatarData || !avatarType) {
        return res.status(400).json({
          success: false,
          error: 'Dados do avatar são obrigatórios',
          timestamp: new Date()
        })
      }

      // Valida tipo de avatar
      const allowedTypes = ['url', 'base64', 'svg']
      if (!allowedTypes.includes(avatarType)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de avatar não suportado',
          timestamp: new Date()
        })
      }

      // Processa e salva avatar (implementação futura)
      const avatarUrl = await processAvatarUpload(user.id, avatarData, avatarType)

      const response: APIResponse<{ avatarUrl: string }> = {
        success: true,
        data: { avatarUrl },
        message: 'Avatar enviado com sucesso',
        timestamp: new Date()
      }

      res.json(response)
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error)
      
      const response: APIResponse = {
        success: false,
        error: 'Erro ao fazer upload do avatar',
        timestamp: new Date()
      }
      
      res.status(500).json(response)
    }
  }
)

/**
 * @route   GET /personalization/templates
 * @desc    Obtém templates de personalização pré-definidos
 * @access  Private
 */
router.get('/templates', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const templates = [
      {
        id: 'juridico-formal',
        name: 'Jurídico Formal',
        description: 'Assistente com tom formal e técnico',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=formal',
        personality: 'Profissional, formal e técnico. Especialista em direito com linguagem precisa e acadêmica.',
        preview: 'Olá, sou sua assistente jurídica. Como posso ajudá-lo com sua consulta legal?'
      },
      {
        id: 'juridico-amigavel',
        name: 'Jurídico Amigável',
        description: 'Assistente com tom amigável e acessível',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=friendly',
        personality: 'Amigável, acessível e paciente. Especialista em direito que explica conceitos complexos de forma simples.',
        preview: 'Oi! Sou sua assistente jurídica. Vou te ajudar a entender melhor essa questão legal!'
      },
      {
        id: 'juridico-executivo',
        name: 'Jurídico Executivo',
        description: 'Assistente focado em eficiência e resultados',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=executive',
        personality: 'Direto, eficiente e focado em resultados. Especialista em direito que prioriza soluções práticas.',
        preview: 'Olá. Sou sua assistente jurídica. Vamos resolver sua questão de forma eficiente.'
      },
      {
        id: 'juridico-mentor',
        name: 'Jurídico Mentor',
        description: 'Assistente com abordagem educativa',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mentor',
        personality: 'Educativo, explicativo e mentor. Especialista em direito que ensina enquanto resolve questões.',
        preview: 'Olá! Sou sua mentora jurídica. Vou te ajudar a entender e resolver essa questão legal.'
      }
    ]

    const response: APIResponse<typeof templates> = {
      success: true,
      data: templates,
      timestamp: new Date()
    }

    res.json(response)
  } catch (error) {
    console.error('Erro ao obter templates:', error)
    
    const response: APIResponse = {
      success: false,
      error: 'Erro ao obter templates',
      timestamp: new Date()
    }
    
    res.status(500).json(response)
  }
})

/**
 * @route   POST /personalization/apply-template
 * @desc    Aplica template de personalização
 * @access  Private
 */
router.post('/apply-template', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user
    const { templateId } = req.body

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'templateId é obrigatório',
        timestamp: new Date()
      })
    }

    // Busca template
    const template = await getTemplateById(templateId)
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado',
        timestamp: new Date()
      })
    }

    // Aplica template
    const personalization = await saveUserPersonalization(user.id, {
      name: template.name,
      description: template.description,
      avatar: template.avatar,
      personality: template.personality
    })

    const response: APIResponse<{
      name: string
      description: string
      avatar: string
      personality: string
      capabilities: string[]
      isCustomized: boolean
    }> = {
      success: true,
      data: {
        name: personalization.name,
        description: personalization.description,
        avatar: personalization.avatar,
        personality: personalization.personality,
        capabilities: gabiConfig.capabilities,
        isCustomized: true
      },
      message: `Template "${template.name}" aplicado com sucesso`,
      timestamp: new Date()
    }

    res.json(response)
  } catch (error) {
    console.error('Erro ao aplicar template:', error)
    
    const response: APIResponse = {
      success: false,
      error: 'Erro ao aplicar template',
      timestamp: new Date()
    }
    
    res.status(500).json(response)
  }
})

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

function validatePersonalizationData(data: {
  name?: string
  description?: string
  avatar?: string
  personality?: string
}): string[] {
  const errors: string[] = []

  if (data.name !== undefined) {
    if (!personalizationConfig.allowCustomName) {
      errors.push('Personalização de nome não permitida')
    } else if (data.name.length > personalizationConfig.maxCustomLength.name) {
      errors.push(`Nome muito longo (máximo ${personalizationConfig.maxCustomLength.name} caracteres)`)
    } else if (data.name.trim().length === 0) {
      errors.push('Nome não pode estar vazio')
    }
  }

  if (data.description !== undefined) {
    if (data.description.length > personalizationConfig.maxCustomLength.description) {
      errors.push(`Descrição muito longa (máximo ${personalizationConfig.maxCustomLength.description} caracteres)`)
    }
  }

  if (data.avatar !== undefined) {
    if (!personalizationConfig.allowCustomAvatar) {
      errors.push('Personalização de avatar não permitida')
    } else if (!isValidAvatarUrl(data.avatar)) {
      errors.push('URL do avatar inválida')
    }
  }

  if (data.personality !== undefined) {
    if (!personalizationConfig.allowCustomPersonality) {
      errors.push('Personalização de personalidade não permitida')
    } else if (data.personality.length > personalizationConfig.maxCustomLength.personality) {
      errors.push(`Personalidade muito longa (máximo ${personalizationConfig.maxCustomLength.personality} caracteres)`)
    }
  }

  return errors
}

function isValidAvatarUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:', 'data:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

// Funções de persistência (implementação futura)
async function getUserPersonalization(userId: string): Promise<any> {
  // Implementação futura - buscar do banco de dados
  return null
}

async function saveUserPersonalization(userId: string, data: any): Promise<any> {
  // Implementação futura - salvar no banco de dados
  return data
}

async function removeUserPersonalization(userId: string): Promise<void> {
  // Implementação futura - remover do banco de dados
}

async function processAvatarUpload(userId: string, avatarData: string, avatarType: string): Promise<string> {
  // Implementação futura - processar upload
  return avatarData
}

async function getTemplateById(templateId: string): Promise<any> {
  // Implementação futura - buscar template
  const templates = {
    'juridico-formal': {
      name: 'Jurídico Formal',
      description: 'Assistente com tom formal e técnico',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=formal',
      personality: 'Profissional, formal e técnico. Especialista em direito com linguagem precisa e acadêmica.'
    },
    'juridico-amigavel': {
      name: 'Jurídico Amigável',
      description: 'Assistente com tom amigável e acessível',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=friendly',
      personality: 'Amigável, acessível e paciente. Especialista em direito que explica conceitos complexos de forma simples.'
    },
    'juridico-executivo': {
      name: 'Jurídico Executivo',
      description: 'Assistente focado em eficiência e resultados',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=executive',
      personality: 'Direto, eficiente e focado em resultados. Especialista em direito que prioriza soluções práticas.'
    },
    'juridico-mentor': {
      name: 'Jurídico Mentor',
      description: 'Assistente com abordagem educativa',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mentor',
      personality: 'Educativo, explicativo e mentor. Especialista em direito que ensina enquanto resolve questões.'
    }
  }

  return templates[templateId as keyof typeof templates] || null
}

export default router 