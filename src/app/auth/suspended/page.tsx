// =====================================================
// PÁGINA USUARIO SUSPENDIDO - src/app/auth/suspended/page.tsx
// =====================================================

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Shield, LogOut, Mail, HelpCircle } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { SilkBackground } from '@/components/SilkBackground'
import Image from 'next/image'

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      <SilkBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-8"
      >
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
          {/* Logo con bordes redondeados */}
          <div className="mx-auto w-16 h-16 mb-4 relative">
            <Image
              src="/logo.webp"
              alt="Jett Labs Logo"
              fill
              className="object-contain opacity-50 rounded-2xl"
            />
          </div>
          
          <div className="mb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 border border-red-500/30 rounded-full mb-4"
            >
              <Shield className="w-10 h-10 text-red-400" />
            </motion.div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              Cuenta Suspendida
            </h1>
            <p className="text-gray-300 leading-relaxed mb-4">
              Tu cuenta ha sido suspendida temporalmente. Por favor, contacta al administrador del sistema para más información y resolver esta situación.
            </p>
            <p className="text-gray-400 text-sm">
              Si crees que esto es un error, ponte en contacto con el equipo de soporte de Jett Labs.
            </p>
          </div>

          {/* Información de contacto */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
            <p className="text-gray-400 text-sm mb-2">Contacto de soporte:</p>
            <div className="flex items-center justify-center space-x-2 text-blue-400">
              <Mail className="w-4 h-4" />
              <span className="text-sm">soporte@jettlabs.com</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-3">
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </button>
            
            <button
              className="w-full btn-secondary text-blue-400 border-blue-500/30 hover:bg-blue-500/10 flex items-center justify-center"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Solicitar Ayuda
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-gray-500 text-xs">
              Jett Labs • Sistema de gestión administrativo
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}