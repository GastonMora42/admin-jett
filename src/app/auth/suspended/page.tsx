// =====================================================
// PÁGINA CUENTA SUSPENDIDA - src/app/auth/suspended/page.tsx
// =====================================================

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Mail, Phone } from 'lucide-react'

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-gray-900/20 to-black" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center max-w-md mx-auto p-8"
      >
        {/* Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Cuenta Suspendida
        </h1>
        
        <p className="text-gray-400 mb-6 leading-relaxed">
          Tu cuenta ha sido suspendida temporalmente. Por favor, contacta al administrador 
          del sistema para obtener más información.
        </p>

        {/* Contact info */}
        <div className="bg-white/5 rounded-lg p-6 mb-8">
          <h3 className="text-white font-medium mb-4">Información de Contacto</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-center space-x-2 text-gray-300">
              <Mail className="w-4 h-4" />
              <span>support@jettlabs.com</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-gray-300">
              <Phone className="w-4 h-4" />
              <span>+54 9 11 1234-5678</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Login</span>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}