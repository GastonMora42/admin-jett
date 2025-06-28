// src/app/api/auth/resend-code/route.ts
import { CognitoIdentityProviderClient, ResendConfirmationCodeCommand } from '@aws-sdk/client-cognito-identity-provider';
import { NextResponse } from 'next/server';
import { getSecretHash, cognitoConfig } from '@/lib/cognito-utils';

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

    const resendCommand = new ResendConfirmationCodeCommand({
      ClientId: cognitoConfig.clientId,
      Username: email,
      SecretHash: secretHash, // ← Agregado
    });

    await cognitoClient.send(resendCommand);

    return NextResponse.json({
      message: 'Código de confirmación reenviado exitosamente.',
    });

  } catch (error: any) {
    console.error('Error al reenviar código:', error);
    
    let errorMessage = 'Error interno del servidor';
    
    if (error.name === 'UserNotFoundException') {
      errorMessage = 'Usuario no encontrado';
    } else if (error.name === 'InvalidParameterException') {
      errorMessage = 'Usuario ya está confirmado';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}