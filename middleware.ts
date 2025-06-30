// middleware.ts - VERSIÓN CORREGIDA COMPLETAMENTE
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
  const isValid = token.exp > currentTime
  console.log('🔍 [MIDDLEWARE] Token validation:', {
    exp: token.exp,
    current: currentTime,
    timeUntilExpiration: token.exp - currentTime,
    isValid,
    email: token.email
  });
  return isValid
}

// NUEVA: Función para extraer token de múltiples fuentes
function extractToken(request: NextRequest): string | null {
  console.log('🔍 [MIDDLEWARE] Extracting token from request...')
  
  // 1. Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    console.log('🔑 [MIDDLEWARE] Token found in Authorization header')
    return token
  }
  
  // 2. X-Auth-Token header (custom header from api-client)
  const customHeader = request.headers.get('x-auth-token')
  if (customHeader) {
    console.log('🔑 [MIDDLEWARE] Token found in X-Auth-Token header')
    return customHeader
  }
  
  // 3. Cookie 'token'
  const tokenCookie = request.cookies.get('token')?.value
  if (tokenCookie) {
    console.log('🔑 [MIDDLEWARE] Token found in "token" cookie')
    return tokenCookie
  }

  // 4. Cookie 'idToken'  
  const idTokenCookie = request.cookies.get('idToken')?.value
  if (idTokenCookie) {
    console.log('🔑 [MIDDLEWARE] Token found in "idToken" cookie')
    return idTokenCookie
  }

  console.log('❌ [MIDDLEWARE] No token found in any location')
  console.log('🔍 [MIDDLEWARE] Available cookies:', request.cookies.getAll().map(c => c.name))
  console.log('🔍 [MIDDLEWARE] Available headers:', Object.fromEntries(request.headers.entries()))
  
  return null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🛡️ [MIDDLEWARE] Processing request:', pathname)

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
    console.log('✅ [MIDDLEWARE] Public route allowed:', pathname)
    return NextResponse.next()
  }

  // NUEVA: Extraer token de múltiples fuentes
  const token = extractToken(request)

  // Para páginas (no APIs), ser más permisivo
  if (!pathname.startsWith('/api/')) {
    console.log('📄 [MIDDLEWARE] Processing page request')
    
    if (!token) {
      console.log('📄 [MIDDLEWARE] No token found - allowing page, AuthProvider will handle')
      return NextResponse.next()
    }
    
    const decodedToken = decodeToken(token)
    if (decodedToken && isTokenValid(decodedToken)) {
      console.log('✅ [MIDDLEWARE] Valid token for page')
      
      // Agregar headers de usuario para facilitar el uso en server components
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', decodedToken.sub)
      requestHeaders.set('x-user-email', decodedToken.email)
      requestHeaders.set('x-user-role', decodedToken['custom:role'] || 'VENTAS')
      requestHeaders.set('x-user-name', `${decodedToken.given_name} ${decodedToken.family_name}`)

      console.log('✅ [MIDDLEWARE] Added user headers for page:', decodedToken.email)

      return NextResponse.next({
        request: { headers: requestHeaders }
      })
    }
    
    console.log('📄 [MIDDLEWARE] Invalid token - allowing page, AuthProvider will handle')
    return NextResponse.next()
  }

  // Para APIs, ser estricto pero agregar LOGS DETALLADOS
  console.log('🔌 [MIDDLEWARE] Processing API request - strict verification')
  
  if (!token) {
    console.log('❌ [MIDDLEWARE] API request rejected: no token')
    return NextResponse.json({ 
      error: 'No autorizado - Token requerido',
      debug: {
        path: pathname,
        cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
        hasAuthHeader: !!request.headers.get('authorization'),
        hasCustomHeader: !!request.headers.get('x-auth-token')
      }
    }, { status: 401 })
  }

  const decodedToken = decodeToken(token)
  if (!decodedToken) {
    console.log('❌ [MIDDLEWARE] API request rejected: invalid token format')
    return NextResponse.json({ 
      error: 'Token inválido',
      debug: { tokenLength: token.length, tokenStart: token.substring(0, 20) }
    }, { status: 401 })
  }

  if (!isTokenValid(decodedToken)) {
    console.log('❌ [MIDDLEWARE] API request rejected: token expired')
    return NextResponse.json({ 
      error: 'Token expirado',
      debug: { exp: decodedToken.exp, current: Math.floor(Date.now() / 1000) }
    }, { status: 401 })
  }

  const userRole = decodedToken['custom:role'] || 'VENTAS'
  
  // Verificar permisos específicos para rutas sensibles
  if (pathname.startsWith('/api/usuarios') || pathname.startsWith('/api/admin')) {
    if (!['SUPERADMIN', 'ADMIN'].includes(userRole)) {
      console.log('❌ [MIDDLEWARE] API request rejected: insufficient permissions:', userRole)
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }
  }

  // CRÍTICO: Agregar headers de usuario para APIs
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', decodedToken.sub)
  requestHeaders.set('x-user-email', decodedToken.email)
  requestHeaders.set('x-user-role', userRole)
  requestHeaders.set('x-user-name', `${decodedToken.given_name} ${decodedToken.family_name}`)

  console.log('✅ [MIDDLEWARE] API request authorized for:', decodedToken.email, 'Role:', userRole)
  console.log('✅ [MIDDLEWARE] Added user headers:', {
    'x-user-id': decodedToken.sub,
    'x-user-email': decodedToken.email,
    'x-user-role': userRole
  })
  
  return NextResponse.next({
    request: { headers: requestHeaders }
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|logo.webp).*)',
  ],
}