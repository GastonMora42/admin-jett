// =====================================================
// LAYOUT PRINCIPAL - src/app/layout.tsx
// =====================================================

import { SilkBackground } from '@/components/SilkBackground'
import './globals.css'
import { Inter } from 'next/font/google'
import { Sidebar } from '@/components/Sidebar'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Jett Labs - Software Factory',
  description: 'Jett Admin Sistem',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <AuthProvider>
          <div className="min-h-screen relative">
            <SilkBackground />
            <div className="relative z-10 flex">
              <Sidebar />
              <main className="flex-1 ml-64 p-6">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}