// =====================================================
// HOOKS DE AUTENTICACIÓN - src/hooks/useAuth.ts
// =====================================================

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { PERMISOS, RolUsuario } from '@/types/auth'

export const useAuth = () => {
  const { data: session, status } = useSession()
  
  const user = useMemo(() => {
    if (!session?.user) return null
    return {
      id: session.user.id,
      email: session.user.email,
      nombre: session.user.nombre,
      apellido: session.user.apellido,
      rol: session.user.rol as RolUsuario,
      estado: session.user.estado,
      image: session.user.image,
    }
  }, [session])

  const isAuthenticated = status === 'authenticated' && !!user
  const isLoading = status === 'loading'

  return {
    user,
    isAuthenticated,
    isLoading,
    session,
  }
}

export const usePermissions = () => {
  const { user } = useAuth()
  
  const permissions = useMemo(() => {
    if (!user?.rol) return null
    return PERMISOS[user.rol]
  }, [user?.rol])

  const can = useMemo(() => ({
    // Usuarios
    viewUsers: () => permissions?.usuarios?.leer || false,
    createUsers: () => permissions?.usuarios?.crear || false,
    editUsers: () => permissions?.usuarios?.editar || false,
    deleteUsers: () => permissions?.usuarios?.eliminar || false,
    
    // Clientes
    viewClients: () => permissions?.clientes?.leer || false,
    createClients: () => permissions?.clientes?.crear || false,
    editClients: () => permissions?.clientes?.editar || false,
    deleteClients: () => permissions?.clientes?.eliminar || false,
    
    // Proyectos
    viewProjects: () => permissions?.proyectos?.leer || false,
    createProjects: () => permissions?.proyectos?.crear || false,
    editProjects: () => permissions?.proyectos?.editar || false,
    deleteProjects: () => permissions?.proyectos?.eliminar || false,
    
    // Pagos
    viewPayments: () => permissions?.pagos?.leer || false,
    createPayments: () => permissions?.pagos?.crear || false,
    editPayments: () => permissions?.pagos?.editar || false,
    deletePayments: () => permissions?.pagos?.eliminar || false,
    
    // Reportes
    viewReports: () => permissions?.reportes?.leer || false,
    createReports: () => permissions?.reportes?.crear || false,
    
    // Configuración
    viewSettings: () => permissions?.configuracion?.leer || false,
    editSettings: () => permissions?.configuracion?.editar || false,
    
    // Roles específicos
    isSuperAdmin: () => user?.rol === 'SUPERADMIN',
    isAdmin: () => ['SUPERADMIN', 'ADMIN'].includes(user?.rol || ''),
    isSales: () => user?.rol === 'VENTAS',
  }), [permissions, user?.rol])

  return {
    permissions,
    can,
    userRole: user?.rol,
  }
}

export const useRoleCheck = (requiredRoles: RolUsuario[]) => {
  const { user } = useAuth()
  
  const hasAccess = useMemo(() => {
    if (!user?.rol) return false
    return requiredRoles.includes(user.rol)
  }, [user?.rol, requiredRoles])

  return hasAccess
}