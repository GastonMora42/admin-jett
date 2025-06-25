// =====================================================
// PÁGINA FACTURACIÓN - src/app/facturacion/page.tsx
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Filter,
  Search
} from 'lucide-react'

export default function FacturacionPage() {
  const [periodo, setPeriodo] = useState('este_mes')
  const [facturacion, setFacturacion] = useState({
    totalMes: 45000,
    totalAnterior: 38000,
    pendiente: 12000,
    proyectosFacturados: 8,
    clientesFacturados: 6
  })

  const periodos = [
    { value: 'este_mes', label: 'Este mes' },
    { value: 'mes_anterior', label: 'Mes anterior' },
    { value: 'trimestre', label: 'Este trimestre' },
    { value: 'año', label: 'Este año' }
  ]

  const tendencia = ((facturacion.totalMes - facturacion.totalAnterior) / facturacion.totalAnterior * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Facturación</h1>
          <p className="text-gray-400 mt-1">Análisis detallado de ingresos y facturación</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="input-glass"
          >
            {periodos.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button className="btn-primary">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-400" />
            <div className={`flex items-center space-x-1 text-sm ${tendencia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {tendencia >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(tendencia).toFixed(1)}%</span>
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Facturación Total</h3>
          <p className="text-white text-3xl font-bold">${facturacion.totalMes.toLocaleString()}</p>
          <p className="text-gray-500 text-xs mt-1">vs ${facturacion.totalAnterior.toLocaleString()} mes anterior</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Proyectos Facturados</h3>
          <p className="text-white text-3xl font-bold">{facturacion.proyectosFacturados}</p>
          <p className="text-gray-500 text-xs mt-1">de {facturacion.proyectosFacturados + 3} proyectos activos</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Clientes Facturados</h3>
          <p className="text-white text-3xl font-bold">{facturacion.clientesFacturados}</p>
          <p className="text-gray-500 text-xs mt-1">clientes con facturación activa</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Pendiente de Cobro</h3>
          <p className="text-white text-3xl font-bold">${facturacion.pendiente.toLocaleString()}</p>
          <p className="text-gray-500 text-xs mt-1">{((facturacion.pendiente / facturacion.totalMes) * 100).toFixed(1)}% del total</p>
        </div>
      </div>

      {/* Gráfico de facturación mensual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-white font-semibold text-lg mb-6">Evolución Mensual</h3>
          <div className="space-y-4">
            {[
              { mes: 'Enero', monto: 32000 },
              { mes: 'Febrero', monto: 28000 },
              { mes: 'Marzo', monto: 35000 },
              { mes: 'Abril', monto: 42000 },
              { mes: 'Mayo', monto: 38000 },
              { mes: 'Junio', monto: 45000 }
            ].map((item, index) => (
              <div key={item.mes} className="flex items-center space-x-4">
                <div className="w-16 text-gray-400 text-sm">{item.mes}</div>
                <div className="flex-1 relative">
                  <div className="bg-white/10 h-6 rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.monto / 45000) * 100}%` }}
                      transition={{ delay: index * 0.1, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded"
                    />
                  </div>
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <span className="text-white text-sm font-medium">
                      ${item.monto.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-white font-semibold text-lg mb-6">Top Clientes por Facturación</h3>
          <div className="space-y-4">
            {[
              { nombre: 'TechCorp', empresa: 'Desarrollo Software', monto: 15000 },
              { nombre: 'StartupXYZ', empresa: 'E-commerce', monto: 12000 },
              { nombre: 'Digital SA', empresa: 'Marketing Digital', monto: 8000 },
              { nombre: 'InnovaCorp', empresa: 'Fintech', monto: 6000 },
              { nombre: 'WebFlow', empresa: 'Consultoría', monto: 4000 }
            ].map((cliente, index) => (
              <div key={cliente.nombre} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">{cliente.nombre}</p>
                  <p className="text-gray-400 text-sm">{cliente.empresa}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">${cliente.monto.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">#{index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

