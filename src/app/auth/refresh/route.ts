// src/app/api/auth/refresh/route.ts - CORREGIDO
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { NextResponse } from 'next/server';
import { getSecretHash, cognitoConfig } from '@/lib/cognito-utils';

// Función para decodificar JWT y obtener información del usuario
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

    console.log('🔄 Iniciando refresh de tokens...');

    // CLAVE: Obtener el username correcto del idToken
    let username = '';
    if (idToken) {
      const decodedToken = decodeToken(idToken);
      
      // SOLUCIÓN: Usar el mismo valor que se usó en el login
      // En el login usamos 'email' como USERNAME, así que seguimos usando email
      // Fallback order: email -> username -> sub
      username = decodedToken?.email || decodedToken?.username || decodedToken?.sub || '';
      
      console.log('🔍 Token decodificado:', {
        email: decodedToken?.email,
        username: decodedToken?.username,
        sub: decodedToken?.sub,
        selectedUsername: username
      });
    }

    if (!username) {
      console.error('❌ No se pudo extraer username del token');
      return NextResponse.json(
        { error: 'No se pudo obtener información del usuario del token' },
        { status: 400 }
      );
    }

    const cognitoClient = new CognitoIdentityProviderClient({
      region: cognitoConfig.region,
    });

    // Preparar parámetros de autenticación
    const authParameters: any = {
      REFRESH_TOKEN: refreshToken,
    };

    // Agregar SECRET_HASH usando el username correcto
    if (cognitoConfig.clientSecret) {
      authParameters.SECRET_HASH = getSecretHash(username);
      console.log('🔐 SECRET_HASH generado para username:', username);
    }

    const refreshCommand = new InitiateAuthCommand({
      ClientId: cognitoConfig.clientId,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: authParameters,
    });

    console.log('📡 Enviando comando de refresh a Cognito...');
    const result = await cognitoClient.send(refreshCommand);
    const authResult = result.AuthenticationResult;

    if (!authResult) {
      console.error('❌ No se recibió AuthenticationResult');
      return NextResponse.json(
        { error: 'Error al refrescar tokens' },
        { status: 400 }
      );
    }

    console.log('✅ Tokens refreshed exitosamente');

    return NextResponse.json({
      accessToken: authResult.AccessToken,
      idToken: authResult.IdToken,
      // El refresh token puede ser el mismo o uno nuevo
      refreshToken: authResult.RefreshToken || refreshToken,
      expiresIn: authResult.ExpiresIn,
    });

  } catch (error: any) {
    console.error('❌ Error en refresh completo:', error);
    
    let errorMessage = 'Error interno del servidor';
    
    if (error.name === 'NotAuthorizedException') {
      console.log('🔒 Token de refresh inválido o expirado');
      errorMessage = 'Token de actualización inválido o expirado';
    } else if (error.name === 'UserNotFoundException') {
      errorMessage = 'Usuario no encontrado';
    } else if (error.message?.includes('SecretHash')) {
      console.log('🔑 Error de SECRET_HASH - verificar configuración');
      errorMessage = 'Error de configuración de autenticación';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}