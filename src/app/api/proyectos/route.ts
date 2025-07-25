// src/app/api/proyectos/route.ts - VERSIÓN CORREGIDA
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/api-auth'

const prisma = new PrismaClient()

interface CreateProyectoData {
  nombre: string
  tipo: string
  montoTotal: number
  formaPago: string
  cuotas?: number
  fechaInicio: string
  fechaEntrega?: string
  clienteId: string
  currency?: 'USD' | 'ARS'
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/proyectos - Starting...')
    
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      console.log('❌ Auth failed:', authResult.response)
      return authResult.response
    }

    console.log('✅ Auth successful, fetching proyectos...')

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

    console.log(`✅ Found ${proyectos.length} proyectos`)

    // Simplificar: remover currency por ahora para evitar problemas
    const proyectosResponse = proyectos.map(proyecto => ({
      ...proyecto,
      // Agregar currency por defecto sin usar globals
      currency: 'ARS' as const
    }))

    return NextResponse.json(proyectosResponse)
  } catch (error) {
    console.error('❌ Error in GET /api/proyectos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/proyectos - Starting...')
    
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      console.log('❌ Auth failed:', authResult.response)
      return authResult.response
    }

    const data: CreateProyectoData = await request.json()
    console.log('📝 Received project data:', { 
      nombre: data.nombre, 
      clienteId: data.clienteId, 
      montoTotal: data.montoTotal 
    })

    const { 
      nombre, 
      tipo, 
      montoTotal, 
      formaPago, 
      cuotas, 
      fechaInicio, 
      fechaEntrega, 
      clienteId,
      currency = 'ARS'
    } = data

    // Validaciones básicas
    if (!nombre || !clienteId || !montoTotal) {
      console.log('❌ Validation failed: missing required fields')
      return NextResponse.json({ 
        error: 'Nombre, cliente y monto son requeridos' 
      }, { status: 400 })
    }

    // Verificar que el cliente existe
    const clienteExists = await prisma.cliente.findUnique({
      where: { id: clienteId }
    })

    if (!clienteExists) {
      console.log('❌ Cliente not found:', clienteId)
      return NextResponse.json({ 
        error: 'Cliente no encontrado' 
      }, { status: 400 })
    }

    console.log('✅ Cliente verified, creating project...')

    // Crear proyecto
    const proyecto = await prisma.proyecto.create({
      data: {
        nombre,
        tipo: tipo as any || 'SOFTWARE_A_MEDIDA',
        montoTotal: parseFloat(montoTotal.toString()),
        formaPago: formaPago as any || 'PAGO_UNICO',
        cuotas: parseInt(cuotas?.toString() || '1'),
        fechaInicio: new Date(fechaInicio),
        fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
        clienteId,
        creadoPor: authResult.user!.id
      }
    })

    console.log('✅ Project created with ID:', proyecto.id)

    // Crear pagos automáticamente con mejor manejo de errores
    try {
      await crearPagosAutomaticos({
        id: proyecto.id,
        montoTotal: proyecto.montoTotal,
        cuotas: proyecto.cuotas || 1,
        fechaInicio: proyecto.fechaInicio,
        formaPago: proyecto.formaPago
      })
      console.log('✅ Pagos automáticos creados')
    } catch (pagosError) {
      console.error('⚠️ Error creating automatic payments:', pagosError)
      // No fallar el proyecto si los pagos fallan, solo log
    }

    // Obtener proyecto completo para response
    const proyectoCompleto = await prisma.proyecto.findUnique({
      where: { id: proyecto.id },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            empresa: true,
            email: true
          }
        },
        pagos: true
      }
    })

    console.log('✅ Project creation completed successfully')

    return NextResponse.json({
      ...proyectoCompleto,
      currency
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error in POST /api/proyectos:', error)
    return NextResponse.json({ 
      error: 'Error al crear proyecto',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

interface ProyectoData {
  id: string
  montoTotal: number
  cuotas: number
  fechaInicio: Date
  formaPago: string
}

// Función auxiliar mejorada para crear pagos
async function crearPagosAutomaticos(proyecto: ProyectoData) {
  try {
    console.log('💰 Creating automatic payments for project:', proyecto.id)
    
    const { id, montoTotal, cuotas, fechaInicio, formaPago } = proyecto
    const montoPorCuota = montoTotal / cuotas

    // Crear todos los pagos en una transacción
    const pagosData = []
    
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

      pagosData.push({
        numeroCuota: i,
        montoCuota: i === cuotas ? 
          montoTotal - (montoPorCuota * (cuotas - 1)) : // Ajustar último pago por redondeo
          montoPorCuota,
        fechaVencimiento,
        proyectoId: id,
        estadoPago: 'PENDIENTE'
      })
    }

    // Crear todos los pagos de una vez
    await prisma.pago.createMany({
      data: pagosData.map(pago => ({
        ...pago,
        // Aseguramos que estadoPago sea del tipo correcto (por ejemplo, 'PENDIENTE' as EstadoPago)
        estadoPago: 'PENDIENTE' as any // Cambia 'any' por el enum correcto si lo tienes importado, por ejemplo: as EstadoPago
      }))
    })

    console.log(`✅ Se crearon ${pagosData.length} pagos automáticos`)
  } catch (error) {
    console.error('❌ Error in crearPagosAutomaticos:', error)
    throw error
  }
}