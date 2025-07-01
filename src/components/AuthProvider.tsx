// components/AuthProvider.tsx - MEJORADO para solucionar problemas de sincronización
'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
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
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Rutas públicas
  const publicRoutes = ['/', '/auth/signin', '/auth/register', '/auth/error', '/auth/confirm'];
  const protectedRoutes = ['/dashboard', '/clientes', '/proyectos', '/pagos', '/facturacion', '/analytics', '/configuracion'];

  // NUEVA: Función de verificación de auth más robusta
  const checkAuth = useCallback(async (attemptRefresh = true, force = false) => {
    try {
      const now = Date.now();
      if (!force && (now - lastTokenCheck.current) < 3000) { // Reducido a 3 segundos
        console.log('🔍 Auth check skipped - too frequent');
        return isAuthenticated;
      }
      lastTokenCheck.current = now;

      console.log('🔍 Checking authentication state...', { attemptRefresh, force });
      
      // NUEVO: Verificar que tenemos tokens válidos ANTES de continuar
      const hasValidTokens = await authUtils.ensureValidTokens();
      if (!hasValidTokens) {
        console.log('❌ No valid tokens after ensure check');
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }

      const tokens = authUtils.getTokens();
      if (!tokens) {
        console.log('❌ No tokens found after validation');
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
            
            // MEJORADO: Pausa más larga y verificación múltiple
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const newAuthenticated = authUtils.isAuthenticated();
            const newUserData = authUtils.getCurrentUser();
            
            console.log('🔍 Post-refresh check:', { newAuthenticated, hasNewUser: !!newUserData });
            
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
  }, [isAuthenticated]);

  // Inicialización mejorada
  useEffect(() => {
    const initAuth = async () => {
      console.log('🚀 Initializing authentication...');
      setIsLoading(true);
      
      // NUEVO: Múltiples intentos de verificación con pausas
      let authSuccess = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔍 Auth initialization attempt ${attempt}/3`);
        
        authSuccess = await checkAuth(true, true);
        
        if (authSuccess) {
          console.log('✅ Auth initialized successfully');
          break;
        }
        
        if (attempt < 3) {
          console.log(`⏳ Attempt ${attempt} failed, retrying in 500ms...`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setIsLoading(false);
      setHasInitialized(true);
      console.log('🏁 Authentication initialization complete:', authSuccess);
    };

    initAuth();
  }, [checkAuth]);

  // MEJORADO: Listener para cambios en tokens con mejor manejo
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTokensUpdated = async (event: any) => {
      console.log('🔄 Tokens updated event received, details:', event.detail?.verified);
      
      // Cancelar timeout previo si existe
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      // NUEVO: Pausa adaptativa basada en si los tokens fueron verificados
      const delay = event.detail?.verified ? 200 : 800;
      
      syncTimeoutRef.current = setTimeout(async () => {
        console.log('🔄 Processing token update after delay:', delay);
        await checkAuth(false, true);
      }, delay);
    };

    const handleTokensCleared = () => {
      console.log('🗑️ Tokens cleared event received, updating state...');
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      setIsAuthenticated(false);
      setUser(null);
    };

    const handleBeforeUnload = () => {
      refreshingRef.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };

    window.addEventListener('auth-tokens-updated', handleTokensUpdated);
    window.addEventListener('auth-tokens-cleared', handleTokensCleared);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('auth-tokens-updated', handleTokensUpdated);
      window.removeEventListener('auth-tokens-cleared', handleTokensCleared);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [checkAuth]);

  // MEJORADO: Manejo de redirecciones más inteligente
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

  // MEJORADO: Monitor de salud de tokens más eficiente
  useEffect(() => {
    if (!hasInitialized) return;

    const monitorTokenHealth = async () => {
      if (refreshingRef.current) return;
      
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
  }, [hasInitialized, checkAuth]);

  // MEJORADO: Login con mejor sincronización
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

      // NUEVO: Esperar por el evento de tokens actualizados
      const tokenUpdatePromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 3000); // 3 segundos máximo
        
        const handler = (event: any) => {
          if (event.detail?.verified) {
            clearTimeout(timeout);
            window.removeEventListener('auth-tokens-updated', handler);
            resolve(true);
          }
        };
        
        window.addEventListener('auth-tokens-updated', handler);
      });

      console.log('⏳ Waiting for token synchronization...');
      const tokensSynced = await tokenUpdatePromise;
      
      if (tokensSynced) {
        console.log('✅ Tokens synchronized, checking auth state...');
      } else {
        console.log('⚠️ Token sync timeout, proceeding anyway...');
      }

      // Verificar estado DESPUÉS de la sincronización
      const authSuccess = await checkAuth(false, true);
      
      console.log('✅ Login complete:', { 
        tokensSynced, 
        authSuccess,
        user: authUtils.getCurrentUser()?.email 
      });
      
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