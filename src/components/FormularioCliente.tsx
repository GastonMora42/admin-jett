// src/components/FormularioCliente.tsx - VERSIÓN MEJORADA Y RESPONSIVA
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Globe, 
  MapPin, 
  Save,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Info,
  Sparkles,
  Users,
  Star
} from 'lucide-react'

interface Cliente {
  id?: string
  nombre: string
  email: string
  telefono?: string
  empresa?: string
  estado?: 'ACTIVO' | 'INACTIVO'
}

interface FormularioClienteProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Cliente>) => Promise<void>
  cliente?: Cliente | null
  title?: string
}

interface FormErrors {
  [key: string]: string
}

interface FormTouched {
  [key: string]: boolean
}

export const FormularioCliente: React.FC<FormularioClienteProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cliente = null,
  title = 'Nuevo Cliente'
}) => {
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    estado: 'ACTIVO'
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<FormTouched>({})
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showPreview, setShowPreview] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const formRef = useRef<HTMLFormElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Efecto para resetear el formulario cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      if (cliente) {
        setFormData({
          nombre: cliente.nombre || '',
          email: cliente.email || '',
          telefono: cliente.telefono || '',
          empresa: cliente.empresa || '',
          estado: cliente.estado || 'ACTIVO'
        })
      } else {
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          empresa: '',
          estado: 'ACTIVO'
        })
      }
      setErrors({})
      setTouched({})
      setCurrentStep(1)
      setShowPreview(false)
      setShowSuccess(false)
      
      // Focus en el primer input después de un pequeño delay
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 300)
    }
  }, [cliente, isOpen])

  // Validación en tiempo real
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'nombre':
        if (!value.trim()) return 'El nombre es requerido'
        if (value.length < 2) return 'El nombre debe tener al menos 2 caracteres'
        if (value.length > 100) return 'El nombre es demasiado largo'
        return ''
      
      case 'email':
        if (!value.trim()) return 'El email es requerido'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'El email no tiene un formato válido'
        return ''
      
      case 'telefono':
        if (value && value.trim()) {
          const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/
          if (!phoneRegex.test(value)) return 'El teléfono no tiene un formato válido'
        }
        return ''
      
      case 'empresa':
        if (value && value.length > 200) return 'El nombre de la empresa es demasiado largo'
        return ''
      
      default:
        return ''
    }
  }

  // Validar todo el formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof Cliente] as string || '')
      if (error) newErrors[key] = error
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejar cambios en los inputs
  const handleInputChange = (field: keyof Cliente, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Validar en tiempo real solo si el campo ya fue tocado
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  // Manejar cuando un campo pierde el foco
  const handleBlur = (field: keyof Cliente) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const value = formData[field] as string || ''
    const error = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Marcar todos los campos como tocados para mostrar errores
      const allTouched: FormTouched = {}
      Object.keys(formData).forEach(key => {
        allTouched[key] = true
      })
      setTouched(allTouched)
      return
    }

    try {
      setLoading(true)
      await onSubmit(formData)
      
      setShowSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error al guardar cliente:', error)
    } finally {
      setLoading(false)
    }
  }

  // Avanzar al siguiente paso
  const nextStep = () => {
    if (currentStep === 1) {
      // Validar campos del paso 1
      const step1Fields = ['nombre', 'email']
      let hasErrors = false
      
      step1Fields.forEach(field => {
        const error = validateField(field, formData[field as keyof Cliente] as string || '')
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

  // Calcular progreso
  const progress = (currentStep / 2) * 100

  // Determinar si el formulario está completo
  const isFormComplete = formData.nombre && formData.email && !Object.values(errors).some(error => error)

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
                  <Sparkles className="w-6 h-6 mr-3 text-blue-400" />
                  {title}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {cliente ? 'Actualiza la información del cliente' : 'Agrega un nuevo cliente a tu base de datos'}
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
                      <User className="w-16 h-16 text-blue-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-white">Información Personal</h3>
                      <p className="text-gray-400 text-sm">Datos básicos del cliente</p>
                    </div>

                    {/* Nombre */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        <User className="w-4 h-4 inline mr-2" />
                        Nombre Completo *
                      </label>
                      <div className="relative">
                        <input
                          ref={firstInputRef}
                          type="text"
                          value={formData.nombre || ''}
                          onChange={(e) => handleInputChange('nombre', e.target.value)}
                          onBlur={() => handleBlur('nombre')}
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                            errors.nombre && touched.nombre
                              ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                              : formData.nombre && !errors.nombre
                              ? 'border-green-500/50 focus:ring-green-500/20 bg-green-500/5'
                              : 'border-white/20 focus:ring-blue-500/20 focus:border-blue-500/50'
                          }`}
                          placeholder="Ej: Juan Pérez"
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

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email *
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          onBlur={() => handleBlur('email')}
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                            errors.email && touched.email
                              ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                              : formData.email && !errors.email
                              ? 'border-green-500/50 focus:ring-green-500/20 bg-green-500/5'
                              : 'border-white/20 focus:ring-blue-500/20 focus:border-blue-500/50'
                          }`}
                          placeholder="juan@ejemplo.com"
                          disabled={loading}
                        />
                        {formData.email && !errors.email && (
                          <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                        )}
                      </div>
                      <AnimatePresence>
                        {errors.email && touched.email && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-400 text-sm flex items-center"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {errors.email}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Tips */}
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
                            Asegúrate de que el email sea correcto, lo usaremos para comunicaciones importantes.
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
                      <Building className="w-16 h-16 text-purple-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-white">Información Adicional</h3>
                      <p className="text-gray-400 text-sm">Datos opcionales del cliente</p>
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Teléfono
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={formData.telefono || ''}
                          onChange={(e) => handleInputChange('telefono', e.target.value)}
                          onBlur={() => handleBlur('telefono')}
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                            errors.telefono && touched.telefono
                              ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                              : formData.telefono && !errors.telefono
                              ? 'border-green-500/50 focus:ring-green-500/20 bg-green-500/5'
                              : 'border-white/20 focus:ring-blue-500/20 focus:border-blue-500/50'
                          }`}
                          placeholder="+54 9 11 1234-5678"
                          disabled={loading}
                        />
                        {formData.telefono && !errors.telefono && (
                          <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                        )}
                      </div>
                      <AnimatePresence>
                        {errors.telefono && touched.telefono && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-400 text-sm flex items-center"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {errors.telefono}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Empresa */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        <Building className="w-4 h-4 inline mr-2" />
                        Empresa / Organización
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.empresa || ''}
                          onChange={(e) => handleInputChange('empresa', e.target.value)}
                          onBlur={() => handleBlur('empresa')}
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                            errors.empresa && touched.empresa
                              ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                              : formData.empresa && !errors.empresa
                              ? 'border-green-500/50 focus:ring-green-500/20 bg-green-500/5'
                              : 'border-white/20 focus:ring-blue-500/20 focus:border-blue-500/50'
                          }`}
                          placeholder="Nombre de la empresa"
                          disabled={loading}
                        />
                        {formData.empresa && !errors.empresa && (
                          <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                        )}
                      </div>
                      <AnimatePresence>
                        {errors.empresa && touched.empresa && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-400 text-sm flex items-center"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {errors.empresa}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Estado */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        <Globe className="w-4 h-4 inline mr-2" />
                        Estado
                      </label>
                      <select
                        value={formData.estado || 'ACTIVO'}
                        onChange={(e) => handleInputChange('estado', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                        disabled={loading}
                      >
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                      </select>
                    </div>

                    {/* Vista previa */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-6 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-medium flex items-center">
                          <Eye className="w-4 h-4 mr-2" />
                          Vista Previa
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowPreview(!showPreview)}
                          className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                        >
                          {showPreview ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>
                      
                      <AnimatePresence>
                        {showPreview && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                  {formData.nombre?.charAt(0)?.toUpperCase() || 'C'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-medium">
                                  {formData.nombre || 'Nombre del cliente'}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {formData.email || 'email@ejemplo.com'}
                                </p>
                                {formData.empresa && (
                                  <p className="text-gray-400 text-sm flex items-center">
                                    <Building className="w-3 h-3 mr-1" />
                                    {formData.empresa}
                                  </p>
                                )}
                                {formData.telefono && (
                                  <p className="text-gray-400 text-sm flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {formData.telefono}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  formData.estado === 'ACTIVO' 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                }`}>
                                  {formData.estado}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
                    disabled={!formData.nombre || !formData.email || !!errors.nombre || !!errors.email}
                    whileHover={{ scale: !formData.nombre || !formData.email || !!errors.nombre || !!errors.email ? 1 : 1.02 }}
                    whileTap={{ scale: !formData.nombre || !formData.email || !!errors.nombre || !!errors.email ? 1 : 0.98 }}
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
                        {cliente ? 'Actualizar Cliente' : 'Crear Cliente'}
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

// Asignar displayName para evitar warnings de ESLint
FormularioCliente.displayName = 'FormularioCliente'