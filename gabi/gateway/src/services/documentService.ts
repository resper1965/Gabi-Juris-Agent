import { google } from 'googleapis'
import { Client } from '@microsoft/microsoft-graph-client'
import { createClient } from '@supabase/supabase-js'
import { OAuthService } from './oauthService'
import { Document, DocumentIndexRequest } from '../types/oauth'

// =============================================================================
// SERVIÇO DE DOCUMENTOS
// =============================================================================

export class DocumentService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  private oauthService = new OAuthService()

  // =============================================================================
  // LISTAGEM DE DOCUMENTOS
  // =============================================================================

  async listDocuments(userId: string, options: {
    source: string
    pageToken?: string
    limit: number
  }): Promise<{ documents: Document[], pagination: any }> {
    try {
      const documents: Document[] = []
      let pagination = { hasMore: false }

      if (options.source === 'all' || options.source === 'google') {
        const googleDocs = await this.listGoogleDocuments(userId, options.pageToken, options.limit)
        documents.push(...googleDocs.documents)
        pagination = googleDocs.pagination
      }

      if (options.source === 'all' || options.source === 'sharepoint') {
        const sharepointDocs = await this.listSharePointDocuments(userId, options.pageToken, options.limit)
        documents.push(...sharepointDocs.documents)
        if (options.source === 'sharepoint') {
          pagination = sharepointDocs.pagination
        }
      }

      return { documents, pagination }
    } catch (error) {
      console.error('Erro ao listar documentos:', error)
      throw error
    }
  }

  // =============================================================================
  // GOOGLE DRIVE
  // =============================================================================

  private async listGoogleDocuments(userId: string, pageToken?: string, limit: number = 20): Promise<{ documents: Document[], pagination: any }> {
    try {
      const token = await this.oauthService.getValidToken(userId, 'google')
      if (!token) {
        throw new Error('No valid Google token found')
      }

      const auth = new google.auth.OAuth2()
      auth.setCredentials({
        access_token: token.accessToken,
        refresh_token: token.refreshToken
      })

      const drive = google.drive({ version: 'v3', auth })
      
      const response = await drive.files.list({
        pageSize: limit,
        pageToken,
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink)',
        q: "mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document'"
      })

      const documents: Document[] = (response.data.files || []).map(file => ({
        id: file.id!,
        name: file.name!,
        type: this.getDocumentType(file.mimeType!),
        source: 'google',
        sourceId: file.id!,
        userId,
        size: parseInt(file.size || '0'),
        lastModified: new Date(file.modifiedTime!),
        url: file.webViewLink,
        isIndexed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      return {
        documents,
        pagination: {
          nextPageToken: response.data.nextPageToken,
          hasMore: !!response.data.nextPageToken
        }
      }
    } catch (error) {
      console.error('Erro ao listar documentos Google:', error)
      throw error
    }
  }

  // =============================================================================
  // SHAREPOINT
  // =============================================================================

  private async listSharePointDocuments(userId: string, pageToken?: string, limit: number = 20): Promise<{ documents: Document[], pagination: any }> {
    try {
      const token = await this.oauthService.getValidToken(userId, 'microsoft')
      if (!token) {
        throw new Error('No valid Microsoft token found')
      }

      const client = Client.init({
        authProvider: (done) => {
          done(null, token.accessToken)
        }
      })

      const response = await client
        .api('/me/drive/root/children')
        .top(limit)
        .filter("file ne null and (file/mimeType eq 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or file/mimeType eq 'application/pdf')")
        .get()

      const documents: Document[] = (response.value || []).map(file => ({
        id: file.id!,
        name: file.name!,
        type: this.getDocumentType(file.file?.mimeType || ''),
        source: 'sharepoint',
        sourceId: file.id!,
        userId,
        size: file.size || 0,
        lastModified: new Date(file.lastModifiedDateTime!),
        url: file.webUrl,
        isIndexed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      return {
        documents,
        pagination: {
          hasMore: false // Microsoft Graph não retorna nextPageToken da mesma forma
        }
      }
    } catch (error) {
      console.error('Erro ao listar documentos SharePoint:', error)
      throw error
    }
  }

  // =============================================================================
  // EXTRAÇÃO DE CONTEÚDO
  // =============================================================================

  async extractDocument(userId: string, docId: string, source: 'google' | 'sharepoint'): Promise<{
    text: string
    wordCount: number
    pageCount?: number
  }> {
    try {
      if (source === 'google') {
        return await this.extractGoogleDocument(userId, docId)
      } else {
        return await this.extractSharePointDocument(userId, docId)
      }
    } catch (error) {
      console.error('Erro ao extrair documento:', error)
      throw error
    }
  }

  private async extractGoogleDocument(userId: string, docId: string): Promise<{
    text: string
    wordCount: number
    pageCount?: number
  }> {
    try {
      const token = await this.oauthService.getValidToken(userId, 'google')
      if (!token) {
        throw new Error('No valid Google token found')
      }

      const auth = new google.auth.OAuth2()
      auth.setCredentials({
        access_token: token.accessToken,
        refresh_token: token.refreshToken
      })

      const docs = google.docs({ version: 'v1', auth })
      
      const response = await docs.documents.get({
        documentId: docId
      })

      const document = response.data
      let text = ''

      // Extrai texto do documento Google Docs
      if (document.body?.content) {
        text = this.extractTextFromGoogleDoc(document.body.content)
      }

      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length

      return {
        text,
        wordCount,
        pageCount: undefined // Google Docs não fornece contagem de páginas diretamente
      }
    } catch (error) {
      console.error('Erro ao extrair documento Google:', error)
      throw error
    }
  }

  private async extractSharePointDocument(userId: string, docId: string): Promise<{
    text: string
    wordCount: number
    pageCount?: number
  }> {
    try {
      const token = await this.oauthService.getValidToken(userId, 'microsoft')
      if (!token) {
        throw new Error('No valid Microsoft token found')
      }

      const client = Client.init({
        authProvider: (done) => {
          done(null, token.accessToken)
        }
      })

      // Baixa o arquivo
      const response = await client
        .api(`/me/drive/items/${docId}/content`)
        .get()

      // Para arquivos Word, seria necessário usar uma biblioteca como mammoth
      // Por simplicidade, retornamos um texto placeholder
      const text = `Conteúdo extraído do documento SharePoint ${docId}`
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length

      return {
        text,
        wordCount,
        pageCount: undefined
      }
    } catch (error) {
      console.error('Erro ao extrair documento SharePoint:', error)
      throw error
    }
  }

  // =============================================================================
  // INDEXAÇÃO NO MCP
  // =============================================================================

  async indexDocument(request: DocumentIndexRequest): Promise<{
    indexId: string
    status: 'success' | 'error'
    message?: string
  }> {
    try {
      const payload = {
        text: request.text,
        metadata: {
          userId: request.userId,
          origin: request.origin,
          docName: request.docName,
          docId: request.docId,
          indexedAt: new Date().toISOString()
        }
      }

      const response = await fetch('http://localhost:8080/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`MCP Server error: ${response.status}`)
      }

      const result = await response.json()

      return {
        indexId: result.indexId || `index_${Date.now()}`,
        status: 'success',
        message: 'Document indexed successfully'
      }
    } catch (error) {
      console.error('Erro ao indexar documento:', error)
      return {
        indexId: `error_${Date.now()}`,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =============================================================================
  // SINCRONIZAÇÃO
  // =============================================================================

  async syncDocuments(userId: string, source: string): Promise<{
    syncedCount: number
    errors: string[]
  }> {
    try {
      const errors: string[] = []
      let syncedCount = 0

      if (source === 'all' || source === 'google') {
        try {
          const googleDocs = await this.listGoogleDocuments(userId)
          await this.saveDocumentsToDatabase(googleDocs.documents)
          syncedCount += googleDocs.documents.length
        } catch (error) {
          errors.push(`Google sync error: ${error}`)
        }
      }

      if (source === 'all' || source === 'sharepoint') {
        try {
          const sharepointDocs = await this.listSharePointDocuments(userId)
          await this.saveDocumentsToDatabase(sharepointDocs.documents)
          syncedCount += sharepointDocs.documents.length
        } catch (error) {
          errors.push(`SharePoint sync error: ${error}`)
        }
      }

      return { syncedCount, errors }
    } catch (error) {
      console.error('Erro na sincronização:', error)
      throw error
    }
  }

  // =============================================================================
  // OPERAÇÕES DE BANCO DE DADOS
  // =============================================================================

  private async saveDocumentsToDatabase(documents: Document[]): Promise<void> {
    try {
      for (const doc of documents) {
        await this.supabase
          .from('documents')
          .upsert({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            source: doc.source,
            source_id: doc.sourceId,
            user_id: doc.userId,
            size: doc.size,
            last_modified: doc.lastModified,
            url: doc.url,
            is_indexed: doc.isIndexed,
            created_at: doc.createdAt,
            updated_at: doc.updatedAt
          })
      }
    } catch (error) {
      console.error('Erro ao salvar documentos no banco:', error)
      throw error
    }
  }

  async getDocumentMetadata(userId: string, docId: string): Promise<Document | null> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .eq('user_id', userId)
        .single()

      if (error || !data) return null

      return {
        id: data.id,
        name: data.name,
        type: data.type,
        source: data.source,
        sourceId: data.source_id,
        userId: data.user_id,
        size: data.size,
        lastModified: new Date(data.last_modified),
        url: data.url,
        isIndexed: data.is_indexed,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Erro ao obter metadados do documento:', error)
      return null
    }
  }

  async deleteDocument(userId: string, docId: string): Promise<void> {
    try {
      await this.supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .eq('user_id', userId)
    } catch (error) {
      console.error('Erro ao excluir documento:', error)
      throw error
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  private getDocumentType(mimeType: string): Document['type'] {
    switch (mimeType) {
      case 'application/vnd.google-apps.document':
        return 'google-docs'
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'word'
      case 'application/pdf':
        return 'pdf'
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return 'excel'
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return 'powerpoint'
      default:
        return 'word'
    }
  }

  private extractTextFromGoogleDoc(content: any[]): string {
    let text = ''
    
    for (const element of content) {
      if (element.paragraph) {
        for (const element2 of element.paragraph.elements || []) {
          if (element2.textRun) {
            text += element2.textRun.content || ''
          }
        }
        text += '\n'
      }
    }
    
    return text.trim()
  }
} 