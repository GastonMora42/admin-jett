// src/app/dashboard/page.tsx - CORREGIDO
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Users, 
  FolderOpen, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Target,
  Activity,
  RefreshCw,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  PlayCircle,
  PauseCircle
} from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useApi } from '@/lib/api-client'

// ✅ SOLUCIÓN: Definir interfaces más específicas
interface DashboardApiResponse {
  totalFacturado?: number
  pendienteCobro?: number
  proyectosActivos?: number
  clientesActivos?: number
  facturacionMes?: number
  pagosVencidos?: number
  tendenciaFacturacion?: number
  proyectosCompletados?: number
  [key: string]: any // Para propiedades adicionales
}

interface DashboardData {
  totalFacturado: number
  pendienteCobro: number
  proyectosActivos: number
  clientesActivos: number
  facturacionMes: number
  pagosVencidos: number
  tendenciaFacturacion: number
  proyectosCompletados: number
  // Nuevos datos
  proyectosEnPausa: number
  nuevosClientesMes: number
  pagosPendientes: number
  tasaExito: number
  ingresoPromedioPorProyecto: number
  proyectosPorVencer: number
  actividad: ActivityItem[]
  proyectosPorEstado: Array<{
    estado: string
    cantidad: number
    color: string
  }>
  facturacionPorMes: Array<{
    mes: string
    monto: number
    proyectos: number
  }>
  clientesMasActivos: any[]
  pagosProximosVencer: any[]
}

interface ActivityItem {
  id: string
  tipo: 'pago_recibido' | 'proyecto_creado' | 'cliente_agregado' | 'pago_vencido' | 'proyecto_completado'
  titulo: string
  descripcion: string
  fecha: string
  monto?: number
  urgente?: boolean
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d')
  
  const api = useApi()

  useEffect(() => {
    fetchDashboardData()
    // Auto-refresh cada 5 minutos
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedTimeframe])

  const fetchDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      // Obtener múltiples fuentes de datos
      const [dashboardResponse, clientesResponse, proyectosResponse, pagosResponse] = await Promise.all([
        api.get('/api/dashboard'),
        api.get('/api/clientes'),
        api.get('/api/proyectos'),
        api.get('/api/pagos')
      ])

      // ✅ SOLUCIÓN: Asegurar que las respuestas sean arrays
      const clientes = Array.isArray(clientesResponse) ? clientesResponse : []
      const proyectos = Array.isArray(proyectosResponse) ? proyectosResponse : []
      const pagos = Array.isArray(pagosResponse) ? pagosResponse : []
      
      // ✅ SOLUCIÓN: Asegurar que dashboardResponse sea un objeto válido
      const dashboardData: DashboardApiResponse = dashboardResponse && typeof dashboardResponse === 'object' && !Array.isArray(dashboardResponse)
        ? dashboardResponse as DashboardApiResponse
        : {}

      // Calcular métricas adicionales
      const hoy = new Date()
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      const treintaDiasAtras = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Proyectos por estado
      const proyectosEnDesarrollo = proyectos.filter((p: any) => p.estadoProyecto === 'EN_DESARROLLO').length
      const proyectosCompletados = proyectos.filter((p: any) => p.estadoProyecto === 'COMPLETADO').length
      const proyectosEnPausa = proyectos.filter((p: any) => p.estadoProyecto === 'EN_PAUSA').length

      // Clientes nuevos este mes
      const nuevosClientesMes = clientes.filter((c: any) => 
        new Date(c.fechaRegistro) >= inicioMes
      ).length

      // Pagos pendientes y vencidos
      const pagosPendientes = pagos.filter((p: any) => p.estadoPago === 'PENDIENTE').length
      const pagosVencidosCount = pagos.filter((p: any) => p.estadoPago === 'VENCIDO').length

      // Tasa de éxito
      const totalProyectos = proyectos.length
      const tasaExito = totalProyectos > 0 ? Math.round((proyectosCompletados / totalProyectos) * 100) : 0

