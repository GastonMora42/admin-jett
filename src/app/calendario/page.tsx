// =====================================================
// PÁGINA CALENDARIO - src/app/calendario/page.tsx
// =====================================================

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react'

export default function CalendarioPage() {
  const [currentDate] = useState(new Date())

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendario</h1>
          <p className="text-gray-400 mt-1">Gestiona fechas importantes y vencimientos</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Evento
        </button>
      </div>

      {/* Header del calendario */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Vista del calendario */}
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Vista de Calendario</h3>
          <p className="text-gray-400">
            Próximamente - Vista completa del calendario con eventos y vencimientos
          </p>
        </div>
      </div>
    </motion.div>
  )
}
