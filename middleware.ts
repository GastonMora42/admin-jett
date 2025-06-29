// =====================================================
// MIDDLEWARE CORREGIDO PARA COGNITO - middleware.ts
// =====================================================

import { NextRequest, NextResponse } from 'next/server'

interface DecodedToken {
  sub: string
  email: string
  given_name: string
  family_name: string
  'custom:role'?: string
  exp: number
  iat: number
}

// Función para decodificar JWT
function decodeToken(token: string): DecodedToken | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

// Función para verificar si el token es válido
function isTokenValid(token: DecodedToken): boolean {
  const currentTime = Math.floor(Date.now() / 1000)
  return token.exp > currentTime
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🛡️ Middleware ejecutándose para:', pathname)

  // Rutas públicas que no requieren autenticación
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

  // Si es una ruta pública, permitir acceso
  if (publicRoutes.includes(pathname) || pathname.startsWith('/auth/')) {
    console.log('✅ Ruta pública permitida:', pathname)
    return NextResponse.next()
  }

  // Obtener token de las cookies o headers
  let token: string | null = null
  
  // Intentar obtener de Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  // Si no está en header, intentar obtener de cookie (para navegador)
  if (!token) {
    // En el navegador, los tokens se almacenan en localStorage, no en cookies
    // por lo que necesitamos otra estrategia para las rutas de servidor
    console.log('🔍 No se encontró token en headers')
  }

  // Para rutas de API, verificar autenticación más estrictamente
  if (pathname.startsWith('/api/')) {
    if (!token) {
      console.log('❌ API: No token provided')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const decodedToken = decodeToken(token)
    if (!decodedToken || !isTokenValid(decodedToken)) {
      console.log('❌ API: Invalid or expired token')
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 })
    }

    // Verificar permisos específicos para APIs administrativas
    const userRole = decodedToken['custom:role'] || 'VENTAS'
    
    if (pathname.startsWith('/api/usuarios')) {
      if (!['SUPERADMIN', 'ADMIN'].includes(userRole)) {
        console.log('❌ API: Sin permisos para gestión de usuarios')
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    // Agregar información del usuario a los headers para que las APIs la puedan usar
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', decodedToken.sub)
    requestHeaders.set('x-user-email', decodedToken.email)
    requestHeaders.set('x-user-role', userRole)

    console.log('✅ API: Token válido para:', decodedToken.email)
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Para rutas de páginas, permitir pasar y que el AuthProvider maneje la redirección
  console.log('➡️ Página: Permitiendo que AuthProvider maneje la autenticación')
  return NextResponse.next()
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