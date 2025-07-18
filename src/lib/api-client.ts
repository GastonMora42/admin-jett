// src/lib/api-client.ts - API CLIENT CORREGIDO
'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { authUtils } from '@/lib/auth'

interface ApiClientState {
  loading: boolean
  error: string | null
}

class ApiClient {
  private baseUrl: string
  private state: ApiClientState = {
    loading: false,
    error: null
  }
  private stateCallbacks: Set<(state: ApiClientState) => void> = new Set()

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    if (typeof window !== 'undefined') {
      console.log('🌐 API Client initialized')
    }
  }

  // Suscribirse a cambios de estado
  subscribe(callback: (state: ApiClientState) => void) {
    this.stateCallbacks.add(callback)
    return () => this.stateCallbacks.delete(callback)
  }

  // Notificar cambios de estado
  private notifyStateChange() {
    this.stateCallbacks.forEach(callback => callback(this.state))
  }

  // Actualizar estado
  private setState(updates: Partial<ApiClientState>) {
    this.state = { ...this.state, ...updates }
    this.notifyStateChange()
  }

  // Obtener headers con autenticación
  private async getHeaders(includeAuth = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (includeAuth) {
      // Asegurar que los tokens sean válidos antes de hacer la request
      const hasValidTokens = await authUtils.ensureValidTokens()
      
      if (hasValidTokens) {
        const tokens = authUtils.getTokens()
        if (tokens?.idToken) {
          // Usar múltiples headers para máxima compatibilidad
          headers['Authorization'] = `Bearer ${tokens.idToken}`
          headers['X-Auth-Token'] = tokens.idToken
          headers['X-Access-Token'] = tokens.accessToken || tokens.idToken
          
          console.log('🔐 Request headers set with auth tokens')
        } else {
          console.warn('⚠️ No tokens available for authenticated request')
        }
      } else {
        console.warn('⚠️ Failed to ensure valid tokens')
      }
    }

    return headers
  }

  // Hacer request con manejo de errores mejorado
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    showLoading = true
  ): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`
    
    if (showLoading) {
      this.setState({ loading: true, error: null })
    }

    try {
      console.log(`📡 Making ${options.method || 'GET'} request to:`, url)
      
      const headers = await this.getHeaders(!url.includes('/auth/'))
      
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      })

      console.log(`📡 Response status:`, response.status)

      // Manejar diferentes tipos de respuesta
      let data: T
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = (await response.text()) as unknown as T
      }

      if (!response.ok) {
        // Manejar errores de autenticación
        if (response.status === 401) {
          console.warn('🔒 Unauthorized request, attempting token refresh...')
          
          // Intentar refrescar tokens una vez
          const refreshSuccess = await authUtils.refreshTokens()
          
          if (refreshSuccess) {
            console.log('✅ Tokens refreshed, retrying request...')
            // Reintentar la request con tokens nuevos
            return this.makeRequest(url, options, false)
          } else {
            console.error('❌ Token refresh failed, redirecting to login')
            await authUtils.logout()
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
          }
        }

        // Manejar otros errores HTTP
        const errorMessage = (data as any)?.error || 
                           (data as any)?.message || 
                           `Error ${response.status}: ${response.statusText}`
        
        throw new Error(errorMessage)
      }

      console.log(`✅ Request successful:`, url)
      return data

    } catch (error) {
      console.error(`❌ Request failed for ${url}:`, error)
      
      let errorMessage = 'Error de conexión'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      this.setState({ error: errorMessage })
      throw new Error(errorMessage)

    } finally {
      if (showLoading) {
        this.setState({ loading: false })
      }
    }
  }

  // Métodos HTTP públicos
  async get<T>(url: string, showLoading = true): Promise<T> {
    return this.makeRequest<T>(url, { method: 'GET' }, showLoading)
  }

  async post<T>(url: string, data?: any, showLoading = true): Promise<T> {
    return this.makeRequest<T>(
      url,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      showLoading
    )
  }

  async put<T>(url: string, data?: any, showLoading = true): Promise<T> {
    return this.makeRequest<T>(
      url,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      showLoading
    )
  }

  async patch<T>(url: string, data?: any, showLoading = true): Promise<T> {
    return this.makeRequest<T>(
      url,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      showLoading
    )
  }

  async delete<T>(url: string, showLoading = true): Promise<T> {
    return this.makeRequest<T>(url, { method: 'DELETE' }, showLoading)
  }

  // Upload de archivos
  async upload<T>(url: string, formData: FormData, showLoading = true): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`
    
    if (showLoading) {
      this.setState({ loading: true, error: null })
    }

    try {
      const tokens = authUtils.getTokens()
      const headers: Record<string, string> = {}
      
      if (tokens?.idToken) {
        headers['Authorization'] = `Bearer ${tokens.idToken}`
        headers['X-Auth-Token'] = tokens.idToken
      }

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al subir archivo'
      this.setState({ error: errorMessage })
      throw new Error(errorMessage)

    } finally {
      if (showLoading) {
        this.setState({ loading: false })
      }
    }
  }

  // Limpiar estado de error
  clearError() {
    this.setState({ error: null })
  }

  // Obtener estado actual
  getState(): ApiClientState {
    return this.state
  }
}

