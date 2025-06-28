// lib/cognito-utils.ts
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
  region: process.env.AWS_REGION!,
  clientId: process.env.COGNITO_CLIENT_ID!,
  clientSecret: process.env.COGNITO_CLIENT_SECRET!,
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
};

/**
 * Genera SECRET_HASH usando la configuración por defecto
 */
export function getSecretHash(username: string): string {
  return generateSecretHash(username, cognitoConfig.clientId, cognitoConfig.clientSecret);
}