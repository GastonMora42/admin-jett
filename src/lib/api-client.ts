// src/lib/api-client.ts - MEJORADO CON MEJOR MANEJO DE TOKENS
import { authUtils } from '@/lib/auth'

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Función helper para hacer requests autenticadas con mejor manejo de refresh
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  console.log(`🌐 Making authenticated request to: ${url}`);
  
  // Si ya hay un refresh en progreso, esperar a que termine
  if (isRefreshing && refreshPromise) {
    console.log('⏳ Esperando refresh en progreso...');
    const refreshResult = await refreshPromise;
    if (!refreshResult) {
      throw new Error('Refresh falló, sesión expirada');
    }
  }
  
  // Intentar asegurar que tenemos tokens válidos antes de hacer la request
  const hasValidTokens = await authUtils.ensureValidTokens();
  
  if (!hasValidTokens) {
    console.log('❌ No valid tokens available, redirecting to login');
    authUtils.logout();
    throw new Error('No hay autenticación válida disponible');
  }

  const tokens = authUtils.getTokens();
  
  if (!tokens) {
    console.log('❌ No tokens found after validation');
    authUtils.logout();
    throw new Error('No hay token de autenticación');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${tokens.idToken}`);
  headers.set('Content-Type', 'application/json');

  // DEBUGGING: Log del token para verificar
  console.log(`📡 Sending request with token to: ${url}`, {
    hasToken: !!tokens.idToken,
    tokenLength: tokens.idToken?.length || 0,
    tokenStart: tokens.idToken?.substring(0, 20) + '...'
  });
  
  const response = await fetch(url, {
    ...options,
    headers
  });

  // Si el token expiró, intentar refrescar UNA vez más
  if (response.status === 401) {
    console.log('🔄 Received 401, token might be expired, attempting refresh...');
    
    // Evitar múltiples refreshes simultáneos
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = authUtils.refreshTokens();
      
      try {
        const refreshed = await refreshPromise;
        
        if (refreshed) {
          // Reintentar con el nuevo token
          const newTokens = authUtils.getTokens();
          if (newTokens) {
            console.log('🔄 Retrying request with refreshed token...');
            headers.set('Authorization', `Bearer ${newTokens.idToken}`);
            const retryResponse = await fetch(url, { ...options, headers });
            
            if (retryResponse.status === 401) {
              console.log('❌ Still 401 after refresh, logging out');
              authUtils.logout();
              throw new Error('Sesión expirada');
            }
            
            return retryResponse;
          }
        } else {
          // Si no se pudo refrescar, redirigir al login
          console.log('❌ No se pudo refrescar el token, redirigiendo al login');
          authUtils.logout();
          throw new Error('Sesión expirada');
        }
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    } else {
      // Si ya hay un refresh en progreso, esperar
      if (refreshPromise) {
        const refreshResult = await refreshPromise;
        if (refreshResult) {
          const newTokens = authUtils.getTokens();
          if (newTokens) {
            console.log('🔄 Using refreshed token from parallel refresh...');
            headers.set('Authorization', `Bearer ${newTokens.idToken}`);
            return fetch(url, { ...options, headers });
          }
        }
      }
      
      authUtils.logout();
      throw new Error('Sesión expirada');
    }
  }

  // Para otros errores de servidor, manejar apropiadamente
  if (!response.ok && response.status >= 500) {
    console.error(`🚨 Server error ${response.status} for ${url}`);
    throw new Error(`Error del servidor: ${response.status}`);
  }

  return response;
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

// Hook personalizado mejorado para usar en los componentes
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

      console.log(`🎯 API Request: ${options.method || 'GET'} ${url}`);

      const response = await authenticatedFetch(url, options)
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let errorData
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json()
        } else {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        
        console.error(`❌ API Error ${response.status} for ${url}:`, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // Verificar si la respuesta tiene contenido JSON
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        console.log(`✅ API Success: ${options.method || 'GET'} ${url}`);
        return data
      } else {
        // Si no es JSON, devolver texto
        const text = await response.text()
        console.log(`✅ API Success (text): ${options.method || 'GET'} ${url}`);
        return text
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error(`💥 API Request failed for ${url}:`, errorMessage);
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