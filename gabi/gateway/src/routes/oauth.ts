import { Router, Request, Response } from 'express'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as AzureADStrategy } from 'passport-azure-ad-oauth2'
import { authenticate } from '../middleware/authMiddleware'
import { RBACMiddleware } from '../middleware/rbacMiddleware'
import { OAuthService } from '../services/oauthService'
import { getLocalizedMessage, getSuccessMessage } from '../utils/i18n'
import { OAuthToken, OAuthUser } from '../types/oauth'

const router = Router()

// =============================================================================
// CONFIGURAÇÃO PASSPORT
// =============================================================================

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback',
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const oauthUser: OAuthUser = {
      id: profile.id,
      email: profile.emails?.[0]?.value || '',
      name: profile.displayName || '',
      picture: profile.photos?.[0]?.value,
      provider: 'google',
      providerId: profile.id
    }
    
    done(null, oauthUser)
  } catch (error) {
    done(error as Error)
  }
}))

// Microsoft OAuth Strategy
passport.use(new AzureADStrategy({
  clientID: process.env.MICROSOFT_CLIENT_ID!,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/microsoft/callback',
  resource: 'https://graph.microsoft.com',
  scope: ['User.Read', 'Files.Read.All']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const oauthUser: OAuthUser = {
      id: profile.id,
      email: profile.emails?.[0]?.value || '',
      name: profile.displayName || '',
      picture: profile.photos?.[0]?.value,
      provider: 'microsoft',
      providerId: profile.id
    }
    
    done(null, oauthUser)
  } catch (error) {
    done(error as Error)
  }
}))

// =============================================================================
// ROTAS DE AUTENTICAÇÃO GOOGLE
// =============================================================================

/**
 * @route   GET /auth/google
 * @desc    Redireciona para autenticação Google OAuth
 * @access  Public
 */
router.get('/google', (req: Request, res: Response) => {
  const lang = req.headers['x-lang'] as string || 'pt-BR'
  
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly'],
    state: JSON.stringify({ lang, userId: req.query.userId })
  })(req, res)
})

/**
 * @route   GET /auth/google/callback
 * @desc    Callback da autenticação Google OAuth
 * @access  Public
 */
router.get('/google/callback', (req: Request, res: Response) => {
  passport.authenticate('google', { session: false }, async (err: any, user: OAuthUser, info: any) => {
    try {
      const lang = req.headers['x-lang'] as string || 'pt-BR'
      
      if (err) {
        const message = getLocalizedMessage('oauth_error', lang)
        return res.status(400).json({
          success: false,
          error: message,
          details: err.message,
          timestamp: new Date()
        })
      }

      if (!user) {
        const message = getLocalizedMessage('oauth_error', lang)
        return res.status(400).json({
          success: false,
          error: message,
          timestamp: new Date()
        })
      }

      // Salva tokens no Supabase
      const oauthService = new OAuthService()
      const savedToken = await oauthService.saveGoogleTokens(user, req.query.code as string)

      const successMessage = getSuccessMessage('oauth_success', lang)
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            provider: user.provider
          },
          token: {
            id: savedToken.id,
            expiresAt: savedToken.expiresAt
          }
        },
        message: successMessage,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Erro no callback Google:', error)
      const message = getLocalizedMessage('oauth_error', req.headers['x-lang'] as string || 'pt-BR')
      res.status(500).json({
        success: false,
        error: message,
        timestamp: new Date()
      })
    }
  })(req, res)
})

// =============================================================================
// ROTAS DE AUTENTICAÇÃO MICROSOFT
// =============================================================================

/**
 * @route   GET /auth/microsoft
 * @desc    Redireciona para autenticação Microsoft OAuth
 * @access  Public
 */
router.get('/microsoft', (req: Request, res: Response) => {
  const lang = req.headers['x-lang'] as string || 'pt-BR'
  
  passport.authenticate('azure_ad_oauth2', {
    scope: ['User.Read', 'Files.Read.All'],
    state: JSON.stringify({ lang, userId: req.query.userId })
  })(req, res)
})

/**
 * @route   GET /auth/microsoft/callback
 * @desc    Callback da autenticação Microsoft OAuth
 * @access  Public
 */
