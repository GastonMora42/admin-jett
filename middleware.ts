// middleware.ts - VERSIÓN SIMPLIFICADA
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
    console.error('❌ Error decoding token:', error)
    return null
  }
}

function isTokenValid(token: DecodedToken): boolean {
  const currentTime = Math.floor(Date.now() / 1000)
  return token.exp > currentTime
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🛡️ [MIDDLEWARE] Request:', pathname)

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

  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')
  
  if (isPublicRoute) {
    console.log('✅ [MIDDLEWARE] Ruta pública permitida')
    return NextResponse.next()
  }

  // Buscar token en múltiples fuentes
  let token: string | null = null

  // 1. Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
    console.log('🔑 [MIDDLEWARE] Token desde Authorization header')
  }
  
  // 2. Cookie 'token'
  if (!token) {
    const tokenCookie = request.cookies.get('token')?.value
    if (tokenCookie) {
      token = tokenCookie
      console.log('🔑 [MIDDLEWARE] Token desde cookie')
    }
  }

  // 3. Cookie 'idToken'
  if (!token) {
    const idTokenCookie = request.cookies.get('idToken')?.value
    if (idTokenCookie) {
      token = idTokenCookie
      console.log('🔑 [MIDDLEWARE] Token desde cookie idToken')
    }
  }

  // Para páginas (no APIs), ser más permisivo
  if (!pathname.startsWith('/api/')) {
    console.log('📄 [MIDDLEWARE] Es una página')
    
    if (!token) {
      console.log('📄 [MIDDLEWARE] Sin token - permitiendo, AuthProvider manejará')
      return NextResponse.next()
    }
    
    const decodedToken = decodeToken(token)
    if (decodedToken && isTokenValid(decodedToken)) {
      console.log('✅ [MIDDLEWARE] Token válido para página')
      
      // Agregar headers de usuario para facilitar el uso en server components
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', decodedToken.sub)
      requestHeaders.set('x-user-email', decodedToken.email)
      requestHeaders.set('x-user-role', decodedToken['custom:role'] || 'VENTAS')
      requestHeaders.set('x-user-name', `${decodedToken.given_name} ${decodedToken.family_name}`)

      return NextResponse.next({
        request: { headers: requestHeaders }
      })
    }
    
    console.log('📄 [MIDDLEWARE] Token inválido - permitiendo, AuthProvider manejará')
    return NextResponse.next()
  }

  // Para APIs, ser estricto
  console.log('🔌 [MIDDLEWARE] Es una API - verificación estricta')
  
  if (!token) {
    console.log('❌ [MIDDLEWARE] API sin token')
    return NextResponse.json({ error: 'No autorizado - Token requerido' }, { status: 401 })
  }

  const decodedToken = decodeToken(token)
  if (!decodedToken) {
    console.log('❌ [MIDDLEWARE] Token inválido')
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  if (!isTokenValid(decodedToken)) {
    console.log('❌ [MIDDLEWARE] Token expirado')
    return NextResponse.json({ error: 'Token expirado' }, { status: 401 })
  }

  const userRole = decodedToken['custom:role'] || 'VENTAS'
  
  // Verificar permisos específicos para rutas sensibles
  if (pathname.startsWith('/api/usuarios') || pathname.startsWith('/api/admin')) {
    if (!['SUPERADMIN', 'ADMIN'].includes(userRole)) {
      console.log('❌ [MIDDLEWARE] Sin permisos admin:', userRole)
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }
  }

  // Agregar headers de usuario para APIs
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', decodedToken.sub)
  requestHeaders.set('x-user-email', decodedToken.email)
  requestHeaders.set('x-user-role', userRole)
  requestHeaders.set('x-user-name', `${decodedToken.given_name} ${decodedToken.family_name}`)

  console.log('✅ [MIDDLEWARE] API autorizada para:', decodedToken.email)
  
  return NextResponse.next({
    request: { headers: requestHeaders }
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|logo.webp).*)',
  ],
}