// =====================================================
// API PERFIL USUARIO - src/app/api/usuarios/profile/route.ts
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { CognitoService } from '@/lib/cognito'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        estado: true,
        fechaCreacion: true,
        fechaLogin: true,
      }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Error al obtener perfil:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { nombre, apellido, telefono, bio, timezone, idioma, notificaciones } = data

    // Actualizar en la base de datos
    const usuario = await prisma.usuario.update({
      where: { id: session.user.id },
      data: {
        ...(nombre && { nombre }),
        ...(apellido && { apellido }),
      }
    })

    // Actualizar en Cognito si hay cambios en nombre/apellido
    if (nombre || apellido) {
      try {
        await CognitoService.updateUser(usuario.cognitoId, {
          firstName: nombre || usuario.nombre,
          lastName: apellido || usuario.apellido,
        })
      } catch (cognitoError) {
        console.error('Error actualizando Cognito:', cognitoError)
        // No fallar la operación si Cognito falla
      }
    }

    return NextResponse.json({ message: 'Perfil actualizado correctamente', usuario })
  } catch (error) {
    console.error('Error al actualizar perfil:', error)
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 })
  }
}
