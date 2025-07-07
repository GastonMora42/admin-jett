// =====================================================
// FORMULARIO PROYECTO CORREGIDO - src/components/FormularioProyecto.tsx
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderOpen, User, DollarSign, Calendar } from 'lucide-react'

// Importar tipos correctos
import { 
  Proyecto, 
  Cliente, 
  CreateProyectoData,
  TipoProyecto, 
  FormaPago,
  TIPOS_PROYECTO_LABELS,
  FORMAS_PAGO_LABELS
} from '@/types/index'

interface FormularioProyectoProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateProyectoData | Partial<Proyecto>) => Promise<void>
  proyecto?: Proyecto | null
  clientes: Cliente[]
  title?: string
}

export const FormularioProyecto: React.FC<FormularioProyectoProps> = ({
  isOpen,
  onClose,
  onSubmit,
  proyecto = null,
  clientes,
  title = 'Nuevo Proyecto'
}) => {
  const [formData, setFormData] = useState<CreateProyectoData>({
    nombre: '',
    tipo: 'SOFTWARE_A_MEDIDA',
    montoTotal: 0,
    formaPago: 'PAGO_UNICO',
    cuotas: 1,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaEntrega: '',
    clienteId: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const tiposProyecto: { value: TipoProyecto; label: string }[] = Object.entries(TIPOS_PROYECTO_LABELS).map(
    ([value, label]) => ({ value: value as TipoProyecto, label })
  )

  const formasPago: { value: FormaPago; label: string }[] = Object.entries(FORMAS_PAGO_LABELS).map(
    ([value, label]) => ({ value: value as FormaPago, label })
  )

  useEffect(() => {
    if (proyecto) {
      setFormData({
        nombre: proyecto.nombre || '',
        tipo: proyecto.tipo || 'SOFTWARE_A_MEDIDA',
        montoTotal: proyecto.montoTotal || 0,
        formaPago: proyecto.formaPago || 'PAGO_UNICO',
        cuotas: proyecto.cuotas || 1,
        fechaInicio: proyecto.fechaInicio ? proyecto.fechaInicio.split('T')[0] : new Date().toISOString().split('T')[0],
        fechaEntrega: proyecto.fechaEntrega ? proyecto.fechaEntrega.split('T')[0] : '',
        clienteId: proyecto.clienteId || ''
      })
    } else {
      setFormData({
        nombre: '',
        tipo: 'SOFTWARE_A_MEDIDA',
        montoTotal: 0,
        formaPago: 'PAGO_UNICO',
        cuotas: 1,
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaEntrega: '',
        clienteId: clientes.length > 0 ? clientes[0].id : ''
      })
    }
    setErrors({})
  }, [proyecto, clientes, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del proyecto es requerido'
    }

    if (!formData.clienteId) {
      newErrors.clienteId = 'Debe seleccionar un cliente'
    }

    if (formData.montoTotal <= 0) {
      newErrors.montoTotal = 'El monto debe ser mayor a 0'
    }

    if (formData.formaPago === 'MENSUAL' && (!formData.cuotas || formData.cuotas < 1)) {
      newErrors.cuotas = 'Debe especificar el número de cuotas'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      
      // Calcular cuotas automáticamente si no es mensual
      let cuotasFinales = formData.cuotas
      if (formData.formaPago === 'DOS_CUOTAS') cuotasFinales = 2
      else if (formData.formaPago === 'TRES_CUOTAS') cuotasFinales = 3
      else if (formData.formaPago === 'PAGO_UNICO') cuotasFinales = 1

      const submitData: CreateProyectoData = {
        ...formData,
        cuotas: cuotasFinales
      }

      await onSubmit(submitData)
      onClose()
    } catch (error) {
      console.error('Error al guardar proyecto:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

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
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FolderOpen className="w-4 h-4 inline mr-2" />
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className={`input-glass w-full ${errors.nombre ? 'border-red-500' : ''}`}
                  placeholder="Ej: Sistema de gestión de inventario"
                />
                {errors.nombre && (
                  <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Cliente *
                </label>
                <select
                  value={formData.clienteId}
                  onChange={(e) => setFormData({...formData, clienteId: e.target.value})}
                  className={`input-glass w-full ${errors.clienteId ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.empresa && `(${cliente.empresa})`}
                    </option>
                  ))}
                </select>
                {errors.clienteId && (
                  <p className="text-red-400 text-xs mt-1">{errors.clienteId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Proyecto
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value as TipoProyecto})}
                  className="input-glass w-full"
                >
                  {tiposProyecto.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Monto Total *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.montoTotal}
                  onChange={(e) => setFormData({...formData, montoTotal: parseFloat(e.target.value) || 0})}
                  className={`input-glass w-full ${errors.montoTotal ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                />
                {errors.montoTotal && (
                  <p className="text-red-400 text-xs mt-1">{errors.montoTotal}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Forma de Pago
                </label>
                <select
                  value={formData.formaPago}
                  onChange={(e) => setFormData({...formData, formaPago: e.target.value as FormaPago})}
                  className="input-glass w-full"
                >
                  {formasPago.map((forma) => (
                    <option key={forma.value} value={forma.value}>
                      {forma.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.formaPago === 'MENSUAL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Número de Cuotas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.cuotas}
                    onChange={(e) => setFormData({...formData, cuotas: parseInt(e.target.value) || 1})}
                    className={`input-glass w-full ${errors.cuotas ? 'border-red-500' : ''}`}
                    placeholder="12"
                  />
                  {errors.cuotas && (
                    <p className="text-red-400 text-xs mt-1">{errors.cuotas}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  required
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                  className="input-glass w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fecha de Entrega Estimada
                </label>
                <input
                  type="date"
                  value={formData.fechaEntrega}
                  onChange={(e) => setFormData({...formData, fechaEntrega: e.target.value})}
                  className="input-glass w-full"
                />
              </div>
            </div>

            {/* Resumen */}
            <div className="card bg-white/5 p-4">
              <h3 className="text-white font-medium mb-3">Resumen del Proyecto</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Monto total:</span>
                  <p className="text-green-400 font-medium">${formData.montoTotal.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-400">Forma de pago:</span>
                  <p className="text-white">{formasPago.find(f => f.value === formData.formaPago)?.label}</p>
                </div>
                {formData.formaPago !== 'PAGO_UNICO' && (
                  <>
                    <div>
                      <span className="text-gray-400">Número de cuotas:</span>
                      <p className="text-blue-400 font-medium">
                        {formData.formaPago === 'DOS_CUOTAS' ? 2 :
                         formData.formaPago === 'TRES_CUOTAS' ? 3 :
                         formData.cuotas}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Monto por cuota:</span>
                      <p className="text-blue-400 font-medium">
                        ${(formData.montoTotal / (
                          formData.formaPago === 'DOS_CUOTAS' ? 2 :
                          formData.formaPago === 'TRES_CUOTAS' ? 3 :
                          formData.cuotas || 1
                        )).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
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
                {loading ? 'Guardando...' : 'Guardar Proyecto'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}