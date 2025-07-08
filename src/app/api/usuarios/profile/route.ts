// =====================================================
// API PERFIL USUARIO - src/app/api/usuarios/profile/route.ts
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/api-auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return authResult.response
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: authResult.user!.id },
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
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return authResult.response
    }

    const data = await request.json()
    const { nombre, apellido } = data

    // Actualizar en la base de datos
    const usuario = await prisma.usuario.update({
      where: { id: authResult.user!.id },
      data: {
        ...(nombre && { nombre }),
        ...(apellido && { apellido }),
      }
    })

    return NextResponse.json({ message: 'Perfil actualizado correctamente', usuario })
  } catch (error) {
    console.error('Error al actualizar perfil:', error)
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 })
  }
}