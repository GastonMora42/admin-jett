
// =====================================================
// PÁGINA NO AUTORIZADO - src/app/unauthorized/page.tsx
// =====================================================

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ShieldX, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SilkBackground } from '@/components/SilkBackground'
import Image from 'next/image'

export default function UnauthorizedPage() {
  const router = useRouter()

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
            <ShieldX className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Acceso Denegado
            </h1>
            <p className="text-gray-400">
              No tienes permisos para acceder a esta sección. Si crees que esto es un error, contacta al administrador.
            </p>
          </div>

          <button
            onClick={() => router.back()}
            className="btn-primary w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </button>
        </div>
      </motion.div>
    </div>
  )
}