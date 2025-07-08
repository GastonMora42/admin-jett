// =====================================================
// API USUARIOS CORREGIDA - src/app/api/usuarios/route.ts
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { CognitoService } from '@/lib/cognito'
import { RolUsuario } from '@/types/auth'
import { requireAuth } from '@/lib/api-auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return authResult.response
    }

    if (!['SUPERADMIN', 'ADMIN'].includes(authResult.user!.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const usuarios = await prisma.usuario.findMany({
      orderBy: { fechaCreacion: 'desc' },
      include: {
        _count: {
          select: {
            clientesCreados: true,
            proyectosCreados: true,
            pagosGestionados: true,
          }
        }
      }
    })

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return authResult.response
    }

    if (!['SUPERADMIN', 'ADMIN'].includes(authResult.user!.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const data = await request.json()
    const { email, nombre, apellido, rol, password } = data

    // Validaciones
    if (!email || !nombre || !apellido || !rol || !password) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    if (!['SUPERADMIN', 'ADMIN', 'VENTAS'].includes(rol)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }

    // Solo SUPERADMIN puede crear otros SUPERADMIN
    if (rol === 'SUPERADMIN' && authResult.user!.rol !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Solo SUPERADMIN puede crear otros SUPERADMIN' }, { status: 403 })
    }

    // Verificar si el email ya existe
    const existeUsuario = await prisma.usuario.findUnique({
      where: { email }
    })

    if (existeUsuario) {
      return NextResponse.json({ error: 'Ya existe un usuario con este email' }, { status: 400 })
    }

    // Crear usuario en Cognito
    const cognitoUsername = await CognitoService.createUser({
      email,
      firstName: nombre,
      lastName: apellido,
      temporaryPassword: password,
      rol: rol.toUpperCase(),
    })

    // Crear usuario en la base de datos
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        cognitoId: cognitoUsername,
        email,
        nombre,
        apellido,
        rol: rol as RolUsuario,
        creadoPor: authResult.user!.id,
      },
      include: {
        _count: {
          select: {
            clientesCreados: true,
            proyectosCreados: true,
            pagosGestionados: true,
          }
        }
      }
    })

    return NextResponse.json(nuevoUsuario, { status: 201 })
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}