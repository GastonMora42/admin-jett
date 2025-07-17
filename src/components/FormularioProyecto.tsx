// src/components/FormularioProyecto.tsx - VERSIÓN MEJORADA Y RESPONSIVA
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  FolderOpen, 
  User, 
  DollarSign, 
  Calendar, 
  ArrowLeftRight,
  Check,
  AlertTriangle,
  Info,
  Sparkles,
  Zap,
  Target,
  Clock,
  CreditCard,
  Calculator,
  TrendingUp,
  Star,
  Briefcase
} from 'lucide-react'
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

interface FormErrors {
  [key: string]: string
}

interface FormTouched {
  [key: string]: boolean
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
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<FormTouched>({})
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  const tiposProyecto: { value: TipoProyecto; label: string; icon: any; description: string }[] = [
    { value: 'SOFTWARE_A_MEDIDA', label: 'Software a Medida', icon: Zap, description: 'Desarrollo personalizado' },
    { value: 'ECOMMERCE', label: 'E-commerce', icon: CreditCard, description: 'Tienda online completa' },
    { value: 'LANDING_PAGE', label: 'Landing Page', icon: Target, description: 'Página de aterrizaje' },
    { value: 'SISTEMA_WEB', label: 'Sistema Web', icon: Briefcase, description: 'Aplicación web compleja' },
    { value: 'APP_MOVIL', label: 'App Móvil', icon: Sparkles, description: 'Aplicación móvil nativa' },
    { value: 'MANTENIMIENTO', label: 'Mantenimiento', icon: Clock, description: 'Soporte y actualización' }
  ]

  const formasPago: { value: FormaPago; label: string; description: string }[] = [
    { value: 'PAGO_UNICO', label: 'Pago Único', description: 'Un solo pago al completar' },
    { value: 'DOS_CUOTAS', label: '2 Cuotas', description: '50% inicio, 50% final' },
    { value: 'TRES_CUOTAS', label: '3 Cuotas', description: 'Inicio, medio y final' },
    { value: 'MENSUAL', label: 'Mensual', description: 'Pagos mensuales' }
  ]

  useEffect(() => {
    if (isOpen) {
      if (proyecto) {
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
      setTouched({})
      setCurrentStep(1)
      setShowSuccess(false)
      
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 300)
    }
  }, [proyecto, clientes, isOpen, settings.defaultCurrency, getProjectCurrency])

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'nombre':
        if (!value?.trim()) return 'El nombre del proyecto es requerido'
        if (value.length < 3) return 'El nombre debe tener al menos 3 caracteres'
        if (value.length > 200) return 'El nombre es demasiado largo'
        return ''
      
      case 'clienteId':
        if (!value) return 'Debe seleccionar un cliente'
        return ''
      
      case 'montoTotal':
        if (!value || value <= 0) return 'El monto debe ser mayor a 0'
        if (value > 10000000) return 'El monto es demasiado alto'
        return ''
      
      case 'cuotas':
        if (formData.formaPago === 'MENSUAL' && (!value || value < 1)) {
          return 'Debe especificar el número de cuotas'
        }
        if (value > 60) return 'Máximo 60 cuotas'
        return ''
      
