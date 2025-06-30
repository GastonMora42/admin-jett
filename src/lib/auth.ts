// lib/auth.ts - CORREGIDO CON MEJOR MANEJO DE REFRESH
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
  // Guardar tokens
  setTokens: (tokens: AuthTokens) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('idToken', tokens.idToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        console.log('💾 Tokens saved to localStorage');
      } catch (error) {
        console.error('❌ Error saving tokens:', error);
      }
    }
  },

  // Obtener tokens
  getTokens: (): AuthTokens | null => {
    if (typeof window === 'undefined') {
      console.log('🖥️ Server-side, no tokens available');
      return null;
    }
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      const idToken = localStorage.getItem('idToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && idToken && refreshToken) {
        console.log('📱 Tokens found in localStorage');
        return { accessToken, idToken, refreshToken };
      }
    } catch (error) {
      console.error('❌ Error reading tokens:', error);
    }
    
    console.log('📭 No tokens found');
    return null;
  },

  // Limpiar tokens (logout)
  clearTokens: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('refreshToken');
        console.log('🗑️ Tokens cleared from localStorage');
      } catch (error) {
        console.error('❌ Error clearing tokens:', error);
      }
    }
  },

  // Verificar si está autenticado
  isAuthenticated: (): boolean => {
    const tokens = authUtils.getTokens();
    if (!tokens) {
      console.log('🔍 Not authenticated: no tokens');
      return false;
    }

    // Verificar si el token no ha expirado
    try {
      const tokenData = authUtils.decodeToken(tokens.idToken);
      if (!tokenData) {
        console.log('🔍 Not authenticated: invalid token');
        return false;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiration = tokenData.exp - currentTime;
      const isValid = timeUntilExpiration > 0;
      
      console.log('🔍 Token validation:', { 
        exp: tokenData.exp, 
        current: currentTime, 
        timeUntilExpiration,
        isValid 
      });
      
      // Si está cerca de expirar (menos de 5 minutos), considerar como expirado
      // para forzar un refresh proactivo
      if (timeUntilExpiration < 300 && timeUntilExpiration > 0) {
        console.log('⏰ Token expires soon, will need refresh');
        return false; // Esto forzará un refresh
      }
      
      if (!isValid) {
        console.log('⏰ Token expired');
      }
      
      return isValid;
    } catch (error) {
      console.error('❌ Error validating token:', error);
      authUtils.clearTokens();
      return false;
    }
  },

  // Decodificar JWT para obtener información del usuario
  decodeToken: (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        console.error('❌ Invalid token format');
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
      console.log('🔓 Token decoded successfully');
      return decoded;
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      return null;
    }
  },

  // Obtener información del usuario actual
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

  // Refrescar tokens automáticamente - MEJORADO
  refreshTokens: async (): Promise<boolean> => {
    const tokens = authUtils.getTokens();
    if (!tokens?.refreshToken) {
      console.log('🔄 Cannot refresh: no refresh token');
      return false;
    }

    try {
      console.log('🔄 Attempting token refresh...');
      
      // Preparar la solicitud con mejor manejo de errores
      const requestBody = { 
        refreshToken: tokens.refreshToken,
        idToken: tokens.idToken // Enviar idToken para obtener username
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
        
        authUtils.setTokens(newTokens);
        console.log('✅ Tokens refreshed successfully');
        return true;
      } else {
        const errorData = await response.json();
        console.log('❌ Token refresh failed:', response.status, errorData.error);
        
        // Si el error es por token expirado o inválido, limpiar tokens
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

  // Logout completo
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

  // Nueva función: verificar y refrescar tokens si es necesario
  ensureValidTokens: async (): Promise<boolean> => {
    console.log('🔍 Checking token validity...');
    
    // Si ya está autenticado, todo bien
    if (authUtils.isAuthenticated()) {
      console.log('✅ Tokens are valid');
      return true;
    }

    // Si no está autenticado, intentar refresh
    console.log('🔄 Tokens expired or invalid, attempting refresh...');
    return await authUtils.refreshTokens();
  }
};