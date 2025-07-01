
// =====================================================
// API ESTADÍSTICAS - src/app/api/estadisticas/route.ts
// =====================================================

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Estadísticas por tipo de proyecto
    const proyectosPorTipo = await prisma.proyecto.groupBy({
      by: ['tipo'],
      _count: true,
      _sum: { montoTotal: true }
    })

    // Estadísticas por estado de proyecto
    const proyectosPorEstado = await prisma.proyecto.groupBy({
      by: ['estadoProyecto'],
      _count: true
    })

    // Clientes más activos (por número de proyectos)
    const clientesMasActivos = await prisma.cliente.findMany({
      include: {
        proyectos: {
          select: {
            id: true,
            montoTotal: true
          }
        }
      },
      take: 10
    }).then(clientes => 
      clientes
        .map(cliente => ({
          id: cliente.id,
          nombre: cliente.nombre,
          empresa: cliente.empresa,
          totalProyectos: cliente.proyectos.length,
          totalFacturado: cliente.proyectos.reduce((sum, p) => sum + p.montoTotal, 0)
        }))
        .sort((a, b) => b.totalFacturado - a.totalFacturado)
    )

    // Proyectos más rentables
    const proyectosMasRentables = await prisma.proyecto.findMany({
      include: {
        cliente: true
      },
      orderBy: {
        montoTotal: 'desc'
      },
      take: 10
    })

    // Evolución mensual de ingresos
    const evolucionIngresos = await prisma.pago.findMany({
      where: {
        estadoPago: 'PAGADO',
        fechaPagoReal: {
          gte: new Date(new Date().getFullYear(), 0, 1) // Desde enero de este año
        }
      },
      select: {
        montoCuota: true,
        fechaPagoReal: true
      }
    })

    // Agrupar por mes
    const ingresosPorMes = evolucionIngresos.reduce((acc, pago) => {
      if (!pago.fechaPagoReal) return acc
      
      const mes = pago.fechaPagoReal.getMonth()
      const año = pago.fechaPagoReal.getFullYear()
      const key = `${año}-${mes.toString().padStart(2, '0')}`
      
      if (!acc[key]) {
        acc[key] = 0
      }
      acc[key] += pago.montoCuota
      
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      proyectosPorTipo,
      proyectosPorEstado,
      clientesMasActivos,
      proyectosMasRentables,
      ingresosPorMes
    })
  } catch (err) {
    console.error('Error al obtener estadísticas:', err)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
