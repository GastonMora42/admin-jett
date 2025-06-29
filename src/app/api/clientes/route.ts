// =====================================================
// API CLIENTES CORREGIDA - src/app/api/clientes/route.ts
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

    const clientes = await prisma.cliente.findMany({
      orderBy: { fechaRegistro: 'desc' },
      include: {
        proyectos: {
          select: {
            id: true,
            montoTotal: true,
            estadoProyecto: true
          }
        }
      }
    })

    return NextResponse.json(clientes)
  } catch (error) {
    console.error('Error al obtener clientes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return authResult.response
    }

    const data = await request.json()
    const { nombre, email, telefono, empresa, estado } = data

    // Validaciones básicas
    if (!nombre || !email) {
      return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 })
    }

    // Verificar email único
    const existeCliente = await prisma.cliente.findUnique({
      where: { email }
    })

    if (existeCliente) {
      return NextResponse.json({ error: 'Ya existe un cliente con este email' }, { status: 400 })
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        email,
        telefono,
        empresa,
        estado: estado || 'ACTIVO',
        creadoPor: authResult.user!.id
      }
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    console.error('Error al crear cliente:', error)
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }
}