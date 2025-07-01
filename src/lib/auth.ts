// lib/auth.ts - VERSIÓN MEJORADA para sincronización perfecta con middleware
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
  // MEJORADO: Guardar tokens en múltiples formatos para compatibilidad máxima
  setTokens: (tokens: AuthTokens) => {
    if (typeof window !== 'undefined') {
      try {
        // 1. Guardar en localStorage (backup principal)
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('idToken', tokens.idToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        console.log('💾 Tokens saved to localStorage');
        
        // 2. CRÍTICO: Establecer cookies simples que el middleware puede leer fácilmente
        const isProduction = window.location.protocol === 'https:';
        const cookieOptions = isProduction 
          ? '; path=/; secure; samesite=strict; max-age=86400' // 24 horas
          : '; path=/; samesite=strict; max-age=86400';
        
        // Cookies simples para el middleware
        document.cookie = `token=${tokens.idToken}${cookieOptions}`;
        document.cookie = `idToken=${tokens.idToken}${cookieOptions}`;
        document.cookie = `accessToken=${tokens.accessToken}${cookieOptions}`;
        document.cookie = `refreshToken=${tokens.refreshToken}${cookieOptions}`;
        
        console.log('🍪 Simple tokens saved to cookies');

        // 3. NUEVO: También establecer cookies de Cognito si vienen de AWS
        // Esto mantiene compatibilidad con el sistema AWS Amplify si lo usas
        if (tokens.idToken && tokens.idToken.includes('eyJ')) {
          try {
            const decoded = authUtils.decodeToken(tokens.idToken);
            if (decoded && decoded.email) {
              const userEmail = decoded.email;
              const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '7tmctt10ht1q3tff359eii7jv0';
              
              // Formato de cookies de Cognito
              const cognitoPrefix = `CognitoIdentityServiceProvider.${clientId}.${encodeURIComponent(userEmail)}`;
              document.cookie = `${cognitoPrefix}.accessToken=${tokens.accessToken}${cookieOptions}`;
              document.cookie = `${cognitoPrefix}.idToken=${tokens.idToken}${cookieOptions}`;
              document.cookie = `${cognitoPrefix}.refreshToken=${tokens.refreshToken}${cookieOptions}`;
              document.cookie = `CognitoIdentityServiceProvider.${clientId}.LastAuthUser=${encodeURIComponent(userEmail)}${cookieOptions}`;
              
              console.log('🍪 Cognito-style tokens saved for compatibility');
            }
          } catch (error) {
            console.warn('⚠️ Could not set Cognito-style cookies:', error);
          }
        }

        // 4. Verificación inmediata de que las cookies se establecieron
        setTimeout(() => {
          const testCookie = document.cookie.includes(`token=${tokens.idToken}`);
          console.log('✅ Cookie verification:', testCookie ? 'SUCCESS' : 'FAILED');
          
          if (testCookie) {
            // Disparar evento para notificar que los tokens fueron actualizados
            window.dispatchEvent(new CustomEvent('auth-tokens-updated', {
              detail: { tokens, verified: true }
            }));
          }
        }, 100);

      } catch (error) {
        console.error('❌ Error saving tokens:', error);
      }
    }
  },

  // MEJORADO: Obtener tokens con múltiples fallbacks incluyendo Cognito
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

      // Método 2: Cookies simples
      console.log('📱 localStorage empty, trying simple cookies...');
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);

      if (cookies.idToken && cookies.accessToken && cookies.refreshToken) {
        console.log('🍪 Tokens found in simple cookies');
        return {
          accessToken: cookies.accessToken,
          idToken: cookies.idToken,
          refreshToken: cookies.refreshToken
        };
      }

      // Método 3: NUEVO - Buscar cookies de Cognito
      console.log('📱 Simple cookies empty, trying Cognito cookies...');
      const cognitoTokens = authUtils.extractCognitoTokens(cookies);
      if (cognitoTokens) {
        console.log('🍪 Tokens found in Cognito cookies, syncing to localStorage');
        
        // Sincronizar de vuelta a localStorage
        localStorage.setItem('accessToken', cognitoTokens.accessToken);
        localStorage.setItem('idToken', cognitoTokens.idToken);
        localStorage.setItem('refreshToken', cognitoTokens.refreshToken);
        
        return cognitoTokens;
      }

    } catch (error) {
      console.error('❌ Error reading tokens:', error);
    }
    
    console.log('📭 No tokens found anywhere');
    return null;
  },

  // NUEVO: Extraer tokens de cookies de Cognito
  extractCognitoTokens: (cookies: Record<string, string>): AuthTokens | null => {
    try {
      let accessToken = '';
      let idToken = '';
      let refreshToken = '';

      // Buscar cookies de Cognito
      for (const [cookieName, cookieValue] of Object.entries(cookies)) {
        if (cookieName.includes('CognitoIdentityServiceProvider') && cookieName.includes('.accessToken')) {
          accessToken = cookieValue;
        } else if (cookieName.includes('CognitoIdentityServiceProvider') && cookieName.includes('.idToken')) {
          idToken = cookieValue;
        } else if (cookieName.includes('CognitoIdentityServiceProvider') && cookieName.includes('.refreshToken')) {
          refreshToken = cookieValue;
        }
      }

      if (accessToken && idToken && refreshToken) {
        console.log('🔍 Successfully extracted Cognito tokens');
        return { accessToken, idToken, refreshToken };
      }

      return null;
    } catch (error) {
      console.error('❌ Error extracting Cognito tokens:', error);
      return null;
    }
  },

  // MEJORADO: Limpiar TODOS los tipos de cookies
  clearTokens: () => {
    if (typeof window !== 'undefined') {
      try {
        // 1. Limpiar localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('refreshToken');
        
        // 2. Limpiar cookies simples
        const clearOptions = '; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        const simpleCookies = ['token', 'idToken', 'accessToken', 'refreshToken'];
        
        simpleCookies.forEach(cookieName => {
          document.cookie = `${cookieName}=${clearOptions}`;
        });

        // 3. NUEVO: Limpiar cookies de Cognito
        const allCookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key] = cookie.trim().split('=');
          if (key) acc.push(key);
          return acc;
        }, [] as string[]);

        allCookies.forEach(cookieName => {
          if (cookieName.includes('CognitoIdentityServiceProvider')) {
            document.cookie = `${cookieName}=${clearOptions}`;
          }
        });
        
        console.log('🗑️ All tokens cleared from localStorage and all cookie types');

        // 4. Disparar evento de limpieza
        window.dispatchEvent(new CustomEvent('auth-tokens-cleared'));
      } catch (error) {
        console.error('❌ Error clearing tokens:', error);
      }
    }
  },

  // Verificar autenticación - sin cambios, funciona bien
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
        authUtils.clearTokens();
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

  // Refrescar tokens - sin cambios, funciona bien
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
        
        // Pausa para asegurar sincronización completa
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

  // MEJORADO: Método para forzar sincronización de cookies
  forceCookieSync: () => {
    const tokens = authUtils.getTokens();
    if (tokens) {
      console.log('🔄 Forcing cookie synchronization...');
      authUtils.setTokens(tokens);
      return true;
    }
    return false;
  },

  // Verificar y refrescar tokens - sin cambios, funciona bien
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