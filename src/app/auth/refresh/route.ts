// src/app/api/auth/refresh/route.ts
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { NextResponse } from 'next/server';
import { getSecretHash, cognitoConfig } from '@/lib/cognito-utils';

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token es requerido' },
        { status: 400 }
      );
    }

    const cognitoClient = new CognitoIdentityProviderClient({
      region: cognitoConfig.region,
    });

    const refreshCommand = new InitiateAuthCommand({
      ClientId: cognitoConfig.clientId,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        // NOTA: Para REFRESH_TOKEN_AUTH, no necesitamos SECRET_HASH si no hay usuario específico
        // Pero si tu configuración lo requiere, descomenta la siguiente línea:
        // SECRET_HASH: getSecretHash(''), // Usar email del token original si es necesario
      },
    });

    const result = await cognitoClient.send(refreshCommand);
    const authResult = result.AuthenticationResult;

    if (!authResult) {
      return NextResponse.json(
        { error: 'Error al refrescar tokens' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      accessToken: authResult.AccessToken,
      idToken: authResult.IdToken,
      // El refresh token puede ser el mismo o uno nuevo
      refreshToken: authResult.RefreshToken || refreshToken,
      expiresIn: authResult.ExpiresIn,
    });

  } catch (error: any) {
    console.error('Error en refresh:', error);
    
    let errorMessage = 'Error interno del servidor';
    
    if (error.name === 'NotAuthorizedException') {
      errorMessage = 'Token de actualización inválido o expirado';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}