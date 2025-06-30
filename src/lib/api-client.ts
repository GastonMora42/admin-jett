// src/lib/api-client.ts - CORREGIDO para timing issues
import { authUtils } from '@/lib/auth'

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Función helper para hacer requests autenticadas - CORREGIDA para timing
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
  
  // CRÍTICO: Asegurar que tenemos tokens válidos ANTES de hacer la request
  const hasValidTokens = await authUtils.ensureValidTokens();
  
  if (!hasValidTokens) {
    console.log('❌ No valid tokens available after validation');
    authUtils.logout();
    throw new Error('No hay autenticación válida disponible');
  }

  // NUEVO: Esperar más tiempo para asegurar sincronización de cookies
  await new Promise(resolve => setTimeout(resolve, 500));

  const tokens = authUtils.getTokens();
  
  if (!tokens) {
    console.log('❌ No tokens found after validation');
    authUtils.logout();
    throw new Error('No hay token de autenticación');
  }

  const headers = new Headers(options.headers);
  
  // CRÍTICO: Múltiples formas de enviar el token para compatibilidad máxima
  headers.set('Authorization', `Bearer ${tokens.idToken}`);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Auth-Token', tokens.idToken);
  
  // NUEVO: También establecer cookies manualmente en el header si es necesario
  const existingCookies = headers.get('Cookie') || '';
  const tokenCookies = `token=${tokens.idToken}; idToken=${tokens.idToken}`;
  headers.set('Cookie', existingCookies ? `${existingCookies}; ${tokenCookies}` : tokenCookies);

  console.log(`📡 Sending request with multiple token methods to: ${url}`, {
    hasAuthHeader: !!headers.get('Authorization'),
    hasCustomHeader: !!headers.get('X-Auth-Token'),
    hasCookieHeader: !!headers.get('Cookie'),
    tokenLength: tokens.idToken?.length || 0,
  });
  
  // Primera tentativa
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // IMPORTANTE: incluir cookies
  });

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
          
          // IMPORTANTE: Esperar más tiempo después del refresh
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Obtener los nuevos tokens
          const newTokens = authUtils.getTokens();
          if (newTokens) {
            // Actualizar headers con nuevo token
            headers.set('Authorization', `Bearer ${newTokens.idToken}`);
            headers.set('X-Auth-Token', newTokens.idToken);
            
            // Actualizar cookies en header
            const newTokenCookies = `token=${newTokens.idToken}; idToken=${newTokens.idToken}`;
            headers.set('Cookie', newTokenCookies);
            
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
          const newTokens = authUtils.getTokens();
          if (newTokens) {
            console.log('🔄 Using refreshed token from parallel refresh...');
            headers.set('Authorization', `Bearer ${newTokens.idToken}`);
            headers.set('X-Auth-Token', newTokens.idToken);
            
            const newTokenCookies = `token=${newTokens.idToken}; idToken=${newTokens.idToken}`;
            headers.set('Cookie', newTokenCookies);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
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