      // Ingreso promedio por proyecto
      const totalFacturado = proyectos.reduce((sum: number, p: any) => sum + (p.montoTotal || 0), 0)
      const ingresoPromedioPorProyecto = totalProyectos > 0 ? totalFacturado / totalProyectos : 0

      // Proyectos próximos a vencer
      const enUnaSemana = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)
      const proyectosPorVencer = proyectos.filter((p: any) => 
        p.fechaEntrega && 
        new Date(p.fechaEntrega) <= enUnaSemana && 
        p.estadoProyecto !== 'COMPLETADO'
      ).length

      // Actividad reciente
      const actividad: ActivityItem[] = [
        ...pagos
          .filter((p: any) => p.fechaPagoReal && new Date(p.fechaPagoReal) >= treintaDiasAtras)
          .map((p: any) => ({
            id: `pago-${p.id}`,
            tipo: 'pago_recibido' as const,
            titulo: 'Pago Recibido',
            descripcion: `${p.proyecto?.cliente?.nombre || 'Cliente'} - Cuota ${p.numeroCuota}`,
            fecha: p.fechaPagoReal,
            monto: p.montoCuota
          })),
        ...proyectos
          .filter((p: any) => new Date(p.createdAt) >= treintaDiasAtras)
          .map((p: any) => ({
            id: `proyecto-${p.id}`,
            tipo: 'proyecto_creado' as const,
            titulo: 'Nuevo Proyecto',
            descripcion: `${p.nombre} - ${p.cliente?.nombre || 'Cliente'}`,
            fecha: p.createdAt,
            monto: p.montoTotal
          })),
        ...clientes
          .filter((c: any) => new Date(c.fechaRegistro) >= treintaDiasAtras)
          .map((c: any) => ({
            id: `cliente-${c.id}`,
            tipo: 'cliente_agregado' as const,
            titulo: 'Nuevo Cliente',
            descripcion: `${c.nombre} - ${c.empresa || 'Sin empresa'}`,
            fecha: c.fechaRegistro
          })),
        ...pagos
          .filter((p: any) => p.estadoPago === 'VENCIDO')
          .map((p: any) => ({
            id: `vencido-${p.id}`,
            tipo: 'pago_vencido' as const,
            titulo: 'Pago Vencido',
            descripcion: `${p.proyecto?.cliente?.nombre || 'Cliente'} - $${p.montoCuota?.toLocaleString()}`,
            fecha: p.fechaVencimiento,
            monto: p.montoCuota,
            urgente: true
          }))
      ]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 10)

      // Facturación por mes (últimos 6 meses)
      const facturacionPorMes = []
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
        const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 0)
        
        const pagosMes = pagos.filter((p: any) => 
          p.fechaPagoReal && 
          new Date(p.fechaPagoReal) >= fecha && 
          new Date(p.fechaPagoReal) <= fechaFin &&
          p.estadoPago === 'PAGADO'
        )
        
        const totalMes = pagosMes.reduce((sum: number, p: any) => sum + (p.montoCuota || 0), 0)
        
        facturacionPorMes.push({
          mes: fecha.toLocaleDateString('es-AR', { month: 'short' }),
          monto: totalMes,
          proyectos: new Set(pagosMes.map((p: any) => p.proyectoId)).size
        })
      }

      // ✅ SOLUCIÓN: Crear el objeto sin spread, usando valores por defecto
      const enhancedData: DashboardData = {
        // Datos de la API (con valores por defecto)
        totalFacturado: dashboardData.totalFacturado ?? totalFacturado,
        pendienteCobro: dashboardData.pendienteCobro ?? pagos
          .filter((p: any) => p.estadoPago === 'PENDIENTE' || p.estadoPago === 'VENCIDO')
          .reduce((sum: number, p: any) => sum + (p.montoCuota || 0), 0),
        facturacionMes: dashboardData.facturacionMes ?? 0,
        tendenciaFacturacion: dashboardData.tendenciaFacturacion ?? 0,
        
        // Datos calculados
        proyectosEnPausa,
        nuevosClientesMes,
        pagosPendientes,
        tasaExito,
        ingresoPromedioPorProyecto,
        proyectosPorVencer,
        actividad,
        proyectosActivos: proyectosEnDesarrollo,
        proyectosCompletados,
        clientesActivos: clientes.filter((c: any) => c.estado === 'ACTIVO').length,
        pagosVencidos: pagosVencidosCount,
        proyectosPorEstado: [
          { estado: 'EN_DESARROLLO', cantidad: proyectosEnDesarrollo, color: 'blue' },
          { estado: 'COMPLETADO', cantidad: proyectosCompletados, color: 'green' },
          { estado: 'EN_PAUSA', cantidad: proyectosEnPausa, color: 'yellow' },
        ],
        facturacionPorMes,
        clientesMasActivos: clientes
          .map((c: any) => ({
            ...c,
            totalProyectos: proyectos.filter((p: any) => p.clienteId === c.id).length,
            totalFacturado: proyectos
              .filter((p: any) => p.clienteId === c.id)
              .reduce((sum: number, p: any) => sum + (p.montoTotal || 0), 0)
          }))
          .sort((a: any, b: any) => b.totalFacturado - a.totalFacturado)
          .slice(0, 5),
        pagosProximosVencer: pagos
          .filter((p: any) => {
            const fechaVenc = new Date(p.fechaVencimiento)
            return fechaVenc >= hoy && fechaVenc <= enUnaSemana && p.estadoPago === 'PENDIENTE'
          })
          .sort((a: any, b: any) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
          .slice(0, 5)
      }

      setData(enhancedData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error al cargar dashboard</h2>
          <button onClick={handleRefresh} className="btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Resumen general de tu negocio</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="input-glass text-sm"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Métricas principales mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={DollarSign}
          title="Total Facturado"
          value={`$${data.totalFacturado?.toLocaleString() || '0'}`}
          change={data.tendenciaFacturacion || 0}
          changeType={data.tendenciaFacturacion >= 0 ? 'positive' : 'negative'}
          subtitle="Este período"
        />
        
        <MetricCard
          icon={Clock}
          title="Pendiente de Cobro"
          value={`$${data.pendienteCobro?.toLocaleString() || '0'}`}
          urgent={data.pendienteCobro > 50000}
          subtitle={`${data.pagosPendientes} pagos pendientes`}
        />
        
        <MetricCard
          icon={FolderOpen}
          title="Proyectos Activos"
          value={data.proyectosActivos?.toString() || '0'}
          subtitle={`${data.proyectosCompletados || 0} completados`}
        />
        
        <MetricCard
          icon={Users}
          title="Clientes Activos"
          value={data.clientesActivos?.toString() || '0'}
          subtitle={`+${data.nuevosClientesMes || 0} este mes`}
        />
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Target}
          title="Tasa de Éxito"
          value={`${data.tasaExito || 0}%`}
          subtitle="Proyectos completados"
        />
        
        <MetricCard
          icon={BarChart3}
          title="Ingreso Promedio"
          value={`$${Math.round(data.ingresoPromedioPorProyecto || 0).toLocaleString()}`}
          subtitle="Por proyecto"
        />
        
        <MetricCard
          icon={AlertTriangle}
          title="Pagos Vencidos"
          value={data.pagosVencidos?.toString() || '0'}
          urgent={data.pagosVencidos > 0}
          subtitle="Requieren atención"
        />
        
        <MetricCard
          icon={Calendar}
          title="Por Vencer"
          value={data.proyectosPorVencer?.toString() || '0'}
          subtitle="Próxima semana"
        />
      </div>

      {/* Alertas importantes */}
      {data.pagosVencidos > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-6"
        >
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-6 h-6 text-red-400 mt-1" />
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold text-lg mb-2">
                ⚠️ Tienes {data.pagosVencidos} pagos vencidos
              </h3>
              <p className="text-gray-300 mb-4">
                Es importante seguir up con estos pagos para mantener un flujo de caja saludable.
              </p>
              <button className="btn-primary bg-red-600 hover:bg-red-700">
                <Eye className="w-4 h-4 mr-2" />
                Ver Pagos Vencidos
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Gráficos y actividad en cuadrícula mejorada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Gráfico de facturación */}
        <div className="xl:col-span-2">
          <FacturacionChart data={data.facturacionPorMes} />
        </div>
        
        {/* Actividad reciente */}
        <div>
          <ActividadReciente actividad={data.actividad} />
        </div>
        
        {/* Estado de proyectos */}
        <div>
          <EstadoProyectos data={data.proyectosPorEstado} />
        </div>
        
        {/* Clientes más activos */}
        <div>
          <ClientesMasActivos clientes={data.clientesMasActivos} />
        </div>
        
        {/* Pagos próximos a vencer */}
        <div>
          <PagosProximosVencer pagos={data.pagosProximosVencer} />
        </div>
      </div>

      {/* Resumen financiero detallado */}
      <div className="card p-6">
        <h3 className="text-white font-semibold text-xl mb-6 flex items-center">
          <TrendingUp className="w-6 h-6 mr-3" />
          Resumen Financiero del Mes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400 mb-2">
              ${data.facturacionMes?.toLocaleString() || '0'}
            </p>
            <p className="text-gray-400">Facturación este mes</p>
            <p className="text-sm text-green-400 mt-1">
              {data.tendenciaFacturacion >= 0 ? '+' : ''}{data.tendenciaFacturacion}% vs mes anterior
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400 mb-2">
              {data.proyectosActivos || 0}
            </p>
            <p className="text-gray-400">Proyectos en desarrollo</p>
            <p className="text-sm text-blue-400 mt-1">
              {data.proyectosEnPausa || 0} en pausa
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-400 mb-2">
              {data.tasaExito || 0}%
            </p>
            <p className="text-gray-400">Tasa de finalización</p>
            <p className="text-sm text-purple-400 mt-1">
              {data.proyectosCompletados || 0} completados
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400 mb-2">
              {data.nuevosClientesMes || 0}
            </p>
            <p className="text-gray-400">Clientes nuevos</p>
            <p className="text-sm text-yellow-400 mt-1">
              Este mes
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Resto de componentes siguen igual...
// (FacturacionChart, ActividadReciente, EstadoProyectos, etc.)

// Componente de gráfico de facturación
const FacturacionChart: React.FC<{ data: any[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.monto), 1)

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold text-lg">Evolución de Ingresos</h3>
          <p className="text-gray-400 text-sm">Facturación de los últimos 6 meses</p>
        </div>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
          <motion.div
            key={item.mes}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-4"
          >
            <div className="w-10 text-gray-400 text-sm font-medium">
              {item.mes}
            </div>
            <div className="flex-1 relative">
              <div className="bg-white/10 h-10 rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.monto / maxValue) * 100}%` }}
                  transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-end pr-3"
                >
                  <span className="text-white text-sm font-medium">
                    ${item.monto.toLocaleString()}
                  </span>
                </motion.div>
              </div>
            </div>
            <div className="w-20 text-right">
              <span className="text-gray-400 text-sm">{item.proyectos} proj</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">
            ${data.reduce((sum, item) => sum + item.monto, 0).toLocaleString()}
          </p>
          <p className="text-gray-400 text-xs">Total período</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-400">
            ${Math.round(data.reduce((sum, item) => sum + item.monto, 0) / data.length).toLocaleString()}
          </p>
          <p className="text-gray-400 text-xs">Promedio mensual</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-400">
            {data.reduce((sum, item) => sum + item.proyectos, 0)}
          </p>
          <p className="text-gray-400 text-xs">Total proyectos</p>
        </div>
      </div>
    </div>
  )
}

