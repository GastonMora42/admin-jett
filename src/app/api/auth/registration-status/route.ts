// =====================================================
// API ESTADO DE REGISTRO - src/app/api/auth/registration-status/route.ts
// =====================================================

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Verificar si el registro público está habilitado
    const isEnabled = process.env.ENABLE_PUBLIC_REGISTRATION === 'true'
    
    return NextResponse.json({
      enabled: isEnabled,
      environment: process.env.NODE_ENV,
      message: isEnabled 
        ? 'Registro público habilitado' 
        : 'Registro público deshabilitado en este entorno'
    })
    
  } catch (error) {
    console.error('Error verificando estado de registro:', error)
    return NextResponse.json(
      { 
        enabled: false,
        message: 'Error al verificar estado' 
      },
      { status: 500 }
    )
  }
}