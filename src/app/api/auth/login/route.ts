// src/app/api/auth/login/route.ts
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { NextResponse } from 'next/server';
import { getSecretHash, cognitoConfig } from '@/lib/cognito-utils';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y password son requeridos' },
        { status: 400 }
      );
    }

    const cognitoClient = new CognitoIdentityProviderClient({
      region: cognitoConfig.region,
    });

    // Generar SECRET_HASH
    const secretHash = getSecretHash(email);

    const authCommand = new InitiateAuthCommand({
      ClientId: cognitoConfig.clientId,
      AuthFlow: 'USER_PASSWORD_AUTH', // Asegúrate de que este flow esté habilitado en Cognito
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: secretHash, // ← Agregado
      },
    });

    const result = await cognitoClient.send(authCommand);

    // Extraer tokens de la respuesta
    const authResult = result.AuthenticationResult;
    
    if (!authResult) {
      return NextResponse.json(
        { error: 'Error en la autenticación' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Login exitoso',
      accessToken: authResult.AccessToken,
      idToken: authResult.IdToken,
      refreshToken: authResult.RefreshToken,
      expiresIn: authResult.ExpiresIn,
    });

  } catch (error: any) {
    console.error('Error en login:', error);
    
    let errorMessage = 'Error interno del servidor';
    
    if (error.name === 'NotAuthorizedException') {
      errorMessage = 'Email o contraseña incorrectos';
    } else if (error.name === 'UserNotConfirmedException') {
      errorMessage = 'Usuario no confirmado. Verifica tu email.';
    } else if (error.name === 'UserNotFoundException') {
      errorMessage = 'Usuario no encontrado';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}