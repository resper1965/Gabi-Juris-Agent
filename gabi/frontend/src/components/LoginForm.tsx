import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { login, LoginCredentials } from '@/lib/api'
import { Bot, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react'

interface LoginFormProps {
  onLoginSuccess: (credentials: LoginCredentials) => void
  onLoginError: (error: string) => void
}

export default function LoginForm({ onLoginSuccess, onLoginError }: LoginFormProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Chamar o callback de sucesso com as credenciais
      onLoginSuccess(credentials)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro de conexão'
      setError(errorMessage)
      onLoginError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Gabi
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Assistente Jurídica Inteligente
            </CardDescription>
          </div>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary">Supabase Auth</Badge>
            <Badge variant="outline">JWT</Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={credentials.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !credentials.email || !credentials.password}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Conectando ao Gabi Gateway via Supabase
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 