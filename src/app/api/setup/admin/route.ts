// =====================================================
// API SETUP ADMIN - src/app/api/setup/admin/route.ts
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Solo permitir en desarrollo o si no hay usuarios
    const userCount = await prisma.usuario.count()
    
    if (userCount > 0 && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'No se puede crear admin - ya existen usuarios' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { email, nombre, apellido, cognitoId } = body

    if (!email || !nombre || !apellido) {
      return NextResponse.json({ 
        error: 'Email, nombre y apellido son requeridos' 
      }, { status: 400 })
    }

    // Verificar si ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Ya existe un usuario con este email' 
      }, { status: 400 })
    }

    // Crear superadmin
    const superAdmin = await prisma.usuario.create({
      data: {
        cognitoId: cognitoId || `temp-${Date.now()}`,
        email,
        nombre,
        apellido,
        rol: 'SUPERADMIN',
        estado: 'ACTIVO'
      }
    })

    return NextResponse.json({
      message: 'Superadmin creado exitosamente',
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        nombre: superAdmin.nombre,
        apellido: superAdmin.apellido,
        rol: superAdmin.rol
      }
    })

  } catch (error) {
    console.error('Error creating superadmin:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const userCount = await prisma.usuario.count()
    const hasAdmin = await prisma.usuario.findFirst({
      where: { rol: 'SUPERADMIN' }
    })

    return NextResponse.json({
      needsSetup: userCount === 0 || !hasAdmin,
      userCount,
      hasAdmin: !!hasAdmin
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error checking setup status' 
    }, { status: 500 })
  }
}