router.get('/microsoft/callback', (req: Request, res: Response) => {
  passport.authenticate('azure_ad_oauth2', { session: false }, async (err: any, user: OAuthUser, info: any) => {
    try {
      const lang = req.headers['x-lang'] as string || 'pt-BR'
      
      if (err) {
        const message = getLocalizedMessage('oauth_error', lang)
        return res.status(400).json({
          success: false,
          error: message,
          details: err.message,
          timestamp: new Date()
        })
      }

      if (!user) {
        const message = getLocalizedMessage('oauth_error', lang)
        return res.status(400).json({
          success: false,
          error: message,
          timestamp: new Date()
        })
      }

      // Salva tokens no Supabase
      const oauthService = new OAuthService()
      const savedToken = await oauthService.saveMicrosoftTokens(user, req.query.code as string)

      const successMessage = getSuccessMessage('oauth_success', lang)
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            provider: user.provider
          },
          token: {
            id: savedToken.id,
            expiresAt: savedToken.expiresAt
          }
        },
        message: successMessage,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Erro no callback Microsoft:', error)
      const message = getLocalizedMessage('oauth_error', req.headers['x-lang'] as string || 'pt-BR')
      res.status(500).json({
        success: false,
        error: message,
        timestamp: new Date()
      })
    }
  })(req, res)
})

// =============================================================================
// ROTAS DE GERENCIAMENTO DE TOKENS
// =============================================================================

/**
 * @route   GET /auth/tokens
 * @desc    Lista tokens OAuth do usuário
 * @access  Private
 */
router.get('/tokens', authenticate, RBACMiddleware.requireUserOrAdmin, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user
    const lang = req.headers['x-lang'] as string || 'pt-BR'

    const oauthService = new OAuthService()
    const tokens = await oauthService.getUserTokens(user.id)

    res.json({
      success: true,
      data: tokens,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Erro ao listar tokens:', error)
    const message = getLocalizedMessage('internal_server', req.headers['x-lang'] as string || 'pt-BR')
    res.status(500).json({
      success: false,
      error: message,
      timestamp: new Date()
    })
  }
})

/**
 * @route   DELETE /auth/revoke
 * @desc    Revoga acesso OAuth
 * @access  Private
 */
router.delete('/revoke', authenticate, RBACMiddleware.requireUserOrAdmin, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user
    const { provider } = req.body
    const lang = req.headers['x-lang'] as string || 'pt-BR'

    if (!provider || !['google', 'microsoft'].includes(provider)) {
      const message = getLocalizedMessage('invalid_request', lang)
      return res.status(400).json({
        success: false,
        error: message,
        timestamp: new Date()
      })
    }

    const oauthService = new OAuthService()
    await oauthService.revokeAccess(user.id, provider)

    const successMessage = getSuccessMessage('access_revoked', lang)
    
    res.json({
      success: true,
      message: successMessage,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Erro ao revogar acesso:', error)
    const message = getLocalizedMessage('internal_server', req.headers['x-lang'] as string || 'pt-BR')
    res.status(500).json({
      success: false,
      error: message,
      timestamp: new Date()
    })
  }
})

/**
 * @route   POST /auth/refresh
 * @desc    Atualiza token OAuth
 * @access  Private
 */
router.post('/refresh', authenticate, RBACMiddleware.requireUserOrAdmin, async (req: Request, res: Response) => {
  try {
    const authReq = req as any
    const user = authReq.user
    const { provider } = req.body
    const lang = req.headers['x-lang'] as string || 'pt-BR'

    if (!provider || !['google', 'microsoft'].includes(provider)) {
      const message = getLocalizedMessage('invalid_request', lang)
      return res.status(400).json({
        success: false,
        error: message,
        timestamp: new Date()
      })
    }

    const oauthService = new OAuthService()
    const refreshedToken = await oauthService.refreshToken(user.id, provider)

    const successMessage = getSuccessMessage('token_refreshed', lang)
    
    res.json({
      success: true,
      data: {
        token: {
          id: refreshedToken.id,
          expiresAt: refreshedToken.expiresAt
        }
      },
      message: successMessage,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Erro ao atualizar token:', error)
    const message = getLocalizedMessage('internal_server', req.headers['x-lang'] as string || 'pt-BR')
    res.status(500).json({
      success: false,
      error: message,
      timestamp: new Date()
    })
  }
})

export default router 