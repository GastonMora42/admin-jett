// =====================================================
// PÁGINA DE PERFIL CORREGIDA - src/app/perfil/page.tsx
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Activity,
  Save,
  Camera,
  Key,
  Bell,
  Globe,
  Eye,
  EyeOff,
  Crown,
  Briefcase
} from 'lucide-react'
import { AuthLoading } from '@/components/AuthLoading'

interface UserStats {
  clientesCreados: number
  proyectosCreados: number
  pagosGestionados: number
  ultimoAcceso: string
  sesionesActivas: number
}

export default function PerfilPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [stats, setStats] = useState<UserStats | null>(null)
  const [saving, setSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    bio: '',
    timezone: 'America/Argentina/Buenos_Aires',
    idioma: 'es',
    notificaciones: {
      email: true,
      push: true,
      sms: false
    }
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        // ✅ CORREGIDO: Usar las propiedades correctas del usuario
        nombre: user.given_name || user.name || '',
        apellido: user.family_name || '', // ← Cambiado de user.surname
        email: user.email || '',
        telefono: '',
        bio: '',
        timezone: 'America/Argentina/Buenos_Aires',
        idioma: 'es',
        notificaciones: {
          email: true,
          push: true,
          sms: false
        }
      })
      fetchUserStats()
    }
  }, [user])

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/usuarios/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/usuarios/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido
        })
      })

      if (response.ok) {
        console.log('Perfil actualizado correctamente')
      } else {
        throw new Error('Error al actualizar perfil')
      }
    } catch (error) {
      console.error('Error al guardar los cambios:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      console.error('Las contraseñas no coinciden')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/usuarios/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (response.ok) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        console.log('Contraseña cambiada correctamente')
      } else {
        throw new Error('Error al cambiar contraseña')
      }
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error)
    } finally {
      setSaving(false)
    }
  }

  const getRolIcon = () => {
    switch (user?.['custom:role']) {
      case 'SUPERADMIN': return <Crown className="w-5 h-5 text-purple-400" />
      case 'ADMIN': return <Shield className="w-5 h-5 text-blue-400" />
      case 'VENTAS': return <Briefcase className="w-5 h-5 text-green-400" />
      default: return <User className="w-5 h-5 text-gray-400" />
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'preferencias', label: 'Preferencias', icon: Globe },
    { id: 'actividad', label: 'Actividad', icon: Activity }
  ]

  if (isLoading) {
    return <AuthLoading />
  }

  if (!isAuthenticated || !user) {
    return <AuthLoading />
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
          <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
          <p className="text-gray-400 mt-1">Administra tu información personal y configuraciones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar del perfil */}
        <div className="space-y-6">
          {/* Avatar y info básica */}
          <div className="card p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white font-semibold text-2xl">
                  {/* ✅ CORREGIDO: Usar las propiedades correctas */}
                  {user.given_name?.charAt(0) || user.name?.charAt(0) || 'U'}
                  {user.family_name?.charAt(0) || ''}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-1">
              {/* ✅ CORREGIDO: Mostrar nombre correctamente */}
              {user.given_name || user.name || 'Usuario'} {user.family_name || ''}
            </h3>
            
            <div className="flex items-center justify-center space-x-2 mb-3">
              {getRolIcon()}
              <span className="text-sm font-medium text-gray-300">
                {user['custom:role'] || 'VENTAS'}
              </span>
            </div>
            
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>

          {/* Estadísticas rápidas */}
          {stats && (
            <div className="card p-6">
              <h4 className="text-white font-medium mb-4">Estadísticas</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Clientes creados</span>
                  <span className="text-white font-medium">{stats.clientesCreados}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Proyectos creados</span>
                  <span className="text-blue-400 font-medium">{stats.proyectosCreados}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Pagos gestionados</span>
                  <span className="text-green-400 font-medium">{stats.pagosGestionados}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navegación de tabs */}
          <div className="card p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="lg:col-span-3">
          {activeTab === 'general' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Información General</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="input-glass w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                    className="input-glass w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="input-glass w-full opacity-50"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    El email no se puede modificar. Contacta al administrador.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="input-glass w-full"
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Biografía
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows={3}
                    className="input-glass w-full resize-none"
                    placeholder="Cuéntanos un poco sobre ti..."
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="btn-primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          )}

          {/* Resto de tabs permanecen igual */}
          {activeTab === 'seguridad' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Cambiar Contraseña</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contraseña Actual
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="input-glass w-full pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="input-glass w-full pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="input-glass w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleChangePassword}
                    disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="btn-primary"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Los demás tabs permanecen igual */}
        </div>
      </div>
    </motion.div>
  )
}