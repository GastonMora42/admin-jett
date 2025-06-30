// src/app/api/auth/refresh/route.ts - CORREGIDO
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { NextResponse } from 'next/server';
import { getSecretHash, cognitoConfig } from '@/lib/cognito-utils';

// Función para decodificar JWT y obtener email
function decodeToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { refreshToken, idToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token es requerido' },
        { status: 400 }
      );
    }

    // Obtener email del idToken para generar SECRET_HASH
    let userEmail = '';
    if (idToken) {
      const decodedToken = decodeToken(idToken);
      userEmail = decodedToken?.email || '';
    }

    const cognitoClient = new CognitoIdentityProviderClient({
      region: cognitoConfig.region,
    });

    // Para REFRESH_TOKEN_AUTH necesitamos el SECRET_HASH
    const authParameters: any = {
      REFRESH_TOKEN: refreshToken,
    };

    // Solo agregar SECRET_HASH si tenemos el email
    if (userEmail) {
      authParameters.SECRET_HASH = getSecretHash(userEmail);
    }

    const refreshCommand = new InitiateAuthCommand({
      ClientId: cognitoConfig.clientId,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: authParameters,
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
    } else if (error.name === 'UserNotFoundException') {
      errorMessage = 'Usuario no encontrado';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}