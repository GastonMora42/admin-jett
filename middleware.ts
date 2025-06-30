// middleware.ts - VERSIÓN DEBUG CON LOGS DETALLADOS
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
  
  console.log('🛡️ [MIDDLEWARE] ===== NUEVO REQUEST =====')
  console.log('🛡️ [MIDDLEWARE] Pathname:', pathname)
  console.log('🛡️ [MIDDLEWARE] Method:', request.method)
  console.log('🛡️ [MIDDLEWARE] URL completa:', request.url)

  // Rutas públicas
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
    console.log('✅ [MIDDLEWARE] Ruta pública permitida:', pathname)
    return NextResponse.next()
  }

  // DEBUGGING COMPLETO DE HEADERS Y COOKIES
  console.log('🔍 [MIDDLEWARE] === DEBUGGING TOKENS ===')
  
  // Log todos los headers
  console.log('🔍 [MIDDLEWARE] Todos los headers:')
  request.headers.forEach((value, key) => {
    console.log(`🔍 [MIDDLEWARE]   ${key}: ${value}`)
  })
  
  // Log todas las cookies
  console.log('🔍 [MIDDLEWARE] Todas las cookies:')
  request.cookies.getAll().forEach(cookie => {
    console.log(`🔍 [MIDDLEWARE]   ${cookie.name}: ${cookie.value?.substring(0, 20)}...`)
  })

  let token: string | null = null
  let tokenSource = 'none'

  // 1. Authorization header
  const authHeader = request.headers.get('authorization')
  console.log('🔍 [MIDDLEWARE] Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'NO ENCONTRADO')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
    tokenSource = 'authorization_header'
    console.log('🔑 [MIDDLEWARE] Token encontrado en Authorization header')
  }
  
  // 2. Cookie 'token'
  if (!token) {
    const tokenCookie = request.cookies.get('token')?.value
    console.log('🔍 [MIDDLEWARE] Cookie "token":', tokenCookie ? `${tokenCookie.substring(0, 20)}...` : 'NO ENCONTRADO')
    
    if (tokenCookie) {
      token = tokenCookie
      tokenSource = 'cookie_token'
      console.log('🔑 [MIDDLEWARE] Token encontrado en cookie "token"')
    }
  }

  // 3. Cookie 'idToken'
  if (!token) {
    const idTokenCookie = request.cookies.get('idToken')?.value
    console.log('🔍 [MIDDLEWARE] Cookie "idToken":', idTokenCookie ? `${idTokenCookie.substring(0, 20)}...` : 'NO ENCONTRADO')
    
    if (idTokenCookie) {
      token = idTokenCookie
      tokenSource = 'cookie_idToken'
      console.log('🔑 [MIDDLEWARE] Token encontrado en cookie "idToken"')
    }
  }

  console.log('🔍 [MIDDLEWARE] Resultado búsqueda token:')
  console.log('🔍 [MIDDLEWARE]   - Token encontrado:', !!token)
  console.log('🔍 [MIDDLEWARE]   - Fuente:', tokenSource)
  console.log('🔍 [MIDDLEWARE]   - Longitud:', token?.length || 0)

  // Para páginas (no APIs), ser más permisivo
  if (!pathname.startsWith('/api/')) {
    console.log('📄 [MIDDLEWARE] Es una página, no API')
    
    if (!token) {
      console.log('📄 [MIDDLEWARE] Página sin token - permitiendo pasar, AuthProvider manejará')
      return NextResponse.next()
    }
    
    const decodedToken = decodeToken(token)
    if (decodedToken && isTokenValid(decodedToken)) {
      console.log('✅ [MIDDLEWARE] Página: Token válido para:', decodedToken.email)
      
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', decodedToken.sub)
      requestHeaders.set('x-user-email', decodedToken.email)
      requestHeaders.set('x-user-role', decodedToken['custom:role'] || 'VENTAS')
      requestHeaders.set('x-user-name', `${decodedToken.given_name} ${decodedToken.family_name}`)

      return NextResponse.next({
        request: { headers: requestHeaders }
      })
    }
    
    console.log('📄 [MIDDLEWARE] Página: Token inválido, pero permitiendo pasar')
    return NextResponse.next()
  }

  // Para APIs, ser estricto
  console.log('🔌 [MIDDLEWARE] Es una API, verificando token estrictamente')
  
  if (!token) {
    console.log('❌ [MIDDLEWARE] API: No token provided for', pathname)
    console.log('❌ [MIDDLEWARE] Fuentes revisadas: Authorization header, cookie "token", cookie "idToken"')
    return NextResponse.json({ error: 'No autorizado - Token requerido' }, { status: 401 })
  }

  const decodedToken = decodeToken(token)
  if (!decodedToken) {
    console.log('❌ [MIDDLEWARE] API: Invalid token format for', pathname)
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  console.log('🔍 [MIDDLEWARE] Token decodificado:', {
    email: decodedToken.email,
    sub: decodedToken.sub,
    exp: decodedToken.exp,
    current: Math.floor(Date.now() / 1000),
    valid: isTokenValid(decodedToken)
  })

  if (!isTokenValid(decodedToken)) {
    console.log('❌ [MIDDLEWARE] API: Expired token for', pathname)
    return NextResponse.json({ error: 'Token expirado' }, { status: 401 })
  }

  const userRole = decodedToken['custom:role'] || 'VENTAS'
  
  // Verificar permisos específicos
  if (pathname.startsWith('/api/usuarios')) {
    if (!['SUPERADMIN', 'ADMIN'].includes(userRole)) {
      console.log('❌ [MIDDLEWARE] API: Insufficient permissions for user management:', userRole)
      return NextResponse.json({ error: 'Sin permisos para gestión de usuarios' }, { status: 403 })
    }
  }

  // Agregar headers de usuario
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', decodedToken.sub)
  requestHeaders.set('x-user-email', decodedToken.email)
  requestHeaders.set('x-user-role', userRole)
  requestHeaders.set('x-user-name', `${decodedToken.given_name} ${decodedToken.family_name}`)

  console.log('✅ [MIDDLEWARE] API: Token válido para:', decodedToken.email, 'Role:', userRole)
  console.log('✅ [MIDDLEWARE] Headers agregados:', {
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