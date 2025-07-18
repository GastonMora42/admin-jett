// src/app/admin/usuarios/crear/page.tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'
import { 
  UserPlus, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Shield,
  Crown,
  Briefcase,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export default function CrearUsuarioPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellido: '',
    rol: 'VENTAS',
    password: '',
    confirmPassword: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Verificar permisos
  const canCreateUsers = user?.['custom:role'] === 'SUPERADMIN' || user?.['custom:role'] === 'ADMIN'
  
  if (!canCreateUsers) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
          <p className="text-gray-400 mb-6">
            No tienes permisos para crear usuarios.
          </p>
          <Link href="/admin/usuarios" className="btn-primary">
            Volver a Usuarios
          </Link>
        </div>
      </div>
    )
  }

  const validateForm = () => {
    if (!formData.email || !formData.nombre || !formData.apellido || !formData.password) {
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

    // Solo SUPERADMIN puede crear otros SUPERADMIN
    if (formData.rol === 'SUPERADMIN' && user?.['custom:role'] !== 'SUPERADMIN') {
      return 'Solo SUPERADMIN puede crear otros SUPERADMIN'
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
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/admin/usuarios')
        }, 2000)
      } else {
        setError(data.error || 'Error al crear usuario')
      }
    } catch (err) {
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
      color: 'text-green-400 border-green-500/30 bg-green-500/10',
      disabled: false
    },
    {
      value: 'ADMIN',
      label: 'Administrador',
      icon: Shield,
      description: 'Administración del sistema',
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
      disabled: false
    },
    {
      value: 'SUPERADMIN',
      label: 'Super Admin',
      icon: Crown,
      description: 'Acceso total al sistema',
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      disabled: user?.['custom:role'] !== 'SUPERADMIN'
    }
  ]

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="card p-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">¡Usuario Creado!</h1>
            <p className="text-gray-400 mb-4">
              El usuario ha sido creado exitosamente.
            </p>
            <p className="text-sm text-gray-500">
              Redirigiendo a la lista de usuarios...
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <Link 
              href="/admin/usuarios"
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Usuarios</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white">Crear Nuevo Usuario</h1>
          <p className="text-gray-400 mt-1">
            Agregar un nuevo usuario al sistema
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-2xl">
        <div className="card">
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm font-medium">Error</p>
                <p className="text-red-300 text-xs mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información personal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="input-glass w-full"
                  placeholder="Nombre del usuario"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={formData.apellido}
                  onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                  className="input-glass w-full"
                  placeholder="Apellido del usuario"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email corporativo *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="input-glass w-full"
                placeholder="usuario@empresa.com"
                disabled={loading}
              />
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Rol en el sistema *
              </label>
              <div className="space-y-3">
                {roles.map((role) => (
                  <label
                    key={role.value}
                    className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                      role.disabled 
                        ? 'opacity-50 cursor-not-allowed border-gray-500/20 bg-gray-500/5'
                        : formData.rol === role.value
                          ? role.color
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rol"
                      value={role.value}
                      checked={formData.rol === role.value}
                      onChange={(e) => setFormData({...formData, rol: e.target.value})}
                      className="sr-only"
                      disabled={loading || role.disabled}
                    />
                    <role.icon className={`w-5 h-5 mr-3 ${
                      role.disabled 
                        ? 'text-gray-500'
                        : formData.rol === role.value || !role.disabled 
                          ? '' 
                          : 'text-gray-400'
                    }`} />
                    <div className="flex-1">
                      <p className={`font-medium ${
                        role.disabled 
                          ? 'text-gray-500'
                          : formData.rol === role.value || !role.disabled 
                            ? '' 
                            : 'text-white'
                      }`}>
                        {role.label}
                        {role.disabled && ' (Sin permisos)'}
                      </p>
                      <p className="text-gray-400 text-xs">{role.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="input-glass w-full pr-12"
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
                  Confirmar contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="input-glass w-full pr-12"
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

            {/* Requisitos de contraseña */}
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

            {/* Botones */}
            <div className="flex space-x-4 pt-6">
              <Link href="/admin/usuarios" className="btn-secondary flex-1">
                Cancelar
              </Link>
              
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    Creando usuario...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Crear Usuario
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  )
}