// =====================================================
// REGISTRAR PAGO - src/components/RegistrarPago.tsx
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Calendar, FileText } from 'lucide-react'

interface Pago {
  id: string
  montoCuota: number
  numeroCuota: number
  proyecto?: {
    nombre: string
    cliente?: {
      nombre: string
    }
  }
}

interface RegistrarPagoProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Pago>) => void
  pago?: Pago | null
}

export const RegistrarPago: React.FC<RegistrarPagoProps> = ({
  isOpen,
  onClose,
  onSubmit,
  pago = null
}) => {
  const [formData, setFormData] = useState({
    fechaPagoReal: new Date().toISOString().split('T')[0],
    metodoPago: '',
    notas: ''
  })
  const [loading, setLoading] = useState(false)

  const metodosPago = [
    'Transferencia Bancaria',
    'Efectivo',
    'Cheque',
    'Tarjeta de Crédito',
    'Tarjeta de Débito',
    'PayPal',
    'Mercado Pago',
    'Otros'
  ]

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fechaPagoReal: new Date().toISOString().split('T')[0],
        metodoPago: '',
        notas: ''
      })
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        id: pago?.id,
        numeroCuota: pago?.numeroCuota,
        proyecto: pago?.proyecto
      })
      onClose()
    } catch (error) {
      console.error('Error al registrar pago:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !pago) return null

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
          className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Registrar Pago</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Información del pago */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h3 className="text-white font-medium mb-2">Detalles del Pago</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Proyecto:</span>
                <span className="text-white">{pago.proyecto?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cliente:</span>
                <span className="text-white">{pago.proyecto?.cliente?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cuota:</span>
                <span className="text-white">#{pago.numeroCuota}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Monto:</span>
                <span className="text-green-400 font-semibold">${pago.montoCuota.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Fecha de Pago *
              </label>
              <input
                type="date"
                required
                value={formData.fechaPagoReal}
                onChange={(e) => setFormData({...formData, fechaPagoReal: e.target.value})}
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                Método de Pago
              </label>
              <select
                value={formData.metodoPago}
                onChange={(e) => setFormData({...formData, metodoPago: e.target.value})}
                className="input-glass w-full"
              >
                <option value="">Seleccionar método</option>
                {metodosPago.map((metodo) => (
                  <option key={metodo} value={metodo}>
                    {metodo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Notas adicionales
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({...formData, notas: e.target.value})}
                rows={3}
                className="input-glass w-full resize-none"
                placeholder="Información adicional sobre el pago..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? 'Registrando...' : 'Confirmar Pago'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}