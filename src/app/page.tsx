// src/app/page.tsx - PÁGINA INICIAL SIMPLIFICADA
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { SilkBackground } from '@/components/SilkBackground'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      <SilkBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-md mx-auto px-6"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <Image
              src="/logo.webp"
              alt="Jett Labs"
              fill
              className="object-contain rounded-2xl"
            />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Jett Labs
            </span>
          </h1>
          
          <p className="text-gray-400 text-lg mb-8">
            Sistema de Gestión Empresarial
          </p>
        </motion.div>

        {/* Botón de acceso */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/auth/signin" className="btn-primary text-lg px-8 py-4 inline-flex items-center">
            Acceder al Sistema
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </motion.div>

        {/* Footer minimalista */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 text-xs">
            © 2024 Jett Labs. Todos los derechos reservados.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}