// =====================================================
// CHART CARD - src/components/ChartCard.tsx
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Calendar, DollarSign } from 'lucide-react'

export const ChartCard = () => {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('6meses')

  useEffect(() => {
    fetchChartData()
  }, [periodo])

  const fetchChartData = async () => {
    try {
      setLoading(true)
      // Simular datos de facturación mensual
      const data = [
        { mes: 'Ene', facturado: 12000, proyectos: 3 },
        { mes: 'Feb', facturado: 18000, proyectos: 4 },
        { mes: 'Mar', facturado: 15000, proyectos: 3 },
        { mes: 'Abr', facturado: 22000, proyectos: 5 },
        { mes: 'May', facturado: 28000, proyectos: 6 },
        { mes: 'Jun', facturado: 35000, proyectos: 7 }
      ]
      setChartData(data)
    } catch (error) {
      console.error('Error al cargar datos del gráfico:', error)
    } finally {
      setLoading(false)
    }
  }

  const maxValue = Math.max(...chartData.map(d => d.facturado))

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold text-lg">Evolución de Ingresos</h3>
          <p className="text-gray-400 text-sm">Facturación mensual del año</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="input-glass text-sm"
          >
            <option value="6meses">Últimos 6 meses</option>
            <option value="12meses">Último año</option>
            <option value="trimestre">Este trimestre</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="loading-shimmer w-full h-40 rounded-lg"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Gráfico de barras simple */}
          <div className="space-y-3">
            {chartData.map((item, index) => (
              <motion.div
                key={item.mes}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-4"
              >
                <div className="w-8 text-gray-400 text-sm font-medium">
                  {item.mes}
                </div>
                <div className="flex-1 relative">
                  <div className="bg-white/10 h-8 rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.facturado / maxValue) * 100}%` }}
                      transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"
                    />
                  </div>
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <span className="text-white text-sm font-medium">
                      ${item.facturado.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="w-16 text-right">
                  <span className="text-gray-400 text-sm">{item.proyectos} proj</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                ${chartData.reduce((sum, item) => sum + item.facturado, 0).toLocaleString()}
              </p>
              <p className="text-gray-400 text-xs">Total período</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                ${Math.round(chartData.reduce((sum, item) => sum + item.facturado, 0) / chartData.length).toLocaleString()}
              </p>
              <p className="text-gray-400 text-xs">Promedio mensual</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {chartData.reduce((sum, item) => sum + item.proyectos, 0)}
              </p>
              <p className="text-gray-400 text-xs">Total proyectos</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
