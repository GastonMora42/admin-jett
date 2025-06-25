// =====================================================
// PÁGINA USUARIO SUSPENDIDO - src/app/auth/suspended/page.tsx
// =====================================================

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Shield, LogOut } from 'lucide-react'
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
        <div className="glass rounded-2xl p-8 backdrop-blur-xl text-center">
          <div className="mx-auto w-16 h-16 mb-4 relative">
            <Image
              src="/logo.webp"
              alt="PayTracker Logo"
              fill
              className="object-contain opacity-50"
            />
          </div>
          
          <div className="mb-6">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Cuenta Suspendida
            </h1>
            <p className="text-gray-400">
              Tu cuenta ha sido suspendida. Por favor, contacta al administrador del sistema para más información.
            </p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="btn-primary w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </button>
        </div>
      </motion.div>
    </div>
  )
}
