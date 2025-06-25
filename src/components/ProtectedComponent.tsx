// =====================================================
// COMPONENTES DE PROTECCIÓN - src/components/ProtectedComponent.tsx
// =====================================================

'use client'

import React from 'react'
import { RolUsuario } from '@/types/auth'
import { ShieldX } from 'lucide-react'
import { usePermissions, useRoleCheck } from '@/hooks/useAuth'

// Componente para proteger por roles
interface RoleGuardProps {
  roles: RolUsuario[]
  children: React.ReactNode
  fallback?: React.ReactNode
  showFallback?: boolean
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  children,
  fallback,
  showFallback = false
}) => {
  const hasAccess = useRoleCheck(roles)

  if (!hasAccess) {
    if (showFallback && fallback) {
      return <>{fallback}</>
    }
    if (showFallback) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <ShieldX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No tienes permisos para ver este contenido</p>
          </div>
        </div>
      )
    }
    return null
  }

  return <>{children}</>
}

// Componente para proteger por permisos específicos
interface PermissionGuardProps {
  permission: (can: any) => boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  showFallback?: boolean
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback,
  showFallback = false
}) => {
  const { can } = usePermissions()

  const hasPermission = can ? permission(can) : false

  if (!hasPermission) {
    if (showFallback && fallback) {
      return <>{fallback}</>
    }
    if (showFallback) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="text-center">
            <ShieldX className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Sin permisos</p>
          </div>
        </div>
      )
    }
    return null
  }

  return <>{children}</>
}

// Componente para mostrar información según el rol
interface RoleBasedContentProps {
  superAdmin?: React.ReactNode
  admin?: React.ReactNode
  sales?: React.ReactNode
  fallback?: React.ReactNode
}

export const RoleBasedContent: React.FC<RoleBasedContentProps> = ({
  superAdmin,
  admin,
  sales,
  fallback
}) => {
  const { can } = usePermissions()

  if (can?.isSuperAdmin() && superAdmin) {
    return <>{superAdmin}</>
  }

  if (can?.isAdmin() && admin) {
    return <>{admin}</>
  }

  if (can?.isSales() && sales) {
    return <>{sales}</>
  }

  return fallback ? <>{fallback}</> : null
}

// Hook para condicionar elementos según permisos
export const useConditionalRender = () => {
  const { can } = usePermissions()

  const renderIf = (condition: (can: any) => boolean, element: React.ReactNode) => {
    return can && condition(can) ? element : null
  }

  const renderUnless = (condition: (can: any) => boolean, element: React.ReactNode) => {
    return can && !condition(can) ? element : null
  }

  return { renderIf, renderUnless }
}