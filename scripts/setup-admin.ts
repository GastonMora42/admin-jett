// =====================================================
// SCRIPT SETUP ADMINISTRADOR - scripts/setup-admin.ts
// =====================================================

import { PrismaClient } from '@prisma/client'
import { CognitoService } from '../src/lib/cognito'
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

async function setupAdmin() {
  console.log('🚀 Configuración del Primer Administrador - Jett Labs\n')
  
  try {
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

    console.log('📝 Ingresa los datos del nuevo Super Administrador:\n')

    // Recopilar datos
    const email = await askQuestion('📧 Email corporativo: ')
    if (!email || !email.includes('@')) {
      throw new Error('❌ Email inválido')
    }

    const nombre = await askQuestion('👤 Nombre: ')
    if (!nombre) {
      throw new Error('❌ Nombre requerido')
    }

    const apellido = await askQuestion('👤 Apellido: ')
    if (!apellido) {
      throw new Error('❌ Apellido requerido')
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error('❌ Ya existe un usuario con este email')
    }

    console.log('\n🔐 Configurando contraseña temporal...')
    
    // Generar contraseña temporal segura
    const tempPassword = generateSecurePassword()
    console.log(`🔑 Contraseña temporal: ${tempPassword}`)
    console.log('⚠️  IMPORTANTE: Guarda esta contraseña, deberás cambiarla en el primer login\n')

    const confirmar = await askQuestion('¿Confirmas la creación del usuario? (s/N): ')
    if (confirmar.toLowerCase() !== 's' && confirmar.toLowerCase() !== 'si') {
      console.log('❌ Operación cancelada')
      process.exit(0)
    }

    console.log('\n🔄 Creando usuario en AWS Cognito...')

    // Crear usuario en Cognito
    let cognitoUsername: string
    try {
      cognitoUsername = await CognitoService.createUser({
        email,
        firstName: nombre,
        lastName: apellido,
        temporaryPassword: tempPassword,
        rol: 'SUPERADMIN'
      })
      console.log('✅ Usuario creado en Cognito exitosamente')
    } catch (cognitoError: any) {
      console.error('❌ Error en Cognito:', cognitoError.message)
      throw new Error('No se pudo crear el usuario en Cognito. Verifica la configuración de AWS.')
    }

    console.log('💾 Guardando usuario en la base de datos...')

    // Crear usuario en la base de datos
    const nuevoAdmin = await prisma.usuario.create({
      data: {
        cognitoId: cognitoUsername,
        email,
        nombre,
        apellido,
        rol: 'SUPERADMIN',
        estado: 'ACTIVO'
      }
    })

    console.log('\n🎉 ¡Super Administrador creado exitosamente!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`👤 Nombre: ${nuevoAdmin.nombre} ${nuevoAdmin.apellido}`)
    console.log(`📧 Email: ${nuevoAdmin.email}`)
    console.log(`🔑 Contraseña temporal: ${tempPassword}`)
    console.log(`🆔 ID de usuario: ${nuevoAdmin.id}`)
    console.log(`👑 Rol: ${nuevoAdmin.rol}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    console.log('\n📋 PRÓXIMOS PASOS:')
    console.log('1. 🌐 Accede a http://localhost:3000')
    console.log('2. 🔐 Haz clic en "Iniciar Sesión"')
    console.log('3. 📧 Usa el email y contraseña temporal mostrados arriba')
    console.log('4. 🔄 Cambia la contraseña en el primer login')
    console.log('5. ✅ ¡Comienza a usar Jett Labs!')

    console.log('\n💡 NOTAS IMPORTANTES:')
    console.log('• La contraseña temporal expira si no se usa')
    console.log('• Debes cambiar la contraseña en el primer login')
    console.log('• Como SUPERADMIN tienes acceso total al sistema')
    console.log('• Puedes crear más usuarios desde el panel de administración')

  } catch (error: any) {
    console.error('\n❌ Error durante la configuración:', error.message)
    console.log('\n🔧 VERIFICACIONES:')
    console.log('• ¿Están configuradas las variables de entorno de AWS?')
    console.log('• ¿Está ejecutándose la base de datos?')
    console.log('• ¿Las credenciales de Cognito son correctas?')
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

function generateSecurePassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '@#$%&*'
  
  let password = ''
  
  // Asegurar al menos un carácter de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Completar hasta 12 caracteres
  const allChars = uppercase + lowercase + numbers + symbols
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Mezclar caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Ejecutar el script
setupAdmin().catch(console.error)