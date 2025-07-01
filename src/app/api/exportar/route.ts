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

    let data: Record<string, unknown>[] = []

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
  } catch (err) {
    console.error('Error al exportar datos:', err)
    return NextResponse.json({ error: 'Error al exportar datos' }, { status: 500 })
  }
}

function convertToCSV(data: Record<string, unknown>[], tipo: string | null): string {
  if (data.length === 0) return ''

  let headers: string[] = []
  let rows: string[][] = []

  switch (tipo) {
    case 'clientes':
      headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Empresa', 'Estado', 'Fecha Registro', 'Total Proyectos']
      rows = data.map(cliente => [
        String(cliente.id),
        String(cliente.nombre),
        String(cliente.email),
        String(cliente.telefono || ''),
        String(cliente.empresa || ''),
        String(cliente.estado),
        new Date(String(cliente.fechaRegistro)).toLocaleDateString(),
        String((cliente.proyectos as unknown[] | undefined)?.length || '0')
      ])
      break
    case 'proyectos':
      headers = ['ID', 'Nombre', 'Cliente', 'Tipo', 'Monto Total', 'Estado Proyecto', 'Estado Pago', 'Fecha Inicio']
      rows = data.map(proyecto => [
        String(proyecto.id),
        String(proyecto.nombre),
        String((proyecto.cliente as { nombre?: string } | undefined)?.nombre || ''),
        String(proyecto.tipo),
        String(proyecto.montoTotal),
        String(proyecto.estadoProyecto),
        String(proyecto.estadoPago),
        new Date(String(proyecto.fechaInicio)).toLocaleDateString()
      ])
      break
    case 'pagos':
      headers = ['ID', 'Proyecto', 'Cliente', 'Cuota', 'Monto', 'Fecha Vencimiento', 'Fecha Pago', 'Estado', 'Método']
      rows = data.map(pago => [
        String(pago.id),
        String((pago.proyecto as { nombre?: string } | undefined)?.nombre || ''),
        String((pago.proyecto as { cliente?: { nombre?: string } } | undefined)?.cliente?.nombre || ''),
        String(pago.numeroCuota),
        String(pago.montoCuota),
        new Date(String(pago.fechaVencimiento)).toLocaleDateString(),
        pago.fechaPagoReal ? new Date(String(pago.fechaPagoReal)).toLocaleDateString() : '',
        String(pago.estadoPago),
        String(pago.metodoPago || '')
      ])
      break
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n')

  return csvContent
}
