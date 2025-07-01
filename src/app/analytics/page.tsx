// =====================================================
// PÁGINA ANALYTICS - src/app/analytics/page.tsx
// =====================================================

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Clock,
  Target,
  Zap
} from 'lucide-react'

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('6m')

  const analytics = {
    conversion: {
      leads: 156,
      clientes: 42,
      tasa: 27
    },
    tiempoPromedio: {
      proyecto: 45,
      pago: 8
    },
    satisfaccion: 4.7,
    retencion: 85
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Métricas avanzadas y análisis de rendimiento</p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="input-glass"
        >
          <option value="1m">Último mes</option>
          <option value="3m">Últimos 3 meses</option>
          <option value="6m">Últimos 6 meses</option>
          <option value="1y">Último año</option>
        </select>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-blue-400" />
            <span className="text-green-400 text-sm font-medium">+12%</span>
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Tasa de Conversión</h3>
          <p className="text-white text-3xl font-bold">{analytics.conversion.tasa}%</p>
          <p className="text-gray-500 text-xs mt-1">
            {analytics.conversion.clientes} de {analytics.conversion.leads} leads
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-purple-400" />
            <span className="text-yellow-400 text-sm font-medium">Estable</span>
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Tiempo Promedio</h3>
          <p className="text-white text-3xl font-bold">{analytics.tiempoPromedio.proyecto}d</p>
          <p className="text-gray-500 text-xs mt-1">duración promedio de proyecto</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 text-yellow-400" />
            <span className="text-green-400 text-sm font-medium">Excelente</span>
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Satisfacción</h3>
          <p className="text-white text-3xl font-bold">{analytics.satisfaccion}/5</p>
          <p className="text-gray-500 text-xs mt-1">rating promedio de clientes</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-green-400" />
            <span className="text-green-400 text-sm font-medium">+5%</span>
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Retención</h3>
          <p className="text-white text-3xl font-bold">{analytics.retencion}%</p>
          <p className="text-gray-500 text-xs mt-1">clientes que regresan</p>
        </div>
      </div>

      {/* Distribución por tipo de proyecto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-white font-semibold text-lg mb-6">Proyectos por Tipo</h3>
          <div className="space-y-4">
            {[
              { tipo: 'Software a Medida', count: 15, color: 'bg-blue-500', percentage: 35 },
              { tipo: 'E-commerce', count: 12, color: 'bg-green-500', percentage: 28 },
              { tipo: 'Landing Pages', count: 8, color: 'bg-purple-500', percentage: 19 },
              { tipo: 'Apps Móviles', count: 5, color: 'bg-yellow-500', percentage: 12 },
              { tipo: 'Mantenimiento', count: 3, color: 'bg-red-500', percentage: 6 }
            ].map((item, index) => (
              <div key={item.tipo} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{item.tipo}</span>
                  <span className="text-white font-medium">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ delay: index * 0.1, duration: 0.8 }}
                    className={`h-2 rounded-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-white font-semibold text-lg mb-6">Rendimiento Temporal</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-gray-400 text-sm mb-3">Tiempo promedio de cobro</h4>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="bg-white/10 h-3 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-3 rounded-full w-3/4" />
                  </div>
                </div>
                <span className="text-white font-medium">{analytics.tiempoPromedio.pago} días</span>
              </div>
            </div>

            <div>
              <h4 className="text-gray-400 text-sm mb-3">Proyectos completados a tiempo</h4>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="bg-white/10 h-3 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-3 rounded-full w-4/5" />
                  </div>
                </div>
                <span className="text-white font-medium">78%</span>
              </div>
            </div>

            <div>
              <h4 className="text-gray-400 text-sm mb-3">Eficiencia de cobros</h4>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="bg-white/10 h-3 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-3 rounded-full w-5/6" />
                  </div>
                </div>
                <span className="text-white font-medium">92%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights y recomendaciones */}
      <div className="card p-6">
        <h3 className="text-white font-semibold text-lg mb-6">Insights y Recomendaciones</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <TrendingUp className="w-8 h-8 text-blue-400 mb-3" />
            <h4 className="text-blue-400 font-medium mb-2">Oportunidad de Crecimiento</h4>
            <p className="text-gray-300 text-sm">
              Los proyectos de E-commerce tienen mayor rentabilidad. Considera especializarte más en este nicho.
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <Clock className="w-8 h-8 text-yellow-400 mb-3" />
            <h4 className="text-yellow-400 font-medium mb-2">Optimización de Tiempos</h4>
            <p className="text-gray-300 text-sm">
              El tiempo promedio de cobro ha aumentado. Implementa recordatorios automáticos.
            </p>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <Users className="w-8 h-8 text-green-400 mb-3" />
            <h4 className="text-green-400 font-medium mb-2">Retención Excelente</h4>
            <p className="text-gray-300 text-sm">
              Tu tasa de retención está por encima del promedio. Mantén la calidad del servicio.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}