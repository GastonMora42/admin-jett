// src/app/api/auth/register/route.ts - Versión de Producción
import { CognitoIdentityProviderClient, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { NextResponse } from 'next/server';
import { getSecretHash, cognitoConfig } from '@/lib/cognito-utils';

export async function POST(request: Request) {
  try {
    const { email, password, confirmPassword, firstName, lastName, role } = await request.json();

    // Validaciones básicas
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, firstName y lastName son requeridos' },
        { status: 400 }
      );
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas no coinciden' },
        { status: 400 }
      );
    }

    // Combinar nombre completo
    const fullName = `${firstName} ${lastName}`.trim();

    const cognitoClient = new CognitoIdentityProviderClient({
      region: cognitoConfig.region,
    });

    // Generar SECRET_HASH
    const secretHash = getSecretHash(email);

    const signUpCommand = new SignUpCommand({
      ClientId: cognitoConfig.clientId,
      Username: email,
      Password: password,
      SecretHash: secretHash,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'name',
          Value: fullName,
        },
        {
          Name: 'given_name',
          Value: firstName,
        },
        {
          Name: 'family_name',
          Value: lastName,
        },
        // Descomenta esta línea después de configurar el atributo custom:role en Cognito
        // {
        //   Name: 'custom:role',
        //   Value: role,
        // },
        {
          Name: 'address',
          Value: JSON.stringify({
            street_address: '',
            locality: '',
            region: '',
            postal_code: '',
            country: ''
          }),
        },
      ],
    });

    const result = await cognitoClient.send(signUpCommand);

    return NextResponse.json({
      message: 'Usuario registrado exitosamente. Verifica tu email para confirmar la cuenta.',
      userSub: result.UserSub,
    });

  } catch (error: any) {
    console.error('Error en Cognito:', error);
    
    // Manejo específico de errores de Cognito
    let errorMessage = 'Error interno del servidor';
    
    if (error.name === 'UsernameExistsException') {
      errorMessage = 'Este email ya está registrado';
    } else if (error.name === 'InvalidPasswordException') {
      errorMessage = 'La contraseña no cumple con los requisitos';
    } else if (error.name === 'InvalidParameterException') {
      errorMessage = 'Parámetros inválidos: ' + error.message;
    } else if (error.name === 'NotAuthorizedException') {
      errorMessage = 'Error de autorización: ' + error.message;
    } else if (error.name === 'ResourceNotFoundException') {
      errorMessage = 'User Pool no encontrado - verifica COGNITO_CLIENT_ID';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}