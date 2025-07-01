// =====================================================
// PÁGINA DASHBOARD - src/app/dashboard/page.tsx
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Users, 
  FolderOpen, 
  Clock, 
  TrendingUp, 
  AlertTriangle
} from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { ChartCard } from '@/components/ChartCard'
import { RecentActivity } from '@/components/RecentActivity'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface DashboardData {
  totalFacturado: number
  pendienteCobro: number
  proyectosActivos: number
  clientesActivos: number
  facturacionMes: number
  pagosVencidos: number
  tendenciaFacturacion: number
  proyectosCompletados: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Resumen general de tu negocio</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={DollarSign}
          title="Total Facturado"
          value={`$${data?.totalFacturado?.toLocaleString() || '0'}`}
          change={data?.tendenciaFacturacion || 0}
          changeType={data && data.tendenciaFacturacion >= 0 ? 'positive' : 'negative'}
        />
        
        <MetricCard
          icon={Clock}
          title="Pendiente de Cobro"
          value={`$${data?.pendienteCobro?.toLocaleString() || '0'}`}
          urgent={data ? data.pendienteCobro > 50000 : false}
        />
        
        <MetricCard
          icon={FolderOpen}
          title="Proyectos Activos"
          value={data?.proyectosActivos?.toString() || '0'}
          subtitle={`${data?.proyectosCompletados || 0} completados`}
        />
        
        <MetricCard
          icon={Users}
          title="Clientes Activos"
          value={data?.clientesActivos?.toString() || '0'}
          subtitle="Base de clientes"
        />
      </div>

      {/* Alertas importantes */}
      {data && data.pagosVencidos > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-red-400 font-medium">
                Tienes {data.pagosVencidos} pagos vencidos
              </h3>
              <p className="text-gray-400 text-sm">
                Revisa los pagos pendientes para mantener el flujo de caja
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Gráficos y actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard />
        <RecentActivity />
      </div>

      {/* Resumen financiero */}
      <div className="card p-6">
        <h3 className="text-white font-semibold text-lg mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Resumen del Mes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">
              ${data?.facturacionMes?.toLocaleString() || '0'}
            </p>
            <p className="text-gray-400 text-sm">Facturación este mes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">
              {data?.proyectosActivos || 0}
            </p>
            <p className="text-gray-400 text-sm">Proyectos en curso</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">
              {data ? Math.round((data.proyectosCompletados / (data.proyectosActivos + data.proyectosCompletados)) * 100) : 0}%
            </p>
            <p className="text-gray-400 text-sm">Tasa de finalización</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
