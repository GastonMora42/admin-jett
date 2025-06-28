// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Aquí puedes agregar lógica adicional de logout si es necesaria
    // Como invalidar tokens en el servidor, logs de auditoría, etc.
    
    return NextResponse.json({
      message: 'Logout exitoso',
    });

  } catch (error: any) {
    console.error('Error en logout:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}