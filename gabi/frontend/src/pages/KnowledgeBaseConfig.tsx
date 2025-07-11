import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'

interface KnowledgeBaseConfigProps {
  organizationId: string
}

export function KnowledgeBaseConfig({ organizationId }: KnowledgeBaseConfigProps) {
  const [type, setType] = useState<'fulltext' | 'vector'>('fulltext')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Buscar configuração atual do backend
    fetch(`/api/organizations/${organizationId}`)
      .then(res => res.json())
      .then(data => setType(data.knowledge_base_type || 'fulltext'))
  }, [organizationId])

  const handleSave = async () => {
    setLoading(true)
    const res = await fetch(`/api/organizations/${organizationId}/knowledge-base-type`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    })
    setLoading(false)
    if (res.ok) {
      toast({ title: 'Configuração salva!', description: `Tipo de base: ${type === 'vector' ? 'Vetorial' : 'Fulltext'}` })
    } else {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente', variant: 'destructive' })
    }
  }

  return (
    <Card className="max-w-xl mx-auto mt-10">
      <CardHeader>
        <CardTitle>Configuração da Base de Conhecimento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <label className="block text-sm font-medium mb-1">Tipo de Base de Conhecimento</label>
          <Select value={type} onValueChange={v => setType(v as 'fulltext' | 'vector')}>
            <Select.Item value="fulltext">Fulltext (busca tradicional)</Select.Item>
            <Select.Item value="vector">Vetorial (busca semântica)</Select.Item>
          </Select>
          <Button onClick={handleSave} loading={loading} className="mt-4">Salvar</Button>
        </div>
      </CardContent>
    </Card>
  )
} 