// src/app/layout.tsx - VERSIÓN ACTUALIZADA CON CURRENCY PROVIDER
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { AppLayout } from '@/components/AppLayout'
import { CurrencyProvider } from '@/lib/currency-config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Jett Labs - Software Factory Management',
  description: 'Sistema de gestión integral para software factories',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <CurrencyProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
