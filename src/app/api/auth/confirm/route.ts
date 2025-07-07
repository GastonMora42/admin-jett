// src/app/api/auth/confirm/route.ts
import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { NextResponse } from 'next/server';
import { getSecretHash, cognitoConfig } from '@/lib/cognito-utils';

export async function POST(request: Request) {
  try {
    const { email, confirmationCode } = await request.json();

    if (!email || !confirmationCode) {
      return NextResponse.json(
        { error: 'Email y código de confirmación son requeridos' },
        { status: 400 }
      );
    }

    const cognitoClient = new CognitoIdentityProviderClient({
      region: cognitoConfig.region,
    });

    // Generar SECRET_HASH
    const secretHash = getSecretHash(email);

    const confirmCommand = new ConfirmSignUpCommand({
      ClientId: cognitoConfig.clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
      SecretHash: secretHash,
    });

    await cognitoClient.send(confirmCommand);

    return NextResponse.json({
      message: 'Cuenta confirmada exitosamente. Ya puedes iniciar sesión.',
    });

  } catch (error: unknown) {
    console.error('Error en confirmación:', error);
    
    let errorMessage = 'Error interno del servidor';
    const err = error as { name?: string };
    
    if (err.name === 'CodeMismatchException') {
      errorMessage = 'Código de confirmación inválido';
    } else if (err.name === 'ExpiredCodeException') {
      errorMessage = 'Código de confirmación expirado';
    } else if (err.name === 'UserNotFoundException') {
      errorMessage = 'Usuario no encontrado';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}