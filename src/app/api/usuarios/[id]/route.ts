// =====================================================
// API USUARIO INDIVIDUAL CORREGIDA - src/app/api/usuarios/[id]/route.ts
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { CognitoService } from '@/lib/cognito'
import { RolUsuario } from '@/types/auth'
import { requireAuth } from '@/lib/api-auth'

const prisma = new PrismaClient()

// Next.js 15 - Nueva sintaxis para parámetros
interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return authResult.response
    }

    const user = authResult.user!
    
    if (!['SUPERADMIN', 'ADMIN'].includes(user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await context.params
    const data = await request.json()
    const { nombre, apellido, rol, estado } = data

    // Obtener usuario actual
    const usuario = await prisma.usuario.findUnique({
      where: { id }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Solo SUPERADMIN puede modificar otros SUPERADMIN
    if (usuario.rol === 'SUPERADMIN' && user.rol !== 'SUPERADMIN') {
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
      where: { id },
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
  context: RouteParams
) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return authResult.response
    }

    const user = authResult.user!
    
    if (user.rol !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Solo SUPERADMIN puede eliminar usuarios' }, { status: 403 })
    }

    const { id } = await context.params

    const usuario = await prisma.usuario.findUnique({
      where: { id }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // No permitir auto-eliminación
    if (usuario.id === user.id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
    }

    // Eliminar de Cognito
    await CognitoService.deleteUser(usuario.cognitoId)

    // Eliminar de la base de datos
    await prisma.usuario.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}