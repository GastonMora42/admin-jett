// src/lib/api-client.ts - MEJORADO para funcionar perfectamente con el nuevo middleware
import { authUtils } from '@/lib/auth'

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// NUEVA: Función para verificar si el middleware puede leer las cookies
async function ensureMiddlewareCompatibility(): Promise<boolean> {
  const tokens = authUtils.getTokens();
  if (!tokens) {
    console.log('❌ No tokens available for middleware compatibility check');
    return false;
  }

  // Forzar sincronización de cookies para asegurar que el middleware las pueda leer
  authUtils.forceCookieSync();
  
  // Pequeña pausa para que las cookies se propaguen
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('✅ Middleware compatibility ensured');
  return true;
}

// Función helper para hacer requests autenticadas - MEJORADA
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
  
  // CRÍTICO: Asegurar que tenemos tokens válidos Y que el middleware los puede leer
  const hasValidTokens = await authUtils.ensureValidTokens();
  
  if (!hasValidTokens) {
    console.log('❌ No valid tokens available after validation');
    authUtils.logout();
    throw new Error('No hay autenticación válida disponible');
  }

  // NUEVO: Asegurar compatibilidad con middleware
  await ensureMiddlewareCompatibility();

  const tokens = authUtils.getTokens();
  
  if (!tokens) {
    console.log('❌ No tokens found after validation');
    authUtils.logout();
    throw new Error('No hay token de autenticación');
  }

  const headers = new Headers(options.headers);
  
  // CRÍTICO: Múltiples métodos para enviar el token (compatibilidad máxima)
  headers.set('Authorization', `Bearer ${tokens.idToken}`);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Auth-Token', tokens.idToken);
  
  // NUEVO: También enviar el accessToken en un header separado por si acaso
  headers.set('X-Access-Token', tokens.accessToken);

  console.log(`📡 Sending request with multiple auth methods to: ${url}`, {
    hasAuthHeader: !!headers.get('Authorization'),
    hasCustomHeader: !!headers.get('X-Auth-Token'),
    hasAccessHeader: !!headers.get('X-Access-Token'),
    tokenLength: tokens.idToken?.length || 0,
  });
  
  // CRÍTICO: Usar credentials: 'include' para asegurar que las cookies se envíen
  const requestOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include' // Esto es clave para que las cookies lleguen al middleware
  };

  // Primera tentativa
  let response = await fetch(url, requestOptions);

  // Si obtenemos 401, intentar refresh UNA sola vez
  if (response.status === 401) {
    console.log('🔄 Received 401, attempting token refresh...');
    
    // Evitar múltiples refreshes simultáneos
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = authUtils.refreshTokens();
      
      try {
        const refreshed = await refreshPromise;
        
        if (refreshed) {
          console.log('🔄 Retrying request with refreshed token...');
          
          // IMPORTANTE: Asegurar compatibilidad DESPUÉS del refresh
          await ensureMiddlewareCompatibility();
          
          // Obtener los nuevos tokens
          const newTokens = authUtils.getTokens();
          if (newTokens) {
            // Actualizar headers con nuevo token
            headers.set('Authorization', `Bearer ${newTokens.idToken}`);
            headers.set('X-Auth-Token', newTokens.idToken);
            headers.set('X-Access-Token', newTokens.accessToken);
            
            console.log('🔄 Retrying with refreshed tokens...');
            
            // Reintentar la request
            response = await fetch(url, { 
              ...options, 
              headers,
              credentials: 'include'
            });
            
            if (response.status === 401) {
              console.log('❌ Still 401 after refresh, logging out');
              authUtils.logout();
              throw new Error('Sesión expirada');
            }
          } else {
            console.log('❌ No tokens found after refresh');
            authUtils.logout();
            throw new Error('Error obteniendo tokens después del refresh');
          }
        } else {
          console.log('❌ Refresh failed, logging out');
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
          await ensureMiddlewareCompatibility();
          const newTokens = authUtils.getTokens();
          if (newTokens) {
            console.log('🔄 Using refreshed token from parallel refresh...');
            headers.set('Authorization', `Bearer ${newTokens.idToken}`);
            headers.set('X-Auth-Token', newTokens.idToken);
            headers.set('X-Access-Token', newTokens.accessToken);
            
            return fetch(url, { ...options, headers, credentials: 'include' });
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

  console.log(`✅ Request successful: ${response.status} for ${url}`);
  return response;
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

      // NUEVO: Pre-check de autenticación para requests críticos
      if (url.startsWith('/api/') && !url.includes('/auth/')) {
        const isAuthenticated = authUtils.isAuthenticated();
        if (!isAuthenticated) {
          console.log('❌ Pre-flight auth check failed');
          throw new Error('Sesión expirada - por favor inicia sesión nuevamente');
        }
      }

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
        
        // NUEVO: Manejo específico de errores de autenticación
        if (response.status === 401) {
          console.log('🔐 401 error - triggering logout');
          authUtils.logout();
          throw new Error('Sesión expirada - redirigiendo al login...');
        }
        
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

// NUEVA: Función para hacer requests simples sin autenticación (para endpoints públicos)
export async function publicFetch(url: string, options: RequestInit = {}) {
  console.log(`🌍 Making public request to: ${url}`);
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  console.log(`${response.ok ? '✅' : '❌'} Public request result: ${response.status} for ${url}`);
  return response;
}

// NUEVA: Hook para requests públicos
export function usePublicApi() {
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

      const response = await publicFetch(url, options)
      
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

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
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

  return {
    loading,
    error,
    get,
    post,
    request
  }
}