// Componente de actividad reciente mejorado
const ActividadReciente: React.FC<{ actividad: ActivityItem[] }> = ({ actividad }) => {
  const getActivityIcon = (tipo: ActivityItem['tipo']) => {
    switch (tipo) {
      case 'pago_recibido':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'proyecto_creado':
        return <FolderOpen className="w-4 h-4 text-blue-400" />
      case 'cliente_agregado':
        return <Users className="w-4 h-4 text-purple-400" />
      case 'pago_vencido':
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'proyecto_completado':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getTimeAgo = (fecha: string) => {
    const now = new Date()
    const time = new Date(fecha)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Hace unos minutos'
    if (diffInHours < 24) return `Hace ${diffInHours}h`
    const diffInDays = Math.floor(diffInHours / 24)
    return `Hace ${diffInDays}d`
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold text-lg">Actividad Reciente</h3>
          <p className="text-gray-400 text-sm">Últimas acciones en tu sistema</p>
        </div>
        <Activity className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {actividad.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-start space-x-3 p-3 rounded-lg transition-colors hover:bg-white/5 ${
              activity.urgente ? 'bg-red-500/10 border border-red-500/20' : ''
            }`}
          >
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.tipo)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium text-sm">{activity.titulo}</h4>
                <span className="text-gray-400 text-xs whitespace-nowrap ml-2">
                  {getTimeAgo(activity.fecha)}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1 truncate">
                {activity.descripcion}
              </p>
              {activity.monto && (
                <p className="text-green-400 font-medium text-sm mt-1">
                  ${activity.monto.toLocaleString()}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <button className="w-full btn-secondary text-sm">
          Ver toda la actividad
        </button>
      </div>
    </div>
  )
}

// Componente de estado de proyectos
const EstadoProyectos: React.FC<{ data: Array<{estado: string, cantidad: number, color: string}> }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.cantidad, 0)

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-400 bg-blue-500/20'
      case 'green': return 'text-green-400 bg-green-500/20'
      case 'yellow': return 'text-yellow-400 bg-yellow-500/20'
      case 'red': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getIcon = (estado: string) => {
    switch (estado) {
      case 'EN_DESARROLLO': return <PlayCircle className="w-4 h-4" />
      case 'COMPLETADO': return <CheckCircle className="w-4 h-4" />
      case 'EN_PAUSA': return <PauseCircle className="w-4 h-4" />
      default: return <FolderOpen className="w-4 h-4" />
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold text-lg">Estado de Proyectos</h3>
          <p className="text-gray-400 text-sm">Distribución actual</p>
        </div>
        <PieChart className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {data.map((item, index) => {
          const porcentaje = total > 0 ? (item.cantidad / total) * 100 : 0
          
          return (
            <motion.div
              key={item.estado}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getColorClass(item.color)}`}>
                  {getIcon(item.estado)}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">
                    {item.estado.replace('_', ' ')}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {porcentaje.toFixed(1)}% del total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{item.cantidad}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 text-center">
        <p className="text-2xl font-bold text-white">{total}</p>
        <p className="text-gray-400 text-sm">Total de proyectos</p>
      </div>
    </div>
  )
}

// Componente de clientes más activos
const ClientesMasActivos: React.FC<{ clientes: any[] }> = ({ clientes }) => {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold text-lg">Clientes Más Activos</h3>
          <p className="text-gray-400 text-sm">Por facturación total</p>
        </div>
        <Users className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {clientes.map((cliente, index) => (
          <motion.div
            key={cliente.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {cliente.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {cliente.nombre}
              </p>
              <p className="text-gray-400 text-xs">
                {cliente.totalProyectos} proyectos
              </p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-medium text-sm">
                ${cliente.totalFacturado.toLocaleString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Componente de pagos próximos a vencer
const PagosProximosVencer: React.FC<{ pagos: any[] }> = ({ pagos }) => {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold text-lg">Próximos Vencimientos</h3>
          <p className="text-gray-400 text-sm">Próxima semana</p>
        </div>
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>

      {pagos.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-400">¡No hay pagos próximos a vencer!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pagos.map((pago, index) => (
            <motion.div
              key={pago.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
            >
              <div>
                <p className="text-white font-medium text-sm">
                  {pago.proyecto?.cliente?.nombre || 'Cliente'}
                </p>
                <p className="text-gray-400 text-xs">
                  Cuota {pago.numeroCuota} - Vence: {new Date(pago.fechaVencimiento).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-medium">
                  ${pago.montoCuota?.toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}