
// =====================================================
// API EXPORTAR DATOS - src/app/api/exportar/route.ts
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // 'clientes', 'proyectos', 'pagos'
    const formato = searchParams.get('formato') || 'json' // 'json', 'csv'

    let data: any[] = []

    switch (tipo) {
      case 'clientes':
        data = await prisma.cliente.findMany({
          include: {
            proyectos: true
          }
        })
        break
      case 'proyectos':
        data = await prisma.proyecto.findMany({
          include: {
            cliente: true,
            pagos: true
          }
        })
        break
      case 'pagos':
        data = await prisma.pago.findMany({
          include: {
            proyecto: {
              include: {
                cliente: true
              }
            }
          }
        })
        break
      default:
        return NextResponse.json({ error: 'Tipo de exportación no válido' }, { status: 400 })
    }

    if (formato === 'csv') {
      const csv = convertToCSV(data, tipo)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${tipo}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Error al exportar datos' }, { status: 500 })
  }
}

function convertToCSV(data: any[], tipo: string): string {
  if (data.length === 0) return ''

  let headers: string[] = []
  let rows: string[][] = []

  switch (tipo) {
    case 'clientes':
      headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Empresa', 'Estado', 'Fecha Registro', 'Total Proyectos']
      rows = data.map(cliente => [
        cliente.id,
        cliente.nombre,
        cliente.email,
        cliente.telefono || '',
        cliente.empresa || '',
        cliente.estado,
        new Date(cliente.fechaRegistro).toLocaleDateString(),
        cliente.proyectos?.length.toString() || '0'
      ])
      break
    case 'proyectos':
      headers = ['ID', 'Nombre', 'Cliente', 'Tipo', 'Monto Total', 'Estado Proyecto', 'Estado Pago', 'Fecha Inicio']
      rows = data.map(proyecto => [
        proyecto.id,
        proyecto.nombre,
        proyecto.cliente?.nombre || '',
        proyecto.tipo,
        proyecto.montoTotal.toString(),
        proyecto.estadoProyecto,
        proyecto.estadoPago,
        new Date(proyecto.fechaInicio).toLocaleDateString()
      ])
      break
    case 'pagos':
      headers = ['ID', 'Proyecto', 'Cliente', 'Cuota', 'Monto', 'Fecha Vencimiento', 'Fecha Pago', 'Estado', 'Método']
      rows = data.map(pago => [
        pago.id,
        pago.proyecto?.nombre || '',
        pago.proyecto?.cliente?.nombre || '',
        pago.numeroCuota.toString(),
        pago.montoCuota.toString(),
        new Date(pago.fechaVencimiento).toLocaleDateString(),
        pago.fechaPagoReal ? new Date(pago.fechaPagoReal).toLocaleDateString() : '',
        pago.estadoPago,
        pago.metodoPago || ''
      ])
      break
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n')

  return csvContent
}