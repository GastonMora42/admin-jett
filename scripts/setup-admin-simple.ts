// =====================================================
// SETUP ADMIN SIMPLIFICADO - scripts/setup-admin-simple.ts
// =====================================================

import { PrismaClient } from '@prisma/client'
import readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

async function setupFirstAdmin() {
  console.log('🚀 Configuración del Primer Administrador - Jett Labs (Modo Simplificado)\n')
  
  try {
    // Verificar variables de entorno básicas
    const requiredEnvs = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'AWS_REGION',
      'AWS_COGNITO_USER_POOL_ID',
      'AWS_COGNITO_CLIENT_ID',
      'AWS_COGNITO_CLIENT_SECRET'
    ]

    const missingEnvs = requiredEnvs.filter(env => !process.env[env])
    
    if (missingEnvs.length > 0) {
      console.error('❌ Variables de entorno faltantes:')
      missingEnvs.forEach(env => console.error(`   - ${env}`))
      process.exit(1)
    }

    // Verificar conexión a la base de datos
    await prisma.$connect()
    console.log('✅ Conexión con la base de datos exitosa\n')

    // Verificar si ya existe un superadmin
    const existingSuperAdmin = await prisma.usuario.findFirst({
      where: { rol: 'SUPERADMIN' }
    })

    if (existingSuperAdmin) {
      console.log('⚠️  Ya existe un Super Administrador en el sistema')
      console.log(`📧 Email: ${existingSuperAdmin.email}`)
      console.log(`👤 Nombre: ${existingSuperAdmin.nombre} ${existingSuperAdmin.apellido}`)
      
      const continuar = await askQuestion('\n¿Deseas crear otro Super Administrador? (s/N): ')
      if (continuar.toLowerCase() !== 's' && continuar.toLowerCase() !== 'si') {
        console.log('❌ Operación cancelada')
        process.exit(0)
      }
    }

    console.log('📝 INSTRUCCIONES PARA CREAR EL PRIMER USUARIO:\n')
    console.log('1. 🌐 Ve a http://localhost:3000/auth/register')
    console.log('2. 📝 Completa el formulario de registro')
    console.log('3. 👑 Selecciona el rol "Super Admin"')
    console.log('4. 📧 Confirma tu email con el código que recibirás')
    console.log('5. 🔐 Inicia sesión en http://localhost:3000/auth/signin')
    console.log('\n💡 NOTA: El registro público está habilitado solo en desarrollo')
    console.log('   En producción, cambia ENABLE_PUBLIC_REGISTRATION=false\n')

    // Verificar el estado actual del registro
    const registrationEnabled = process.env.ENABLE_PUBLIC_REGISTRATION === 'true'
    const nodeEnv = process.env.NODE_ENV || 'development'

    console.log('📊 ESTADO ACTUAL:')
    console.log(`   - Entorno: ${nodeEnv}`)
    console.log(`   - Registro público: ${registrationEnabled ? '✅ Habilitado' : '❌ Deshabilitado'}`)
    
    if (!registrationEnabled) {
      console.log('\n⚠️  PROBLEMA: El registro público está deshabilitado')
      console.log('🔧 SOLUCIÓN: Agrega a tu .env.local:')
      console.log('   ENABLE_PUBLIC_REGISTRATION=true')
      console.log('\nLuego reinicia el servidor con: npm run dev')
    }

    console.log('\n🚀 PASOS PARA EMPEZAR:')
    console.log('1. npm run dev (si no está ejecutándose)')
    console.log('2. Ve a http://localhost:3000')
    console.log('3. Clic en "Iniciar Sesión"')
    console.log('4. Clic en "Crear Nueva Cuenta" (si está disponible)')
    console.log('5. Completa el registro como SUPERADMIN')
    console.log('6. Confirma tu email')
    console.log('7. ¡Inicia sesión y comienza a usar Jett Labs!')

    console.log('\n🔒 PARA PRODUCCIÓN:')
    console.log('- Cambia ENABLE_PUBLIC_REGISTRATION=false')
    console.log('- Solo los usuarios registrados en desarrollo podrán acceder')
    console.log('- Usa el panel de administración para crear más usuarios')

    const startServer = await askQuestion('\n¿Quieres iniciar el servidor de desarrollo ahora? (s/N): ')
    
    if (startServer.toLowerCase() === 's' || startServer.toLowerCase() === 'si') {
      console.log('\n🚀 Iniciando servidor...')
      console.log('Ejecuta: npm run dev')
      console.log('Luego ve a: http://localhost:3000')
    }

  } catch (error: any) {
    console.error('\n❌ Error durante la configuración:', error.message)
    console.log('\n🔧 VERIFICACIONES:')
    console.log('• ¿Está configurado el archivo .env.local?')
    console.log('• ¿Está ejecutándose la base de datos?')
    console.log('• ¿Ejecutaste: npx prisma db push?')
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

// Ejecutar el script
setupFirstAdmin().catch(console.error)