// components/AuthProvider.tsx - CORREGIDO para mejor sincronización
'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authUtils } from '@/lib/auth';

interface User {
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  sub: string;
  'custom:role'?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const refreshingRef = useRef(false);
  const lastTokenCheck = useRef<number>(0);

  // Rutas públicas
  const publicRoutes = ['/', '/auth/signin', '/auth/register', '/auth/error', '/auth/confirm'];
  const protectedRoutes = ['/dashboard', '/clientes', '/proyectos', '/pagos', '/facturacion', '/analytics', '/configuracion'];

  // Función para verificar autenticación con mejor sincronización
  const checkAuth = async (attemptRefresh = true, force = false) => {
    try {
      // Evitar checks muy frecuentes a menos que sea forzado
      const now = Date.now();
      if (!force && (now - lastTokenCheck.current) < 5000) { // 5 segundos
        console.log('🔍 Auth check skipped - too frequent');
        return isAuthenticated;
      }
      lastTokenCheck.current = now;

      console.log('🔍 Checking authentication state...', { attemptRefresh, force });
      
      const tokens = authUtils.getTokens();
      if (!tokens) {
        console.log('❌ No tokens found');
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }

      const authenticated = authUtils.isAuthenticated();
      const userData = authUtils.getCurrentUser();
      
      console.log('🔍 Auth check result:', { 
        authenticated, 
        hasUser: !!userData,
        email: userData?.email 
      });
      
      // Si no está autenticado pero tenemos tokens, intentar refresh
      if (!authenticated && attemptRefresh && tokens.refreshToken && !refreshingRef.current) {
        console.log('🔄 Token appears expired, attempting refresh...');
        refreshingRef.current = true;
        
        try {
          const refreshed = await authUtils.refreshTokens();
          if (refreshed) {
            console.log('✅ Tokens refreshed, rechecking auth state...');
            
            // NUEVO: Esperar más tiempo para asegurar sincronización
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const newAuthenticated = authUtils.isAuthenticated();
            const newUserData = authUtils.getCurrentUser();
            
            setIsAuthenticated(newAuthenticated);
            setUser(newUserData);
            return newAuthenticated;
          } else {
            console.log('❌ Refresh failed, clearing state');
            setIsAuthenticated(false);
            setUser(null);
            return false;
          }
        } catch (error) {
          console.error('❌ Error during refresh:', error);
          setIsAuthenticated(false);
          setUser(null);
          return false;
        } finally {
          refreshingRef.current = false;
        }
      }
      
      // Actualizar estado basado en la verificación actual
      setIsAuthenticated(authenticated);
      setUser(userData);
      return authenticated;
      
    } catch (error) {
      console.error('❌ Error in checkAuth:', error);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  // Inicialización
  useEffect(() => {
    const initAuth = async () => {
      console.log('🚀 Initializing authentication...');
      setIsLoading(true);
      
      await checkAuth(true, true); // Force check during initialization
      
      setIsLoading(false);
      setHasInitialized(true);
      console.log('✅ Authentication initialized');
    };

    initAuth();
  }, []);

  // Listener para cambios en tokens (para sincronización) - MEJORADO
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTokensUpdated = async () => {
      console.log('🔄 Tokens updated event received, rechecking auth...');
      // NUEVO: Pausa más larga para asegurar que las cookies se establecieron
      await new Promise(resolve => setTimeout(resolve, 600));
      await checkAuth(false, true); // Force recheck without refresh attempt
    };

    const handleTokensCleared = () => {
      console.log('🗑️ Tokens cleared event received, updating state...');
      setIsAuthenticated(false);
      setUser(null);
    };

    const handleBeforeUnload = () => {
      // Limpiar refs al cerrar la ventana
      refreshingRef.current = false;
    };

    window.addEventListener('auth-tokens-updated', handleTokensUpdated);
    window.addEventListener('auth-tokens-cleared', handleTokensCleared);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('auth-tokens-updated', handleTokensUpdated);
      window.removeEventListener('auth-tokens-cleared', handleTokensCleared);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Manejo de redirecciones - MEJORADO
  useEffect(() => {
    if (!hasInitialized || isLoading || refreshingRef.current) {
      return;
    }

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/');

    console.log('🎯 Route check:', { 
      pathname, 
      isAuthenticated, 
      isProtectedRoute, 
      isPublicRoute 
    });

    // Redirigir a login si es ruta protegida sin autenticación
    if (isProtectedRoute && !isAuthenticated) {
      console.log('🔒 Redirecting to login from protected route');
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(pathname));
      return;
    }
    
    // Redirigir a dashboard si está autenticado en login
    if (isAuthenticated && pathname === '/auth/signin') {
      console.log('✅ Authenticated user on login page, redirecting to dashboard');
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl') || '/dashboard';
      router.push(callbackUrl);
      return;
    }

  }, [pathname, isAuthenticated, hasInitialized, isLoading, router]);

  // Monitor de salud de tokens - MEJORADO
  useEffect(() => {
    if (!hasInitialized) return;

    const monitorTokenHealth = async () => {
      if (refreshingRef.current) return; // Skip if already refreshing
      
      const tokens = authUtils.getTokens();
      if (!tokens) return;

      const tokenData = authUtils.decodeToken(tokens.idToken);
      if (!tokenData) return;

      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiration = tokenData.exp - currentTime;

      // Refresh preventivo si expira en menos de 5 minutos
      if (timeUntilExpiration > 0 && timeUntilExpiration < 300 && !refreshingRef.current) {
        console.log('⏰ Token expires soon, preventive refresh...');
        await checkAuth(true, true);
      }
    };

    const interval = setInterval(monitorTokenHealth, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, [hasInitialized]);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting login process...');
      setIsLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication error');
      }

      console.log('✅ Login API call successful, saving tokens...');

      // Guardar tokens INMEDIATAMENTE
      authUtils.setTokens({
        accessToken: data.accessToken,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
      });

      // CRÍTICO: Esperar más tiempo para que las cookies se establezcan completamente
      console.log('⏳ Waiting for cookie synchronization...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Aumentado a 1 segundo

      // Verificar estado INMEDIATAMENTE después de guardar tokens
      const authSuccess = await checkAuth(false, true);
      
      console.log('✅ Login complete:', { 
        tokensSet: true, 
        authSuccess,
        user: authUtils.getCurrentUser()?.email 
      });
      
      if (!authSuccess) {
        console.log('⚠️ Auth state not established, but tokens are saved. Will retry on next request.');
        // No fallar aquí, las requests posteriores pueden activar el proceso
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('🚪 Starting logout...');
    setIsLoading(true);
    
    await authUtils.logout();
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const refreshAuth = async () => {
    if (refreshingRef.current) {
      console.log('⏳ Refresh already in progress...');
      return false;
    }

    return await checkAuth(true, true);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}