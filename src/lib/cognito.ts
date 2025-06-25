// =====================================================
// SERVICIO AWS COGNITO - src/lib/cognito.ts
// =====================================================

import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminDeleteUserCommand,
    AdminUpdateUserAttributesCommand,
    AdminSetUserPasswordCommand,
    AdminListGroupsForUserCommand,
    AdminAddUserToGroupCommand,
    AdminRemoveUserFromGroupCommand,
    ListUsersCommand,
    AdminGetUserCommand,
    AdminDisableUserCommand,
    AdminEnableUserCommand,
  } from '@aws-sdk/client-cognito-identity-provider'
  
  const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
  
  const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID!
  
  export interface CognitoUser {
    username: string
    email: string
    firstName: string
    lastName: string
    enabled: boolean
    status: string
    groups: string[]
  }
  
  export class CognitoService {
    // Crear nuevo usuario
    static async createUser(userData: {
      email: string
      firstName: string
      lastName: string
      temporaryPassword: string
      rol: string
    }): Promise<string> {
      try {
        const command = new AdminCreateUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: userData.email,
          UserAttributes: [
            { Name: 'email', Value: userData.email },
            { Name: 'given_name', Value: userData.firstName },
            { Name: 'family_name', Value: userData.lastName },
            { Name: 'email_verified', Value: 'true' },
          ],
          TemporaryPassword: userData.temporaryPassword,
          MessageAction: 'SUPPRESS', // No enviar email automático
        })
  
        const result = await cognitoClient.send(command)
        
        // Establecer contraseña permanente
        await this.setUserPassword(userData.email, userData.temporaryPassword)
        
        // Agregar usuario al grupo de rol
        await this.addUserToGroup(userData.email, userData.rol)
        
        return result.User?.Username || userData.email
      } catch (error) {
        console.error('Error creating user in Cognito:', error)
        throw new Error('Failed to create user in Cognito')
      }
    }
  
    // Obtener información de usuario
    static async getUser(username: string): Promise<CognitoUser | null> {
      try {
        const command = new AdminGetUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
        })
  
        const result = await cognitoClient.send(command)
        
        if (!result.Username) return null
  
        const attributes = result.UserAttributes || []
        const email = attributes.find(attr => attr.Name === 'email')?.Value || ''
        const firstName = attributes.find(attr => attr.Name === 'given_name')?.Value || ''
        const lastName = attributes.find(attr => attr.Name === 'family_name')?.Value || ''
  
        // Obtener grupos del usuario
        const groups = await this.getUserGroups(username)
  
        return {
          username: result.Username,
          email,
          firstName,
          lastName,
          enabled: result.Enabled || false,
          status: result.UserStatus || 'UNKNOWN',
          groups,
        }
      } catch (error) {
        console.error('Error getting user from Cognito:', error)
        return null
      }
    }
  
    // Listar todos los usuarios
    static async listUsers(limit: number = 60): Promise<CognitoUser[]> {
      try {
        const command = new ListUsersCommand({
          UserPoolId: USER_POOL_ID,
          Limit: limit,
        })
  
        const result = await cognitoClient.send(command)
        const users: CognitoUser[] = []
  
        if (result.Users) {
          for (const user of result.Users) {
            if (user.Username) {
              const attributes = user.Attributes || []
              const email = attributes.find(attr => attr.Name === 'email')?.Value || ''
              const firstName = attributes.find(attr => attr.Name === 'given_name')?.Value || ''
              const lastName = attributes.find(attr => attr.Name === 'family_name')?.Value || ''
              
              const groups = await this.getUserGroups(user.Username)
  
              users.push({
                username: user.Username,
                email,
                firstName,
                lastName,
                enabled: user.Enabled || false,
                status: user.UserStatus || 'UNKNOWN',
                groups,
              })
            }
          }
        }
  
        return users
      } catch (error) {
        console.error('Error listing users from Cognito:', error)
        return []
      }
    }
  
    // Actualizar usuario
    static async updateUser(username: string, updates: {
      firstName?: string
      lastName?: string
      email?: string
    }): Promise<void> {
      try {
        const attributes = []
        
        if (updates.firstName) {
          attributes.push({ Name: 'given_name', Value: updates.firstName })
        }
        if (updates.lastName) {
          attributes.push({ Name: 'family_name', Value: updates.lastName })
        }
        if (updates.email) {
          attributes.push({ Name: 'email', Value: updates.email })
        }
  
        if (attributes.length > 0) {
          const command = new AdminUpdateUserAttributesCommand({
            UserPoolId: USER_POOL_ID,
            Username: username,
            UserAttributes: attributes,
          })
  
          await cognitoClient.send(command)
        }
      } catch (error) {
        console.error('Error updating user in Cognito:', error)
        throw new Error('Failed to update user in Cognito')
      }
    }
  
    // Eliminar usuario
    static async deleteUser(username: string): Promise<void> {
      try {
        const command = new AdminDeleteUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
        })
  
        await cognitoClient.send(command)
      } catch (error) {
        console.error('Error deleting user from Cognito:', error)
        throw new Error('Failed to delete user from Cognito')
      }
    }
  
    // Habilitar/deshabilitar usuario
    static async setUserEnabled(username: string, enabled: boolean): Promise<void> {
      try {
        const command = enabled 
          ? new AdminEnableUserCommand({
              UserPoolId: USER_POOL_ID,
              Username: username,
            })
          : new AdminDisableUserCommand({
              UserPoolId: USER_POOL_ID,
              Username: username,
            })
  
        await cognitoClient.send(command)
      } catch (error) {
        console.error('Error setting user enabled status:', error)
        throw new Error('Failed to update user status')
      }
    }
  
    // Establecer contraseña
    static async setUserPassword(username: string, password: string): Promise<void> {
      try {
        const command = new AdminSetUserPasswordCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
          Password: password,
          Permanent: true,
        })
  
        await cognitoClient.send(command)
      } catch (error) {
        console.error('Error setting user password:', error)
        throw new Error('Failed to set user password')
      }
    }
  
    // Obtener grupos del usuario
    static async getUserGroups(username: string): Promise<string[]> {
      try {
        const command = new AdminListGroupsForUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
        })
  
        const result = await cognitoClient.send(command)
        return result.Groups?.map(group => group.GroupName || '') || []
      } catch (error) {
        console.error('Error getting user groups:', error)
        return []
      }
    }
  
    // Agregar usuario a grupo
    static async addUserToGroup(username: string, groupName: string): Promise<void> {
      try {
        const command = new AdminAddUserToGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
          GroupName: groupName,
        })
  
        await cognitoClient.send(command)
      } catch (error) {
        console.error('Error adding user to group:', error)
        throw new Error('Failed to add user to group')
      }
    }
  
    // Remover usuario de grupo
    static async removeUserFromGroup(username: string, groupName: string): Promise<void> {
      try {
        const command = new AdminRemoveUserFromGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
          GroupName: groupName,
        })
  
        await cognitoClient.send(command)
      } catch (error) {
        console.error('Error removing user from group:', error)
        throw new Error('Failed to remove user from group')
      }
    }
  }