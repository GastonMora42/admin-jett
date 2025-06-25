// =====================================================
// MIDDLEWARE DE PROTECCIÓN - middleware.ts
// =====================================================

import { withAuth } from 'next-auth/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { PERMISOS, RolUsuario } from '@/types/auth'

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl
    
    // Si no hay token, redirigir al login
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    
    // Verificar estado del usuario
    if (token.estado !== 'ACTIVO') {
      return NextResponse.redirect(new URL('/auth/suspended', req.url))
    }
    
    // Verificar permisos por ruta
    const userRole = token.rol as RolUsuario
    
    // Rutas de administración de usuarios - solo SUPERADMIN y ADMIN
    if (pathname.startsWith('/admin/usuarios')) {
      if (!['SUPERADMIN', 'ADMIN'].includes(userRole)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
    
    // Configuración del sistema - solo SUPERADMIN
    if (pathname.startsWith('/configuracion')) {
      if (userRole !== 'SUPERADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
    
    // APIs de administración
    if (pathname.startsWith('/api/usuarios')) {
      if (!['SUPERADMIN', 'ADMIN'].includes(userRole)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }
    
    // Verificar permisos específicos para otras rutas
    const rutaPermisos = obtenerPermisosRuta(pathname, userRole)
    if (!rutaPermisos) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

function obtenerPermisosRuta(pathname: string, rol: RolUsuario): boolean {
  const permisos = PERMISOS[rol]
  
  // Mapear rutas a recursos
  if (pathname.startsWith('/clientes')) {
    return permisos.clientes?.leer || false
  }
  
  if (pathname.startsWith('/proyectos')) {
    return permisos.proyectos?.leer || false
  }
  
  if (pathname.startsWith('/pagos')) {
    return permisos.pagos?.leer || false
  }
  
  if (pathname.startsWith('/facturacion') || pathname.startsWith('/analytics')) {
    return permisos.reportes?.leer || false
  }
  
  // Dashboard y calendario accesibles para todos los roles autenticados
  if (pathname === '/' || pathname.startsWith('/calendario')) {
    return true
  }
  
  return true // Permitir otras rutas por defecto
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - auth (custom auth pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|auth|_next/static|_next/image|favicon.ico|public|logo.webp).*)',
  ],
}