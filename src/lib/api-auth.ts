// =====================================================
// API AUTH UTILS CORREGIDA - src/lib/api-auth.ts
// =====================================================

import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuthenticatedUser {
  id: string
  email: string
  rol: string
  cognitoId: string
}

// Función para obtener el usuario autenticado de los headers del middleware
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const userId = request.headers.get('x-user-id')
    const userEmail = request.headers.get('x-user-email')
    const userRole = request.headers.get('x-user-role')

    if (!userId || !userEmail) {
      console.log('❌ No user info in headers')
      return null
    }

    console.log('🔍 Looking for user:', { userId, userEmail, userRole })

    // 1. Buscar primero por cognitoId
    let usuario = await prisma.usuario.findUnique({
      where: { cognitoId: userId }
    })

    if (usuario) {
      console.log('✅ Usuario encontrado por cognitoId:', usuario.email)
      
      // Actualizar fecha de último login
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { fechaLogin: new Date() }
      })

      return {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        cognitoId: usuario.cognitoId
      }
    }

    // 2. Si no existe por cognitoId, buscar por email
    usuario = await prisma.usuario.findUnique({
      where: { email: userEmail }
    })

    if (usuario) {
      console.log('📝 Usuario encontrado por email, actualizando cognitoId:', userEmail)
      
      // Actualizar el cognitoId en el usuario existente
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: { 
          cognitoId: userId,
          fechaLogin: new Date() 
        }
      })

      return {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        cognitoId: usuario.cognitoId
      }
    }

    // 3. Si no existe en absoluto, crear nuevo usuario
    console.log('📝 Creando nuevo usuario en DB:', userEmail)
    
    // Extraer nombre y apellido del email si no los tenemos
    const nameParts = userEmail.split('@')[0].split('.')
    const nombre = nameParts[0] || 'Usuario'
    const apellido = nameParts[1] || 'Nuevo'

    try {
      usuario = await prisma.usuario.create({
        data: {
          cognitoId: userId,
          email: userEmail,
          nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
          apellido: apellido.charAt(0).toUpperCase() + apellido.slice(1),
          rol: (userRole as any) || 'VENTAS',
          estado: 'ACTIVO'
        }
      })

      console.log('✅ Nuevo usuario creado:', usuario.email)

      return {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        cognitoId: usuario.cognitoId
      }
    } catch (createError: any) {
      // Si falla la creación, puede ser una condición de carrera
      // Intentar buscar nuevamente
      if (createError.code === 'P2002') {
        console.log('⚠️ Race condition detected, retry finding user by email')
        
        usuario = await prisma.usuario.findUnique({
          where: { email: userEmail }
        })

        if (usuario) {
          // Actualizar cognitoId si el usuario fue creado por otro proceso
          usuario = await prisma.usuario.update({
            where: { id: usuario.id },
            data: { 
              cognitoId: userId,
              fechaLogin: new Date() 
            }
          })

          return {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
            cognitoId: usuario.cognitoId
          }
        }
      }
      
      throw createError
    }

  } catch (error) {
    console.error('❌ Error getting authenticated user:', error)
    return null
  }
}

// Función para verificar permisos
export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

// Middleware de autenticación para APIs
export async function requireAuth(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    return {
      error: true,
      response: Response.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  return {
    error: false,
    user
  }
}

// Middleware de autorización para APIs
export async function requireRole(request: NextRequest, requiredRoles: string[]) {
  const authResult = await requireAuth(request)
  
  if (authResult.error) {
    return authResult
  }

  if (!hasPermission(authResult.user!.rol, requiredRoles)) {
    return {
      error: true,
      response: Response.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }
  }

  return {
    error: false,
    user: authResult.user
  }
}