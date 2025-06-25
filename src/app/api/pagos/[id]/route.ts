// =====================================================
// API PAGOS INDIVIDUAL - src/app/api/pagos/[id]/route.ts
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pago = await prisma.pago.findUnique({
      where: { id: params.id },
      include: {
        proyecto: {
          include: {
            cliente: true
          }
        }
      }
    })
    
    if (!pago) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }
    
    return NextResponse.json(pago)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener pago' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    const pago = await prisma.pago.update({
      where: { id: params.id },
      data: {
        fechaPagoReal: data.fechaPagoReal ? new Date(data.fechaPagoReal) : null,
        estadoPago: data.estadoPago,
        metodoPago: data.metodoPago,
        notas: data.notas
      }
    })

    // Actualizar estado del proyecto automáticamente
    await actualizarEstadoProyecto(pago.proyectoId)

    return NextResponse.json(pago)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar pago' }, { status: 500 })
  }
}

async function actualizarEstadoProyecto(proyectoId: string) {
  const pagos = await prisma.pago.findMany({
    where: { proyectoId }
  })

  const totalPagos = pagos.length
  const pagosPagados = pagos.filter(p => p.estadoPago === 'PAGADO').length

  let estadoPago = 'PENDIENTE'
  if (pagosPagados === totalPagos) {
    estadoPago = 'COMPLETO'
  } else if (pagosPagados > 0) {
    estadoPago = 'PARCIAL'
  }

  await prisma.proyecto.update({
    where: { id: proyectoId },
    data: { estadoPago: estadoPago as any }
  })
}

