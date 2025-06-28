// src/app/api/auth/forgot-password/route.ts
import { 
    CognitoIdentityProviderClient, 
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand 
  } from '@aws-sdk/client-cognito-identity-provider';
  import { NextResponse } from 'next/server';
  import { getSecretHash, cognitoConfig } from '@/lib/cognito-utils';
  
  // Solicitar reset de contraseña
  export async function POST(request: Request) {
    try {
      const { email } = await request.json();
  
      if (!email) {
        return NextResponse.json(
          { error: 'Email es requerido' },
          { status: 400 }
        );
      }
  
      const cognitoClient = new CognitoIdentityProviderClient({
        region: cognitoConfig.region,
      });
  
      // Generar SECRET_HASH
      const secretHash = getSecretHash(email);
  
      const forgotPasswordCommand = new ForgotPasswordCommand({
        ClientId: cognitoConfig.clientId,
        Username: email,
        SecretHash: secretHash, // ← Agregado
      });
  
      await cognitoClient.send(forgotPasswordCommand);
  
      return NextResponse.json({
        message: 'Código de reset enviado a tu email.',
      });
  
    } catch (error: any) {
      console.error('Error en forgot password:', error);
      
      let errorMessage = 'Error interno del servidor';
      
      if (error.name === 'UserNotFoundException') {
        errorMessage = 'Usuario no encontrado';
      } else if (error.name === 'InvalidParameterException') {
        errorMessage = 'Usuario no confirmado';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
  }