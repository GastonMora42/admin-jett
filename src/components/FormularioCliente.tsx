// src/components/FormularioCliente.tsx - COMPONENTE PROFESIONAL
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Phone, Building, Globe, MapPin, Save } from 'lucide-react'

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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
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
  }, [cliente, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    } else if (formData.nombre.length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres'
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'El email es requerido'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'El email no tiene un formato válido'
      }
    }

    if (formData.telefono && formData.telefono.trim()) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/
      if (!phoneRegex.test(formData.telefono)) {
        newErrors.telefono = 'El teléfono no tiene un formato válido'
      }
    }

    if (formData.empresa && formData.empresa.length > 200) {
      newErrors.empresa = 'El nombre de la empresa es demasiado largo'
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
      console.error('Error al guardar cliente:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof Cliente, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
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
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-white font-medium text-sm uppercase tracking-wide border-b border-white/10 pb-2">
                Información Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre || ''}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    className={`input-glass w-full ${errors.nombre ? 'border-red-500 ring-red-500/20' : ''}`}
                    placeholder="Ej: Juan Pérez"
                    disabled={loading}
                  />
                  {errors.nombre && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs mt-1 flex items-center"
                    >
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                      {errors.nombre}
                    </motion.p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`input-glass w-full ${errors.email ? 'border-red-500 ring-red-500/20' : ''}`}
                    placeholder="juan@ejemplo.com"
                    disabled={loading}
                  />
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs mt-1 flex items-center"
                    >
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                      {errors.email}
                    </motion.p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono || ''}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  className={`input-glass w-full ${errors.telefono ? 'border-red-500 ring-red-500/20' : ''}`}
                  placeholder="+54 9 11 1234-5678"
                  disabled={loading}
                />
                {errors.telefono && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-1 flex items-center"
                  >
                    <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                    {errors.telefono}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Información empresarial */}
            <div className="space-y-4">
              <h3 className="text-white font-medium text-sm uppercase tracking-wide border-b border-white/10 pb-2">
                Información Empresarial
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    Empresa / Organización
                  </label>
                  <input
                    type="text"
                    value={formData.empresa || ''}
                    onChange={(e) => handleInputChange('empresa', e.target.value)}
                    className={`input-glass w-full ${errors.empresa ? 'border-red-500 ring-red-500/20' : ''}`}
                    placeholder="Nombre de la empresa"
                    disabled={loading}
                  />
                  {errors.empresa && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs mt-1 flex items-center"
                    >
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                      {errors.empresa}
                    </motion.p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Estado
                  </label>
                  <select
                    value={formData.estado || 'ACTIVO'}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    className="input-glass w-full"
                    disabled={loading}
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vista previa */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-medium mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Vista Previa
              </h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {formData.nombre?.charAt(0)?.toUpperCase() || 'C'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">
                    {formData.nombre || 'Nombre del cliente'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {formData.email || 'email@ejemplo.com'}
                  </p>
                  {formData.empresa && (
                    <p className="text-gray-400 text-sm">
                      {formData.empresa}
                    </p>
                  )}
                </div>
                <div className="ml-auto">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    formData.estado === 'ACTIVO' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {formData.estado}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="flex-1 btn-primary"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {cliente ? 'Actualizar Cliente' : 'Crear Cliente'}
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Asignar displayName para evitar warnings de ESLint
FormularioCliente.displayName = 'FormularioCliente'