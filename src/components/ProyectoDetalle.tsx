
// =====================================================
// PROYECTO DETALLE - src/components/ProyectoDetalle.tsx
// =====================================================

'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Calendar, 
  DollarSign, 
  User, 
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  PlayCircle,
  PauseCircle
} from 'lucide-react'

interface Proyecto {
  id: string
  nombre: string
  tipo: string
  montoTotal: number
  formaPago: string
  fechaInicio: string
  fechaEntrega?: string
  estadoProyecto: string
  estadoPago: string
  cliente?: {
    id: string
    nombre: string
    empresa?: string
    email: string
  }
  pagos?: Array<{
    id: string
    numeroCuota: number
    montoCuota: number
    fechaVencimiento: string
    estadoPago: string
  }>
}

interface ProyectoDetalleProps {
  proyecto: Proyecto | null
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}

export const ProyectoDetalle: React.FC<ProyectoDetalleProps> = ({
  proyecto,
  isOpen,
  onClose,
  onEdit
}) => {
  if (!isOpen || !proyecto) return null

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      SOFTWARE_A_MEDIDA: 'Software a Medida',
      ECOMMERCE: 'E-commerce',
      LANDING_PAGE: 'Landing Page',
      SISTEMA_WEB: 'Sistema Web',
      APP_MOVIL: 'App Móvil',
      MANTENIMIENTO: 'Mantenimiento'
    }
    return tipos[tipo] || tipo
  }

  const getFormaPagoLabel = (forma: string) => {
    const formas: Record<string, string> = {
      PAGO_UNICO: 'Pago Único',
      DOS_CUOTAS: '2 Cuotas',
      TRES_CUOTAS: '3 Cuotas',
      MENSUAL: 'Mensual'
    }
    return formas[forma] || forma
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'EN_DESARROLLO': return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      case 'COMPLETADO': return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'EN_PAUSA': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'CANCELADO': return 'text-red-400 bg-red-500/20 border-red-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const pagosPagados = proyecto.pagos?.filter(p => p.estadoPago === 'PAGADO').length || 0
  const totalPagos = proyecto.pagos?.length || 0
  const progresoPagos = totalPagos > 0 ? (pagosPagados / totalPagos) * 100 : 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{proyecto.nombre}</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={onEdit}
                className="btn-secondary"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Detalles del proyecto */}
              <div className="card p-6">
                <h3 className="text-white font-semibold mb-4">Información del Proyecto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Tipo de proyecto</p>
                    <p className="text-white font-medium">{getTipoLabel(proyecto.tipo)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Estado</p>
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg border ${getEstadoColor(proyecto.estadoProyecto)}`}>
                      {proyecto.estadoProyecto === 'EN_DESARROLLO' && <PlayCircle className="w-4 h-4" />}
                      {proyecto.estadoProyecto === 'COMPLETADO' && <CheckCircle className="w-4 h-4" />}
                      {proyecto.estadoProyecto === 'EN_PAUSA' && <PauseCircle className="w-4 h-4" />}
                      {proyecto.estadoProyecto === 'CANCELADO' && <AlertCircle className="w-4 h-4" />}
                      <span className="font-medium">{proyecto.estadoProyecto.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Fecha de inicio</p>
                    <p className="text-white font-medium">
                      {new Date(proyecto.fechaInicio).toLocaleDateString()}
                    </p>
                  </div>
                  {proyecto.fechaEntrega && (
                    <div>
                      <p className="text-gray-400 text-sm">Fecha de entrega</p>
                      <p className="text-white font-medium">
                        {new Date(proyecto.fechaEntrega).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Información financiera */}
              <div className="card p-6">
                <h3 className="text-white font-semibold mb-4">Información Financiera</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Monto total</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${proyecto.montoTotal.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Forma de pago</p>
                    <p className="text-white font-medium">{getFormaPagoLabel(proyecto.formaPago)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Estado de pagos</p>
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg border ${getEstadoColor(proyecto.estadoPago)}`}>
                      <span className="font-medium">{proyecto.estadoPago}</span>
                    </div>
                  </div>
                </div>

                {/* Progreso de pagos */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Progreso de pagos</span>
                    <span className="text-white text-sm font-medium">
                      {pagosPagados}/{totalPagos} cuotas pagadas
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${progresoPagos}%` }}
                    />
                  </div>
                  <p className="text-right text-gray-400 text-xs mt-1">
                    {progresoPagos.toFixed(1)}% completado
                  </p>
                </div>
              </div>

              {/* Lista de pagos */}
              {proyecto.pagos && proyecto.pagos.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-white font-semibold mb-4">Cronograma de Pagos</h3>
                  <div className="space-y-3">
                    {proyecto.pagos.map((pago, index) => (
                      <div
                        key={pago.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            pago.estadoPago === 'PAGADO' ? 'bg-green-500/20 text-green-400' :
                            pago.estadoPago === 'VENCIDO' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {pago.estadoPago === 'PAGADO' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <span className="text-xs font-medium">{pago.numeroCuota}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              Cuota {pago.numeroCuota}
                            </p>
                            <p className="text-gray-400 text-sm">
                              Vence: {new Date(pago.fechaVencimiento).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">
                            ${pago.montoCuota.toLocaleString()}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            pago.estadoPago === 'PAGADO' ? 'bg-green-500/20 text-green-400' :
                            pago.estadoPago === 'VENCIDO' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {pago.estadoPago}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Información del cliente */}
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Cliente
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm">Nombre</p>
                    <p className="text-white font-medium">{proyecto.cliente?.nombre}</p>
                  </div>
                  {proyecto.cliente?.empresa && (
                    <div>
                      <p className="text-gray-400 text-sm">Empresa</p>
                      <p className="text-white font-medium">{proyecto.cliente.empresa}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-blue-400">{proyecto.cliente?.email}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/10">
                  <button className="w-full btn-secondary text-sm">
                    Ver perfil completo
                  </button>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="card p-6">
                <h3 className="text-white font-semibold mb-4">Acciones Rápidas</h3>
                <div className="space-y-3">
                  <button className="w-full btn-secondary text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Ver cronograma
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Gestionar pagos
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    <User className="w-4 h-4 mr-2" />
                    Contactar cliente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
