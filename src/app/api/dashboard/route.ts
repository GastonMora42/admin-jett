// =====================================================
// API DASHBOARD ACTUALIZADA - src/app/api/dashboard/route.ts
// =====================================================

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Calcular métricas básicas
    const totalProyectos = await prisma.proyecto.count()
    const proyectosActivos = await prisma.proyecto.count({
      where: { estadoProyecto: 'EN_DESARROLLO' }
    })
    const proyectosCompletados = await prisma.proyecto.count({
      where: { estadoProyecto: 'COMPLETADO' }
    })
    const clientesActivos = await prisma.cliente.count({
      where: { estado: 'ACTIVO' }
    })
    
    // Calcular totales financieros
    const totalFacturadoResult = await prisma.proyecto.aggregate({
      _sum: { montoTotal: true }
    })
    const totalFacturado = totalFacturadoResult._sum.montoTotal || 0

    // Pagos pendientes y vencidos
    const pagos = await prisma.pago.findMany()
    const pendienteCobro = pagos
      .filter(p => p.estadoPago === 'PENDIENTE' || p.estadoPago === 'VENCIDO')
      .reduce((sum, p) => sum + p.montoCuota, 0)

    const pagosVencidos = await prisma.pago.count({
      where: {
        estadoPago: 'VENCIDO'
      }
    })

    // Facturación del mes actual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    
    const finMes = new Date()
    finMes.setMonth(finMes.getMonth() + 1, 0)
    finMes.setHours(23, 59, 59, 999)

    const pagosMesResult = await prisma.pago.aggregate({
      where: {
        fechaPagoReal: {
          gte: inicioMes,
          lte: finMes
        },
        estadoPago: 'PAGADO'
      },
      _sum: { montoCuota: true }
    })
    const facturacionMes = pagosMesResult._sum.montoCuota || 0

    // Tendencia de facturación (comparación con mes anterior)
    const inicioMesAnterior = new Date()
    inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1, 1)
    inicioMesAnterior.setHours(0, 0, 0, 0)
    
    const finMesAnterior = new Date()
    finMesAnterior.setMonth(finMesAnterior.getMonth(), 0)
    finMesAnterior.setHours(23, 59, 59, 999)

    const pagosMesAnteriorResult = await prisma.pago.aggregate({
      where: {
        fechaPagoReal: {
          gte: inicioMesAnterior,
          lte: finMesAnterior
        },
        estadoPago: 'PAGADO'
      },
      _sum: { montoCuota: true }
    })
    const facturacionMesAnterior = pagosMesAnteriorResult._sum.montoCuota || 0

    const tendenciaFacturacion = facturacionMesAnterior > 0 
      ? Math.round(((facturacionMes - facturacionMesAnterior) / facturacionMesAnterior) * 100)
      : 0

    // Proyectos por mes para gráficos
    const proyectosPorMes = await prisma.proyecto.groupBy({
      by: ['fechaInicio'],
      _count: true,
      orderBy: {
        fechaInicio: 'asc'
      }
    })

    const dashboard = {
      totalProyectos,
      proyectosActivos,
      proyectosCompletados,
      clientesActivos,
      totalFacturado,
      pendienteCobro,
      facturacionMes,
      pagosVencidos,
      tendenciaFacturacion,
      proyectosPorMes: proyectosPorMes.slice(-6) // Últimos 6 meses
    }

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Error en dashboard:', error)
    return NextResponse.json({ error: 'Error al obtener dashboard' }, { status: 500 })
  }
}

