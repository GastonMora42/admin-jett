// API endpoints para configuración de moneda
import { NextRequest, NextResponse } from 'next/server'

// Simulamos una base de datos simple en memoria
let currencySettings: any = null

export async function GET() {
  try {
    // En un entorno real, cargarías desde la base de datos
    return NextResponse.json(currencySettings || {})
  } catch (error) {
    return NextResponse.json({ error: 'Error loading currency settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json()
    
    // En un entorno real, guardarías en la base de datos
    currencySettings = settings
    
    return NextResponse.json({ message: 'Currency settings updated', settings })
  } catch (error) {
    return NextResponse.json({ error: 'Error saving currency settings' }, { status: 500 });
  }
  }
