
// =====================================================
// PÁGINA CALENDARIO - src/app/calendario/page.tsx
// =====================================================

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Eye
} from 'lucide-react'

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')

  const eventos = [
    {
      id: '1',
      titulo: 'Entrega Sistema CRM',
      fecha: '2025-07-15',
      tipo: 'entrega',
      cliente: 'TechCorp',
      hora: '14:00'
    },
    {
      id: '2',
      titulo: 'Pago Vencido - E-commerce',
      fecha: '2025-07-16',
      tipo: 'pago_vencido',
      cliente: 'StartupXYZ',
      hora: '09:00'
    },
    {
      id: '3',
      titulo: 'Reunión con cliente',
      fecha: '2025-07-18',
      tipo: 'reunion',
      cliente: 'Digital SA',
      hora: '16:00'
    },
    {
      id: '4',
      titulo: 'Vencimiento Cuota 2',
      fecha: '2025-07-20',
      tipo: 'vencimiento',
      cliente: 'InnovaCorp',
      hora: '23:59'
    }
  ]

  const getEventColor = (tipo: string) => {
    switch (tipo) {
      case 'entrega': return 'bg-blue-500/20 border-blue-500 text-blue-400'
      case 'pago_vencido': return 'bg-red-500/20 border-red-500 text-red-400'
      case 'reunion': return 'bg-green-500/20 border-green-500 text-green-400'
      case 'vencimiento': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
      default: return 'bg-gray-500/20 border-gray-500 text-gray-400'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendario</h1>
          <p className="text-gray-400 mt-1">Gestiona entregas, pagos y eventos importantes</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-white/5 rounded-lg p-1">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  view === v ? 'bg-white/10 text-white' : 'text-gray-400'
                }`}
              >
                {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>
          <button className="btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Evento
          </button>
        </div>
      </div>

      {/* Navegación del calendario */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            <h2 className="text-xl font-semibold text-white">
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <button className="btn-secondary text-sm">Hoy</button>
        </div>

        {/* Vista simplificada del calendario */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center text-gray-400 font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - 6 // Ajuste para empezar en lunes
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            const isCurrentMonth = date.getMonth() === currentDate.getMonth()
            const isToday = date.toDateString() === new Date().toDateString()
            
            return (
              <div
                key={i}
                className={`p-3 rounded-lg border min-h-[80px] ${
                  isCurrentMonth ? 'border-white/10 bg-white/5' : 'border-white/5 bg-black/20'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className={`text-sm mb-2 ${
                  isCurrentMonth ? 'text-white' : 'text-gray-600'
                }`}>
                  {date.getDate()}
                </div>
                
                {/* Eventos del día */}
                {eventos
                  .filter(evento => evento.fecha === date.toISOString().split('T')[0])
                  .slice(0, 2)
                  .map(evento => (
                    <div
                      key={evento.id}
                      className={`text-xs p-1 rounded border-l-2 mb-1 ${getEventColor(evento.tipo)}`}
                    >
                      <p className="font-medium truncate">{evento.titulo}</p>
                    </div>
                  ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista de próximos eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-white font-semibold text-lg mb-6">Próximos Eventos</h3>
          <div className="space-y-4">
            {eventos.slice(0, 5).map((evento, index) => (
              <motion.div
                key={evento.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${evento.tipo === 'entrega' ? 'bg-blue-500' : 
                    evento.tipo === 'pago_vencido' ? 'bg-red-500' :
                    evento.tipo === 'reunion' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="text-white font-medium">{evento.titulo}</p>
                    <p className="text-gray-400 text-sm">{evento.cliente}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-300 text-sm">{evento.fecha}</p>
                  <p className="text-gray-400 text-xs">{evento.hora}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-white font-semibold text-lg mb-6">Resumen del Mes</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-white">Entregas programadas</span>
              </div>
              <span className="text-blue-400 font-semibold text-lg">8</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-white">Pagos por vencer</span>
              </div>
              <span className="text-yellow-400 font-semibold text-lg">12</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-green-400" />
                <span className="text-white">Reuniones planificadas</span>
              </div>
              <span className="text-green-400 font-semibold text-lg">6</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-red-400" />
                <span className="text-white">Pagos vencidos</span>
              </div>
              <span className="text-red-400 font-semibold text-lg">3</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