      default:
        return ''
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    const fieldsToValidate = ['nombre', 'clienteId', 'montoTotal', 'cuotas']
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field as keyof CreateProyectoDataWithCurrency])
      if (error) newErrors[field] = error
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof CreateProyectoDataWithCurrency, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  const handleBlur = (field: keyof CreateProyectoDataWithCurrency) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const value = formData[field]
    const error = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: error }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      const allTouched: FormTouched = {}
      Object.keys(formData).forEach(key => {
        allTouched[key] = true
      })
      setTouched(allTouched)
      return
    }

    try {
      setLoading(true)
      
      let cuotasFinales = formData.cuotas
      if (formData.formaPago === 'DOS_CUOTAS') cuotasFinales = 2
      else if (formData.formaPago === 'TRES_CUOTAS') cuotasFinales = 3
      else if (formData.formaPago === 'PAGO_UNICO') cuotasFinales = 1

      const submitData: CreateProyectoDataWithCurrency = {
        ...formData,
        cuotas: cuotasFinales
      }

      await onSubmit(submitData)
      setShowSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error al guardar proyecto:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep === 1) {
      const step1Fields = ['nombre', 'clienteId']
      let hasErrors = false
      
      step1Fields.forEach(field => {
        const error = validateField(field, formData[field as keyof CreateProyectoDataWithCurrency])
        if (error) {
          setErrors(prev => ({ ...prev, [field]: error }))
          setTouched(prev => ({ ...prev, [field]: true }))
          hasErrors = true
        }
      })
      
      if (!hasErrors) {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      const step2Fields = ['montoTotal']
      let hasErrors = false
      
      step2Fields.forEach(field => {
        const error = validateField(field, formData[field as keyof CreateProyectoDataWithCurrency])
        if (error) {
          setErrors(prev => ({ ...prev, [field]: error }))
          setTouched(prev => ({ ...prev, [field]: true }))
          hasErrors = true
        }
      })
      
      if (!hasErrors) {
        setCurrentStep(3)
      }
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }

  const progress = (currentStep / 3) * 100
  const isFormComplete = formData.nombre && formData.clienteId && formData.montoTotal > 0 && !Object.values(errors).some(error => error)

  const clienteSeleccionado = clientes.find(c => c.id === formData.clienteId)
  const montoPorCuota = formData.montoTotal / (
    formData.formaPago === 'DOS_CUOTAS' ? 2 :
    formData.formaPago === 'TRES_CUOTAS' ? 3 :
    formData.cuotas || 1
  )

  if (!isOpen) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Success Animation */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute inset-0 bg-green-500/20 backdrop-blur-xl z-10 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-green-500/90 rounded-full p-6"
                >
                  <Check className="w-12 h-12 text-white" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="relative p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <FolderOpen className="w-6 h-6 mr-3 text-purple-400" />
                  {title}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {proyecto ? 'Actualiza los detalles del proyecto' : 'Crea un nuevo proyecto para tu cliente'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 group"
                disabled={loading}
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Paso {currentStep} de 3</span>
                <span>{Math.round(progress)}% completado</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center mt-4 space-x-4">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex items-center ${step < 3 ? 'flex-1' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    step <= currentStep 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white' 
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`flex-1 h-1 mx-2 rounded transition-all duration-200 ${
                      step < currentStep ? 'bg-gradient-to-r from-purple-500 to-blue-600' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
            <form ref={formRef} onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {/* Step 1: Información Básica */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-white">Información del Proyecto</h3>
                      <p className="text-gray-400 text-sm">Detalles básicos y cliente</p>
                    </div>

                    {/* Nombre del Proyecto */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        <FolderOpen className="w-4 h-4 inline mr-2" />
                        Nombre del Proyecto *
                      </label>
                      <div className="relative">
                        <input
                          ref={firstInputRef}
                          type="text"
                          value={formData.nombre}
                          onChange={(e) => handleInputChange('nombre', e.target.value)}
                          onBlur={() => handleBlur('nombre')}
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                            errors.nombre && touched.nombre
                              ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                              : formData.nombre && !errors.nombre
                              ? 'border-green-500/50 focus:ring-green-500/20 bg-green-500/5'
                              : 'border-white/20 focus:ring-purple-500/20 focus:border-purple-500/50'
                          }`}
                          placeholder="Ej: Sistema de gestión de inventario"
                          disabled={loading}
                        />
                        {formData.nombre && !errors.nombre && (
                          <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                        )}
                      </div>
                      <AnimatePresence>
                        {errors.nombre && touched.nombre && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-400 text-sm flex items-center"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {errors.nombre}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Cliente */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        <User className="w-4 h-4 inline mr-2" />
                        Cliente *
                      </label>
                      <select
                        value={formData.clienteId}
                        onChange={(e) => handleInputChange('clienteId', e.target.value)}
                        onBlur={() => handleBlur('clienteId')}
                        className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white transition-all duration-200 focus:outline-none focus:ring-2 ${
                          errors.clienteId && touched.clienteId
                            ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                            : formData.clienteId && !errors.clienteId
                            ? 'border-green-500/50 focus:ring-green-500/20 bg-green-500/5'
                            : 'border-white/20 focus:ring-purple-500/20 focus:border-purple-500/50'
                        }`}
                        disabled={loading}
                      >
                        <option value="">Seleccionar cliente</option>
                        {clientes.map((cliente) => (
                          <option key={cliente.id} value={cliente.id} className="bg-slate-800">
                            {cliente.nombre} {cliente.empresa && `(${cliente.empresa})`}
                          </option>
                        ))}
                      </select>
                      <AnimatePresence>
                        {errors.clienteId && touched.clienteId && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-400 text-sm flex items-center"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {errors.clienteId}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Tipo de Proyecto */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-300">
                        Tipo de Proyecto
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tiposProyecto.map((tipo) => (
                          <motion.label
                            key={tipo.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 ${
                              formData.tipo === tipo.value
                                ? 'border-purple-500/50 bg-purple-500/10'
                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <input
                              type="radio"
                              name="tipo"
                              value={tipo.value}
                              checked={formData.tipo === tipo.value}
                              onChange={(e) => handleInputChange('tipo', e.target.value)}
                              className="sr-only"
                            />
                            <div className="flex items-center space-x-3">
                              <tipo.icon className={`w-6 h-6 ${
                                formData.tipo === tipo.value ? 'text-purple-400' : 'text-gray-400'
                              }`} />
                              <div>
                                <p className={`font-medium ${
                                  formData.tipo === tipo.value ? 'text-purple-400' : 'text-white'
                                }`}>
                                  {tipo.label}
                                </p>
                                <p className="text-gray-400 text-sm">{tipo.description}</p>
                              </div>
                            </div>
                          </motion.label>
                        ))}
                      </div>
                    </div>

                    {/* Cliente Preview */}
                    {clienteSeleccionado && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {clienteSeleccionado.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-blue-400 font-medium">{clienteSeleccionado.nombre}</p>
                            <p className="text-gray-400 text-sm">{clienteSeleccionado.email}</p>
                            {clienteSeleccionado.empresa && (
                              <p className="text-gray-400 text-sm">{clienteSeleccionado.empresa}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Step 2: Configuración Financiera */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <DollarSign className="w-16 h-16 text-green-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-white">Configuración Financiera</h3>
                      <p className="text-gray-400 text-sm">Moneda, monto y forma de pago</p>
                    </div>

                    {/* Moneda y Monto */}
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-300">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Moneda y Monto Total *
                      </label>
                      
                      <div className="flex space-x-3">
                        {/* Selector de Moneda */}
                        <div className="w-32">
                          <select
                            value={formData.currency}
                            onChange={(e) => handleCurrencyChange(e.target.value as 'USD' | 'ARS')}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 transition-all duration-200"
                            disabled={loading}
                          >
                            <option value="USD" className="bg-slate-800">🇺🇸 USD</option>
                            <option value="ARS" className="bg-slate-800">🇦🇷 ARS</option>
                          </select>
                        </div>
                        
                        {/* Input de Monto */}
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                            {getCurrencySymbol(formData.currency)}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.montoTotal || ''}
                            onChange={(e) => handleInputChange('montoTotal', parseFloat(e.target.value) || 0)}
                            onBlur={() => handleBlur('montoTotal')}
                            className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                              errors.montoTotal && touched.montoTotal
                                ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                                : formData.montoTotal && !errors.montoTotal
                                ? 'border-green-500/50 focus:ring-green-500/20 bg-green-500/5'
                                : 'border-white/20 focus:ring-green-500/20 focus:border-green-500/50'
                            }`}
                            placeholder="0"
                            disabled={loading}
                          />
                          {formData.montoTotal > 0 && !errors.montoTotal && (
                            <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                          )}
                        </div>
                        
                        {/* Botón Convertidor */}
                        <button
                          type="button"
                          onClick={() => setShowCurrencyConverter(!showCurrencyConverter)}
                          className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl transition-all duration-200"
                          disabled={loading}
                        >
                          <ArrowLeftRight className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                      
                      <AnimatePresence>
                        {errors.montoTotal && touched.montoTotal && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-400 text-sm flex items-center"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {errors.montoTotal}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      
                      {/* Convertidor de Moneda */}
                      <AnimatePresence>
                        {showCurrencyConverter && formData.montoTotal > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4"
                          >
                            <p className="text-blue-400 text-sm mb-3 flex items-center">
                              <Calculator className="w-4 h-4 mr-2" />
                              Equivalencias:
                            </p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="bg-white/5 rounded-lg p-3">
                                <span className="text-gray-400">En USD:</span>
                                <p className="text-white font-medium text-lg">
                                  {formatCurrency(
                                    formData.currency === 'USD' 
                                      ? formData.montoTotal 
                                      : convertCurrency(formData.montoTotal, formData.currency, 'USD'),
                                    'USD'
                                  )}
                                </p>
                              </div>
                              <div className="bg-white/5 rounded-lg p-3">
                                <span className="text-gray-400">En ARS:</span>
                                <p className="text-white font-medium text-lg">
                                  {formatCurrency(
                                    formData.currency === 'ARS' 
                                      ? formData.montoTotal 
                                      : convertCurrency(formData.montoTotal, formData.currency, 'ARS'),
                                    'ARS'
                                  )}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-3 text-center">
                              Tasa: 1 USD = {settings.exchangeRate} ARS
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Forma de Pago */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-300">
                        <CreditCard className="w-4 h-4 inline mr-2" />
                        Forma de Pago
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {formasPago.map((forma) => (
                          <motion.label
                            key={forma.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 ${
                              formData.formaPago === forma.value
                                ? 'border-green-500/50 bg-green-500/10'
                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <input
                              type="radio"
                              name="formaPago"
                              value={forma.value}
                              checked={formData.formaPago === forma.value}
                              onChange={(e) => handleInputChange('formaPago', e.target.value)}
                              className="sr-only"
                            />
                            <div>
                              <p className={`font-medium ${
                                formData.formaPago === forma.value ? 'text-green-400' : 'text-white'
                              }`}>
                                {forma.label}
                              </p>
                              <p className="text-gray-400 text-sm">{forma.description}</p>
                            </div>
                          </motion.label>
                        ))}
                      </div>
                    </div>

                    {/* Número de Cuotas (solo si es mensual) */}
                    <AnimatePresence>
                      {formData.formaPago === 'MENSUAL' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <label className="block text-sm font-medium text-gray-300">
                            Número de Cuotas
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={formData.cuotas}
                            onChange={(e) => handleInputChange('cuotas', parseInt(e.target.value) || 1)}
                            onBlur={() => handleBlur('cuotas')}
                            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                              errors.cuotas && touched.cuotas
                                ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                                : 'border-white/20 focus:ring-green-500/20 focus:border-green-500/50'
                            }`}
                            placeholder="12"
                            disabled={loading}
                          />
                          <AnimatePresence>
                            {errors.cuotas && touched.cuotas && (
                              <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-red-400 text-sm flex items-center"
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                {errors.cuotas}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Calculadora de Cuotas */}
                    {formData.montoTotal > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-green-400 font-medium flex items-center">
                            <Calculator className="w-4 h-4 mr-2" />
                            Resumen de Pagos
                          </h4>
                          <button
                            type="button"
                            onClick={() => setShowCalculator(!showCalculator)}
                            className="text-green-400 hover:text-green-300 text-sm transition-colors"
                          >
                            {showCalculator ? 'Ocultar' : 'Ver detalles'}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Monto total:</span>
                            <p className="text-white font-medium">
                              {formatCurrency(formData.montoTotal, formData.currency)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Número de pagos:</span>
                            <p className="text-white font-medium">
                              {formData.formaPago === 'DOS_CUOTAS' ? '2' :
                               formData.formaPago === 'TRES_CUOTAS' ? '3' :
                               formData.formaPago === 'PAGO_UNICO' ? '1' :
                               formData.cuotas}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-400">Monto por pago:</span>
                            <p className="text-green-400 font-medium text-lg">
                              {formatCurrency(montoPorCuota, formData.currency)}
                            </p>
                          </div>
                        </div>

                        <AnimatePresence>
                          {showCalculator && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-white/10"
                            >
                              <div className="space-y-2">
                                {Array.from({ length: formData.formaPago === 'DOS_CUOTAS' ? 2 :
                                  formData.formaPago === 'TRES_CUOTAS' ? 3 :
                                  formData.formaPago === 'PAGO_UNICO' ? 1 :
                                  formData.cuotas || 1 }).map((_, index) => (
                                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg">
                                    <span className="text-gray-400 text-sm">Pago {index + 1}:</span>
                                    <span className="text-white font-medium">
                                      {formatCurrency(montoPorCuota, formData.currency)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Fechas y Finalización */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <Calendar className="w-16 h-16 text-blue-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-white">Fechas del Proyecto</h3>
                      <p className="text-gray-400 text-sm">Define el cronograma del proyecto</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Fecha de Inicio */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          Fecha de Inicio *
                        </label>
                        <input
                          type="date"
                          value={formData.fechaInicio}
                          onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                          disabled={loading}
                        />
                      </div>

                      {/* Fecha de Entrega */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          <Clock className="w-4 h-4 inline mr-2" />
                          Fecha de Entrega Estimada
                        </label>
                        <input
                          type="date"
                          value={formData.fechaEntrega}
                          onChange={(e) => handleInputChange('fechaEntrega', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Resumen Final */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6"
                    >
                      <h4 className="text-purple-400 font-medium mb-4 flex items-center">
                        <Star className="w-5 h-5 mr-2" />
                        Resumen del Proyecto
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-400">Proyecto:</span>
                            <p className="text-white font-medium">{formData.nombre || 'Sin nombre'}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Cliente:</span>
                            <p className="text-white font-medium">{clienteSeleccionado?.nombre || 'Sin cliente'}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Tipo:</span>
                            <p className="text-white font-medium">
                              {tiposProyecto.find(t => t.value === formData.tipo)?.label}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-400">Monto total:</span>
                            <p className="text-green-400 font-bold text-lg">
                              {formatCurrency(formData.montoTotal, formData.currency)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Forma de pago:</span>
                            <p className="text-white font-medium">
                              {formasPago.find(f => f.value === formData.formaPago)?.label}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Inicio:</span>
                            <p className="text-white font-medium">
                              {new Date(formData.fechaInicio).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-white/5">
            <div className="flex flex-col sm:flex-row gap-3">
              {currentStep === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-gray-300 hover:text-white transition-all duration-200 font-medium"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <motion.button
                    type="button"
                    onClick={nextStep}
                    disabled={!formData.nombre || !formData.clienteId || !!errors.nombre || !!errors.clienteId}
                    whileHover={{ scale: !formData.nombre || !formData.clienteId || !!errors.nombre || !!errors.clienteId ? 1 : 1.02 }}
                    whileTap={{ scale: !formData.nombre || !formData.clienteId || !!errors.nombre || !!errors.clienteId ? 1 : 0.98 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-xl transition-all duration-200 font-medium"
                  >
                    Continuar
                  </motion.button>
                </>
              ) : currentStep === 2 ? (
                <>
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 sm:flex-none px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-gray-300 hover:text-white transition-all duration-200 font-medium"
                    disabled={loading}
                  >
                    Volver
                  </button>
                  <motion.button
                    type="button"
                    onClick={nextStep}
                    disabled={!formData.montoTotal || formData.montoTotal <= 0 || !!errors.montoTotal}
                    whileHover={{ scale: !formData.montoTotal || formData.montoTotal <= 0 || !!errors.montoTotal ? 1 : 1.02 }}
                    whileTap={{ scale: !formData.montoTotal || formData.montoTotal <= 0 || !!errors.montoTotal ? 1 : 0.98 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-xl transition-all duration-200 font-medium"
                  >
                    Continuar
                  </motion.button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 sm:flex-none px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-gray-300 hover:text-white transition-all duration-200 font-medium"
                    disabled={loading}
                  >
                    Volver
                  </button>
                  <motion.button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={loading || !isFormComplete}
                    whileHover={{ scale: loading || !isFormComplete ? 1 : 1.02 }}
                    whileTap={{ scale: loading || !isFormComplete ? 1 : 0.98 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-xl transition-all duration-200 font-medium flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Star className="w-5 h-5 mr-2" />
                        {proyecto ? 'Actualizar Proyecto' : 'Crear Proyecto'}
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Asignar displayName para evitar el warning de ESLint
FormularioProyecto.displayName = 'FormularioProyecto'

export { FormularioProyecto }