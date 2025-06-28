// =====================================================
// VERIFICACIÓN DE SETUP SIMPLIFICADO - scripts/check-setup.ts
// =====================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSetup() {
  console.log('🔍 Verificando configuración de Jett Labs...\n')

  let allGood = true

  // 1. Verificar variables de entorno
  console.log('📋 Verificando variables de entorno...')
  const requiredEnvs = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'AWS_REGION',
    'AWS_COGNITO_USER_POOL_ID',
    'AWS_COGNITO_CLIENT_ID',
    'AWS_COGNITO_CLIENT_SECRET'
  ]

  const missingEnvs = requiredEnvs.filter(env => !process.env[env])
  
  if (missingEnvs.length > 0) {
    console.error('❌ Variables faltantes:')
    missingEnvs.forEach(env => console.error(`   - ${env}`))
    allGood = false
  } else {
    console.log('✅ Variables de entorno configuradas')
  }

  // 2. Verificar base de datos
  console.log('\n🗄️  Verificando base de datos...')
  try {
    await prisma.$connect()
    console.log('✅ Conexión exitosa')
    
    // Verificar esquema
    const userCount = await prisma.usuario.count()
    console.log(`✅ Esquema válido (${userCount} usuarios)`)
    
    // Verificar si hay admin
    const adminCount = await prisma.usuario.count({
      where: { rol: 'SUPERADMIN' }
    })
    
    if (adminCount === 0) {
      console.log('⚠️  No hay usuarios SUPERADMIN')
    } else {
      console.log(`✅ ${adminCount} usuario(s) SUPERADMIN`)
    }
    
  } catch (error: any) {
    console.error('❌ Error de base de datos:', error.message)
    allGood = false
  }

  // 3. Verificar configuración de Cognito
  console.log('\n🔐 Verificando configuración de Cognito...')
  try {
    const { CognitoIdentityProviderClient, DescribeUserPoolClientCommand } = await import('@aws-sdk/client-cognito-identity-provider')
    
    const cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION!
    })

    const command = new DescribeUserPoolClientCommand({
      UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID!,
      ClientId: process.env.AWS_COGNITO_CLIENT_ID!
    })

    const result = await cognitoClient.send(command)
    console.log('✅ Configuración de Cognito válida')
    console.log(`   - Cliente: ${result.UserPoolClient?.ClientName || 'N/A'}`)
    
  } catch (error: any) {
    console.error('❌ Error de Cognito:', error.message)
    console.log('💡 Verifica:')
    console.log('   - USER_POOL_ID correcto')
    console.log('   - CLIENT_ID correcto')
    console.log('   - CLIENT_SECRET correcto')
    console.log('   - Región correcta')
    allGood = false
  }

  // 4. Verificar configuración de registro
  console.log('\n📝 Verificando configuración de registro...')
  const registrationEnabled = process.env.ENABLE_PUBLIC_REGISTRATION === 'true'
  const nodeEnv = process.env.NODE_ENV || 'development'
  
  console.log(`   - Entorno: ${nodeEnv}`)
  console.log(`   - Registro público: ${registrationEnabled ? '✅ Habilitado' : '❌ Deshabilitado'}`)
  
  if (nodeEnv === 'development' && !registrationEnabled) {
    console.log('⚠️  Recomendación: Habilita ENABLE_PUBLIC_REGISTRATION=true en desarrollo')
  }

  // 5. Resumen final
  console.log('\n' + '='.repeat(50))
  if (allGood) {
    console.log('🎉 ¡Configuración completa y correcta!')
    console.log('\n📋 Próximos pasos:')
    console.log('1. npm run dev (iniciar servidor)')
    console.log('2. Ve a http://localhost:3000')
    
    const adminCount = await prisma.usuario.count({ where: { rol: 'SUPERADMIN' } })
    if (adminCount === 0) {
      console.log('3. Registra el primer usuario SUPERADMIN')
      console.log('4. Confirma tu email')
      console.log('5. ¡Inicia sesión!')
    } else {
      console.log('3. ¡Inicia sesión y comienza!')
    }
  } else {
    console.log('❌ Hay problemas en la configuración')
    console.log('\n🔧 Revisa los errores mostrados arriba')
    console.log('💡 Consulta el README.md para más ayuda')
  }
  console.log('='.repeat(50))

  return allGood
}

async function main() {
  try {
    const success = await checkSetup()
    process.exit(success ? 0 : 1)
  } catch (error) {
    console.error('❌ Error durante la verificación:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()