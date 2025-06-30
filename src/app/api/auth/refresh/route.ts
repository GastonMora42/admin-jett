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

    // Obtener email del idToken para generar SECRET_HASH
    let username = '';
    if (idToken) {
      const decodedToken = decodeToken(idToken);
      username = decodedToken?.email || decodedToken?.username || '';
      console.log('📧 Username para SECRET_HASH:', username);
    }

    const cognitoClient = new CognitoIdentityProviderClient({
      region: cognitoConfig.region,
    });

    // IMPORTANTE: Para REFRESH_TOKEN_AUTH necesitamos SECRET_HASH
    const authParameters: any = {
      REFRESH_TOKEN: refreshToken,
    };

    // Si tenemos el client secret configurado, SIEMPRE agregar SECRET_HASH
    if (cognitoConfig.clientSecret && username) {
      authParameters.SECRET_HASH = getSecretHash(username);
      console.log('🔐 SECRET_HASH agregado para:', username);
    } else if (cognitoConfig.clientSecret) {
      console.warn('⚠️ Se requiere SECRET_HASH pero no se encontró username');
      return NextResponse.json(
        { error: 'No se pudo generar SECRET_HASH - token inválido' },
        { status: 400 }
      );
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