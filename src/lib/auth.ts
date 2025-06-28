// =====================================================
// NEXTAUTH SIMPLIFICADO - src/lib/auth.ts
// =====================================================

import { NextAuthOptions } from 'next-auth'
import CognitoProvider from 'next-auth/providers/cognito'
import { EstadoUsuario, PrismaClient, RolUsuario } from '@prisma/client'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CognitoProvider({
      clientId: process.env.AWS_COGNITO_CLIENT_ID!,
      clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET!,
      issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_COGNITO_USER_POOL_ID}`,
      checks: ["pkce", "state"],
    }),
  ],
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'cognito' && user.email) {
        try {
          // Verificar si el usuario existe en nuestra DB
          let usuario = await prisma.usuario.findUnique({
            where: { email: user.email }
          })
          
          // Si no existe, crear el usuario automáticamente
          if (!usuario && profile?.sub) {
            // Extraer el rol del perfil de Cognito
            const customAttributes = (profile as any)
            const role = customAttributes['custom:role'] || 'VENTAS'
            
            usuario = await prisma.usuario.create({
              data: {
                cognitoId: profile.sub,
                email: user.email,
                nombre: (profile as any)?.given_name || user.name?.split(' ')[0] || 'Usuario',
                apellido: (profile as any)?.family_name || user.name?.split(' ')[1] || '',
                rol: role as 'SUPERADMIN' | 'ADMIN' | 'VENTAS',
                estado: 'ACTIVO',
                avatar: user.image,
              }
            })
            
            console.log('✅ Usuario creado automáticamente en DB:', {
              id: usuario.id,
              email: usuario.email,
              rol: usuario.rol
            })
          } else if (usuario) {
            // Actualizar fecha de último login
            await prisma.usuario.update({
              where: { id: usuario.id },
              data: { fechaLogin: new Date() }
            })
          }
          
          return true
        } catch (error) {
          console.error('❌ Error en signIn callback:', error)
          return false
        }
      }
      return true
    },
    
    async jwt({ token, user, account, profile }) {
      if (account && user) {
        try {
          // Obtener información del usuario de la DB
          const usuario = await prisma.usuario.findUnique({
            where: { email: user.email! }
          })
          
          if (usuario) {
            token.userId = usuario.id
            token.rol = usuario.rol
            token.estado = usuario.estado
            token.nombre = usuario.nombre
            token.apellido = usuario.apellido
          } else {
            // Si por alguna razón no existe en DB, usar datos del perfil
            const customAttributes = (profile as any) || {}
            token.rol = customAttributes['custom:role'] || 'VENTAS'
            token.estado = 'ACTIVO'
            token.nombre = user.name?.split(' ')[0] || 'Usuario'
            token.apellido = user.name?.split(' ')[1] || ''
          }
        } catch (error) {
          console.error('❌ Error en JWT callback:', error)
          // Valores por defecto en caso de error
          token.rol = 'VENTAS'
          token.estado = 'ACTIVO'
          token.nombre = user.name?.split(' ')[0] || 'Usuario'
          token.apellido = user.name?.split(' ')[1] || ''
        }
      }
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string
        session.user.rol = token.rol as RolUsuario
        session.user.estado = token.estado as EstadoUsuario
        session.user.nombre = token.nombre as string
        session.user.apellido = token.apellido as string
      }
      return session
    },
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  
  secret: process.env.NEXTAUTH_SECRET,
}