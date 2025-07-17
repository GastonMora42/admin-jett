// src/lib/api-client-optimized.ts - VERSIÓN OPTIMIZADA
import { authUtils } from '@/lib/auth'
import { useState, useCallback, useRef } from 'react'

// Cache para requests repetitivos
const requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
const pendingRequests = new Map<string, Promise<any>>()

// Configuración de cache
const CACHE_TTL = {
  default: 5 * 60 * 1000, // 5 minutos
  clientes: 10 * 60 * 1000, // 10 minutos
  proyectos: 5 * 60 * 1000, // 5 minutos
  dashboard: 2 * 60 * 1000, // 2 minutos
  usuarios: 15 * 60 * 1000, // 15 minutos
}

// Función para obtener TTL basado en la URL
function getTTL(url: string): number {
  if (url.includes('/clientes')) return CACHE_TTL.clientes
  if (url.includes('/proyectos')) return CACHE_TTL.proyectos
  if (url.includes('/dashboard')) return CACHE_TTL.dashboard
  if (url.includes('/usuarios')) return CACHE_TTL.usuarios
  return CACHE_TTL.default
}

// Función para limpiar cache expirado
function cleanExpiredCache() {
  const now = Date.now()
  for (const [key, entry] of requestCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      requestCache.delete(key)
    }
  }
}

// Limpiar cache cada 5 minutos
setInterval(cleanExpiredCache, 5 * 60 * 1000)

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Función optimizada para requests autenticadas
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const method = options.method || 'GET'
  const cacheKey = `${method}:${url}:${JSON.stringify(options.body || '')}`
  
  // Solo cachear GET requests
  if (method === 'GET') {
    const cached = requestCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`✅ Cache hit for: ${url}`)
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Si hay una request pendiente para la misma URL, esperar resultado
    if (pendingRequests.has(cacheKey)) {
      console.log(`⏳ Waiting for pending request: ${url}`)
      return pendingRequests.get(cacheKey)!
    }
  }

  console.log(`🌐 Making request to: ${url}`)
  
  // Verificar autenticación solo para requests protegidas
  if (url.startsWith('/api/') && !url.includes('/auth/')) {
    if (isRefreshing && refreshPromise) {
      console.log('⏳ Esperando refresh en progreso...')
      await refreshPromise
    }
    
    const hasValidTokens = await authUtils.ensureValidTokens()
    if (!hasValidTokens) {
      throw new Error('Sesión expirada')
    }
  }

  const tokens = authUtils.getTokens()
  const headers = new Headers(options.headers)
  
  if (tokens && url.startsWith('/api/') && !url.includes('/auth/')) {
    headers.set('Authorization', `Bearer ${tokens.idToken}`)
    headers.set('X-Auth-Token', tokens.idToken)
  }
  
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const requestOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include'
  }

  // Crear la promesa de request
  const requestPromise = (async () => {
    try {
      let response = await fetch(url, requestOptions)

      // Manejar 401 con refresh automático
      if (response.status === 401 && tokens && !url.includes('/auth/')) {
        if (!isRefreshing) {
          isRefreshing = true
          refreshPromise = authUtils.refreshTokens()
          
          try {
            const refreshed = await refreshPromise
            if (refreshed) {
              const newTokens = authUtils.getTokens()
              if (newTokens) {
                headers.set('Authorization', `Bearer ${newTokens.idToken}`)
                headers.set('X-Auth-Token', newTokens.idToken)
                response = await fetch(url, { ...requestOptions, headers })
              }
            }
          } finally {
            isRefreshing = false
            refreshPromise = null
          }
        }
        
        if (response.status === 401) {
          authUtils.logout()
          throw new Error('Sesión expirada')
        }
      }

      // Cachear respuesta exitosa para GET requests
      if (response.ok && method === 'GET') {
        const data = await response.clone().json()
        requestCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: getTTL(url)
        })
      }

      return response
    } finally {
      // Remover de requests pendientes
      if (method === 'GET') {
        pendingRequests.delete(cacheKey)
      }
    }
  })()

  // Agregar a requests pendientes para GET
  if (method === 'GET') {
    pendingRequests.set(cacheKey, requestPromise)
  }

  return requestPromise
}

// Hook optimizado con debouncing y cancelación
export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Función para cancelar requests previos
  const cancelPendingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // Request con debouncing automático
  const request = useCallback(async (
    url: string, 
    options: RequestInit = {},
    showLoading = true,
    debounceMs = 0
  ) => {
    // Cancelar requests previos
    cancelPendingRequests()

    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        try {
          if (showLoading) setLoading(true)
          setError(null)

          // Crear nuevo AbortController
          abortControllerRef.current = new AbortController()
          
          const response = await authenticatedFetch(url, {
            ...options,
            signal: abortControllerRef.current.signal
          })
          
          if (!response.ok) {
            const contentType = response.headers.get('content-type')
            let errorData
            
            if (contentType && contentType.includes('application/json')) {
              errorData = await response.json()
            } else {
              errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
            }
            
            if (response.status === 401) {
              authUtils.logout()
              throw new Error('Sesión expirada')
            }
            
            throw new Error(errorData.error || `HTTP ${response.status}`)
          }

          const contentType = response.headers.get('content-type')
          const data = contentType && contentType.includes('application/json') 
            ? await response.json() 
            : await response.text()
            
          // Invalidar cache relacionado para operaciones que modifican datos
          if (['POST', 'PUT', 'DELETE'].includes(options.method || 'GET')) {
            invalidateRelatedCache(url)
          }
          
          resolve(data)
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.log('Request cancelled')
            return
          }
          
          const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
          setError(errorMessage)
          reject(err)
        } finally {
          if (showLoading) setLoading(false)
          abortControllerRef.current = null
        }
      }

      // Aplicar debouncing si es necesario
      if (debounceMs > 0) {
        timeoutRef.current = setTimeout(executeRequest, debounceMs)
      } else {
        executeRequest()
      }
    })
  }, [cancelPendingRequests])

  const get = useCallback((url: string, showLoading = true, debounceMs = 0) => {
    return request(url, { method: 'GET' }, showLoading, debounceMs)
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

  // Cleanup en unmount
  const cleanup = useCallback(() => {
    cancelPendingRequests()
  }, [cancelPendingRequests])

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    request,
    cleanup,
    clearError: () => setError(null)
  }
}

// Función para invalidar cache relacionado
function invalidateRelatedCache(url: string) {
  const patterns = [
    '/api/clientes',
    '/api/proyectos', 
    '/api/pagos',
    '/api/dashboard',
    '/api/estadisticas'
  ]
  
  for (const [key] of requestCache.entries()) {
    for (const pattern of patterns) {
      if (key.includes(pattern)) {
        requestCache.delete(key)
      }
    }
  }
}

// Hook para invalidar cache manualmente
export function useCacheInvalidation() {
  const invalidateCache = useCallback((pattern?: string) => {
    if (pattern) {
      for (const [key] of requestCache.entries()) {
        if (key.includes(pattern)) {
          requestCache.delete(key)
        }
      }
    } else {
      requestCache.clear()
    }
  }, [])

  return { invalidateCache }
}