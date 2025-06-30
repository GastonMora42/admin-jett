// lib/cognito-utils.ts - CORREGIDO
import crypto from 'crypto';

/**
 * Genera el SECRET_HASH requerido por Cognito cuando el client tiene secret configurado
 */
export function generateSecretHash(username: string, clientId: string, clientSecret: string): string {
  const message = username + clientId;
  return crypto.createHmac('sha256', clientSecret).update(message).digest('base64');
}

/**
 * Configuración base para Cognito
 */
export const cognitoConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  clientId: process.env.COGNITO_CLIENT_ID!,
  clientSecret: process.env.COGNITO_CLIENT_SECRET!,
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
};

/**
 * Genera SECRET_HASH usando la configuración por defecto
 * CRÍTICO: Usar el username original, no el email
 */
export function getSecretHash(username: string): string {
  if (!cognitoConfig.clientSecret) {
    throw new Error('COGNITO_CLIENT_SECRET is required but not configured');
  }
  
  // LOG para debugging
  console.log('🔐 Generating SECRET_HASH for username:', username);
  
  return generateSecretHash(username, cognitoConfig.clientId, cognitoConfig.clientSecret);
}

/**
 * Extrae el username del token JWT de Cognito
 * Cognito puede usar diferentes campos como username
 */
export function extractUsernameFromToken(tokenPayload: any): string {
  // Orden de prioridad para encontrar el username correcto
  const username = tokenPayload['cognito:username'] || 
                   tokenPayload.username || 
                   tokenPayload.email || 
                   tokenPayload.sub;
  
  console.log('🔍 Token payload fields:', Object.keys(tokenPayload));
  console.log('🔍 Selected username for SECRET_HASH:', username);
  
  if (!username) {
    throw new Error('No username found in token payload');
  }
  
  return username;
}