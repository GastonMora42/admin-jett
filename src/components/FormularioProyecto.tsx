// src/components/FormularioProyecto.tsx - VERSIÓN CON SELECCIÓN DE MONEDA
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderOpen, User, DollarSign, Calendar, ArrowLeftRight } from 'lucide-react'
import { useCurrency } from '@/lib/currency-config'
import { 
  Proyecto, 
  Cliente, 
  CreateProyectoData,
  TipoProyecto, 
  FormaPago,
  TIPOS_PROYECTO_LABELS,
  FORMAS_PAGO_LABELS
} from '@/types/index'

interface CreateProyectoDataWithCurrency extends CreateProyectoData {
  currency: 'USD' | 'ARS'
}

interface FormularioProyectoProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateProyectoDataWithCurrency) => Promise<void>
  proyecto?: Proyecto | null
  clientes: Cliente[]
  title?: string
}

const FormularioProyecto: React.FC<FormularioProyectoProps> = ({
  isOpen,
  onClose,
  onSubmit,
  proyecto = null,
  clientes,
  title = 'Nuevo Proyecto'
}) => {
  const { settings, formatCurrency, getCurrencySymbol, getProjectCurrency, convertCurrency } = useCurrency()
  const [formData, setFormData] = useState<CreateProyectoDataWithCurrency>({
    nombre: '',
    tipo: 'SOFTWARE_A_MEDIDA',
    montoTotal: 0,
    formaPago: 'PAGO_UNICO',
    cuotas: 1,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaEntrega: '',
    clienteId: '',
    currency: settings.defaultCurrency
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false)

  const tiposProyecto: { value: TipoProyecto; label: string }[] = Object.entries(TIPOS_PROYECTO_LABELS).map(
    ([value, label]) => ({ value: value as TipoProyecto, label })
  )

  const formasPago: { value: FormaPago; label: string }[] = Object.entries(FORMAS_PAGO_LABELS).map(
    ([value, label]) => ({ value: value as FormaPago, label })
  )

  useEffect(() => {
    if (proyecto) {
      // Si estamos editando un proyecto existente
      const projectCurrency = getProjectCurrency(proyecto.id)
      setFormData({
        nombre: proyecto.nombre || '',
        tipo: proyecto.tipo || 'SOFTWARE_A_MEDIDA',
        montoTotal: proyecto.montoTotal || 0,
        formaPago: proyecto.formaPago || 'PAGO_UNICO',
        cuotas: proyecto.cuotas || 1,
        fechaInicio: proyecto.fechaInicio ? proyecto.fechaInicio.split('T')[0] : new Date().toISOString().split('T')[0],
        fechaEntrega: proyecto.fechaEntrega ? proyecto.fechaEntrega.split('T')[0] : '',
        clienteId: proyecto.clienteId || '',
        currency: projectCurrency
      })
    } else {
      // Nuevo proyecto
      setFormData({
        nombre: '',
        tipo: 'SOFTWARE_A_MEDIDA',
        montoTotal: 0,
        formaPago: 'PAGO_UNICO',
        cuotas: 1,
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaEntrega: '',
        clienteId: clientes.length > 0 ? clientes[0].id : '',
        currency: settings.defaultCurrency
      })
    }
    setErrors({})
  }, [proyecto, clientes, isOpen, settings.defaultCurrency, getProjectCurrency])

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

      const submitData: CreateProyectoDataWithCurrency = {
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

  const handleCurrencyChange = (newCurrency: 'USD' | 'ARS') => {
    if (formData.currency !== newCurrency && formData.montoTotal > 0) {
      const convertedAmount = convertCurrency(formData.montoTotal, formData.currency, newCurrency)
      setFormData({
        ...formData,
        currency: newCurrency,
        montoTotal: Math.round(convertedAmount)
      })
    } else {
      setFormData({
        ...formData,
        currency: newCurrency
      })
    }
  }

  const getConvertedAmount = (amount: number, from: 'USD' | 'ARS', to: 'USD' | 'ARS'): number => {
    return convertCurrency(amount, from, to)
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
          className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                >
                  {tiposProyecto.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* NUEVA SECCIÓN: Moneda y Monto */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Moneda y Monto Total *
                </label>
                
                <div className="flex space-x-3">
                  {/* Selector de Moneda */}
                  <div className="w-32">
                    <select
                      value={formData.currency}
                      onChange={(e) => handleCurrencyChange(e.target.value as 'USD' | 'ARS')}
                      className="input-glass w-full"
                      disabled={loading}
                    >
                      <option value="USD">🇺🇸 USD</option>
                      <option value="ARS">🇦🇷 ARS</option>
                    </select>
                  </div>
                  
                  {/* Input de Monto */}
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                      {getCurrencySymbol(formData.currency)}
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={formData.montoTotal}
                      onChange={(e) => setFormData({...formData, montoTotal: parseFloat(e.target.value) || 0})}
                      className={`input-glass w-full pl-12 ${errors.montoTotal ? 'border-red-500' : ''}`}
                      placeholder="0"
                      disabled={loading}
                    />
                  </div>
                  
                  {/* Botón Convertidor */}
                  <button
                    type="button"
                    onClick={() => setShowCurrencyConverter(!showCurrencyConverter)}
                    className="btn-secondary px-3"
                    disabled={loading}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>
                
                {errors.montoTotal && (
                  <p className="text-red-400 text-xs mt-1">{errors.montoTotal}</p>
                )}
                
                {/* Convertidor de Moneda */}
                {showCurrencyConverter && formData.montoTotal > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                  >
                    <p className="text-blue-400 text-sm mb-2">Equivalencias:</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white/5 rounded p-2">
                        <span className="text-gray-400">En USD:</span>
                        <p className="text-white font-medium">
                          {formatCurrency(
                            formData.currency === 'USD' 
                              ? formData.montoTotal 
                              : getConvertedAmount(formData.montoTotal, formData.currency, 'USD'),
                            'USD'
                          )}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded p-2">
                        <span className="text-gray-400">En ARS:</span>
                        <p className="text-white font-medium">
                          {formatCurrency(
                            formData.currency === 'ARS' 
                              ? formData.montoTotal 
                              : getConvertedAmount(formData.montoTotal, formData.currency, 'ARS'),
                            'ARS'
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Tasa: 1 USD = {settings.exchangeRate} ARS
                    </p>
                  </motion.div>
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
                  disabled={loading}
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
                    disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
            </div>

            {/* Resumen Mejorado */}
            <div className="card bg-white/5 p-4 border border-white/10">
              <h3 className="text-white font-medium mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Resumen del Proyecto
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Monto total:</span>
                  <p className="text-green-400 font-medium flex items-center">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs mr-2">
                      {formData.currency}
                    </span>
                    {formatCurrency(formData.montoTotal, formData.currency)}
                  </p>
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
                        {formatCurrency(
                          formData.montoTotal / (
                            formData.formaPago === 'DOS_CUOTAS' ? 2 :
                            formData.formaPago === 'TRES_CUOTAS' ? 3 :
                            formData.cuotas || 1
                          ),
                          formData.currency
                        )}
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
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Proyecto'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Asignar displayName para evitar el warning de ESLint
FormularioProyecto.displayName = 'FormularioProyecto'

export { FormularioProyecto }