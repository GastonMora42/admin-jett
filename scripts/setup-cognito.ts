// =====================================================
// SETUP AWS COGNITO - scripts/setup-cognito.js
// =====================================================

const {
    CognitoIdentityProviderClient,
    CreateGroupCommand,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    AdminAddUserToGroupCommand,
  } = require('@aws-sdk/client-cognito-identity-provider')
  
  const client = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })
  
  const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID
  
  async function setupCognito() {
    console.log('🚀 Configurando AWS Cognito...')
  
    try {
      // 1. Crear grupos de roles
      console.log('📋 Creando grupos de roles...')
      
      const grupos = [
        {
          GroupName: 'SUPERADMIN',
          Description: 'Super Administradores del sistema',
          Precedence: 1,
        },
        {
          GroupName: 'ADMIN',
          Description: 'Administradores del sistema',
          Precedence: 2,
        },
        {
          GroupName: 'VENTAS',
          Description: 'Personal de ventas',
          Precedence: 3,
        },
      ]
  
      for (const grupo of grupos) {
        try {
          await client.send(new CreateGroupCommand({
            UserPoolId: USER_POOL_ID,
            ...grupo,
          }))
          console.log(`✅ Grupo ${grupo.GroupName} creado`)
        } catch (error: unknown) {
          if (error && typeof error === 'object' && 'name' in error && (error as any).name === 'GroupExistsException') {
            console.log(`ℹ️  Grupo ${grupo.GroupName} ya existe`)
          } else {
            throw error
          }
        }
      }
  
      // 2. Crear usuario SUPERADMIN inicial
      console.log('👑 Creando usuario SUPERADMIN inicial...')
      
      const superAdminEmail = 'gaston-mora@hotmail.com' // CAMBIAR POR TU EMAIL
      const temporaryPassword = 'TempPass123!' // CAMBIAR POR UNA CONTRASEÑA TEMPORAL
      
      try {
        // Crear usuario
        const createUserResult = await client.send(new AdminCreateUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: superAdminEmail,
          UserAttributes: [
            { Name: 'email', Value: superAdminEmail },
            { Name: 'given_name', Value: 'Super' },
            { Name: 'family_name', Value: 'Admin' },
            { Name: 'email_verified', Value: 'true' },
          ],
          TemporaryPassword: temporaryPassword,
          MessageAction: 'SUPPRESS', // No enviar email
        }))
  
        console.log('✅ Usuario SUPERADMIN creado')
  
        // Establecer contraseña permanente
        await client.send(new AdminSetUserPasswordCommand({
          UserPoolId: USER_POOL_ID,
          Username: superAdminEmail,
          Password: temporaryPassword,
          Permanent: true,
        }))
  
        console.log('✅ Contraseña establecida como permanente')
  
        // Agregar al grupo SUPERADMIN
        await client.send(new AdminAddUserToGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: superAdminEmail,
          GroupName: 'SUPERADMIN',
        }))
  
        console.log('✅ Usuario agregado al grupo SUPERADMIN')

      } catch (error: unknown) {
        if (
          error &&
          typeof error === 'object' &&
          'name' in error &&
          (error as any).name === 'UsernameExistsException'
        ) {
          console.log('ℹ️  Usuario SUPERADMIN ya existe')
        } else {
          throw error
        }
      }
  
      console.log('✅ Configuración de Cognito completada!')
      console.log('\n📝 Datos importantes:')
      console.log(`   Email: ${superAdminEmail}`)
      console.log(`   Contraseña temporal: ${temporaryPassword}`)
      console.log('\n⚠️  IMPORTANTE: Cambia estos datos en el archivo y actualiza el .env')
  
    } catch (error) {
      console.error('❌ Error configurando Cognito:', error)
      process.exit(1)
    }
  }
  
  // Verificar variables de entorno
  const requiredEnvs = [
    'AWS_REGION',
    'AWS_COGNITO_USER_POOL_ID',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
  ]
  
  const missingEnvs = requiredEnvs.filter(env => !process.env[env])
  
  if (missingEnvs.length > 0) {
    console.error('❌ Variables de entorno faltantes:')
    missingEnvs.forEach(env => console.error(`   - ${env}`))
    process.exit(1)
  }
  
  setupCognito()