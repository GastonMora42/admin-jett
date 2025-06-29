// =====================================================
// API PAGOS CORREGIDA - src/app/api/pagos/route.ts
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/api-auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return authResult.response
    }

    const pagos = await prisma.pago.findMany({
      orderBy: { fechaVencimiento: 'asc' },
      include: {
        proyecto: {
          select: {
            id: true,
            nombre: true,
            cliente: {
              select: {
                id: true,
                nombre: true,
                empresa: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(pagos)
  } catch (error) {
    console.error('Error al obtener pagos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return authResult.response
    }

    const data = await request.json()
    const { 
      numeroCuota, 
      montoCuota, 
      fechaVencimiento, 
      proyectoId,
      metodoPago,
      notas
    } = data

    // Validaciones básicas
    if (!numeroCuota || !montoCuota || !fechaVencimiento || !proyectoId) {
      return NextResponse.json({ 
        error: 'Todos los campos básicos son requeridos' 
      }, { status: 400 })
    }

    const pago = await prisma.pago.create({
      data: {
        numeroCuota: parseInt(numeroCuota),
        montoCuota: parseFloat(montoCuota),
        fechaVencimiento: new Date(fechaVencimiento),
        proyectoId,
        estadoPago: 'PENDIENTE',
        metodoPago,
        notas,
        gestionadoPor: authResult.user!.id
      }
    })

    return NextResponse.json(pago, { status: 201 })
  } catch (error) {
    console.error('Error al crear pago:', error)
    return NextResponse.json({ error: 'Error al crear pago' }, { status: 500 })
  }
}