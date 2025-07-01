// src/middleware.ts - VERSIÓN CORREGIDA para manejar cookies de Cognito
import { NextRequest, NextResponse } from 'next/server'

interface DecodedToken {
  sub: string
  email: string
  given_name: string
  family_name: string
  'custom:role'?: string
  exp: number
  iat: number
  'cognito:username'?: string
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
  })
  return isValid
}

function extractCognitoTokenFromCookies(cookieHeader: string): string | null {
  console.log('🔍 [MIDDLEWARE] Searching for Cognito tokens in cookies...')
  
  // Parse cookies manually
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    if (key && value) {
      acc[key] = decodeURIComponent(value)
    }
    return acc
  }, {} as Record<string, string>)

  console.log('🔍 [MIDDLEWARE] Parsed cookies:', Object.keys(cookies))

  // Buscar tokens de Cognito
  for (const [cookieName, cookieValue] of Object.entries(cookies)) {
    console.log('🔍 [MIDDLEWARE] Checking cookie:', cookieName)
    
    // Buscar idToken de Cognito primero (mejor opción)
    if (cookieName.includes('CognitoIdentityServiceProvider') && cookieName.endsWith('.idToken')) {
      console.log('🔑 [MIDDLEWARE] Found Cognito idToken:', cookieName)
      console.log('🔑 [MIDDLEWARE] Token value length:', cookieValue.length)
      return cookieValue
    }
  }

  // Segundo intento: buscar accessToken si no hay idToken
  for (const [cookieName, cookieValue] of Object.entries(cookies)) {
    if (cookieName.includes('CognitoIdentityServiceProvider') && cookieName.endsWith('.accessToken')) {
      console.log('🔑 [MIDDLEWARE] Found Cognito accessToken as fallback:', cookieName)
      return cookieValue
    }
  }

  console.log('❌ [MIDDLEWARE] No Cognito tokens found in cookies')
  return null
}

