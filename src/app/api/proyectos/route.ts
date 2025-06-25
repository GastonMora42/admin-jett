// =====================================================
// API PROYECTOS - src/app/api/proyectos/route.ts
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const proyectos = await prisma.proyecto.findMany({
      orderBy: { fechaInicio: 'desc' },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            empresa: true,
            email: true
          }
        },
        pagos: {
          select: {
            id: true,
            numeroCuota: true,
            montoCuota: true,
            fechaVencimiento: true,
            estadoPago: true
          }
        }
      }
    })

    return NextResponse.json(proyectos)
  } catch (error) {
    console.error('Error al obtener proyectos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { 
      nombre, 
      tipo, 
      montoTotal, 
      formaPago, 
      cuotas, 
      fechaInicio, 
      fechaEntrega, 
      clienteId 
    } = data

    // Validaciones básicas
    if (!nombre || !clienteId || !montoTotal) {
      return NextResponse.json({ 
        error: 'Nombre, cliente y monto son requeridos' 
      }, { status: 400 })
    }

    // Crear proyecto
    const proyecto = await prisma.proyecto.create({
      data: {
        nombre,
        tipo: tipo || 'SOFTWARE_A_MEDIDA',
        montoTotal: parseFloat(montoTotal),
        formaPago: formaPago || 'PAGO_UNICO',
        cuotas: parseInt(cuotas) || 1,
        fechaInicio: new Date(fechaInicio),
        fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
        clienteId,
        creadoPor: session.user.id
      }
    })

    // Crear pagos automáticamente
    await crearPagosAutomaticos(proyecto)

    return NextResponse.json(proyecto, { status: 201 })
  } catch (error) {
    console.error('Error al crear proyecto:', error)
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 })
  }
}

// Función auxiliar para crear pagos
async function crearPagosAutomaticos(proyecto: any) {
  const { id, montoTotal, cuotas, fechaInicio, formaPago } = proyecto
  const montoPorCuota = montoTotal / cuotas

  for (let i = 1; i <= cuotas; i++) {
    const fechaVencimiento = new Date(fechaInicio)
    
    // Calcular fecha de vencimiento según forma de pago
    if (formaPago === 'MENSUAL') {
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i - 1)
    } else if (formaPago === 'DOS_CUOTAS') {
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + (i - 1) * 3) // Cada 3 meses
    } else if (formaPago === 'TRES_CUOTAS') {
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + (i - 1) * 2) // Cada 2 meses
    }
    // Para PAGO_UNICO, usar fecha de inicio

    await prisma.pago.create({
      data: {
        numeroCuota: i,
        montoCuota: i === cuotas ? 
          montoTotal - (montoPorCuota * (cuotas - 1)) : // Ajustar último pago por redondeo
          montoPorCuota,
        fechaVencimiento,
        proyectoId: id,
        estadoPago: 'PENDIENTE'
      }
    })
  }
}