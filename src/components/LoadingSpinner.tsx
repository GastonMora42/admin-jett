// =====================================================
// LOADING SPINNER - src/components/LoadingSpinner.tsx
// =====================================================

'use client'

import React from 'react'
import { motion } from 'framer-motion'

export const LoadingSpinner = () => {
  return (
    <div className="flex items-center space-x-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full"
      />
      <span className="text-gray-400">Cargando datos...</span>
    </div>
  )
}