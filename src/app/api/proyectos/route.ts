// src/app/api/proyectos/route.ts - VERSIÓN CON SOPORTE DE MONEDA
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/api-auth'

const prisma = new PrismaClient()

interface CreateProyectoDataWithCurrency {
  nombre: string
  tipo: string
  montoTotal: number
  formaPago: string
  cuotas?: number
  fechaInicio: string
  fechaEntrega?: string
  clienteId: string
  currency: 'USD' | 'ARS' // ✅ NUEVA PROPIEDAD
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return authResult.response
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

    // ✅ AGREGAR INFORMACIÓN DE MONEDA A CADA PROYECTO
    const proyectosWithCurrency = proyectos.map(proyecto => ({
      ...proyecto,
      currency: getCurrencyFromMetadata(proyecto.id), // Función auxiliar
    }))

    return NextResponse.json(proyectosWithCurrency)
  } catch (error) {
    console.error('Error al obtener proyectos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return authResult.response
    }

    const data: CreateProyectoDataWithCurrency = await request.json()
    const { 
      nombre, 
      tipo, 
      montoTotal, 
      formaPago, 
      cuotas, 
      fechaInicio, 
      fechaEntrega, 
      clienteId,
      currency // ✅ NUEVA PROPIEDAD
    } = data

    // Validaciones básicas
    if (!nombre || !clienteId || !montoTotal) {
      return NextResponse.json({ 
        error: 'Nombre, cliente y monto son requeridos' 
      }, { status: 400 })
    }

    if (!currency || !['USD', 'ARS'].includes(currency)) {
      return NextResponse.json({ 
        error: 'Moneda inválida. Debe ser USD o ARS' 
      }, { status: 400 })
    }

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

    // ✅ GUARDAR LA MONEDA DEL PROYECTO
    await saveCurrencyMetadata(proyecto.id, currency)

    // Crear pagos automáticamente
    await crearPagosAutomaticos({
      id: proyecto.id,
      montoTotal: proyecto.montoTotal,
      cuotas: proyecto.cuotas || 1,
      fechaInicio: proyecto.fechaInicio,
      formaPago: proyecto.formaPago
    })

    // ✅ RETORNAR PROYECTO CON INFORMACIÓN DE MONEDA
    const proyectoWithCurrency = {
      ...proyecto,
      currency
    }

    return NextResponse.json(proyectoWithCurrency, { status: 201 })
  } catch (error) {
    console.error('Error al crear proyecto:', error)
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 })
  }
}

// ✅ FUNCIONES AUXILIARES PARA MANEJAR METADATA DE MONEDA
async function saveCurrencyMetadata(proyectoId: string, currency: 'USD' | 'ARS') {
  try {
    // Opción 1: Guardar en una tabla separada de metadata
    // await prisma.proyectoMetadata.create({
    //   data: {
    //     proyectoId,
    //     key: 'currency',
    //     value: currency
    //   }
    // })

    // Opción 2: Guardar en localStorage del servidor (temporal)
    // En un entorno real, esto se guardaría en la base de datos
    global.projectCurrencies = global.projectCurrencies || {}
    global.projectCurrencies[proyectoId] = currency
    
    console.log(`💰 Currency ${currency} saved for project ${proyectoId}`)
  } catch (error) {
    console.error('Error saving currency metadata:', error)
  }
}

function getCurrencyFromMetadata(proyectoId: string): 'USD' | 'ARS' {
  try {
    // Opción 1: Cargar desde tabla de metadata
    // const metadata = await prisma.proyectoMetadata.findFirst({
    //   where: { proyectoId, key: 'currency' }
    // })
    // return metadata?.value || 'ARS'

    // Opción 2: Cargar desde storage temporal
    global.projectCurrencies = global.projectCurrencies || {}
    return global.projectCurrencies[proyectoId] || 'ARS'
  } catch (error) {
    console.error('Error getting currency metadata:', error)
    return 'ARS' // Default
  }
}

interface ProyectoData {
  id: string
  montoTotal: number
  cuotas: number
  fechaInicio: Date
  formaPago: string
}

// Función auxiliar para crear pagos (sin cambios)
async function crearPagosAutomaticos(proyecto: ProyectoData) {
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

// ===============================================
// DECLARACIÓN GLOBAL PARA TYPESCRIPT
// ===============================================
declare global {
  var projectCurrencies: Record<string, 'USD' | 'ARS'> | undefined
}