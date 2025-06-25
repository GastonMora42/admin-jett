
// =====================================================
// PAGO DETALLE - src/components/PagoDetalle.tsx
// =====================================================

'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  User, 
  FolderOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Edit
} from 'lucide-react'

interface Pago {
  id: string
  numeroCuota: number
  montoCuota: number
  fechaVencimiento: string
  fechaPagoReal?: string
  estadoPago: string
  metodoPago?: string
  notas?: string
  proyecto?: {
    id: string
    nombre: string
    cliente?: {
      id: string
      nombre: string
      empresa?: string
    }
  }
}

interface PagoDetalleProps {
  pago: Pago | null
  isOpen: boolean
  onClose: () => void
  onMarcarPagado: () => void
}

export const PagoDetalle: React.FC<PagoDetalleProps> = ({
  pago,
  isOpen,
  onClose,
  onMarcarPagado
}) => {
  if (!isOpen || !pago) return null

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PAGADO': return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'PENDIENTE': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'VENCIDO': return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'PARCIAL': return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PAGADO': return <CheckCircle className="w-5 h-5" />
      case 'PENDIENTE': return <Clock className="w-5 h-5" />
      case 'VENCIDO': return <AlertCircle className="w-5 h-5" />
      case 'PARCIAL': return <CreditCard className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
  }

  const esVencido = pago.estadoPago === 'VENCIDO' || 
    (pago.estadoPago === 'PENDIENTE' && new Date(pago.fechaVencimiento) < new Date())

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
          className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Detalle del Pago</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información principal */}
            <div className="space-y-6">
              {/* Monto y estado */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold text-white">
                      ${pago.montoCuota.toLocaleString()}
                    </p>
                    <p className="text-gray-400">Cuota #{pago.numeroCuota}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg border flex items-center space-x-2 ${getEstadoColor(pago.estadoPago)}`}>
                    {getEstadoIcon(pago.estadoPago)}
                    <span className="font-medium">{pago.estadoPago}</span>
                  </div>
                </div>

                {esVencido && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-400">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Pago Vencido</span>
                    </div>
                    <p className="text-gray-300 text-sm mt-1">
                      Este pago requiere seguimiento inmediato
                    </p>
                  </div>
                )}
              </div>

              {/* Información del proyecto */}
              <div className="card p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Proyecto
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Nombre del proyecto</p>
                    <p className="text-white font-medium">{pago.proyecto?.nombre}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Cliente</p>
                    <p className="text-white font-medium">{pago.proyecto?.cliente?.nombre}</p>
                    {pago.proyecto?.cliente?.empresa && (
                      <p className="text-gray-400 text-sm">{pago.proyecto.cliente.empresa}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fechas y detalles */}
            <div className="space-y-6">
              {/* Fechas */}
              <div className="card p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Fechas
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm">Fecha de vencimiento</p>
                    <p className={`font-medium ${esVencido ? 'text-red-400' : 'text-white'}`}>
                      {new Date(pago.fechaVencimiento).toLocaleDateString()}
                    </p>
                  </div>
                  {pago.fechaPagoReal && (
                    <div>
                      <p className="text-gray-400 text-sm">Fecha de pago</p>
                      <p className="text-green-400 font-medium">
                        {new Date(pago.fechaPagoReal).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Método de pago */}
              {pago.metodoPago && (
                <div className="card p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Método de Pago
                  </h3>
                  <p className="text-white">{pago.metodoPago}</p>
                </div>
              )}

              {/* Notas */}
              {pago.notas && (
                <div className="card p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Notas
                  </h3>
                  <p className="text-gray-300 leading-relaxed">{pago.notas}</p>
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-white/10">
            {pago.estadoPago !== 'PAGADO' && (
              <button
                onClick={onMarcarPagado}
                className="btn-primary"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar como Pagado
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
