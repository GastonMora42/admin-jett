// src/app/api/auth/login/route.ts - CORREGIDO
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

    console.log('🔐 [LOGIN] Intento de login para:', email);

    const cognitoClient = new CognitoIdentityProviderClient({
      region: cognitoConfig.region,
    });

    // CRÍTICO: Para login, el username ES el email
    // Cognito registra el usuario con email como username
    const secretHash = getSecretHash(email);

    const authCommand = new InitiateAuthCommand({
      ClientId: cognitoConfig.clientId,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    });

    console.log('📡 [LOGIN] Enviando comando a Cognito...');

    const result = await cognitoClient.send(authCommand);
    const authResult = result.AuthenticationResult;
    
    if (!authResult) {
      return NextResponse.json(
        { error: 'Error en la autenticación' },
        { status: 400 }
      );
    }

    console.log('✅ [LOGIN] Login exitoso para:', email);

    return NextResponse.json({
      message: 'Login exitoso',
      accessToken: authResult.AccessToken,
      idToken: authResult.IdToken,
      refreshToken: authResult.RefreshToken,
      expiresIn: authResult.ExpiresIn,
    });

  } catch (error: any) {
    console.error('❌ [LOGIN] Error:', error.name, error.message);
    
    let errorMessage = 'Error interno del servidor';
    
    if (error.name === 'NotAuthorizedException') {
      errorMessage = 'Email o contraseña incorrectos';
    } else if (error.name === 'UserNotConfirmedException') {
      errorMessage = 'Usuario no confirmado. Verifica tu email.';
    } else if (error.name === 'UserNotFoundException') {
      errorMessage = 'Usuario no encontrado';
    } else if (error.name === 'TooManyRequestsException') {
      errorMessage = 'Demasiados intentos. Intenta más tarde.';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}