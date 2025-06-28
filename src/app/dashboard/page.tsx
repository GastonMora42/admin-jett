// =====================================================
// DASHBOARD PRINCIPAL - src/app/dashboard/page.tsx
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Users, 
  FolderOpen, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { MetricCard } from '@/components/MetricCard'
import { RecentActivity } from '@/components/RecentActivity'
import { ChartCard } from '@/components/ChartCard'


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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard')
      if (!response.ok) throw new Error('Error al cargar datos')
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error al cargar datos</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Resumen general de tu software factory
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Calendar className="w-4 h-4 mr-2" />
            Este mes
          </button>
          <button 
            onClick={fetchDashboardData}
            className="btn-primary"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={DollarSign}
          title="Total Facturado"
          value={`$${data.totalFacturado?.toLocaleString() || 0}`}
          change={data.tendenciaFacturacion || 0}
          changeType={data.tendenciaFacturacion >= 0 ? 'positive' : 'negative'}
          subtitle="Ingresos totales"
        />
        <MetricCard
          icon={AlertCircle}
          title="Pendiente de Cobro"
          value={`$${data.pendienteCobro?.toLocaleString() || 0}`}
          change={-5}
          changeType="negative"
          subtitle="Requiere seguimiento"
          urgent={data.pendienteCobro > data.totalFacturado * 0.3}
        />
        <MetricCard
          icon={FolderOpen}
          title="Proyectos Activos"
          value={data.proyectosActivos || 0}
          change={12}
          changeType="positive"
          subtitle="En desarrollo"
        />
        <MetricCard
          icon={Users}
          title="Clientes Activos"
          value={data.clientesActivos || 0}
          change={8}
          changeType="positive"
          subtitle="Base de clientes"
        />
      </div>

      {/* Segunda fila de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={TrendingUp}
          title="Facturación del Mes"
          value={`$${data.facturacionMes?.toLocaleString() || 0}`}
          change={data.tendenciaFacturacion || 0}
          changeType="positive"
          subtitle="Ingresos actuales"
        />
        <MetricCard
          icon={Clock}
          title="Pagos Vencidos"
          value={data.pagosVencidos || 0}
          urgent={data.pagosVencidos > 0}
          subtitle="Requieren acción"
          changeType="negative"
        />
        <MetricCard
          icon={CheckCircle}
          title="Proyectos Completados"
          value={data.proyectosCompletados || 0}
          change={15}
          changeType="positive"
          subtitle="Este mes"
        />
        <MetricCard
          icon={DollarSign}
          title="Promedio por Proyecto"
          value={`$${data.proyectosActivos > 0 ? Math.round(data.totalFacturado / data.proyectosActivos).toLocaleString() : 0}`}
          change={3}
          changeType="positive"
          subtitle="Valor promedio"
        />
      </div>

      {/* Gráficos y actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>

      {/* Alertas y notificaciones */}
      <AlertsSection data={data} />
    </motion.div>
  )
}

// Componente de Alertas
const AlertsSection = ({ data }: { data: DashboardData }) => {
  const alerts = []

  if (data.pagosVencidos > 0) {
    alerts.push({
      type: 'error',
      title: 'Pagos Vencidos',
      message: `Tienes ${data.pagosVencidos} pagos vencidos que requieren seguimiento.`,
      action: 'Ver Pagos'
    })
  }

  if (data.pendienteCobro > data.totalFacturado * 0.3) {
    alerts.push({
      type: 'warning',
      title: 'Alto Pendiente de Cobro',
      message: 'El monto pendiente supera el 30% de la facturación total.',
      action: 'Revisar'
    })
  }

  if (data.proyectosActivos > 10) {
    alerts.push({
      type: 'info',
      title: 'Muchos Proyectos Activos',
      message: 'Considera contratar más desarrolladores para manejar la carga.',
      action: 'Ver Proyectos'
    })
  }

  if (alerts.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold text-white">Alertas y Notificaciones</h2>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <motion.div
            key={index}
            whileHover={{ x: 4 }}
            className={`card flex items-center justify-between p-4 border-l-4 ${
              alert.type === 'error' ? 'border-red-500 bg-red-500/5' :
              alert.type === 'warning' ? 'border-yellow-500 bg-yellow-500/5' :
              'border-blue-500 bg-blue-500/5'
            }`}
          >
            <div className="flex items-center space-x-4">
              {alert.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
              {alert.type === 'warning' && <Clock className="w-5 h-5 text-yellow-400" />}
              {alert.type === 'info' && <TrendingUp className="w-5 h-5 text-blue-400" />}
              <div>
                <h3 className="font-medium text-white">{alert.title}</h3>
                <p className="text-sm text-gray-400">{alert.message}</p>
              </div>
            </div>
            <button className="btn-secondary text-sm">
              {alert.action}
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}