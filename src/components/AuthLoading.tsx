// =====================================================
// AUTH LOADING - src/components/AuthLoading.tsx
// =====================================================

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { SilkBackground } from '@/components/SilkBackground'
import Image from 'next/image'

export const AuthLoading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      <SilkBackground />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center"
      >
        {/* Logo */}
        <div className="mx-auto w-20 h-20 mb-6 relative">
          <Image
            src="/logo.webp"
            alt="PayTracker Logo"
            fill
            className="object-contain"
          />
        </div>

        {/* Loading Animation */}
        <div className="mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-2 border-white/20 border-t-blue-500 rounded-full mx-auto"
          />
        </div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-white mb-2">
            PayTracker
          </h2>
          <p className="text-gray-400 text-sm">
            Verificando autenticación...
          </p>
        </motion.div>

        {/* Loading Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center space-x-1 mt-6"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2 h-2 bg-blue-500 rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}