// Instancia singleton
const apiClient = new ApiClient()

// Hook para usar el API client en componentes
export function useApi() {
  const [state, setState] = useState<ApiClientState>(apiClient.getState())

  const subscribe = useCallback(() => {
    return apiClient.subscribe(setState)
  }, [])

  // Suscribirse a cambios de estado
  useEffect(() => {
    const unsubscribe = subscribe()
    return () => {
      unsubscribe()
    }
  }, [subscribe])

  return {
    // Estado
    loading: state.loading,
    error: state.error,
    
    // Métodos HTTP
    get: apiClient.get.bind(apiClient),
    post: apiClient.post.bind(apiClient),
    put: apiClient.put.bind(apiClient),
    patch: apiClient.patch.bind(apiClient),
    delete: apiClient.delete.bind(apiClient),
    upload: apiClient.upload.bind(apiClient),
    
    // Utilidades
    clearError: apiClient.clearError.bind(apiClient),
  }
}

// Exportar cliente para uso directo si es necesario
export { apiClient }

// Hook especializado para operaciones CRUD
export function useCrud<T>(endpoint: string) {
  const api = useApi()
  
  const create = useCallback(async (data: Partial<T>) => {
    console.log(`🆕 Creating new item at ${endpoint}:`, data)
    return api.post<T>(endpoint, data)
  }, [api, endpoint])

  const update = useCallback(async (id: string, data: Partial<T>) => {
    console.log(`✏️ Updating item ${id} at ${endpoint}:`, data)
    return api.put<T>(`${endpoint}/${id}`, data)
  }, [api, endpoint])

  const remove = useCallback(async (id: string) => {
    console.log(`🗑️ Deleting item ${id} at ${endpoint}`)
    return api.delete(`${endpoint}/${id}`)
  }, [api, endpoint])

  const getById = useCallback(async (id: string) => {
    console.log(`🔍 Getting item ${id} from ${endpoint}`)
    return api.get<T>(`${endpoint}/${id}`)
  }, [api, endpoint])

  const getAll = useCallback(async (params?: Record<string, any>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    console.log(`📋 Getting all items from ${endpoint}${queryString}`)
    return api.get<T[]>(`${endpoint}${queryString}`)
  }, [api, endpoint])

  return {
    create,
    update,
    remove,
    getById,
    getAll,
    loading: api.loading,
    error: api.error,
    clearError: api.clearError
  }
}

// Funciones de utilidad para requests específicos
export const apiUtils = {
  // Autenticación
  login: async (email: string, password: string) => {
    console.log('🔐 Attempting login for:', email)
    return apiClient.post('/api/auth/login', { email, password })
  },

  logout: async () => {
    console.log('🚪 Logging out...')
    return apiClient.post('/api/auth/logout')
  },

  // Dashboard
  getDashboard: async () => {
    console.log('📊 Getting dashboard data')
    return apiClient.get('/api/dashboard')
  },

  // Configuración
  getSettings: async () => {
    console.log('⚙️ Getting settings')
    return apiClient.get('/api/configuracion')
  },

  updateSettings: async (settings: any) => {
    console.log('⚙️ Updating settings')
    return apiClient.put('/api/configuracion', settings)
  },

  // Notificaciones
  getNotifications: async () => {
    console.log('🔔 Getting notifications')
    return apiClient.get('/api/notificaciones')
  },

  // Estadísticas
  getStats: async () => {
    console.log('📈 Getting statistics')
    return apiClient.get('/api/estadisticas')
  },

  // Exportar datos
  exportData: async (type: string, format = 'json') => {
    console.log(`📤 Exporting ${type} data as ${format}`)
    return apiClient.get(`/api/exportar?tipo=${type}&formato=${format}`)
  }
}

// Tipos de utilidad
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}