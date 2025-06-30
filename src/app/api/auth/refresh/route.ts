// src/app/api/auth/refresh/route.ts - VERSIÓN DEBUG
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { NextResponse } from 'next/server';
import { getSecretHash, cognitoConfig } from '@/lib/cognito-utils';

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
    console.error('❌ [REFRESH] Error decoding token:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔄 [REFRESH] ===== INICIANDO REFRESH =====');
    
    const body = await request.json();
    const { refreshToken, idToken } = body;

    console.log('🔄 [REFRESH] Request body received:', {
      hasRefreshToken: !!refreshToken,
      hasIdToken: !!idToken,
      refreshTokenLength: refreshToken?.length || 0,
      idTokenLength: idToken?.length || 0
    });

    if (!refreshToken) {
      console.log('❌ [REFRESH] No refresh token provided');
      return NextResponse.json(
        { error: 'Refresh token es requerido' },
        { status: 400 }
      );
    }

    // Decodificar idToken para análisis
    if (idToken) {
      const decodedToken = decodeToken(idToken);
      console.log('🔍 [REFRESH] Token decodificado completo:', {
        email: decodedToken?.email,
        username: decodedToken?.username,
        sub: decodedToken?.sub,
        cognito_username: decodedToken?.['cognito:username'],
        aud: decodedToken?.aud,
        iss: decodedToken?.iss,
        exp: decodedToken?.exp,
        iat: decodedToken?.iat,
        token_use: decodedToken?.token_use,
        auth_time: decodedToken?.auth_time,
        allFields: Object.keys(decodedToken || {})
      });

      // Determinar username para SECRET_HASH
      const username = decodedToken?.email || decodedToken?.username || decodedToken?.sub || '';
      console.log('🔍 [REFRESH] Username seleccionado para SECRET_HASH:', username);

      if (!username) {
        console.log('❌ [REFRESH] No se pudo extraer username del token');
        return NextResponse.json(
          { error: 'No se pudo obtener información del usuario del token' },
          { status: 400 }
        );
      }

      // Mostrar configuración de Cognito (sin secrets)
      console.log('🔍 [REFRESH] Configuración Cognito:', {
        region: cognitoConfig.region,
        clientId: cognitoConfig.clientId,
        hasClientSecret: !!cognitoConfig.clientSecret,
        clientSecretLength: cognitoConfig.clientSecret?.length || 0
      });

      const cognitoClient = new CognitoIdentityProviderClient({
        region: cognitoConfig.region,
      });

      // Generar SECRET_HASH con debugging
      let secretHash;
      try {
        secretHash = getSecretHash(username);
        console.log('🔐 [REFRESH] SECRET_HASH generado exitosamente para:', username);
        console.log('🔐 [REFRESH] SECRET_HASH (primeros 10 chars):', secretHash.substring(0, 10) + '...');
      } catch (error) {
        console.log('❌ [REFRESH] Error generando SECRET_HASH:', error);
        return NextResponse.json(
          { error: 'Error generando SECRET_HASH' },
          { status: 500 }
        );
      }

      const authParameters = {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: secretHash,
      };

      console.log('🔍 [REFRESH] AuthParameters:', {
        hasRefreshToken: !!authParameters.REFRESH_TOKEN,
        hasSecretHash: !!authParameters.SECRET_HASH,
        refreshTokenLength: authParameters.REFRESH_TOKEN?.length || 0,
        secretHashLength: authParameters.SECRET_HASH?.length || 0
      });

      const refreshCommand = new InitiateAuthCommand({
        ClientId: cognitoConfig.clientId,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: authParameters,
      });

      console.log('📡 [REFRESH] Enviando comando a Cognito...');
      console.log('📡 [REFRESH] Comando details:', {
        ClientId: cognitoConfig.clientId,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        hasAuthParameters: !!refreshCommand.AuthParameters
      });

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
      console.log('✅ [REFRESH] New tokens received:', {
        hasAccessToken: !!authResult.AccessToken,
        hasIdToken: !!authResult.IdToken,
        hasRefreshToken: !!authResult.RefreshToken,
        expiresIn: authResult.ExpiresIn
      });

      return NextResponse.json({
        accessToken: authResult.AccessToken,
        idToken: authResult.IdToken,
        refreshToken: authResult.RefreshToken || refreshToken,
        expiresIn: authResult.ExpiresIn,
      });

    } else {
      console.log('❌ [REFRESH] No idToken provided for username extraction');
      return NextResponse.json(
        { error: 'idToken es requerido para el refresh' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.log('❌ [REFRESH] ===== ERROR COMPLETO =====');
    console.log('❌ [REFRESH] Error name:', error.name);
    console.log('❌ [REFRESH] Error message:', error.message);
    console.log('❌ [REFRESH] Error stack:', error.stack);
    console.log('❌ [REFRESH] Error metadata:', error.$metadata);
    console.log('❌ [REFRESH] Error fault:', error.$fault);
    
    let errorMessage = 'Error interno del servidor';
    
    if (error.name === 'NotAuthorizedException') {
      console.log('🔒 [REFRESH] NotAuthorizedException - analizando...');
      
      if (error.message?.includes('SecretHash')) {
        console.log('🔑 [REFRESH] Error específico de SECRET_HASH');
        errorMessage = 'Error de SECRET_HASH - verificar configuración';
      } else if (error.message?.includes('refresh token')) {
        console.log('🔄 [REFRESH] Error de refresh token');
        errorMessage = 'Refresh token inválido o expirado';
      } else {
        console.log('🔒 [REFRESH] Otra causa de NotAuthorizedException');
        errorMessage = 'Token de actualización inválido';
      }
    } else if (error.name === 'UserNotFoundException') {
      errorMessage = 'Usuario no encontrado';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}