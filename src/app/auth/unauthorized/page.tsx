// =====================================================
// PÁGINA NO AUTORIZADO - src/app/auth/unauthorized/page.tsx
// =====================================================

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-gray-900/20 to-black" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center max-w-md mx-auto p-8"
      >
        {/* Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-yellow-400" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Acceso Denegado
        </h1>
        
        <p className="text-gray-400 mb-8 leading-relaxed">
          No tienes permisos suficientes para acceder a esta página. 
          Contacta al administrador si crees que esto es un error.
        </p>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={handleGoBack}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver Atrás</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Ir al Dashboard</span>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}