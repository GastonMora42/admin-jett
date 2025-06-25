// =====================================================
// API MARCAR PAGOS VENCIDOS - src/app/api/pagos/marcar-vencidos/route.ts
// =====================================================

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST() {
  try {
    const hoy = new Date()
    hoy.setHours(23, 59, 59, 999) // Fin del día actual

    await prisma.pago.updateMany({
      where: {
        fechaVencimiento: {
          lt: hoy
        },
        estadoPago: 'PENDIENTE'
      },
      data: {
        estadoPago: 'VENCIDO'
      }
    })

    return NextResponse.json({ message: 'Pagos vencidos actualizados' })
  } catch (error) {
    return NextResponse.json({ error: 'Error al marcar pagos vencidos' }, { status: 500 })
  }
}

