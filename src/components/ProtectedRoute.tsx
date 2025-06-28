// =====================================================
// COMPONENTE PROTECTED ROUTE - src/components/ProtectedRoute.tsx
// =====================================================

'use client'

import React, { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthLoading } from '@/components/AuthLoading'
import { PERMISOS, RolUsuario } from '@/types/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: RolUsuario[]
  requireAuth?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requireAuth = true
}) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return // Aún cargando

    // Si se requiere autenticación y no hay sesión
    if (requireAuth && !session) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }

    // Si hay roles requeridos y el usuario no tiene el rol necesario
    if (session && requiredRoles.length > 0) {
      const userRole = session.user.rol as RolUsuario
      if (!requiredRoles.includes(userRole)) {
        router.push('/auth/unauthorized')
        return
      }
    }

    // Verificar estado del usuario
    if (session && session.user.estado !== 'ACTIVO') {
      router.push('/auth/suspended')
      return
    }
  }, [session, status, router, pathname, requiredRoles, requireAuth])

  // Mostrar loading mientras se verifica
  if (status === 'loading') {
    return <AuthLoading />
  }

  // Si se requiere auth y no hay sesión, no mostrar nada (se está redirigiendo)
  if (requireAuth && !session) {
    return <AuthLoading />
  }

  // Si hay roles requeridos y el usuario no los tiene
  if (session && requiredRoles.length > 0) {
    const userRole = session.user.rol as RolUsuario
    if (!requiredRoles.includes(userRole)) {
      return <AuthLoading />
    }
  }

  // Si el usuario está suspendido
  if (session && session.user.estado !== 'ACTIVO') {
    return <AuthLoading />
  }

  return <>{children}</>
}

// Hook para verificar permisos específicos
export const useRoutePermissions = () => {
  const { data: session } = useSession()
  const pathname = usePathname()

  const hasPermission = (permission: string, action: 'leer' | 'crear' | 'editar' | 'eliminar' = 'leer'): boolean => {
    if (!session?.user?.rol) return false
    
    const userRole = session.user.rol as RolUsuario
    const permissions = PERMISOS[userRole]
    
    return permissions[permission]?.[action] || false
  }

  const canAccessRoute = (route: string): boolean => {
    if (!session?.user?.rol) return false
    
    const userRole = session.user.rol as RolUsuario
    const permissions = PERMISOS[userRole]
    
    // Mapear rutas a permisos
    if (route.startsWith('/clientes')) {
      return permissions.clientes?.leer || false
    }
    
    if (route.startsWith('/proyectos')) {
      return permissions.proyectos?.leer || false
    }
    
    if (route.startsWith('/pagos')) {
      return permissions.pagos?.leer || false
    }
    
    if (route.startsWith('/admin/usuarios')) {
      return permissions.usuarios?.leer || false
    }
    
    if (route.startsWith('/configuracion')) {
      return permissions.configuracion?.leer || false
    }
    
    if (route.startsWith('/facturacion') || route.startsWith('/analytics')) {
      return permissions.reportes?.leer || false
    }
    
    // Rutas que todos pueden acceder
    if (['/dashboard', '/perfil', '/calendario'].some(publicRoute => route.startsWith(publicRoute))) {
      return true
    }
    
    return false
  }

  const getUserRole = (): RolUsuario | null => {
    return session?.user?.rol as RolUsuario || null
  }

  const isAdmin = (): boolean => {
    const role = getUserRole()
    return role === 'SUPERADMIN' || role === 'ADMIN'
  }

  const isSuperAdmin = (): boolean => {
    return getUserRole() === 'SUPERADMIN'
  }

  return {
    hasPermission,
    canAccessRoute,
    getUserRole,
    isAdmin,
    isSuperAdmin,
    currentRoute: pathname,
    canAccessCurrentRoute: canAccessRoute(pathname)
  }
}