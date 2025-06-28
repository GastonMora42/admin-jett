// lib/auth.ts
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
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('idToken', tokens.idToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
  },

  // Obtener tokens
  getTokens: (): AuthTokens | null => {
    if (typeof window === 'undefined') return null;
    
    const accessToken = localStorage.getItem('accessToken');
    const idToken = localStorage.getItem('idToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (accessToken && idToken && refreshToken) {
      return { accessToken, idToken, refreshToken };
    }
    return null;
  },

  // Limpiar tokens (logout)
  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
    }
  },

  // Verificar si está autenticado
  isAuthenticated: (): boolean => {
    const tokens = authUtils.getTokens();
    if (!tokens) return false;

    // Verificar si el token no ha expirado
    try {
      const tokenData = authUtils.decodeToken(tokens.idToken);
      const currentTime = Math.floor(Date.now() / 1000);
      return tokenData.exp > currentTime;
    } catch {
      return false;
    }
  },

  // Decodificar JWT para obtener información del usuario
  decodeToken: (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  // Obtener información del usuario actual
  getCurrentUser: (): User | null => {
    const tokens = authUtils.getTokens();
    if (!tokens) return null;

    const idTokenData = authUtils.decodeToken(tokens.idToken);
    if (!idTokenData) return null;

    return {
      email: idTokenData.email,
      name: idTokenData.name,
      given_name: idTokenData.given_name,
      family_name: idTokenData.family_name,
      sub: idTokenData.sub,
      // Incluir otros campos que puedas necesitar
      address: idTokenData.address,
      'custom:role': idTokenData['custom:role'],
    };
  },

  // Refrescar tokens automáticamente
  refreshTokens: async (): Promise<boolean> => {
    const tokens = authUtils.getTokens();
    if (!tokens?.refreshToken) return false;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (response.ok) {
        const newTokens = await response.json();
        authUtils.setTokens(newTokens);
        return true;
      }
    } catch (error) {
      console.error('Error refreshing tokens:', error);
    }

    // Si falla el refresh, limpiar tokens
    authUtils.clearTokens();
    return false;
  },

  // Logout completo
  logout: async () => {
    authUtils.clearTokens();
    
    // Opcional: llamar al endpoint de logout del servidor
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
    // Redirigir al login
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
  },
};