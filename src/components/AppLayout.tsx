// =====================================================
// APP LAYOUT INTELIGENTE - src/components/AppLayout.tsx
// =====================================================

'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { SilkBackground } from '@/components/SilkBackground'
import { Sidebar } from '@/components/Sidebar'
import { AuthLoading } from '@/components/AuthLoading'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  // Rutas públicas que no requieren sidebar
  const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/error', '/auth/suspended', '/auth/unauthorized']
  
  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')
  
  // Si está cargando la sesión, mostrar loading
  if (status === 'loading') {
    return <AuthLoading />
  }

  // Para rutas públicas, renderizar sin sidebar
  if (isPublicRoute) {
    return (
      <>
        {children}
      </>
    )
  }

  // Para rutas protegidas, verificar autenticación
  if (!session) {
    // Si no está autenticado y trata de acceder a ruta protegida,
    // el middleware debería redirigir, pero por seguridad mostramos loading
    return <AuthLoading />
  }

  // Para rutas protegidas con usuario autenticado, mostrar layout completo
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