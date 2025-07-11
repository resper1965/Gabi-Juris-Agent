import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { OAuthToken, OAuthUser } from '../types/oauth'

// =============================================================================
// SERVIÇO OAUTH
// =============================================================================

export class OAuthService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // =============================================================================
  // CRIPTOGRAFIA DE TOKENS
  // =============================================================================

  private async encryptToken(token: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(token, saltRounds)
  }

  private async decryptToken(encryptedToken: string): Promise<string> {
    // Para bcrypt, não é possível descriptografar
    // Em produção, use uma biblioteca de criptografia reversível como crypto
    throw new Error('Token decryption not implemented')
  }

  // =============================================================================
  // GOOGLE OAUTH
  // =============================================================================

  async saveGoogleTokens(user: OAuthUser, authorizationCode: string): Promise<OAuthToken> {
    try {
      // Troca o código de autorização por tokens
      const tokenResponse = await this.exchangeGoogleCode(authorizationCode)
      
      // Criptografa os tokens
      const encryptedAccessToken = await this.encryptToken(tokenResponse.access_token)
      const encryptedRefreshToken = await this.encryptToken(tokenResponse.refresh_token)

      // Salva no Supabase
      const { data, error } = await this.supabase
        .from('oauth_tokens')
        .upsert({
          user_id: user.id,
          provider: 'google',
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000),
          scope: tokenResponse.scope?.split(' ') || [],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        userId: data.user_id,
        provider: data.provider,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at),
        scope: data.scope,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Erro ao salvar tokens Google:', error)
      throw error
    }
  }

  private async exchangeGoogleCode(code: string): Promise<any> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback',
        grant_type: 'authorization_code'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to exchange Google authorization code')
    }

    return await response.json()
  }

  // =============================================================================
  // MICROSOFT OAUTH
  // =============================================================================

  async saveMicrosoftTokens(user: OAuthUser, authorizationCode: string): Promise<OAuthToken> {
    try {
      // Troca o código de autorização por tokens
      const tokenResponse = await this.exchangeMicrosoftCode(authorizationCode)
      
      // Criptografa os tokens
      const encryptedAccessToken = await this.encryptToken(tokenResponse.access_token)
      const encryptedRefreshToken = await this.encryptToken(tokenResponse.refresh_token)

      // Salva no Supabase
      const { data, error } = await this.supabase
        .from('oauth_tokens')
        .upsert({
          user_id: user.id,
          provider: 'microsoft',
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000),
          scope: tokenResponse.scope?.split(' ') || [],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        userId: data.user_id,
        provider: data.provider,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at),
        scope: data.scope,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Erro ao salvar tokens Microsoft:', error)
      throw error
    }
  }

  private async exchangeMicrosoftCode(code: string): Promise<any> {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        redirect_uri: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/microsoft/callback',
        grant_type: 'authorization_code'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to exchange Microsoft authorization code')
    }

    return await response.json()
  }

  // =============================================================================
  // GERENCIAMENTO DE TOKENS
  // =============================================================================

  async getUserTokens(userId: string): Promise<OAuthToken[]> {
    try {
      const { data, error } = await this.supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) throw error

      return data.map(token => ({
        id: token.id,
        userId: token.user_id,
        provider: token.provider,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: new Date(token.expires_at),
        scope: token.scope,
        isActive: token.is_active,
        createdAt: new Date(token.created_at),
        updatedAt: new Date(token.updated_at)
      }))
    } catch (error) {
      console.error('Erro ao buscar tokens do usuário:', error)
      throw error
    }
  }

  async getValidToken(userId: string, provider: 'google' | 'microsoft'): Promise<OAuthToken | null> {
    try {
      const { data, error } = await this.supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) return null

      return {
        id: data.id,
        userId: data.user_id,
        provider: data.provider,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at),
        scope: data.scope,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Erro ao buscar token válido:', error)
      return null
    }
  }

  async refreshToken(userId: string, provider: 'google' | 'microsoft'): Promise<OAuthToken> {
    try {
      // Busca o token atual
      const currentToken = await this.getValidToken(userId, provider)
      if (!currentToken) {
        throw new Error('No valid token found')
      }

      // Atualiza o token
      const newTokenResponse = await this.refreshOAuthToken(currentToken, provider)
      
      // Criptografa o novo token
      const encryptedAccessToken = await this.encryptToken(newTokenResponse.access_token)
      const encryptedRefreshToken = await this.encryptToken(newTokenResponse.refresh_token)

      // Atualiza no Supabase
      const { data, error } = await this.supabase
        .from('oauth_tokens')
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: new Date(Date.now() + newTokenResponse.expires_in * 1000),
          updated_at: new Date()
        })
        .eq('id', currentToken.id)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        userId: data.user_id,
        provider: data.provider,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at),
        scope: data.scope,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Erro ao atualizar token:', error)
      throw error
    }
  }

  private async refreshOAuthToken(token: OAuthToken, provider: 'google' | 'microsoft'): Promise<any> {
    const refreshUrl = provider === 'google' 
      ? 'https://oauth2.googleapis.com/token'
      : 'https://login.microsoftonline.com/common/oauth2/v2.0/token'

    const clientId = provider === 'google' 
      ? process.env.GOOGLE_CLIENT_ID!
      : process.env.MICROSOFT_CLIENT_ID!

    const clientSecret = provider === 'google'
      ? process.env.GOOGLE_CLIENT_SECRET!
      : process.env.MICROSOFT_CLIENT_SECRET!

    const redirectUri = provider === 'google'
      ? process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback'
      : process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/microsoft/callback'

    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        refresh_token: token.refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to refresh ${provider} token`)
    }

    return await response.json()
  }

  async revokeAccess(userId: string, provider: 'google' | 'microsoft'): Promise<void> {
    try {
      // Desativa o token no Supabase
      await this.supabase
        .from('oauth_tokens')
        .update({
          is_active: false,
          updated_at: new Date()
        })
        .eq('user_id', userId)
        .eq('provider', provider)

      // Revoga o token no provedor OAuth
      await this.revokeOAuthToken(userId, provider)
    } catch (error) {
      console.error('Erro ao revogar acesso:', error)
      throw error
    }
  }

  private async revokeOAuthToken(userId: string, provider: 'google' | 'microsoft'): Promise<void> {
    try {
      const token = await this.getValidToken(userId, provider)
      if (!token) return

      const revokeUrl = provider === 'google'
        ? 'https://oauth2.googleapis.com/revoke'
        : 'https://login.microsoftonline.com/common/oauth2/v2.0/logout'

      await fetch(revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          token: token.accessToken
        })
      })
    } catch (error) {
      console.error(`Erro ao revogar token ${provider}:`, error)
      // Não falha se a revogação externa falhar
    }
  }
} 