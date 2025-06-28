// =====================================================
// PÁGINA NO AUTORIZADO - src/app/auth/unauthorized/page.tsx
// =====================================================

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ShieldX, ArrowLeft, Home, HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { SilkBackground } from '@/components/SilkBackground'
import Image from 'next/image'
import Link from 'next/link'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      <SilkBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl p-8 text-center"
      >
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-12">
          {/* Logo con bordes redondeados */}
          <div className="mx-auto w-16 h-16 mb-6 relative">
            <Image
              src="/logo.webp"
              alt="Jett Labs Logo"
              fill
              className="object-contain opacity-50 rounded-2xl"
            />
          </div>
          
          {/* Icon and main message */}
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-yellow-500/20 border border-yellow-500/30 rounded-full mb-6"
            >
              <ShieldX className="w-12 h-12 text-yellow-400" />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              Acceso Denegado
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed mb-2">
              No tienes los permisos necesarios para acceder a esta sección del sistema.
            </p>
            <p className="text-gray-400 text-sm">
              Si crees que esto es un error, por favor contacta al administrador del sistema.
            </p>
          </div>

          {/* User info */}
          {session?.user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8"
            >
              <p className="text-gray-400 text-sm mb-2">Usuario actual:</p>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {session.user.nombre?.charAt(0)}{session.user.apellido?.charAt(0)}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-white font-medium text-sm">
                    {session.user.nombre} {session.user.apellido}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Rol: {session.user.rol}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoBack}
              className="btn-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </motion.button>
            
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir al Dashboard
              </motion.button>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Solicitar Ayuda
            </motion.button>
          </div>

          {/* Additional help text */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-gray-500 text-xs leading-relaxed">
              Para solicitar acceso a funcionalidades adicionales, contacta al administrador del sistema 
              con tu nombre de usuario y la sección a la que intentas acceder.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Jett Labs • Sistema de gestión administrativo
          </p>
        </div>
      </motion.div>
    </div>
  )
}