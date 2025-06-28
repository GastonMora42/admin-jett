// =====================================================
// PÁGINA DE REGISTRO - src/app/auth/register/page.tsx
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Eye, 
  EyeOff, 
  UserPlus, 
  AlertCircle, 
  ArrowLeft, 
  Shield, 
  Crown,
  Briefcase,
  CheckCircle,
  Mail
} from 'lucide-react'
import { SilkBackground } from '@/components/SilkBackground'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'VENTAS'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [registrationEnabled, setRegistrationEnabled] = useState(true)
  
  const router = useRouter()

  useEffect(() => {
    // Verificar si el registro está habilitado
    checkRegistrationStatus()
  }, [])

  const checkRegistrationStatus = async () => {
    try {
      const response = await fetch('/api/auth/registration-status')
      const data = await response.json()
      setRegistrationEnabled(data.enabled)
    } catch (error) {
      console.error('Error checking registration status:', error)
    }
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      return 'Todos los campos son requeridos'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Email inválido'
    }

    if (formData.password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres'
    }

    if (!/(?=.*[a-z])/.test(formData.password)) {
      return 'La contraseña debe contener al menos una letra minúscula'
    }

    if (!/(?=.*[A-Z])/.test(formData.password)) {
      return 'La contraseña debe contener al menos una letra mayúscula'
    }

    if (!/(?=.*\d)/.test(formData.password)) {
      return 'La contraseña debe contener al menos un número'
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Las contraseñas no coinciden'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Redirigir a confirmación después de 2 segundos
        setTimeout(() => {
          router.push(`/auth/confirm?email=${encodeURIComponent(formData.email)}`)
        }, 2000)
      } else {
        setError(data.message || 'Error al registrar usuario')
      }
    } catch (error) {
      setError('Error de conexión. Por favor, intenta más tarde.')
    } finally {
      setLoading(false)
    }
  }

  const roles = [
    {
      value: 'VENTAS',
      label: 'Ventas',
      icon: Briefcase,
      description: 'Gestión de clientes y proyectos',
      color: 'text-green-400 border-green-500/30 bg-green-500/10'
    },
    {
      value: 'ADMIN',
      label: 'Administrador',
      icon: Shield,
      description: 'Administración del sistema',
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10'
    },
    {
      value: 'SUPERADMIN',
      label: 'Super Admin',
      icon: Crown,
      description: 'Acceso total al sistema',
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10'
    }
  ]

  if (!registrationEnabled) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <SilkBackground />
        <div className="relative z-10 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Registro no disponible</h1>
          <p className="text-gray-400 mb-6">El registro público está deshabilitado en este entorno.</p>
          <Link href="/auth/signin">
            <button className="btn-primary">
              Iniciar Sesión
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <SilkBackground />
        <div className="relative z-10 text-center max-w-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
          >
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">¡Registro Exitoso!</h1>
            <p className="text-gray-400 mb-4">
              Hemos enviado un código de confirmación a tu email.
            </p>
            <p className="text-sm text-gray-500">
              Redirigiendo a la página de confirmación...
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <SilkBackground />
      
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 left-6 z-20"
      >
        <Link href="/auth/signin">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver al login</span>
          </motion.button>
        </Link>
      </motion.div>

      <div className="flex items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 relative">
                <Image
                  src="/logo.webp"
                  alt="Jett Labs Logo"
                  fill
                  className="object-contain rounded-xl"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">Jett Labs</h1>
                <p className="text-xs text-gray-400">Software Factory Management</p>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Crear Nueva Cuenta
              </h2>
              <p className="text-gray-400 text-sm">
                Únete al sistema de gestión de Jett Labs
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 text-sm font-medium">Error en el registro</p>
                  <p className="text-red-300 text-xs mt-1">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombres */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                    placeholder="Tu nombre"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                    placeholder="Tu apellido"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email corporativo
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                  placeholder="usuario@empresa.com"
                  disabled={loading}
                />
              </div>

              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Rol en el sistema
                </label>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <label
                      key={role.value}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.role === role.value
                          ? role.color
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="sr-only"
                        disabled={loading}
                      />
                      <role.icon className={`w-5 h-5 mr-3 ${
                        formData.role === role.value ? '' : 'text-gray-400'
                      }`} />
                      <div>
                        <p className={`font-medium ${
                          formData.role === role.value ? '' : 'text-white'
                        }`}>
                          {role.label}
                        </p>
                        <p className="text-gray-400 text-xs">{role.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contraseñas */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all pr-12"
                      placeholder="Mínimo 8 caracteres"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all pr-12"
                      placeholder="Repetir contraseña"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password requirements */}
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">Requisitos de contraseña:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={formData.password.length >= 8 ? 'text-green-400' : 'text-gray-500'}>
                    ✓ Mínimo 8 caracteres
                  </div>
                  <div className={/(?=.*[a-z])/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}>
                    ✓ Una minúscula
                  </div>
                  <div className={/(?=.*[A-Z])/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}>
                    ✓ Una mayúscula
                  </div>
                  <div className={/(?=.*\d)/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}>
                    ✓ Un número
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-all relative overflow-hidden group"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    Creando cuenta...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Crear Cuenta
                  </div>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-400 text-sm mb-2">
                ¿Ya tienes una cuenta?
              </p>
              <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 transition-colors text-sm">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}