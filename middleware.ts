// =====================================================
// MIDDLEWARE DE PROTECCIÓN MEJORADO - middleware.ts
// =====================================================

import { withAuth } from 'next-auth/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { PERMISOS, RolUsuario } from '@/types/auth'

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl
    
    console.log('Middleware ejecutándose para:', pathname)
    console.log('Token presente:', !!token)
    
    // Rutas públicas que no requieren autenticación
    const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/error']
    
    // Si es una ruta pública, permitir acceso
    if (publicRoutes.includes(pathname) || pathname.startsWith('/auth/')) {
      return NextResponse.next()
    }
    
    // Si no hay token, redirigir al login
    if (!token) {
      console.log('No hay token, redirigiendo a login')
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    
    // Verificar estado del usuario
    if (token.estado !== 'ACTIVO') {
      console.log('Usuario no activo:', token.estado)
      return NextResponse.redirect(new URL('/auth/suspended', req.url))
    }
    
    const userRole = token.rol as RolUsuario
    console.log('Rol del usuario:', userRole)
    
    // Verificar permisos por ruta
    if (pathname.startsWith('/admin/usuarios')) {
      if (!['SUPERADMIN', 'ADMIN'].includes(userRole)) {
        console.log('Sin permisos para gestión de usuarios')
        return NextResponse.redirect(new URL('/auth/unauthorized', req.url))
      }
    }
    
    // Configuración del sistema - solo SUPERADMIN
    if (pathname.startsWith('/configuracion')) {
      if (userRole !== 'SUPERADMIN') {
        console.log('Sin permisos para configuración')
        return NextResponse.redirect(new URL('/auth/unauthorized', req.url))
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
      console.log('Sin permisos para ruta:', pathname)
      return NextResponse.redirect(new URL('/auth/unauthorized', req.url))
    }
    
    console.log('Acceso permitido a:', pathname)
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Permitir rutas públicas sin token
        const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/error']
        if (publicRoutes.includes(pathname) || pathname.startsWith('/auth/')) {
          return true
        }
        
        // Para rutas protegidas, requerir token
        return !!token
      },
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
  if (pathname === '/dashboard' || pathname.startsWith('/calendario') || pathname.startsWith('/perfil')) {
    return true
  }
  
  // APIs públicas
  if (pathname.startsWith('/api/auth')) {
    return true
  }
  
  return true // Permitir otras rutas por defecto para usuarios autenticados
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - logo.webp (logo file)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|logo.webp).*)',
  ],
}