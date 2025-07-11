import { Request, Response } from 'express'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/upload'
import { encrypt } from '@/lib/crypto'

// PUT /api/organizations/:organizationId/settings
export async function updateOrganizationSettings(req: Request, res: Response) {
  try {
    const { organizationId } = req.params
    const {
      name,
      agentName,
      knowledge_base_type,
      iaKey
    } = req.body
    // Arquivos
    const logo = req.files?.logo?.[0]
    const agentImage = req.files?.agentImage?.[0]

    // Permissão: checar se usuário é admin da organização (implementar auth middleware)
    // ...

    // Upload de arquivos (se enviados)
    let logoUrl = undefined
    let agentImageUrl = undefined
    if (logo) {
      logoUrl = await uploadFile(logo, `organizations/${organizationId}/logo.png`)
    }
    if (agentImage) {
      agentImageUrl = await uploadFile(agentImage, `organizations/${organizationId}/agent.png`)
    }

    // Criptografar chave de IA antes de salvar
    let iaKeyEncrypted = iaKey ? encrypt(iaKey) : undefined

    // Atualizar organização no banco
    const updateData: any = {
      name,
      agent_name: agentName,
      knowledge_base_type,
    }
    if (logoUrl) updateData.logo_url = logoUrl
    if (agentImageUrl) updateData.agent_image_url = agentImageUrl
    if (iaKeyEncrypted) updateData.ia_key = iaKeyEncrypted

    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ success: true })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
} 