
// =====================================================
// API DE CONFIRMACIÓN - src/app/api/auth/confirm/route.ts
// =====================================================
import { NextRequest, NextResponse } from 'next/server'
import {
  CognitoIdentityProviderClient,
  SignUpCommand
} from '@aws-sdk/client-cognito-identity-provider'

export async function PUT(request: NextRequest) {
    try {
      const { email, confirmationCode } = await request.json()
  
      if (!email || !confirmationCode) {
        return NextResponse.json(
          { message: 'Email y código de confirmación son requeridos' },
          { status: 400 }
        )
      }
  
      try {
        const { ConfirmSignUpCommand } = await import('@aws-sdk/client-cognito-identity-provider')
        
        const confirmCommand = new ConfirmSignUpCommand({
          ClientId: process.env.AWS_COGNITO_CLIENT_ID!,
          Username: email,
          ConfirmationCode: confirmationCode
        })
  
        const cognitoClient = new CognitoIdentityProviderClient({
          region: process.env.AWS_REGION!
        })
  
        await cognitoClient.send(confirmCommand)
  
        return NextResponse.json({
          message: 'Cuenta confirmada exitosamente'
        })
  
      } catch (cognitoError: any) {
        console.error('Error confirmando usuario:', cognitoError)
        
        let message = 'Error al confirmar la cuenta'
        
        if (cognitoError.name === 'CodeMismatchException') {
          message = 'Código de confirmación inválido'
        } else if (cognitoError.name === 'ExpiredCodeException') {
          message = 'El código de confirmación ha expirado'
        } else if (cognitoError.name === 'UserNotFoundException') {
          message = 'Usuario no encontrado'
        } else if (cognitoError.name === 'NotAuthorizedException') {
          message = 'Usuario ya confirmado'
        }
  
        return NextResponse.json(
          { message },
          { status: 400 }
        )
      }
  
    } catch (error) {
      console.error('Error general en confirmación:', error)
      return NextResponse.json(
        { message: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }