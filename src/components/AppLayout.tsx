// src/components/AppLayout.tsx - VERSIÓN ACTUALIZADA CON SIDEBAR RESPONSIVE
'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Sidebar } from '@/components/Sidebar'
import { AuthLoading } from '@/components/AuthLoading'
import { motion } from 'framer-motion'
import { Menu, Bell, Search, User } from 'lucide-react'

interface MobileHeaderProps {
  onMenuClick: () => void
  user: any
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick, user }) => {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 z-30">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Jett Labs</h1>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.given_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // Cerrar sidebar al cambiar de ruta en móvil
  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false)
    }
  }, [pathname, isDesktop])

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return <AuthLoading />
  }

  // Rutas públicas que no necesitan autenticación
  const publicRoutes = ['/', '/auth/signin', '/auth/register', '/auth/forgot-password', '/auth/confirm']
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')

  // Si es ruta pública, mostrar sin layout
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Si no está autenticado en ruta privada, no mostrar nada (el ProtectedRoute redirigirá)
  if (!isAuthenticated) {
    return <AuthLoading />
  }

  // Layout principal para rutas autenticadas
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Header móvil */}
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} user={user} />

      {/* Contenido principal */}
      <div className={`transition-all duration-300 ${
        isDesktop ? 'lg:ml-80' : ''
      }`}>
        <main className={`min-h-screen ${
          isDesktop ? 'p-6' : 'pt-16 p-4'
        }`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

// ============================================
// src/app/layout.tsx - VERSIÓN ACTUALIZADA CON CURRENCY PROVIDER
// ============================================

// Actualización para app/layout.tsx:
/*
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
*/