// =====================================================
// FORMULARIO USUARIO - src/components/FormularioUsuario.tsx
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Shield, Eye, EyeOff, Crown, Briefcase } from 'lucide-react'
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
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const rolesDisponibles = [
    { value: 'VENTAS', label: 'Ventas', icon: Briefcase, description: 'Acceso básico a clientes y proyectos' },
    { value: 'ADMIN', label: 'Administrador', icon: Shield, description: 'Gestión completa del sistema' },
    ...(currentUserRole === 'SUPERADMIN' ? [
      { value: 'SUPERADMIN', label: 'Super Administrador', icon: Crown, description: 'Acceso total al sistema' }
    ] : [])
  ]

  useEffect(() => {
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
  }, [usuario, isOpen])

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({...formData, password})
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }

    if (!usuario && !formData.password) {
      newErrors.password = 'La contraseña es requerida para nuevos usuarios'
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Error al guardar usuario:', error)
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
            {/* Información personal */}
            <div>
              <h3 className="text-white font-medium mb-4">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className={`input-glass w-full ${errors.nombre ? 'border-red-500' : ''}`}
                    placeholder="Nombre"
                  />
                  {errors.nombre && (
                    <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>
                  )}
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
                    className={`input-glass w-full ${errors.apellido ? 'border-red-500' : ''}`}
                    placeholder="Apellido"
                  />
                  {errors.apellido && (
                    <p className="text-red-400 text-xs mt-1">{errors.apellido}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`input-glass w-full ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="usuario@empresa.com"
                    disabled={!!usuario} // No permitir cambiar email en edición
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Credenciales */}
            {!usuario && (
              <div>
                <h3 className="text-white font-medium mb-4">Credenciales</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contraseña Temporal *
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className={`input-glass w-full pr-12 ${errors.password ? 'border-red-500' : ''}`}
                        placeholder="Contraseña temporal"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="btn-secondary whitespace-nowrap"
                    >
                      Generar
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    El usuario deberá cambiar esta contraseña en su primer inicio de sesión
                  </p>
                </div>
              </div>
            )}

            {/* Permisos y rol */}
            <div>
              <h3 className="text-white font-medium mb-4">Permisos y Estado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Rol del Usuario *
                  </label>
                  <div className="space-y-2">
                    {rolesDisponibles.map((rol) => (
                      <label
                        key={rol.value}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.rol === rol.value
                            ? 'border-blue-500/50 bg-blue-500/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <input
                          type="radio"
                          name="rol"
                          value={rol.value}
                          checked={formData.rol === rol.value}
                          onChange={(e) => setFormData({...formData, rol: e.target.value as RolUsuario})}
                          className="sr-only"
                        />
                        <rol.icon className={`w-5 h-5 mr-3 ${
                          formData.rol === rol.value ? 'text-blue-400' : 'text-gray-400'
                        }`} />
                        <div>
                          <p className={`font-medium ${
                            formData.rol === rol.value ? 'text-blue-400' : 'text-white'
                          }`}>
                            {rol.label}
                          </p>
                          <p className="text-gray-400 text-xs">{rol.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {usuario && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Estado del Usuario
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      className="input-glass w-full"
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="INACTIVO">Inactivo</option>
                      <option value="SUSPENDIDO">Suspendido</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen de permisos */}
            <div className="card bg-white/5 p-4">
              <h4 className="text-white font-medium mb-3">Resumen de Permisos</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {formData.rol === 'SUPERADMIN' && (
                  <>
                    <div className="text-purple-400">✓ Acceso total al sistema</div>
                    <div className="text-purple-400">✓ Gestión de usuarios</div>
                    <div className="text-purple-400">✓ Configuración del sistema</div>
                    <div className="text-purple-400">✓ Todos los reportes</div>
                  </>
                )}
                {formData.rol === 'ADMIN' && (
                  <>
                    <div className="text-blue-400">✓ Gestión de usuarios</div>
                    <div className="text-blue-400">✓ Gestión completa de datos</div>
                    <div className="text-blue-400">✓ Reportes avanzados</div>
                    <div className="text-gray-400">✗ Configuración del sistema</div>
                  </>
                )}
                {formData.rol === 'VENTAS' && (
                  <>
                    <div className="text-green-400">✓ Gestión de clientes</div>
                    <div className="text-green-400">✓ Gestión de proyectos</div>
                    <div className="text-green-400">✓ Visualización de pagos</div>
                    <div className="text-gray-400">✗ Gestión de usuarios</div>
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
                {loading ? 'Guardando...' : 'Guardar Usuario'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}