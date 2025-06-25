// =====================================================
// NEXTAUTH CONFIGURATION - src/lib/auth.ts
// =====================================================

import { NextAuthOptions } from 'next-auth'
import CognitoProvider from 'next-auth/providers/cognito'
import { PrismaClient } from '@prisma/client'

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
          
          // Si no existe, crear el usuario
          if (!usuario && profile?.sub) {
            usuario = await prisma.usuario.create({
              data: {
                cognitoId: profile.sub,
                email: user.email,
                nombre: profile?.given_name || user.name?.split(' ')[0] || 'Usuario',
                apellido: profile?.family_name || user.name?.split(' ')[1] || '',
                rol: 'VENTAS', // Rol por defecto
                avatar: user.image,
              }
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
          console.error('Error en signIn callback:', error)
          return false
        }
      }
      return true
    },
    
    async jwt({ token, user, account }) {
      if (account && user) {
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
        }
      }
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string
        session.user.rol = token.rol as string
        session.user.estado = token.estado as string
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