function extractToken(request: NextRequest): { token: string | null, source: string } {
  console.log('🔍 [MIDDLEWARE] Extracting token from request...')
  
  // 1. Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    console.log('🔑 [MIDDLEWARE] Token found in Authorization header')
    return { token, source: 'auth-header' }
  }
  
  // 2. X-Auth-Token header (custom header from api-client)
  const customHeader = request.headers.get('x-auth-token')
  if (customHeader) {
    console.log('🔑 [MIDDLEWARE] Token found in X-Auth-Token header')
    return { token: customHeader, source: 'custom-header' }
  }
  
  // 3. X-Access-Token header (fallback)
  const accessHeader = request.headers.get('x-access-token')
  if (accessHeader) {
    console.log('🔑 [MIDDLEWARE] Token found in X-Access-Token header')
    return { token: accessHeader, source: 'access-header' }
  }
  
  // 4. Cookies usando request.cookies API (nombres simples)
  const tokenCookie = request.cookies.get('token')?.value
  if (tokenCookie) {
    console.log('🔑 [MIDDLEWARE] Token found in simple token cookie')
    return { token: tokenCookie, source: 'simple-cookie' }
  }

  const idTokenCookie = request.cookies.get('idToken')?.value
  if (idTokenCookie) {
    console.log('🔑 [MIDDLEWARE] Token found in simple idToken cookie')
    return { token: idTokenCookie, source: 'simple-cookie' }
  }

  // 5. NUEVO: Buscar cookies de Cognito
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    console.log('🔍 [MIDDLEWARE] Parsing raw cookie header for Cognito tokens...')
    console.log('🔍 [MIDDLEWARE] Raw cookie header:', cookieHeader.substring(0, 200) + '...')
    
    const cognitoToken = extractCognitoTokenFromCookies(cookieHeader)
    if (cognitoToken) {
      console.log('🔑 [MIDDLEWARE] Token found in Cognito cookies')
      return { token: cognitoToken, source: 'cognito-cookie' }
    }

    // Fallback: buscar cookies simples en header raw
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        acc[key] = decodeURIComponent(value)
      }
      return acc
    }, {} as Record<string, string>)

    console.log('🔍 [MIDDLEWARE] All parsed cookies:', Object.keys(cookies))

    if (cookies.token) {
      console.log('🔑 [MIDDLEWARE] Token found in raw cookie header')
      return { token: cookies.token, source: 'raw-header' }
    }

    if (cookies.idToken) {
      console.log('🔑 [MIDDLEWARE] idToken found in raw cookie header')
      return { token: cookies.idToken, source: 'raw-header' }
    }
  }

  console.log('❌ [MIDDLEWARE] No token found in any location')
  console.log('🔍 [MIDDLEWARE] Available cookies:', request.cookies.getAll().map(c => c.name))
  console.log('🔍 [MIDDLEWARE] Cookie header exists:', !!cookieHeader)
  
  return { token: null, source: 'none' }
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

  // APIs públicas que no requieren autenticación
  const publicApiRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/confirm',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/auth/registration-status',
    '/api/auth/forgot-password',
    '/api/auth/confirm-forgot-password',
    '/api/auth/resend-code',
    '/api/setup/admin'
  ]

  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')
  const isPublicApiRoute = publicApiRoutes.includes(pathname)
  
  if (isPublicRoute || isPublicApiRoute) {
    console.log('✅ [MIDDLEWARE] Public route allowed:', pathname)
    return NextResponse.next()
  }

  // Extraer token con múltiples métodos
  const { token, source } = extractToken(request)

  // Para páginas (no APIs), redirigir si no hay token
  if (!pathname.startsWith('/api/')) {
    console.log('📄 [MIDDLEWARE] Processing page request')
    
    if (!token) {
      console.log('📄 [MIDDLEWARE] No token found - redirecting to login')
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + encodeURIComponent(pathname), request.url))
    }
    
    const decodedToken = decodeToken(token)
    if (decodedToken && isTokenValid(decodedToken)) {
      console.log('✅ [MIDDLEWARE] Valid token for page from:', source)
      
      // Modificar request headers para pages
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', decodedToken.sub)
      requestHeaders.set('x-user-email', decodedToken.email)
      requestHeaders.set('x-user-role', decodedToken['custom:role'] || 'VENTAS')
      requestHeaders.set('x-user-name', `${decodedToken.given_name} ${decodedToken.family_name}`)

      console.log('✅ [MIDDLEWARE] Added user headers for page:', decodedToken.email)

      const response = NextResponse.next({
        request: { headers: requestHeaders }
      })

      // NUEVO: Si el token viene de Cognito, establecer cookies simples para futuros requests
      if (source === 'cognito-cookie') {
        console.log('🍪 [MIDDLEWARE] Syncing Cognito token to simple cookies')
        response.cookies.set('token', token, { 
          httpOnly: false, 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 86400 // 24 horas
        })
        response.cookies.set('idToken', token, { 
          httpOnly: false, 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 86400
        })
      }

      return response
    }
    
    console.log('📄 [MIDDLEWARE] Invalid token - redirecting to login')
    return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + encodeURIComponent(pathname), request.url))
  }

  // Para APIs, verificación estricta
  console.log('🔌 [MIDDLEWARE] Processing API request - strict verification')
  
  if (!token) {
    console.log('❌ [MIDDLEWARE] API request rejected: no token')
    return NextResponse.json({ 
      error: 'No autorizado - Token requerido',
      debug: {
        path: pathname,
        cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
        hasAuthHeader: !!request.headers.get('authorization'),
        hasCustomHeader: !!request.headers.get('x-auth-token'),
        hasCookieHeader: !!request.headers.get('cookie'),
        source: source
      }
    }, { status: 401 })
  }

  const decodedToken = decodeToken(token)
  if (!decodedToken) {
    console.log('❌ [MIDDLEWARE] API request rejected: invalid token format')
    return NextResponse.json({ 
      error: 'Token inválido',
      debug: { tokenLength: token.length, tokenStart: token.substring(0, 20), source }
    }, { status: 401 })
  }

  if (!isTokenValid(decodedToken)) {
    console.log('❌ [MIDDLEWARE] API request rejected: token expired')
    return NextResponse.json({ 
      error: 'Token expirado',
      debug: { exp: decodedToken.exp, current: Math.floor(Date.now() / 1000), source }
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

  console.log('✅ [MIDDLEWARE] API request authorized for:', decodedToken.email, 'Role:', userRole, 'Source:', source)
  console.log('✅ [MIDDLEWARE] User headers added successfully')
  
  const response = NextResponse.next({
    request: { headers: requestHeaders }
  })

  // NUEVO: Sincronizar cookies simples si el token viene de Cognito
  if (source === 'cognito-cookie') {
    console.log('🍪 [MIDDLEWARE] Syncing Cognito token to simple cookies for API')
    response.cookies.set('token', token, { 
      httpOnly: false, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400
    })
    response.cookies.set('idToken', token, { 
      httpOnly: false, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400
    })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|logo.webp).*)',
  ],
}