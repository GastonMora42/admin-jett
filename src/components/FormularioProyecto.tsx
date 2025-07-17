// src/components/FormularioProyecto.tsx - COMPONENTE COMPLETO
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Save,
  Check,
  AlertTriangle,
  Info,
  FolderOpen,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  Target,
  FileText
} from 'lucide-react'
import type { Proyecto, Cliente, TipoProyecto, FormaPago, EstadoProyecto } from '@/types/index'

interface FormularioProyectoProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  proyecto?: Proyecto | null
  clientes: Cliente[]
  title?: string
}

interface FormData {
  nombre: string
  tipo: TipoProyecto
  montoTotal: number | string
  formaPago: FormaPago
  cuotas: number | string
  fechaInicio: string
  fechaEntrega: string
  clienteId: string
  estadoProyecto?: EstadoProyecto
  descripcion?: string
}

interface FormErrors {
  [key: string]: string
}

interface FormTouched {
  [key: string]: boolean
}

export const FormularioProyecto: React.FC<FormularioProyectoProps> = ({
  isOpen,
  onClose,
  onSubmit,
  proyecto = null,
  clientes = [],
  title = 'Nuevo Proyecto'
}) => {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    tipo: 'SOFTWARE_A_MEDIDA',
    montoTotal: '',
    formaPago: 'PAGO_UNICO',
    cuotas: 1,
    fechaInicio: '',
    fechaEntrega: '',
    clienteId: '',
    estadoProyecto: 'EN_DESARROLLO',
    descripcion: ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<FormTouched>({})
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const formRef = useRef<HTMLFormElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      if (proyecto) {
        setFormData({
          nombre: proyecto.nombre || '',
          tipo: proyecto.tipo || 'SOFTWARE_A_MEDIDA',
          montoTotal: proyecto.montoTotal || '',
          formaPago: proyecto.formaPago || 'PAGO_UNICO',
          cuotas: proyecto.cuotas || 1,
          fechaInicio: proyecto.fechaInicio ? proyecto.fechaInicio.split('T')[0] : '',
          fechaEntrega: proyecto.fechaEntrega ? proyecto.fechaEntrega.split('T')[0] : '',
          clienteId: proyecto.clienteId || '',
          estadoProyecto: proyecto.estadoProyecto || 'EN_DESARROLLO',
          descripcion: ''
        })
      } else {
        setFormData({
          nombre: '',
          tipo: 'SOFTWARE_A_MEDIDA',
          montoTotal: '',
          formaPago: 'PAGO_UNICO',
          cuotas: 1,
          fechaInicio: new Date().toISOString().split('T')[0],
          fechaEntrega: '',
          clienteId: '',
          estadoProyecto: 'EN_DESARROLLO',
          descripcion: ''
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
  }, [proyecto, isOpen])

  // Validación en tiempo real
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'nombre':
        if (!value || !value.toString().trim()) return 'El nombre del proyecto es requerido'
        if (value.toString().length < 3) return 'El nombre debe tener al menos 3 caracteres'
        if (value.toString().length > 200) return 'El nombre es demasiado largo'
        return ''
      
      case 'clienteId':
        if (!value) return 'Debes seleccionar un cliente'
        return ''
      
      case 'montoTotal':
        const monto = typeof value === 'string' ? parseFloat(value) : value
        if (!value || isNaN(monto)) return 'El monto total es requerido'
        if (monto <= 0) return 'El monto debe ser mayor a 0'
        if (monto > 10000000) return 'El monto es demasiado alto'
        return ''
      
      case 'fechaInicio':
        if (!value) return 'La fecha de inicio es requerida'
        return ''
      
      case 'cuotas':
        if (formData.formaPago !== 'PAGO_UNICO') {
          const cuotasNum = typeof value === 'string' ? parseInt(value) : value
          if (!value || isNaN(cuotasNum)) return 'El número de cuotas es requerido'
          if (cuotasNum < 1) return 'Debe haber al menos 1 cuota'
          if (cuotasNum > 60) return 'Máximo 60 cuotas'
        }
        return ''
      
      default:
        return ''
    }
  }

  // Validar todo el formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    Object.keys(formData).forEach(key => {
      if (key !== 'fechaEntrega' && key !== 'descripcion' && key !== 'estadoProyecto') {
        const error = validateField(key, formData[key as keyof FormData])
        if (error) newErrors[key] = error
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejar cambios en los inputs
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-ajustar cuotas según forma de pago
      if (field === 'formaPago') {
        switch (value) {
          case 'PAGO_UNICO':
            newData.cuotas = 1
            break
          case 'DOS_CUOTAS':
            newData.cuotas = 2
            break
          case 'TRES_CUOTAS':
            newData.cuotas = 3
            break
          case 'MENSUAL':
            newData.cuotas = newData.cuotas || 6
            break
        }
      }
      
      return newData
    })
    
    // Validar en tiempo real solo si el campo ya fue tocado
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  // Manejar cuando un campo pierde el foco
  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const value = formData[field]
    const error = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  // Manejar envío del formulario
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
      
      const submitData = {
        ...formData,
        montoTotal: typeof formData.montoTotal === 'string' 
          ? parseFloat(formData.montoTotal) 
          : formData.montoTotal,
        cuotas: typeof formData.cuotas === 'string' 
          ? parseInt(formData.cuotas) 
          : formData.cuotas
      }
      
      await onSubmit(submitData)
      
      setShowSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error al guardar proyecto:', error)
    } finally {
      setLoading(false)
    }
  }

  // Avanzar al siguiente paso
  const nextStep = () => {
    if (currentStep === 1) {
      const step1Fields = ['nombre', 'clienteId', 'tipo']
      let hasErrors = false
      
      step1Fields.forEach(field => {
        const error = validateField(field, formData[field as keyof FormData])
        if (error) {
          setErrors(prev => ({ ...prev, [field]: error }))
          setTouched(prev => ({ ...prev, [field]: true }))
          hasErrors = true
        }
      })
      
      if (!hasErrors) {
        setCurrentStep(2)
      }
    }
  }

  const progress = (currentStep / 2) * 100
  const isFormComplete = formData.nombre && formData.clienteId && formData.montoTotal && 
                        formData.fechaInicio && !Object.values(errors).some(error => error)

  if (!isOpen) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
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
                  <FolderOpen className="w-6 h-6 mr-3 text-blue-400" />
                  {title}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {proyecto ? 'Actualiza la información del proyecto' : 'Crea un nuevo proyecto para tu cliente'}
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
                <span>Paso {currentStep} de 2</span>
                <span>{Math.round(progress)}% completado</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
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
                      <Target className="w-16 h-16 text-blue-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-white">Información Básica</h3>
                      <p className="text-gray-400 text-sm">Define los aspectos principales del proyecto</p>
                    </div>

                    {/* Nombre del proyecto */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        <FileText className="w-4 h-4 inline mr-2" />
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
                              : 'border-white/20 focus:ring-blue-500/20 focus:border-blue-500/50'
                          }`}
                          placeholder="Ej: Sistema de gestión para restaurant"
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
                        className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                          errors.clienteId && touched.clienteId
                            ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                            : formData.clienteId && !errors.clienteId
                            ? 'border-green-500/50 focus:ring-green-500/20 bg-green-500/5'
                            : 'border-white/20 focus:ring-blue-500/20 focus:border-blue-500/50'
                        }`}
                        disabled={loading}
                      >
                        <option value="">Selecciona un cliente</option>
                        {clientes.map((cliente) => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nombre} {cliente.empresa ? `- ${cliente.empresa}` : ''}
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

                    {/* Tipo de proyecto */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        <Target className="w-4 h-4 inline mr-2" />
                        Tipo de Proyecto *
                      </label>
                      <select
                        value={formData.tipo}
                        onChange={(e) => handleInputChange('tipo', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                        disabled={loading}
                      >
                        <option value="SOFTWARE_A_MEDIDA">Software a Medida</option>
                        <option value="ECOMMERCE">E-commerce</option>
                        <option value="LANDING_PAGE">Landing Page</option>
                        <option value="SISTEMA_WEB">Sistema Web</option>
                        <option value="APP_MOVIL">App Móvil</option>
                        <option value="MANTENIMIENTO">Mantenimiento</option>
                      </select>
                    </div>

                    {/* Tips paso 1 */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="text-blue-400 font-medium text-sm">Tip</h4>
                          <p className="text-gray-300 text-sm">
                            Un nombre descriptivo ayuda a identificar rápidamente el proyecto en el futuro.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

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
                      <h3 className="text-lg font-semibold text-white">Detalles Financieros</h3>
                      <p className="text-gray-400 text-sm">Configura el monto y forma de pago</p>
                    </div>

                    {/* Monto total */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Monto Total *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.montoTotal}
                          onChange={(e) => handleInputChange('montoTotal', e.target.value)}
                          onBlur={() => handleBlur('montoTotal')}
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                            errors.montoTotal && touched.montoTotal
                              ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                              : formData.montoTotal && !errors.montoTotal
                              ? 'border-green-500/50 focus:ring-green-500/20 bg-green-500/5'
                              : 'border-white/20 focus:ring-blue-500/20 focus:border-blue-500/50'
                          }`}
                          placeholder="0.00"
                          disabled={loading}
                        />
                        {formData.montoTotal && !errors.montoTotal && (
                          <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                        )}
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
                    </div>

                    {/* Forma de pago */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        <CreditCard className="w-4 h-4 inline mr-2" />
                        Forma de Pago *
                      </label>
                      <select
                        value={formData.formaPago}
                        onChange={(e) => handleInputChange('formaPago', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                        disabled={loading}
                      >
                        <option value="PAGO_UNICO">Pago Único</option>
                        <option value="DOS_CUOTAS">2 Cuotas</option>
                        <option value="TRES_CUOTAS">3 Cuotas</option>
                        <option value="MENSUAL">Mensual</option>
                      </select>
                    </div>

                    {/* Número de cuotas (si aplica) */}
                    {formData.formaPago === 'MENSUAL' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          <CreditCard className="w-4 h-4 inline mr-2" />
                          Número de Cuotas *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={formData.cuotas}
                          onChange={(e) => handleInputChange('cuotas', parseInt(e.target.value))}
                          onBlur={() => handleBlur('cuotas')}
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                            errors.cuotas && touched.cuotas
                              ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                              : 'border-white/20 focus:ring-blue-500/20 focus:border-blue-500/50'
                          }`}
                          placeholder="6"
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
                      </div>
                    )}

                    {/* Fechas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          Fecha de Inicio *
                        </label>
                        <input
                          type="date"
                          value={formData.fechaInicio}
                          onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                          onBlur={() => handleBlur('fechaInicio')}
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white transition-all duration-200 focus:outline-none focus:ring-2 ${
                            errors.fechaInicio && touched.fechaInicio
                              ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                              : 'border-white/20 focus:ring-blue-500/20 focus:border-blue-500/50'
                          }`}
                          disabled={loading}
                        />
                        <AnimatePresence>
                          {errors.fechaInicio && touched.fechaInicio && (
                            <motion.p
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="text-red-400 text-sm flex items-center"
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              {errors.fechaInicio}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          Fecha de Entrega (opcional)
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

                    {/* Resumen del proyecto */}
                    {formData.montoTotal && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-4 border border-white/10"
                      >
                        <h4 className="text-white font-medium text-sm mb-3">Resumen del Proyecto</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Monto Total</p>
                            <p className="text-green-400 font-bold text-lg">
                              ${typeof formData.montoTotal === 'string' 
                                ? parseFloat(formData.montoTotal).toLocaleString() 
                                : formData.montoTotal.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Forma de Pago</p>
                            <p className="text-white font-medium">
                              {formData.formaPago === 'PAGO_UNICO' && 'Pago Único'}
                              {formData.formaPago === 'DOS_CUOTAS' && '2 Cuotas'}
                              {formData.formaPago === 'TRES_CUOTAS' && '3 Cuotas'}
                              {formData.formaPago === 'MENSUAL' && `${formData.cuotas} Cuotas Mensuales`}
                            </p>
                          </div>
                          {formData.formaPago !== 'PAGO_UNICO' && (
                            <div className="col-span-2">
                              <p className="text-gray-400">Monto por Cuota</p>
                              <p className="text-blue-400 font-medium">
                                ${Math.round(
                                  (typeof formData.montoTotal === 'string' 
                                    ? parseFloat(formData.montoTotal) 
                                    : formData.montoTotal) / 
                                  (typeof formData.cuotas === 'string' 
                                    ? parseInt(formData.cuotas) 
                                    : formData.cuotas)
                                ).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-white/5">
            <div className="flex gap-3">
              {currentStep === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-gray-300 hover:text-white transition-all duration-200 font-medium"
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-xl transition-all duration-200 font-medium"
                  >
                    Continuar
                  </motion.button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-xl transition-all duration-200 font-medium flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
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

FormularioProyecto.displayName = 'FormularioProyecto'