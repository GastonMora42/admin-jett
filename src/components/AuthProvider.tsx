// components/AuthProvider.tsx - CORREGIDO
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
  address?: any;
  'custom:role'?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  forceRefresh: () => Promise<void>;
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
  const isRedirecting = useRef(false);
  const refreshingTokens = useRef(false);

  // Rutas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/profile', '/admin', '/projects', '/clients', '/clientes', '/proyectos', '/pagos', '/facturacion', '/analytics', '/configuracion'];
  
  // Rutas que solo pueden acceder usuarios no autenticados
  const publicOnlyRoutes = ['/auth/signin', '/auth/register'];

  // Rutas completamente públicas
  const publicRoutes = ['/', '/auth/error', '/auth/suspended', '/auth/unauthorized', '/auth/confirm'];

  const checkAuth = async (attemptRefresh = true) => {
    try {
      const authenticated = authUtils.isAuthenticated();
      const userData = authUtils.getCurrentUser();
      
      console.log('🔍 Checking auth:', { authenticated, userData: !!userData, pathname });
      
      // Si no está autenticado pero tenemos tokens, intentar refresh
      if (!authenticated && attemptRefresh && !refreshingTokens.current) {
        const tokens = authUtils.getTokens();
        if (tokens?.refreshToken) {
          console.log('🔄 Token expired, attempting refresh...');
          refreshingTokens.current = true;
          
          try {
            const refreshed = await authUtils.refreshTokens();
            if (refreshed) {
              console.log('✅ Tokens refreshed, rechecking auth...');
              const newAuthenticated = authUtils.isAuthenticated();
              const newUserData = authUtils.getCurrentUser();
              
              setIsAuthenticated(newAuthenticated);
              setUser(newUserData);
              refreshingTokens.current = false;
              return { authenticated: newAuthenticated, userData: newUserData };
            }
          } catch (error) {
            console.error('❌ Error during refresh:', error);
          } finally {
            refreshingTokens.current = false;
          }
        }
      }
      
      setIsAuthenticated(authenticated);
      setUser(userData);
      
      return { authenticated, userData };
    } catch (error) {
      console.error('❌ Error checking auth:', error);
      setIsAuthenticated(false);
      setUser(null);
      return { authenticated: false, userData: null };
    }
  };

  // Inicialización inicial
  useEffect(() => {
    const initAuth = async () => {
      console.log('🚀 Initializing auth...');
      setIsLoading(true);
      
      await checkAuth();
      
      setIsLoading(false);
      setHasInitialized(true);
      console.log('✅ Auth initialized');
    };

    initAuth();

    // Verificar autenticación cada 5 minutos
    const interval = setInterval(() => checkAuth(true), 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Verificar tokens antes de que expiren
  useEffect(() => {
    const checkTokenExpiration = () => {
      const tokens = authUtils.getTokens();
      if (!tokens) return;

      const tokenData = authUtils.decodeToken(tokens.idToken);
      if (!tokenData) return;

      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiration = tokenData.exp - currentTime;

      // Si el token expira en menos de 5 minutos, refrescar
      if (timeUntilExpiration > 0 && timeUntilExpiration < 300 && !refreshingTokens.current) {
        console.log('⏰ Token expires soon, preemptive refresh...');
        refreshingTokens.current = true;
        authUtils.refreshTokens().finally(() => {
          refreshingTokens.current = false;
        });
      }
    };

    // Verificar cada minuto
    const interval = setInterval(checkTokenExpiration, 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Manejar redirecciones solo después de la inicialización
  useEffect(() => {
    if (!hasInitialized || isLoading || isRedirecting.current || refreshingTokens.current) {
      return;
    }

    const handleRedirection = () => {
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
      const isPublicOnlyRoute = publicOnlyRoutes.some(route => pathname.startsWith(route));
      const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/');

      console.log('🎯 Route check:', { 
        pathname, 
        isAuthenticated, 
        isProtectedRoute, 
        isPublicOnlyRoute, 
        isPublicRoute 
      });

      // Solo redirigir a login si es una ruta protegida y NO está autenticado
      if (isProtectedRoute && !isAuthenticated) {
        console.log('🔒 Redirecting to login: protected route without auth');
        isRedirecting.current = true;
        router.push('/auth/signin?callbackUrl=' + encodeURIComponent(pathname));
        setTimeout(() => { isRedirecting.current = false; }, 2000);
      }
    };

    // Delay para evitar redirecciones inmediatas
    const timeoutId = setTimeout(handleRedirection, 200);
    
    return () => clearTimeout(timeoutId);
  }, [pathname, isAuthenticated, hasInitialized, isLoading, router]);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error de autenticación');
      }

      // Guardar tokens
      authUtils.setTokens({
        accessToken: data.accessToken,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
      });

      // Actualizar estado inmediatamente
      const { authenticated, userData } = await checkAuth(false); // No intentar refresh en login
      
      if (authenticated && userData) {
        console.log('✅ Login successful, updating state immediately');
        setUser(userData);
        setIsAuthenticated(true);
        setHasInitialized(true);
      }
      
      console.log('✅ Login result:', { authenticated, userData: !!userData });
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    console.log('🚪 Logging out...');
    await authUtils.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshAuth = async () => {
    if (refreshingTokens.current) {
      console.log('⏳ Refresh already in progress...');
      return false;
    }

    const success = await authUtils.refreshTokens();
    if (success) {
      const { authenticated, userData } = await checkAuth(false);
      return authenticated;
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    return success;
  };

  const forceRefresh = async () => {
    console.log('🔄 Force refreshing auth state...');
    const { authenticated, userData } = await checkAuth(false);
    console.log('🔄 Force refresh result:', { authenticated, userData: !!userData });
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth,
    forceRefresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// Componente para proteger rutas específicas
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(pathname));
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  // Mostrar loading mientras verifica
  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <div className="text-lg">Verificando autenticación...</div>
          </div>
        </div>
      )
    );
  }

  // Si no está autenticado, no mostrar nada (ya redirigió)
  if (!isAuthenticated) {
    return null;
  }

  // Si está autenticado, mostrar el contenido
  return <>{children}</>;
}