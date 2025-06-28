// components/AuthProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const router = useRouter();
  const pathname = usePathname();

  // Rutas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/profile', '/admin', '/projects', '/clients'];
  
  // Rutas que solo pueden acceder usuarios no autenticados
  const publicOnlyRoutes = ['/auth/signin', '/auth/register'];

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = authUtils.isAuthenticated();
      const userData = authUtils.getCurrentUser();
      
      setIsAuthenticated(authenticated);
      setUser(userData);
      setIsLoading(false);

      // Redirigir según el estado de autenticación y la ruta actual
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
      const isPublicOnlyRoute = publicOnlyRoutes.some(route => pathname.startsWith(route));

      if (isProtectedRoute && !authenticated) {
        // Si está en una ruta protegida sin autenticación, redirigir al login
        router.push('/auth/signin?callbackUrl=' + encodeURIComponent(pathname));
      } else if (isPublicOnlyRoute && authenticated) {
        // Si está en una ruta pública estando autenticado, redirigir al dashboard
        router.push('/dashboard');
      }
    };

    checkAuth();

    // Verificar autenticación cada minuto
    const interval = setInterval(checkAuth, 60000);
    
    return () => clearInterval(interval);
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    try {
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

      // Actualizar estado
      const userData = authUtils.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await authUtils.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshAuth = async () => {
    const success = await authUtils.refreshTokens();
    if (success) {
      const userData = authUtils.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    return success;
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