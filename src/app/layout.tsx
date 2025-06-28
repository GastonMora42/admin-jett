// =====================================================
// LAYOUT PRINCIPAL MEJORADO - src/app/layout.tsx
// =====================================================

import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { AppLayout } from '@/components/AppLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Jett Labs - Software Factory Management',
  description: 'Sistema de gestión integral para software factories',
  keywords: 'software factory, gestión proyectos, pagos, clientes',
  authors: [{ name: 'Jett Labs' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/logo.webp" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </AuthProvider>
      </body>
    </html>
  )
}