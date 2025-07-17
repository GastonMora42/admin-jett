// src/components/FormularioUsuario.tsx - VERSIÓN MEJORADA Y RESPONSIVA
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  User, 
  Mail, 
  Shield, 
  Eye, 
  EyeOff, 
  Crown, 
  Briefcase,
  Check,
  AlertTriangle,
  Info,
  Sparkles,
  Key,
  UserPlus,
  Zap,
  Lock,
  Unlock,
  Activity,
  Settings,
  Star
} from 'lucide-react'
import { RolUsuario } from '@/types/auth'

interface Usuario {
  id?: string
  email: string
  nombre: string
  apellido: string
  rol: RolUsuario
  estado?: string
}

interface FormularioUsuarioProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  usuario?: Usuario | null
  title?: string
  currentUserRole: RolUsuario
}

interface FormErrors {
  [key: string]: string
}

interface FormTouched {
  [key: string]: boolean
}

export const FormularioUsuario: React.FC<FormularioUsuarioProps> = ({
  isOpen,
  onClose,
  onSubmit,
  usuario = null,
  title = 'Nuevo Usuario',
  currentUserRole
}) => {
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellido: '',
    rol: 'VENTAS' as RolUsuario,
    estado: 'ACTIVO',
    password: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<FormTouched>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const formRef = useRef<HTMLFormElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  const rolesDisponibles = [
    { 
      value: 'VENTAS', 
      label: 'Ventas', 
      icon: Briefcase, 
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/30',
      description: 'Acceso básico a clientes y proyectos',
      permissions: ['Gestión de clientes', 'Gestión de proyectos', 'Visualización de pagos']
    },
    { 
      value: 'ADMIN', 
      label: 'Administrador', 
      icon: Shield, 
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/30',
      description: 'Gestión completa del sistema',
      permissions: ['Gestión de usuarios', 'Gestión completa de datos', 'Reportes avanzados']
    },
    ...(currentUserRole === 'SUPERADMIN' ? [{
      value: 'SUPERADMIN' as RolUsuario, 
      label: 'Super Administrador', 
      icon: Crown, 
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/30',
      description: 'Acceso total al sistema',
      permissions: ['Acceso total', 'Gestión de usuarios', 'Configuración del sistema', 'Todos los reportes']
    }] : [])
  ]

  useEffect(() => {
    if (isOpen) {
      if (usuario) {
        setFormData({
          email: usuario.email || '',
          nombre: usuario.nombre || '',
          apellido: usuario.apellido || '',
          rol: usuario.rol || 'VENTAS',
          estado: usuario.estado || 'ACTIVO',
          password: ''
        })
      } else {
        setFormData({
          email: '',
          nombre: '',
          apellido: '',
          rol: 'VENTAS',
          estado: 'ACTIVO',
          password: ''
        })
      }
      setErrors({})
      setTouched({})
      setCurrentStep(1)
      setShowSuccess(false)
      setPasswordStrength(0)
      
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 300)
    }
  }, [usuario, isOpen])

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/\d/.test(password)) strength += 1
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1
    return strength
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*'
    let password = ''
    
    // Asegurar al menos un carácter de cada tipo
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
    password += '0123456789'[Math.floor(Math.random() * 10)]
    password += '@#$%&*'[Math.floor(Math.random() * 6)]
    
    for (let i = 4; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // Mezclar caracteres
    const shuffled = password.split('').sort(() => Math.random() - 0.5).join('')
    setFormData({...formData, password: shuffled})
    setPasswordStrength(calculatePasswordStrength(shuffled))
  }

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'nombre':
        if (!value.trim()) return 'El nombre es requerido'
        if (value.length < 2) return 'El nombre debe tener al menos 2 caracteres'
        if (value.length > 50) return 'El nombre es demasiado largo'
        return ''
      
      case 'apellido':
        if (!value.trim()) return 'El apellido es requerido'
        if (value.length < 2) return 'El apellido debe tener al menos 2 caracteres'
        if (value.length > 50) return 'El apellido es demasiado largo'
        return ''
      
      case 'email':
        if (!value.trim()) return 'El email es requerido'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'El email no es válido'
        return ''
      
      case 'password':
        if (!usuario && !value) return 'La contraseña es requerida para nuevos usuarios'
        if (value && value.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
        if (value && !/[a-z]/.test(value)) return 'Debe contener al menos una letra minúscula'
        if (value && !/[A-Z]/.test(value)) return 'Debe contener al menos una letra mayúscula'
        if (value && !/\d/.test(value)) return 'Debe contener al menos un número'
        return ''
      
      default:
        return ''
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    const fieldsToValidate = ['nombre', 'apellido', 'email']
    if (!usuario) fieldsToValidate.push('password')
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData] as string)
      if (error) newErrors[field] = error
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (field === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }
    
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  const handleBlur = (field: keyof typeof formData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const value = formData[field] as string
    const error = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: error }))
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
      await onSubmit(formData)
      setShowSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error al guardar usuario:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep === 1) {
      const step1Fields = ['nombre', 'apellido', 'email']
      let hasErrors = false
      
      step1Fields.forEach(field => {
        const error = validateField(field, formData[field as keyof typeof formData] as string)
        if (error) {
          setErrors(prev => ({ ...prev, [field]: error }))
          setTouched(prev => ({ ...prev, [field]: true }))
          hasErrors = true
        }
      })
      
      if (!hasErrors) {
        setCurrentStep(2)
      }
    } else if (currentStep === 2 && !usuario) {
      const passwordError = validateField('password', formData.password)
      if (passwordError) {
        setErrors(prev => ({ ...prev, password: passwordError }))
        setTouched(prev => ({ ...prev, password: true }))
      } else {
        setCurrentStep(3)
      }
    } else {
      setCurrentStep(3)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }

  const progress = (currentStep / (usuario ? 2 : 3)) * 100
  const isFormComplete = formData.nombre && formData.apellido && formData.email && 
    (usuario || formData.password) && !Object.values(errors).some(error => error)

  const selectedRole = rolesDisponibles.find(r => r.value === formData.rol)

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 2) return 'bg-red-500'
    if (strength < 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 2) return 'Débil'
    if (strength < 4) return 'Moderada'
    return 'Fuerte'
  }

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
          className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
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
                  <UserPlus className="w-6 h-6 mr-3 text-blue-400" />
                  {title}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {usuario ? 'Actualiza la información del usuario' : 'Crea un nuevo usuario del sistema'}
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
                <span>Paso {currentStep} de {usuario ? 2 : 3}</span>
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
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
            <form ref={formRef} onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {/* Step 1: Información Personal */}
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
                      <p className="text-gray-400 text-sm">Datos básicos del usuario</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Nombre */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          <User className="w-4 h-4 inline mr-2" />
                          Nombre *
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
                            placeholder="Nombre"
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

                      {/* Apellido */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Apellido *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.apellido}
                            onChange={(e) => handleInputChange('apellido', e.target.value)}
                            onBlur={() => handleBlur('apellido')}
                            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                              errors.apellido && touched.apellido
                                ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                                : formData.apellido && !errors.apellido
                                ? 'border-green-500/50 focus:ring-green-500/20 bg-green-500/5'
                                : 'border-white/20 focus:ring-blue-500/20 focus:border-blue-500/50'
                            }`}
                            placeholder="Apellido"
                            disabled={loading}
                          />
                          {formData.apellido && !errors.apellido && (
                            <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                          )}
                        </div>
                        <AnimatePresence>
                          {errors.apellido && touched.apellido && (
                            <motion.p
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="text-red-400 text-sm flex items-center"
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              {errors.apellido}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
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
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          onBlur={() => handleBlur('email')}
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                            errors.email && touched.email
                              ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                              : formData.email && !errors.email
                              ? 'border-green-500/50 focus:ring-green-500/20 bg-green-500/5'
                              : 'border-white/20 focus:ring-blue-500/20 focus:border-blue-500/50'
                          }`}
                          placeholder="usuario@empresa.com"
                          disabled={loading || !!usuario}
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
                      {usuario && (
                        <p className="text-yellow-400 text-xs flex items-center">
                          <Info className="w-3 h-3 mr-1" />
                          No se puede cambiar el email en usuarios existentes
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Credenciales (solo para usuarios nuevos) */}
                {currentStep === 2 && !usuario && (
                  <motion.div
                    key="step2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <Key className="w-16 h-16 text-yellow-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-white">Credenciales</h3>
                      <p className="text-gray-400 text-sm">Contraseña temporal del usuario</p>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-300">
                        <Lock className="w-4 h-4 inline mr-2" />
                        Contraseña Temporal *
                      </label>
                      
                      <div className="flex space-x-3">
                        <div className="relative flex-1">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            onBlur={() => handleBlur('password')}
                            className={`w-full px-4 py-3 pr-12 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                              errors.password && touched.password
                                ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
                                : formData.password && !errors.password
                                ? 'border-green-500/50 focus:ring-green-500/20 bg-green-500/5'
                                : 'border-white/20 focus:ring-yellow-500/20 focus:border-yellow-500/50'
                            }`}
                            placeholder="Contraseña temporal"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition-all duration-200 whitespace-nowrap flex items-center"
                          disabled={loading}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Generar
                        </button>
                      </div>

                      <AnimatePresence>
                        {errors.password && touched.password && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-400 text-sm flex items-center"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {errors.password}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      {/* Password Strength */}
                      {formData.password && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Fortaleza:</span>
                            <span className={`font-medium ${
                              passwordStrength < 2 ? 'text-red-400' :
                              passwordStrength < 4 ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {getPasswordStrengthText(passwordStrength)}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                              style={{ width: `${(passwordStrength / 5) * 100}%` }}
                            />
                          </div>
                        </motion.div>
                      )}

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                          <div>
                            <h4 className="text-blue-400 font-medium text-sm">Información Importante</h4>
                            <p className="text-gray-300 text-sm mt-1">
                              El usuario deberá cambiar esta contraseña en su primer inicio de sesión.
                              Se enviará por email o se la proporcionará de forma segura.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Permisos y Rol */}
                {((currentStep === 3 && !usuario) || (currentStep === 2 && usuario)) && (
                  <motion.div
                    key="step3"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <Shield className="w-16 h-16 text-purple-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-white">Permisos y Estado</h3>
                      <p className="text-gray-400 text-sm">Configuración de acceso y rol</p>
                    </div>

                    {/* Rol del Usuario */}
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-300">
                        <Shield className="w-4 h-4 inline mr-2" />
                        Rol del Usuario *
                      </label>
                      
                      <div className="space-y-3">
                        {rolesDisponibles.map((rol) => (
                          <motion.label
                            key={rol.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                              formData.rol === rol.value
                                ? `${rol.bgColor} border-opacity-100`
                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <input
                              type="radio"
                              name="rol"
                              value={rol.value}
                              checked={formData.rol === rol.value}
                              onChange={(e) => handleInputChange('rol', e.target.value as RolUsuario)}
                              className="sr-only"
                            />
                            <rol.icon className={`w-6 h-6 mt-0.5 mr-4 ${
                              formData.rol === rol.value ? rol.color : 'text-gray-400'
                            }`} />
                            <div className="flex-1">
                              <p className={`font-medium text-base ${
                                formData.rol === rol.value ? rol.color : 'text-white'
                              }`}>
                                {rol.label}
                              </p>
                              <p className="text-gray-400 text-sm mt-1">{rol.description}</p>
                              <div className="mt-2 space-y-1">
                                {rol.permissions.map((permission, index) => (
                                  <div key={index} className="flex items-center text-xs">
                                    <Check className={`w-3 h-3 mr-2 ${
                                      formData.rol === rol.value ? rol.color : 'text-gray-500'
                                    }`} />
                                    <span className={formData.rol === rol.value ? 'text-gray-300' : 'text-gray-500'}>
                                      {permission}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.label>
                        ))}
                      </div>
                    </div>

                    {/* Estado (solo para edición) */}
                    {usuario && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          <Activity className="w-4 h-4 inline mr-2" />
                          Estado del Usuario
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {[
                            { value: 'ACTIVO', label: 'Activo', color: 'text-green-400', icon: Unlock },
                            { value: 'INACTIVO', label: 'Inactivo', color: 'text-gray-400', icon: Lock },
                            { value: 'SUSPENDIDO', label: 'Suspendido', color: 'text-red-400', icon: AlertTriangle }
                          ].map((estado) => (
                            <motion.label
                              key={estado.value}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                                formData.estado === estado.value
                                  ? `border-opacity-50 bg-opacity-10 ${estado.color.replace('text-', 'border-').replace('-400', '-500')} ${estado.color.replace('text-', 'bg-').replace('-400', '-500')}`
                                  : 'border-white/10 bg-white/5 hover:bg-white/10'
                              }`}
                            >
                              <input
                                type="radio"
                                name="estado"
                                value={estado.value}
                                checked={formData.estado === estado.value}
                                onChange={(e) => handleInputChange('estado', e.target.value)}
                                className="sr-only"
                              />
                              <estado.icon className={`w-4 h-4 mr-2 ${
                                formData.estado === estado.value ? estado.color : 'text-gray-400'
                              }`} />
                              <span className={`font-medium text-sm ${
                                formData.estado === estado.value ? estado.color : 'text-white'
                              }`}>
                                {estado.label}
                              </span>
                            </motion.label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resumen de permisos */}
                    {selectedRole && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`${selectedRole.bgColor} rounded-xl p-6 border`}
                      >
                        <h4 className={`${selectedRole.color} font-medium mb-4 flex items-center`}>
                          <Star className="w-5 h-5 mr-2" />
                          Resumen del Usuario
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div>
                              <span className="text-gray-400">Nombre completo:</span>
                              <p className="text-white font-medium">
                                {formData.nombre} {formData.apellido}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-400">Email:</span>
                              <p className="text-white font-medium">{formData.email}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <span className="text-gray-400">Rol asignado:</span>
                              <p className={`font-medium ${selectedRole.color}`}>
                                {selectedRole.label}
                              </p>
                            </div>
                            {usuario && (
                              <div>
                                <span className="text-gray-400">Estado:</span>
                                <p className="text-white font-medium">{formData.estado}</p>
                              </div>
                            )}
                          </div>
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
                    disabled={!formData.nombre || !formData.apellido || !formData.email || !!errors.nombre || !!errors.apellido || !!errors.email}
                    whileHover={{ scale: (!formData.nombre || !formData.apellido || !formData.email || !!errors.nombre || !!errors.apellido || !!errors.email) ? 1 : 1.02 }}
                    whileTap={{ scale: (!formData.nombre || !formData.apellido || !formData.email || !!errors.nombre || !!errors.apellido || !!errors.email) ? 1 : 0.98 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-xl transition-all duration-200 font-medium"
                  >
                    Continuar
                  </motion.button>
                </>
              ) : currentStep === 2 && !usuario ? (
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
                    disabled={!formData.password || !!errors.password}
                    whileHover={{ scale: (!formData.password || !!errors.password) ? 1 : 1.02 }}
                    whileTap={{ scale: (!formData.password || !!errors.password) ? 1 : 0.98 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-xl transition-all duration-200 font-medium"
                  >
                    Continuar
                  </motion.button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={usuario ? onClose : prevStep}
                    className="flex-1 sm:flex-none px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-gray-300 hover:text-white transition-all duration-200 font-medium"
                    disabled={loading}
                  >
                    {usuario ? 'Cancelar' : 'Volver'}
                  </button>
                  <motion.button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={loading || !isFormComplete}
                    whileHover={{ scale: (loading || !isFormComplete) ? 1 : 1.02 }}
                    whileTap={{ scale: (loading || !isFormComplete) ? 1 : 0.98 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-xl transition-all duration-200 font-medium flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Settings className="w-5 h-5 mr-2" />
                        {usuario ? 'Actualizar Usuario' : 'Crear Usuario'}
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