// lib/auth.ts - MEJORADO para sincronización perfecta con middleware
interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

interface User {
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  sub: string;
  [key: string]: any;
}

export const authUtils = {
  // Guardar tokens - MEJORADO para máxima compatibilidad
  setTokens: (tokens: AuthTokens) => {
    if (typeof window !== 'undefined') {
      try {
        // 1. Guardar en localStorage (backup principal)
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('idToken', tokens.idToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        console.log('💾 Tokens saved to localStorage');
        
        // 2. CRÍTICO: Establecer cookies con configuración óptima
        const isProduction = window.location.protocol === 'https:';
        const cookieOptions = isProduction 
          ? '; path=/; secure; samesite=strict; max-age=86400' // 24 horas
          : '; path=/; samesite=strict; max-age=86400';
        
        // Establecer AMBAS cookies que busca el middleware
        document.cookie = `token=${tokens.idToken}${cookieOptions}`;
        document.cookie = `idToken=${tokens.idToken}${cookieOptions}`;
        
        // 3. NUEVO: También establecer accessToken como cookie separada
        document.cookie = `accessToken=${tokens.accessToken}${cookieOptions}`;
        document.cookie = `refreshToken=${tokens.refreshToken}${cookieOptions}`;
        
        console.log('🍪 All tokens saved to cookies with options:', cookieOptions);

        // 4. NUEVO: Verificación inmediata de que las cookies se establecieron
        setTimeout(() => {
          const testCookie = document.cookie.includes(`token=${tokens.idToken}`);
          console.log('✅ Cookie verification:', testCookie ? 'SUCCESS' : 'FAILED');
          
          if (testCookie) {
            // Disparar evento para notificar que los tokens fueron actualizados
            window.dispatchEvent(new CustomEvent('auth-tokens-updated', {
              detail: { tokens, verified: true }
            }));
          }
        }, 100); // Pequeña pausa para asegurar que las cookies se establecieron

      } catch (error) {
        console.error('❌ Error saving tokens:', error);
      }
    }
  },

  // Obtener tokens - MEJORADO con fallbacks
  getTokens: (): AuthTokens | null => {
    if (typeof window === 'undefined') {
      console.log('🖥️ Server-side, no tokens available');
      return null;
    }
    
    try {
      // Método 1: localStorage (principal)
      const accessToken = localStorage.getItem('accessToken');
      const idToken = localStorage.getItem('idToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && idToken && refreshToken) {
        console.log('📱 Tokens found in localStorage');
        return { accessToken, idToken, refreshToken };
      }

      // Método 2: Fallback a cookies si localStorage falla
      console.log('📱 localStorage empty, trying cookies...');
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);

      if (cookies.idToken && cookies.accessToken && cookies.refreshToken) {
        console.log('🍪 Tokens found in cookies, syncing to localStorage');
        
        // Sincronizar de vuelta a localStorage
        localStorage.setItem('accessToken', cookies.accessToken);
        localStorage.setItem('idToken', cookies.idToken);
        localStorage.setItem('refreshToken', cookies.refreshToken);
        
        return {
          accessToken: cookies.accessToken,
          idToken: cookies.idToken,
          refreshToken: cookies.refreshToken
        };
      }

    } catch (error) {
      console.error('❌ Error reading tokens:', error);
    }
    
    console.log('📭 No tokens found anywhere');
    return null;
  },

  // Limpiar tokens - MEJORADO para limpieza completa
  clearTokens: () => {
    if (typeof window !== 'undefined') {
      try {
        // 1. Limpiar localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('refreshToken');
        
        // 2. Limpiar TODAS las cookies relacionadas
        const cookiesToClear = ['token', 'idToken', 'accessToken', 'refreshToken'];
        const clearOptions = '; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        
        cookiesToClear.forEach(cookieName => {
          document.cookie = `${cookieName}=${clearOptions}`;
          // También para subdominios si existe
          if (window.location.hostname.includes('.')) {
            const domain = window.location.hostname.split('.').slice(-2).join('.');
            document.cookie = `${cookieName}=${clearOptions} domain=.${domain}`;
          }
        });
        
        console.log('🗑️ All tokens cleared from localStorage and cookies');

        // 3. Verificación de limpieza
        setTimeout(() => {
          const stillHasCookies = cookiesToClear.some(name => 
            document.cookie.includes(`${name}=`)
          );
          console.log('🧹 Cookie cleanup verification:', stillHasCookies ? 'INCOMPLETE' : 'COMPLETE');
        }, 100);

        // 4. Disparar evento de limpieza
        window.dispatchEvent(new CustomEvent('auth-tokens-cleared'));
      } catch (error) {
        console.error('❌ Error clearing tokens:', error);
      }
    }
  },

  // Verificar autenticación - MEJORADO con mejor validación
  isAuthenticated: (): boolean => {
    const tokens = authUtils.getTokens();
    if (!tokens) {
      console.log('🔍 Not authenticated: no tokens');
      return false;
    }

    try {
      const tokenData = authUtils.decodeToken(tokens.idToken);
      if (!tokenData) {
        console.log('🔍 Not authenticated: invalid token');
        authUtils.clearTokens(); // Limpiar tokens inválidos
        return false;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiration = tokenData.exp - currentTime;
      const isValid = timeUntilExpiration > 60; // Buffer de 1 minuto
      
      console.log('🔍 Token validation:', { 
        exp: tokenData.exp, 
        current: currentTime, 
        timeUntilExpiration,
        isValid,
        email: tokenData.email 
      });
      
      if (!isValid) {
        console.log('⏰ Token expired or expiring soon, cleaning up');
        authUtils.clearTokens();
      }
      
      return isValid;
    } catch (error) {
      console.error('❌ Error validating token:', error);
      authUtils.clearTokens();
      return false;
    }
  },

  // Decodificar JWT - sin cambios, funciona bien
  decodeToken: (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        console.error('❌ Invalid token format - no payload');
        return null;
      }

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const decoded = JSON.parse(jsonPayload);
      console.log('🔓 Token decoded successfully for:', decoded.email);
      return decoded;
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      return null;
    }
  },

  // Obtener usuario actual - sin cambios, funciona bien
  getCurrentUser: (): User | null => {
    const tokens = authUtils.getTokens();
    if (!tokens) {
      console.log('👤 No user: no tokens');
      return null;
    }

    const idTokenData = authUtils.decodeToken(tokens.idToken);
    if (!idTokenData) {
      console.log('👤 No user: invalid token');
      return null;
    }

    const user = {
      email: idTokenData.email || '',
      name: idTokenData.name || '',
      given_name: idTokenData.given_name || '',
      family_name: idTokenData.family_name || '',
      sub: idTokenData.sub || '',
      address: idTokenData.address,
      'custom:role': idTokenData['custom:role'],
    };

    console.log('👤 Current user:', { email: user.email, role: user['custom:role'] });
    return user;
  },

  // Refrescar tokens - MEJORADO con mejor manejo de errores
  refreshTokens: async (): Promise<boolean> => {
    const tokens = authUtils.getTokens();
    if (!tokens?.refreshToken) {
      console.log('🔄 Cannot refresh: no refresh token');
      return false;
    }

    try {
      console.log('🔄 Attempting token refresh...');
      
      const requestBody = { 
        refreshToken: tokens.refreshToken,
        idToken: tokens.idToken
      };

      console.log('📡 Sending refresh request...');
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const newTokens = await response.json();
        console.log('✅ New tokens received, saving...');
        
        // CRÍTICO: Actualizar tokens INMEDIATAMENTE
        authUtils.setTokens(newTokens);
        
        // NUEVO: Pausa más larga para asegurar sincronización completa
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verificar que los tokens se guardaron correctamente
        const verifyTokens = authUtils.getTokens();
        const success = verifyTokens?.idToken === newTokens.idToken;
        
        console.log('✅ Tokens refreshed and verified:', success);
        return success;
      } else {
        const errorData = await response.json();
        console.log('❌ Token refresh failed:', response.status, errorData.error);
        
        if (response.status === 400 || response.status === 401) {
          console.log('🗑️ Clearing invalid tokens');
          authUtils.clearTokens();
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Error refreshing tokens:', error);
      return false;
    }
  },

  // Logout completo - sin cambios, funciona bien
  logout: async () => {
    console.log('🚪 Starting logout process...');
    
    // Limpiar tokens inmediatamente
    authUtils.clearTokens();
    
    // Opcional: llamar al endpoint de logout del servidor
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      console.log('✅ Server logout completed');
    } catch (error) {
      console.error('❌ Error during server logout:', error);
    }
    
    // Redirigir al login
    if (typeof window !== 'undefined') {
      console.log('🔄 Redirecting to login...');
      window.location.href = '/auth/signin';
    }
  },

  // NUEVO: Método para forzar sincronización de cookies
  forceCookieSync: () => {
    const tokens = authUtils.getTokens();
    if (tokens) {
      console.log('🔄 Forcing cookie synchronization...');
      authUtils.setTokens(tokens);
      return true;
    }
    return false;
  },

  // Verificar y refrescar tokens - MEJORADO
  ensureValidTokens: async (): Promise<boolean> => {
    console.log('🔍 Ensuring valid tokens...');
    
    const tokens = authUtils.getTokens();
    if (!tokens) {
      console.log('❌ No tokens available');
      return false;
    }

    const tokenData = authUtils.decodeToken(tokens.idToken);
    if (!tokenData) {
      console.log('❌ Invalid token format');
      authUtils.clearTokens();
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiration = tokenData.exp - currentTime;

    // Si el token ya expiró
    if (timeUntilExpiration <= 0) {
      console.log('⏰ Token expired, attempting refresh...');
      return await authUtils.refreshTokens();
    }

    // Si el token expira en menos de 2 minutos, refrescar preventivamente
    if (timeUntilExpiration < 120) {
      console.log('⏰ Token expires soon, preemptive refresh...');
      const refreshResult = await authUtils.refreshTokens();
      
      if (!refreshResult && timeUntilExpiration > 0) {
        console.log('⚠️ Refresh failed but token still valid, continuing...');
        // Forzar sincronización de cookies como fallback
        authUtils.forceCookieSync();
        return true;
      }
      
      return refreshResult;
    }

    // Token válido, pero asegurar que las cookies estén sincronizadas
    authUtils.forceCookieSync();
    console.log('✅ Tokens are valid and synchronized');
    return true;
  }
};