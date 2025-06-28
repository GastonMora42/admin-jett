// =====================================================
// API DE REGISTRO - src/app/api/auth/register/route.ts
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import {
  CognitoIdentityProviderClient,
  SignUpCommand
} from '@aws-sdk/client-cognito-identity-provider'

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION!
})

export async function POST(request: NextRequest) {
  try {
    // Verificar si el registro está habilitado
    if (process.env.ENABLE_PUBLIC_REGISTRATION !== 'true') {
      return NextResponse.json(
        { message: 'Registro público no disponible' },
        { status: 403 }
      )
    }

    const { email, password, firstName, lastName, role } = await request.json()

    // Validaciones básicas
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Email inválido' },
        { status: 400 }
      )
    }

    // Validar contraseña
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Validar rol
    if (!['VENTAS', 'ADMIN', 'SUPERADMIN'].includes(role)) {
      return NextResponse.json(
        { message: 'Rol inválido' },
        { status: 400 }
      )
    }

    try {
      // Crear usuario en Cognito
      const signUpCommand = new SignUpCommand({
        ClientId: process.env.AWS_COGNITO_CLIENT_ID!,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'given_name', Value: firstName },
          { Name: 'family_name', Value: lastName },
          { Name: 'custom:role', Value: role }
        ]
      })

      const result = await cognitoClient.send(signUpCommand)

      return NextResponse.json({
        message: 'Usuario registrado exitosamente. Verifica tu email para confirmar la cuenta.',
        userSub: result.UserSub,
        codeDeliveryDetails: result.CodeDeliveryDetails
      })

    } catch (cognitoError: any) {
      console.error('Error en Cognito:', cognitoError)
      
      let message = 'Error al registrar usuario'
      
      if (cognitoError.name === 'UsernameExistsException') {
        message = 'Ya existe una cuenta con este email'
      } else if (cognitoError.name === 'InvalidPasswordException') {
        message = 'La contraseña no cumple los requisitos de seguridad'
      } else if (cognitoError.name === 'InvalidParameterException') {
        message = 'Datos inválidos. Verifica la información ingresada.'
      }

      return NextResponse.json(
        { message },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error general en registro:', error)
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
