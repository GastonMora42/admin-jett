// src/app/facturacion/page.tsx - VERSIÓN CON DATOS REALES
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  FileText,
  RefreshCw,
  AlertCircle,
  Filter,
  Eye,
  Plus
} from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useApi } from '@/lib/api-client'

interface FacturacionData {
  totalMes: number
  totalAnterior: number
  pendiente: number
  proyectosFacturados: number
  clientesFacturados: number
  evolucionMensual: Array<{
    mes: string
    monto: number
    proyectos: number
    fecha: string
  }>
  topClientes: Array<{
    id: string
    nombre: string
    empresa?: string
    montoTotal: number
    proyectos: number
    ultimoPago?: string
  }>
  pagosPorMetodo: Array<{
    metodo: string
    cantidad: number
    monto: number
  }>
  estadisticasPagos: {
    totalPagado: number
    totalPendiente: number
    totalVencido: number
    promedioTiempoPago: number
    tasaCobranza: number
  }
}

export default function FacturacionPage() {
  const [periodo, setPeriodo] = useState('este_mes')
  const [facturacion, setFacturacion] = useState<FacturacionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCliente, setSelectedCliente] = useState<string | null>(null)

  const api = useApi()

  useEffect(() => {
    fetchFacturacionData()
    // No es necesario limpiar nada aquí porque 'api.cleanup' no existe
    // y no hay efectos secundarios que limpiar
  }, [periodo])

  const fetchFacturacionData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener datos de múltiples endpoints
      const [proyectos, pagos, clientes] = await Promise.all([
        api.get('/api/proyectos', false),
        api.get('/api/pagos', false),
        api.get('/api/clientes', false)
      ])

      // Procesar datos para facturación
      const facturacionCalculada = calcularFacturacion(
        proyectos as any[],
        pagos as any[],
        clientes as any[],
        periodo
      )
      setFacturacion(facturacionCalculada)
    } catch (err) {
      console.error('Error loading facturación:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const calcularFacturacion = (proyectos: any[], pagos: any[], clientes: any[], periodo: string): FacturacionData => {
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)

    // Filtrar pagos según el período
    const pagosMes = pagos.filter(pago => {
      const fechaPago = pago.fechaPagoReal ? new Date(pago.fechaPagoReal) : null
      return fechaPago && fechaPago >= inicioMes && fechaPago <= finMes && pago.estadoPago === 'PAGADO'
    })

    const pagosMesAnterior = pagos.filter(pago => {
      const fechaPago = pago.fechaPagoReal ? new Date(pago.fechaPagoReal) : null
      return fechaPago && fechaPago >= inicioMesAnterior && fechaPago <= finMesAnterior && pago.estadoPago === 'PAGADO'
    })

    const totalMes = pagosMes.reduce((sum, pago) => sum + pago.montoCuota, 0)
    const totalAnterior = pagosMesAnterior.reduce((sum, pago) => sum + pago.montoCuota, 0)

    // Pendiente de cobro
    const pagosPendientes = pagos.filter(pago => 
      pago.estadoPago === 'PENDIENTE' || pago.estadoPago === 'VENCIDO'
    )
    const pendiente = pagosPendientes.reduce((sum, pago) => sum + pago.montoCuota, 0)

    // Proyectos con facturación este mes
    const proyectosConPagosMes = new Set(pagosMes.map(pago => pago.proyectoId))
    const proyectosFacturados = proyectosConPagosMes.size

    // Clientes con facturación este mes
    const clientesConPagosMes = new Set()
    pagosMes.forEach(pago => {
      const proyecto = proyectos.find(p => p.id === pago.proyectoId)
      if (proyecto) {
        clientesConPagosMes.add(proyecto.clienteId)
      }
    })
    const clientesFacturados = clientesConPagosMes.size

    // Evolución mensual (últimos 12 meses)
    const evolucionMensual = []
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const inicioMesPeriodo = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
      const finMesPeriodo = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)
      
      const pagosPeriodo = pagos.filter(pago => {
        const fechaPago = pago.fechaPagoReal ? new Date(pago.fechaPagoReal) : null
        return fechaPago && fechaPago >= inicioMesPeriodo && fechaPago <= finMesPeriodo && pago.estadoPago === 'PAGADO'
      })

      const proyectosPeriodo = new Set(pagosPeriodo.map(pago => pago.proyectoId))

      evolucionMensual.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short' }),
        monto: pagosPeriodo.reduce((sum, pago) => sum + pago.montoCuota, 0),
        proyectos: proyectosPeriodo.size,
        fecha: fecha.toISOString()
      })
    }

    // Top clientes por facturación
    const clientesMap = new Map()
    pagos.forEach(pago => {
      if (pago.estadoPago === 'PAGADO') {
        const proyecto = proyectos.find(p => p.id === pago.proyectoId)
        if (proyecto && proyecto.cliente) {
          const clienteId = proyecto.cliente.id
          if (!clientesMap.has(clienteId)) {
            clientesMap.set(clienteId, {
              id: clienteId,
              nombre: proyecto.cliente.nombre,
              empresa: proyecto.cliente.empresa,
              montoTotal: 0,
              proyectos: new Set(),
              ultimoPago: null
            })
          }
          
          const clienteData = clientesMap.get(clienteId)
          clienteData.montoTotal += pago.montoCuota
          clienteData.proyectos.add(pago.proyectoId)
          
          if (!clienteData.ultimoPago || new Date(pago.fechaPagoReal) > new Date(clienteData.ultimoPago)) {
            clienteData.ultimoPago = pago.fechaPagoReal
          }
        }
      }
    })

    const topClientes = Array.from(clientesMap.values())
      .map(cliente => ({
        ...cliente,
        proyectos: cliente.proyectos.size
      }))
      .sort((a, b) => b.montoTotal - a.montoTotal)
      .slice(0, 10)

    // Pagos por método
    const metodosPago = new Map()
    pagos.forEach(pago => {
      if (pago.estadoPago === 'PAGADO' && pago.metodoPago) {
        const metodo = pago.metodoPago
        if (!metodosPago.has(metodo)) {
          metodosPago.set(metodo, { cantidad: 0, monto: 0 })
        }
        const metodoData = metodosPago.get(metodo)
        metodoData.cantidad += 1
        metodoData.monto += pago.montoCuota
      }
    })

    const pagosPorMetodo = Array.from(metodosPago.entries()).map(([metodo, data]) => ({
      metodo,
      cantidad: data.cantidad,
      monto: data.monto
    }))

    // Estadísticas de pagos
    const totalPagado = pagos.filter(p => p.estadoPago === 'PAGADO').reduce((sum, p) => sum + p.montoCuota, 0)
    const totalPendiente = pagos.filter(p => p.estadoPago === 'PENDIENTE').reduce((sum, p) => sum + p.montoCuota, 0)
    const totalVencido = pagos.filter(p => p.estadoPago === 'VENCIDO').reduce((sum, p) => sum + p.montoCuota, 0)

    // Tiempo promedio de pago (días entre vencimiento y pago real)
    const pagosPagados = pagos.filter(p => p.estadoPago === 'PAGADO' && p.fechaPagoReal)
    const tiemposPago = pagosPagados.map(p => {
      const vencimiento = new Date(p.fechaVencimiento)
      const pagoReal = new Date(p.fechaPagoReal)
      return Math.max(0, Math.round((pagoReal.getTime() - vencimiento.getTime()) / (1000 * 60 * 60 * 24)))
    })
    const promedioTiempoPago = tiemposPago.length > 0 ? 
      Math.round(tiemposPago.reduce((sum, t) => sum + t, 0) / tiemposPago.length) : 0

    const tasaCobranza = pagos.length > 0 ? 
      Math.round((pagos.filter(p => p.estadoPago === 'PAGADO').length / pagos.length) * 100) : 0

    return {
      totalMes,
      totalAnterior,
      pendiente,
      proyectosFacturados,
      clientesFacturados,
      evolucionMensual,
      topClientes,
      pagosPorMetodo,
      estadisticasPagos: {
        totalPagado,
        totalPendiente,
        totalVencido,
        promedioTiempoPago,
        tasaCobranza
      }
    }
  }

  const periodos = [
    { value: 'este_mes', label: 'Este mes' },
    { value: 'mes_anterior', label: 'Mes anterior' },
    { value: 'trimestre', label: 'Este trimestre' },
    { value: 'año', label: 'Este año' }
  ]

  const tendencia = useMemo(() => {
    if (!facturacion || facturacion.totalAnterior === 0) return 0
    return Math.round(((facturacion.totalMes - facturacion.totalAnterior) / facturacion.totalAnterior) * 100)
  }, [facturacion])

  const maxMonto = useMemo(() => {
    if (!facturacion) return 1
    return Math.max(...facturacion.evolucionMensual.map(item => item.monto), 1)
  }, [facturacion])

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
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error al cargar datos</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchFacturacionData}
            className="btn-primary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!facturacion) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
          <button 
            onClick={fetchFacturacionData}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
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
              <span>{Math.abs(tendencia)}%</span>
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
          <p className="text-gray-500 text-xs mt-1">proyectos con ingresos este período</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Clientes Facturados</h3>
          <p className="text-white text-3xl font-bold">{facturacion.clientesFacturados}</p>
          <p className="text-gray-500 text-xs mt-1">clientes con pagos recibidos</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-yellow-400" />
            {facturacion.pendiente > 0 && (
              <span className="text-yellow-400 text-sm font-medium">Pendiente</span>
            )}
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Pendiente de Cobro</h3>
          <p className="text-white text-3xl font-bold">${facturacion.pendiente.toLocaleString()}</p>
          <p className="text-gray-500 text-xs mt-1">
            {facturacion.totalMes > 0 ? 
              `${Math.round((facturacion.pendiente / (facturacion.totalMes + facturacion.pendiente)) * 100)}% del total` :
              'Sin facturación activa'
            }
          </p>
        </div>
      </div>

      {/* Gráfico de facturación mensual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-white font-semibold text-lg mb-6">Evolución Mensual</h3>
          {facturacion.evolucionMensual.length > 0 ? (
            <div className="space-y-4">
              {facturacion.evolucionMensual.map((item, index) => (
                <div key={item.mes + item.fecha} className="flex items-center space-x-4">
                  <div className="w-16 text-gray-400 text-sm font-medium">{item.mes}</div>
                  <div className="flex-1 relative">
                    <div className="bg-white/10 h-8 rounded overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${maxMonto > 0 ? (item.monto / maxMonto) * 100 : 0}%` }}
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
                  <div className="w-16 text-right">
                    <span className="text-gray-400 text-sm">{item.proyectos} proj</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No hay datos de facturación</p>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-white font-semibold text-lg mb-6">Top Clientes por Facturación</h3>
          {facturacion.topClientes.length > 0 ? (
            <div className="space-y-4">
              {facturacion.topClientes.slice(0, 5).map((cliente, index) => (
                <motion.div 
                  key={cliente.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => setSelectedCliente(selectedCliente === cliente.id ? null : cliente.id)}
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{cliente.nombre}</p>
                    <p className="text-gray-400 text-sm">{cliente.empresa || 'Sin empresa'}</p>
                    <p className="text-gray-500 text-xs">{cliente.proyectos} proyectos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">${cliente.montoTotal.toLocaleString()}</p>
                    <p className="text-gray-400 text-xs">#{index + 1}</p>
                    {cliente.ultimoPago && (
                      <p className="text-gray-500 text-xs">
                        Último: {new Date(cliente.ultimoPago).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Eye className="w-4 h-4 text-gray-400 ml-2" />
                </motion.div>
              ))}
              {facturacion.topClientes.length > 5 && (
                <div className="text-center pt-2">
                  <button className="text-blue-400 hover:text-blue-300 text-sm">
                    Ver todos los clientes ({facturacion.topClientes.length})
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No hay datos de clientes</p>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-white font-semibold text-lg mb-6">Métodos de Pago</h3>
          {facturacion.pagosPorMetodo.length > 0 ? (
            <div className="space-y-4">
              {facturacion.pagosPorMetodo.map((metodo, index) => (
                <div key={metodo.metodo} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white font-medium">{metodo.metodo}</p>
                    <p className="text-gray-400 text-sm">{metodo.cantidad} transacciones</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">${metodo.monto.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm">
                      {facturacion.estadisticasPagos.totalPagado > 0 ? 
                        Math.round((metodo.monto / facturacion.estadisticasPagos.totalPagado) * 100) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No hay datos de métodos de pago</p>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-white font-semibold text-lg mb-6">Estadísticas de Cobros</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <p className="text-2xl font-bold text-green-400">
                ${facturacion.estadisticasPagos.totalPagado.toLocaleString()}
              </p>
              <p className="text-gray-400 text-sm">Total Cobrado</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
              <p className="text-2xl font-bold text-yellow-400">
                ${facturacion.estadisticasPagos.totalPendiente.toLocaleString()}
              </p>
              <p className="text-gray-400 text-sm">Total Pendiente</p>
            </div>
            
            <div className="text-center p-4 bg-red-500/10 rounded-lg">
              <p className="text-2xl font-bold text-red-400">
                ${facturacion.estadisticasPagos.totalVencido.toLocaleString()}
              </p>
              <p className="text-gray-400 text-sm">Total Vencido</p>
            </div>
            
            <div className="text-center p-4 bg-blue-500/10 rounded-lg">
              <p className="text-2xl font-bold text-blue-400">
                {facturacion.estadisticasPagos.tasaCobranza}%
              </p>
              <p className="text-gray-400 text-sm">Tasa de Cobranza</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-white/5 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Tiempo promedio de cobro</span>
              <span className="text-white font-medium">
                {facturacion.estadisticasPagos.promedioTiempoPago} días
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}