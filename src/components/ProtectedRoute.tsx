// src/components/ProtectedRoute.tsx - Versión migrada
'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider' // ← Cambiado de next-auth
import { AuthLoading } from '@/components/AuthLoading'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requiredRole?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback,
  requiredRole 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth() // ← Cambiado de useSession
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirigir al login con la URL de retorno
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }, [isLoading, isAuthenticated, router, pathname])

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return fallback || <AuthLoading />
  }

  // Si no está autenticado, no mostrar nada (ya redirigió)
  if (!isAuthenticated || !user) {
    return null
  }

  // Verificar rol si es requerido
  if (requiredRole && user['custom:role'] !== requiredRole) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
          <p className="text-gray-400 mb-6">
            No tienes permisos para acceder a esta página.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Si está autenticado y tiene el rol correcto, mostrar el contenido
  return <>{children}</>
}