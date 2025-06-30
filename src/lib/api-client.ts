// =====================================================
// API CLIENT UTILS CORREGIDO - src/lib/api-client.ts
// =====================================================

import { authUtils } from '@/lib/auth'

// Función helper para hacer requests autenticadas
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const tokens = authUtils.getTokens()
  
  if (!tokens) {
    throw new Error('No hay token de autenticación')
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${tokens.idToken}`)
  headers.set('Content-Type', 'application/json')

  const response = await fetch(url, {
    ...options,
    headers
  })

  // Si el token expiró, intentar refrescar
  if (response.status === 401) {
    console.log('🔄 Token expirado, intentando refrescar...')
    const refreshed = await authUtils.refreshTokens()
    
    if (refreshed) {
      // Reintentar con el nuevo token
      const newTokens = authUtils.getTokens()
      if (newTokens) {
        headers.set('Authorization', `Bearer ${newTokens.idToken}`)
        console.log('🔄 Reintentando request con token renovado...')
        return fetch(url, { ...options, headers })
      }
    } else {
      // Si no se pudo refrescar, redirigir al login
      console.log('❌ No se pudo refrescar el token, redirigiendo al login')
      authUtils.logout()
      throw new Error('Sesión expirada')
    }
  }

  return response
}

// Wrapper para GET requests
export async function apiGet(url: string) {
  return authenticatedFetch(url, { method: 'GET' })
}

// Wrapper para POST requests
export async function apiPost(url: string, data: any) {
  return authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// Wrapper para PUT requests
export async function apiPut(url: string, data: any) {
  return authenticatedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

// Wrapper para DELETE requests
export async function apiDelete(url: string) {
  return authenticatedFetch(url, { method: 'DELETE' })
}

// Hook personalizado para usar en los componentes
import { useState, useCallback } from 'react'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(async (
    url: string, 
    options: RequestInit = {},
    showLoading = true
  ) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)

      const response = await authenticatedFetch(url, options)
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let errorData
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json()
        } else {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // Verificar si la respuesta tiene contenido JSON
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        return data
      } else {
        // Si no es JSON, devolver texto
        return await response.text()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  const get = useCallback((url: string, showLoading = true) => {
    return request(url, { method: 'GET' }, showLoading)
  }, [request])

  const post = useCallback((url: string, data: any, showLoading = true) => {
    return request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    }, showLoading)
  }, [request])

  const put = useCallback((url: string, data: any, showLoading = true) => {
    return request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    }, showLoading)
  }, [request])

  const del = useCallback((url: string, showLoading = true) => {
    return request(url, { method: 'DELETE' }, showLoading)
  }, [request])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    request,
    clearError
  }
}