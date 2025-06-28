// =====================================================
// CONFIGURACIÓN NEXTAUTH - src/lib/nextauth.ts
// =====================================================

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos')
        }

        try {
          // Aquí puedes integrar con Cognito si lo necesitas
          // Por ahora, verificamos contra la base de datos
          const usuario = await prisma.usuario.findUnique({
            where: { email: credentials.email }
          })

          if (usuario && usuario.estado === 'ACTIVO') {
            return {
              id: usuario.id,
              email: usuario.email,
              name: `${usuario.nombre} ${usuario.apellido}`,
              rol: usuario.rol,
              estado: usuario.estado,
              nombre: usuario.nombre,
              apellido: usuario.apellido,
            }
          }

          return null
        } catch (error) {
          console.error('Error en authorize:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.rol = user.rol!
        token.estado = user.estado!
        token.nombre = user.nombre!
        token.apellido = user.apellido!
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId
        session.user.rol = token.rol
        session.user.estado = token.estado
        session.user.nombre = token.nombre
        session.user.apellido = token.apellido
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
}