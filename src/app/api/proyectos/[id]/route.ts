// =====================================================
// API PROYECTOS INDIVIDUAL - src/app/api/proyectos/[id]/route.ts
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Next.js 15 - Nueva sintaxis para parámetros
interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    
    const proyecto = await prisma.proyecto.findUnique({
      where: { id },
      include: {
        cliente: true,
        pagos: {
          orderBy: {
            numeroCuota: 'asc'
          }
        }
      }
    })
    
    if (!proyecto) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }
    
    return NextResponse.json(proyecto)
  } catch (error) {
    console.error('Error al obtener proyecto:', error)
    return NextResponse.json({ error: 'Error al obtener proyecto' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    const data = await request.json()
    
    const proyecto = await prisma.proyecto.update({
      where: { id },
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        montoTotal: data.montoTotal,
        formaPago: data.formaPago,
        cuotas: data.cuotas,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
        fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega) : undefined,
        estadoProyecto: data.estadoProyecto,
        estadoPago: data.estadoPago,
        clienteId: data.clienteId
      }
    })
    return NextResponse.json(proyecto)
  } catch (error) {
    console.error('Error al actualizar proyecto:', error)
    return NextResponse.json({ error: 'Error al actualizar proyecto' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    
    await prisma.proyecto.delete({
      where: { id }
    })
    return NextResponse.json({ message: 'Proyecto eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar proyecto:', error)
    return NextResponse.json({ error: 'Error al eliminar proyecto' }, { status: 500 })
  }
}