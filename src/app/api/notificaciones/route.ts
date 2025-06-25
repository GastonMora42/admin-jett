
// =====================================================
// API NOTIFICACIONES - src/app/api/notificaciones/route.ts
// =====================================================

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const hoy = new Date()
    const enUnaSemana = new Date()
    enUnaSemana.setDate(hoy.getDate() + 7)

    // Pagos vencidos
    const pagosVencidos = await prisma.pago.findMany({
      where: {
        estadoPago: 'VENCIDO'
      },
      include: {
        proyecto: {
          include: {
            cliente: true
          }
        }
      },
      orderBy: {
        fechaVencimiento: 'desc'
      },
      take: 10
    })

    // Pagos próximos a vencer (en la próxima semana)
    const pagosProximosVencer = await prisma.pago.findMany({
      where: {
        estadoPago: 'PENDIENTE',
        fechaVencimiento: {
          gte: hoy,
          lte: enUnaSemana
        }
      },
      include: {
        proyecto: {
          include: {
            cliente: true
          }
        }
      },
      orderBy: {
        fechaVencimiento: 'asc'
      }
    })

    // Proyectos sin actividad reciente
    const treintaDiasAtras = new Date()
    treintaDiasAtras.setDate(hoy.getDate() - 30)

    const proyectosSinActividad = await prisma.proyecto.findMany({
      where: {
        estadoProyecto: 'EN_DESARROLLO',
        updatedAt: {
          lt: treintaDiasAtras
        }
      },
      include: {
        cliente: true
      },
      take: 5
    })

    const notificaciones = [
      ...pagosVencidos.map(pago => ({
        id: `vencido-${pago.id}`,
        tipo: 'pago_vencido',
        titulo: 'Pago Vencido',
        mensaje: `El pago de ${pago.proyecto?.cliente?.nombre} por $${pago.montoCuota.toLocaleString()} está vencido`,
        fecha: pago.fechaVencimiento,
        urgente: true,
        leida: false
      })),
      ...pagosProximosVencer.map(pago => ({
        id: `proximo-${pago.id}`,
        tipo: 'pago_proximo',
        titulo: 'Pago Próximo a Vencer',
        mensaje: `El pago de ${pago.proyecto?.cliente?.nombre} por $${pago.montoCuota.toLocaleString()} vence el ${new Date(pago.fechaVencimiento).toLocaleDateString()}`,
        fecha: pago.fechaVencimiento,
        urgente: false,
        leida: false
      })),
      ...proyectosSinActividad.map(proyecto => ({
        id: `inactivo-${proyecto.id}`,
        tipo: 'proyecto_inactivo',
        titulo: 'Proyecto Sin Actividad',
        mensaje: `El proyecto "${proyecto.nombre}" no tiene actualizaciones recientes`,
        fecha: proyecto.updatedAt,
        urgente: false,
        leida: false
      }))
    ]

    return NextResponse.json(notificaciones)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 })
  }
}
