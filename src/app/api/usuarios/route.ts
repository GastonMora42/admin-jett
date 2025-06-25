// =====================================================
// API USUARIOS - src/app/api/usuarios/route.ts
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { CognitoService } from '@/lib/cognito'
import { RolUsuario } from '@/types/auth'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.rol)) {
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
    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.rol)) {
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
    if (rol === 'SUPERADMIN' && session.user.rol !== 'SUPERADMIN') {
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
        creadoPor: session.user.id,
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

// =====================================================
// API USUARIO INDIVIDUAL - src/app/api/usuarios/[id]/route.ts
// =====================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const data = await request.json()
    const { nombre, apellido, rol, estado } = data

    // Obtener usuario actual
    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Solo SUPERADMIN puede modificar otros SUPERADMIN
    if (usuario.rol === 'SUPERADMIN' && session.user.rol !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Solo SUPERADMIN puede modificar otros SUPERADMIN' }, { status: 403 })
    }

    // Actualizar en Cognito si hay cambios en nombre/apellido
    if (nombre || apellido) {
      await CognitoService.updateUser(usuario.cognitoId, {
        firstName: nombre,
        lastName: apellido,
      })
    }

    // Actualizar estado en Cognito si es necesario
    if (estado !== undefined) {
      await CognitoService.setUserEnabled(usuario.cognitoId, estado === 'ACTIVO')
    }

    // Actualizar rol en Cognito
    if (rol && rol !== usuario.rol) {
      // Remover del grupo anterior
      await CognitoService.removeUserFromGroup(usuario.cognitoId, usuario.rol)
      // Agregar al nuevo grupo
      await CognitoService.addUserToGroup(usuario.cognitoId, rol)
    }

    // Actualizar en la base de datos
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: params.id },
      data: {
        ...(nombre && { nombre }),
        ...(apellido && { apellido }),
        ...(rol && { rol: rol as RolUsuario }),
        ...(estado && { estado }),
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

    return NextResponse.json(usuarioActualizado)
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.rol !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Solo SUPERADMIN puede eliminar usuarios' }, { status: 403 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // No permitir auto-eliminación
    if (usuario.id === session.user.id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
    }

    // Eliminar de Cognito
    await CognitoService.deleteUser(usuario.cognitoId)

    // Eliminar de la base de datos
    await prisma.usuario.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}