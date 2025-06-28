// =====================================================
// APP LAYOUT INTELIGENTE - src/components/AppLayout.tsx
// =====================================================

'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { SilkBackground } from '@/components/SilkBackground'
import { Sidebar } from '@/components/Sidebar'
import { AuthLoading } from '@/components/AuthLoading'

interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useAuth()

  // Rutas públicas que no requieren sidebar
  const publicRoutes = [
    '/', 
    '/auth/signin', 
    '/auth/signup', 
    '/auth/register', 
    '/auth/error', 
    '/auth/suspended', 
    '/auth/unauthorized',
    '/auth/confirm'
  ]
  
  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')
  
  console.log('📄 AppLayout:', { pathname, isPublicRoute, isAuthenticated, isLoading });

  // Si está cargando la autenticación, mostrar loading
  if (isLoading) {
    console.log('⏳ AppLayout: Showing loading');
    return <AuthLoading />
  }

  // Para rutas públicas, renderizar sin sidebar
  if (isPublicRoute) {
    console.log('🌍 AppLayout: Rendering public route');
    return (
      <>
        {children}
      </>
    )
  }

  // Para rutas protegidas, verificar autenticación
  if (!isAuthenticated || !user) {
    console.log('🔒 AppLayout: Not authenticated, showing loading (will redirect)');
    // No redirigir aquí, dejar que AuthProvider maneje las redirecciones
    // Solo mostrar loading mientras AuthProvider hace su trabajo
    return <AuthLoading />
  }

  // Para rutas protegidas con usuario autenticado, mostrar layout completo
  console.log('✅ AppLayout: Rendering authenticated layout');
  return (
    <div className="min-h-screen relative">
      <SilkBackground />
      <div className="relative z-10 flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}