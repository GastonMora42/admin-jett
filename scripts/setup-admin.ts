// =====================================================
// SETUP ADMIN SCRIPT - scripts/setup-admin.ts
// =====================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSuperAdmin() {
  console.log('🚀 Configurando usuario SUPERADMIN...')

  try {
    // Verificar si ya existe un superadmin
    const existingSuperAdmin = await prisma.usuario.findFirst({
      where: { rol: 'SUPERADMIN' }
    })

    if (existingSuperAdmin) {
      console.log('✅ Ya existe un usuario SUPERADMIN:', existingSuperAdmin.email)
      return
    }

    // Datos del superadmin (CAMBIAR ESTOS VALORES)
    const superAdminData = {
      cognitoId: 'temp-cognito-id', // Se actualizará cuando configures Cognito
      email: 'gaston-mora@hotmail.com', // CAMBIAR POR TU EMAIL
      nombre: 'Admin',
      apellido: 'Sistema',
      rol: 'SUPERADMIN' as const,
      estado: 'ACTIVO' as const,
    }

    // Crear el superadmin
    const superAdmin = await prisma.usuario.create({
      data: superAdminData
    })

    console.log('✅ Usuario SUPERADMIN creado exitosamente!')
    console.log('📧 Email:', superAdmin.email)
    console.log('🆔 ID:', superAdmin.id)
    console.log('')
    console.log('⚠️  IMPORTANTE:')
    console.log('1. Actualiza el cognitoId cuando configures AWS Cognito')
    console.log('2. Cambia el email por el tuyo real')
    console.log('3. Ejecuta el script setup-cognito.ts para crear el usuario en Cognito')

  } catch (error) {
    console.error('❌ Error creando superadmin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSuperAdmin()