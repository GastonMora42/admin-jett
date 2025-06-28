// src/app/api/auth/confirm-forgot-password/route.ts
import { CognitoIdentityProviderClient, ConfirmForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { NextResponse } from 'next/server';
import { getSecretHash, cognitoConfig } from '@/lib/cognito-utils';

export async function POST(request: Request) {
  try {
    const { email, confirmationCode, newPassword } = await request.json();

    if (!email || !confirmationCode || !newPassword) {
      return NextResponse.json(
        { error: 'Email, código de confirmación y nueva contraseña son requeridos' },
        { status: 400 }
      );
    }

    const cognitoClient = new CognitoIdentityProviderClient({
      region: cognitoConfig.region,
    });

    // Generar SECRET_HASH
    const secretHash = getSecretHash(email);

    const confirmForgotPasswordCommand = new ConfirmForgotPasswordCommand({
      ClientId: cognitoConfig.clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
      SecretHash: secretHash, // ← Agregado
    });

    await cognitoClient.send(confirmForgotPasswordCommand);

    return NextResponse.json({
      message: 'Contraseña actualizada exitosamente.',
    });

  } catch (error: any) {
    console.error('Error en confirm forgot password:', error);
    
    let errorMessage = 'Error interno del servidor';
    
    if (error.name === 'CodeMismatchException') {
      errorMessage = 'Código de confirmación inválido';
    } else if (error.name === 'ExpiredCodeException') {
      errorMessage = 'Código de confirmación expirado';
    } else if (error.name === 'InvalidPasswordException') {
      errorMessage = 'La nueva contraseña no cumple con los requisitos';
    } else if (error.name === 'UserNotFoundException') {
      errorMessage = 'Usuario no encontrado';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}