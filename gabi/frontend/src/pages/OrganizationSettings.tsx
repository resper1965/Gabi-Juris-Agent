import { useState, useEffect, ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'

interface OrganizationSettingsProps {
  organizationId: string
}

export function OrganizationSettings({ organizationId }: OrganizationSettingsProps) {
  const [orgName, setOrgName] = useState('')
  const [logo, setLogo] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [agentName, setAgentName] = useState('Líder')
  const [agentImage, setAgentImage] = useState<File | null>(null)
  const [agentImageUrl, setAgentImageUrl] = useState<string>('')
  const [kbType, setKbType] = useState<'fulltext' | 'vector'>('fulltext')
  const [iaKey, setIaKey] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Buscar dados atuais da organização
    fetch(`/api/organizations/${organizationId}`)
      .then(res => res.json())
      .then(data => {
        setOrgName(data.name || '')
        setLogoUrl(data.logoUrl || '')
        setAgentName(data.agentName || 'Líder')
        setAgentImageUrl(data.agentImageUrl || '')
        setKbType(data.knowledge_base_type || 'fulltext')
        setIaKey(data.iaKey || '')
      })
  }, [organizationId])

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0])
      setLogoUrl(URL.createObjectURL(e.target.files[0]))
    }
  }

  const handleAgentImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAgentImage(e.target.files[0])
      setAgentImageUrl(URL.createObjectURL(e.target.files[0]))
    }
  }

  const handleSave = async () => {
    setLoading(true)
    const formData = new FormData()
    formData.append('name', orgName)
    if (logo) formData.append('logo', logo)
    formData.append('agentName', agentName)
    if (agentImage) formData.append('agentImage', agentImage)
    formData.append('knowledge_base_type', kbType)
    formData.append('iaKey', iaKey)

    const res = await fetch(`/api/organizations/${organizationId}/settings`, {
      method: 'PUT',
      body: formData
    })
    setLoading(false)
    if (res.ok) {
      toast({ title: 'Configuração salva!', description: 'As configurações da organização foram atualizadas.' })
    } else {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente', variant: 'destructive' })
    }
  }

  return (
    <Card className="max-w-2xl mx-auto mt-10">
      <CardHeader>
        <CardTitle>Configurações da Organização</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Nome da organização */}
          <div>
            <label className="block text-sm font-medium mb-1">Nome da organização</label>
            <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Nome do escritório" />
          </div>
          {/* Logo da organização */}
          <div>
            <label className="block text-sm font-medium mb-1">Logo</label>
            <Input type="file" accept="image/*" onChange={handleLogoChange} />
            {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 mt-2 rounded" />}
          </div>
          {/* Nome do agente líder */}
          <div>
            <label className="block text-sm font-medium mb-1">Nome do agente líder</label>
            <Input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Líder, Ada, etc." />
          </div>
          {/* Imagem do agente líder */}
          <div>
            <label className="block text-sm font-medium mb-1">Imagem do agente líder</label>
            <Input type="file" accept="image/*" onChange={handleAgentImageChange} />
            {agentImageUrl && <img src={agentImageUrl} alt="Agente" className="h-16 mt-2 rounded-full" />}
          </div>
          {/* Tipo de base de conhecimento */}
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Base de Conhecimento</label>
            <Select value={kbType} onValueChange={v => setKbType(v as 'fulltext' | 'vector')}>
              <Select.Item value="fulltext">Fulltext (busca tradicional)</Select.Item>
              <Select.Item value="vector">Vetorial (busca semântica)</Select.Item>
            </Select>
          </div>
          {/* Chave de IA */}
          <div>
            <label className="block text-sm font-medium mb-1">Chave de IA da organização</label>
            <Input
              value={iaKey}
              onChange={e => setIaKey(e.target.value)}
              placeholder="sk-... ou endpoint do Ollama"
              type="password"
              autoComplete="off"
            />
            <span className="text-xs text-gray-500">A chave será usada apenas para esta organização e armazenada de forma segura.</span>
          </div>
          <Button onClick={handleSave} loading={loading} className="mt-4">Salvar</Button>
        </div>
      </CardContent>
    </Card>
  )
} 