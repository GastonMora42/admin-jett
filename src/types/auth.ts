// =====================================================
// TIPOS DE AUTENTICACIÓN - src/types/auth.ts
// =====================================================

import { DefaultSession } from 'next-auth'

export type RolUsuario = 'SUPERADMIN' | 'ADMIN' | 'VENTAS'
export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      rol: RolUsuario
      estado: EstadoUsuario
      nombre: string
      apellido: string
    } & DefaultSession['user']
  }
  
  interface User {
    rol?: RolUsuario
    estado?: EstadoUsuario
    nombre?: string
    apellido?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    rol: RolUsuario
    estado: EstadoUsuario
    nombre: string
    apellido: string
  }
}

export interface UsuarioCompleto {
  id: string
  cognitoId: string
  email: string
  nombre: string
  apellido: string
  avatar?: string
  rol: RolUsuario
  estado: EstadoUsuario
  fechaCreacion: Date
  fechaLogin?: Date
  creadoPor?: string
}

export interface PermisosRol {
  [key: string]: {
    leer: boolean
    crear: boolean
    editar: boolean
    eliminar: boolean
    admin: boolean
  }
}

export const PERMISOS: Record<RolUsuario, PermisosRol> = {
  SUPERADMIN: {
    usuarios: { leer: true, crear: true, editar: true, eliminar: true, admin: true },
    clientes: { leer: true, crear: true, editar: true, eliminar: true, admin: true },
    proyectos: { leer: true, crear: true, editar: true, eliminar: true, admin: true },
    pagos: { leer: true, crear: true, editar: true, eliminar: true, admin: true },
    reportes: { leer: true, crear: true, editar: true, eliminar: true, admin: true },
    configuracion: { leer: true, crear: true, editar: true, eliminar: true, admin: true },
  },
  ADMIN: {
    usuarios: { leer: true, crear: true, editar: true, eliminar: false, admin: false },
    clientes: { leer: true, crear: true, editar: true, eliminar: true, admin: true },
    proyectos: { leer: true, crear: true, editar: true, eliminar: true, admin: true },
    pagos: { leer: true, crear: true, editar: true, eliminar: false, admin: true },
    reportes: { leer: true, crear: true, editar: false, eliminar: false, admin: true },
    configuracion: { leer: true, crear: false, editar: true, eliminar: false, admin: false },
  },
  VENTAS: {
    usuarios: { leer: false, crear: false, editar: false, eliminar: false, admin: false },
    clientes: { leer: true, crear: true, editar: true, eliminar: false, admin: false },
    proyectos: { leer: true, crear: true, editar: true, eliminar: false, admin: false },
    pagos: { leer: true, crear: false, editar: true, eliminar: false, admin: false },
    reportes: { leer: true, crear: false, editar: false, eliminar: false, admin: false },
    configuracion: { leer: false, crear: false, editar: false, eliminar: false, admin: false },
  },
}