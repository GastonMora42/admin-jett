// src/app/api/auth/refresh/route.ts - VERSIÓN CORREGIDA
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { NextResponse } from 'next/server';
import { getSecretHash, cognitoConfig, extractUsernameFromToken } from '@/lib/cognito-utils';

function decodeToken(token: string): Record<string, unknown> | null {
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
    
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch (error) {
    console.error('❌ Error decoding token:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔄 [REFRESH] Iniciando refresh de tokens...');
    
    const body = await request.json();
    const { refreshToken, idToken } = body;

    if (!refreshToken) {
      console.log('❌ [REFRESH] No refresh token provided');
      return NextResponse.json(
        { error: 'Refresh token es requerido' },
        { status: 400 }
      );
    }

    if (!idToken) {
      console.log('❌ [REFRESH] No idToken provided for username extraction');
      return NextResponse.json(
        { error: 'idToken es requerido para el refresh' },
        { status: 400 }
      );
    }

    // Decodificar el idToken para obtener el username correcto
    const decodedToken = decodeToken(idToken);
    if (!decodedToken) {
      console.log('❌ [REFRESH] No se pudo decodificar el idToken');
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      );
    }

    // CRÍTICO: Usar la función nueva para extraer username
    let username: string;
    try {
      username = extractUsernameFromToken(decodedToken);
    } catch (error) {
      console.log('❌ [REFRESH] Error extrayendo username:', error);
      return NextResponse.json(
        { error: 'No se pudo obtener información del usuario del token' },
        { status: 400 }
      );
    }

    console.log('🔍 [REFRESH] Username para SECRET_HASH:', username);

    const cognitoClient = new CognitoIdentityProviderClient({
      region: cognitoConfig.region,
    });

    // Generar SECRET_HASH con el username correcto
    let secretHash: string;
    try {
      secretHash = getSecretHash(username);
      console.log('🔐 [REFRESH] SECRET_HASH generado exitosamente');
    } catch (error) {
      console.log('❌ [REFRESH] Error generando SECRET_HASH:', error);
      return NextResponse.json(
        { error: 'Error generando SECRET_HASH' },
        { status: 500 }
      );
    }

    // Preparar comando de refresh
    const refreshCommand = new InitiateAuthCommand({
      ClientId: cognitoConfig.clientId,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: secretHash,
      },
    });

    console.log('📡 [REFRESH] Enviando comando a Cognito...');

    // Ejecutar refresh
    const result = await cognitoClient.send(refreshCommand);
    const authResult = result.AuthenticationResult;

    if (!authResult) {
      console.log('❌ [REFRESH] No AuthenticationResult received');
      return NextResponse.json(
        { error: 'Error al refrescar tokens' },
        { status: 400 }
      );
    }

    console.log('✅ [REFRESH] Tokens refreshed successfully');

    return NextResponse.json({
      accessToken: authResult.AccessToken,
      idToken: authResult.IdToken,
      refreshToken: authResult.RefreshToken || refreshToken, // Usar el nuevo si viene, sino el anterior
      expiresIn: authResult.ExpiresIn,
    });

  } catch (error: unknown) {
    console.log('❌ [REFRESH] Error:', error);
    
    let errorMessage = 'Error interno del servidor';
    const err = error as { name?: string; message?: string };
    
    if (err.name === 'NotAuthorizedException') {
      if (err.message?.includes('SecretHash')) {
        errorMessage = 'Error de SECRET_HASH - configuración incorrecta';
      } else if (err.message?.includes('refresh token')) {
        errorMessage = 'Refresh token inválido o expirado';
      } else {
        errorMessage = 'Token de actualización inválido';
      }
    } else if (err.name === 'UserNotFoundException') {
      errorMessage = 'Usuario no encontrado';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}