
// =====================================================
// PÁGINA CONFIGURACIÓN - src/app/configuracion/page.tsx
// =====================================================

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database,
  Mail,
  Smartphone,
  Save,
  RotateCcw
} from 'lucide-react'

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('perfil')
  const [settings, setSettings] = useState({
    perfil: {
      nombre: 'Juan Pérez',
      email: 'juan@softwarefactory.com',
      telefono: '+54 9 11 1234-5678',
      empresa: 'Mi Software Factory',
      avatar: ''
    },
    notificaciones: {
      emailPagosVencidos: true,
      emailNuevosProyectos: true,
      smsRecordatorios: false,
      pushNotifications: true,
      frecuenciaReportes: 'semanal'
    },
    sistema: {
      moneda: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires',
      formatoFecha: 'DD/MM/YYYY',
      idioma: 'es'
    }
  })

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'sistema', label: 'Sistema', icon: Settings },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
    { id: 'integraciones', label: 'Integraciones', icon: Database }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-white">Configuración</h1>
        <p className="text-gray-400 mt-1">Personaliza tu experiencia y configuraciones del sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de navegación */}
        <div className="card p-6">
          <nav className="space-y-2">
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
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido principal */}
        <div className="lg:col-span-3">
          {activeTab === 'perfil' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Información del Perfil</h2>
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-2xl">
                      {settings.perfil.nombre.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <button className="btn-secondary mr-3">Cambiar Avatar</button>
                    <button className="btn-secondary">Eliminar</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={settings.perfil.nombre}
                      onChange={(e) => setSettings({
                        ...settings,
                        perfil: { ...settings.perfil, nombre: e.target.value }
                      })}
                      className="input-glass w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.perfil.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        perfil: { ...settings.perfil, email: e.target.value }
                      })}
                      className="input-glass w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={settings.perfil.telefono}
                      onChange={(e) => setSettings({
                        ...settings,
                        perfil: { ...settings.perfil, telefono: e.target.value }
                      })}
                      className="input-glass w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={settings.perfil.empresa}
                      onChange={(e) => setSettings({
                        ...settings,
                        perfil: { ...settings.perfil, empresa: e.target.value }
                      })}
                      className="input-glass w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notificaciones' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Preferencias de Notificaciones</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-medium mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Notificaciones por Email
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailPagosVencidos', label: 'Pagos vencidos', desc: 'Recibir alertas cuando hay pagos vencidos' },
                      { key: 'emailNuevosProyectos', label: 'Nuevos proyectos', desc: 'Notificar cuando se crean nuevos proyectos' }
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-gray-400 text-sm">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notificaciones[item.key as keyof typeof settings.notificaciones] as boolean}
                            onChange={(e) => setSettings({
                              ...settings,
                              notificaciones: {
                                ...settings.notificaciones,
                                [item.key]: e.target.checked
                              }
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-4 flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    Otras Notificaciones
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">SMS Recordatorios</p>
                        <p className="text-gray-400 text-sm">Recordatorios por SMS de pagos próximos</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notificaciones.smsRecordatorios}
                          onChange={(e) => setSettings({
                            ...settings,
                            notificaciones: {
                              ...settings.notificaciones,
                              smsRecordatorios: e.target.checked
                            }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Frecuencia de Reportes
                  </label>
                  <select
                    value={settings.notificaciones.frecuenciaReportes}
                    onChange={(e) => setSettings({
                      ...settings,
                      notificaciones: {
                        ...settings.notificaciones,
                        frecuenciaReportes: e.target.value
                      }
                    })}
                    className="input-glass w-full"
                  >
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                    <option value="nunca">Nunca</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sistema' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Configuración del Sistema</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Moneda
                  </label>
                  <select
                    value={settings.sistema.moneda}
                    onChange={(e) => setSettings({
                      ...settings,
                      sistema: { ...settings.sistema, moneda: e.target.value }
                    })}
                    className="input-glass w-full"
                  >
                    <option value="ARS">Peso Argentino (ARS)</option>
                    <option value="USD">Dólar Estadounidense (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Formato de Fecha
                  </label>
                  <select
                    value={settings.sistema.formatoFecha}
                    onChange={(e) => setSettings({
                      ...settings,
                      sistema: { ...settings.sistema, formatoFecha: e.target.value }
                    })}
                    className="input-glass w-full"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Zona Horaria
                  </label>
                  <select
                    value={settings.sistema.timezone}
                    onChange={(e) => setSettings({
                      ...settings,
                      sistema: { ...settings.sistema, timezone: e.target.value }
                    })}
                    className="input-glass w-full"
                  >
                    <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                    <option value="America/Montevideo">Montevideo (GMT-3)</option>
                    <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Idioma
                  </label>
                  <select
                    value={settings.sistema.idioma}
                    onChange={(e) => setSettings({
                      ...settings,
                      sistema: { ...settings.sistema, idioma: e.target.value }
                    })}
                    className="input-glass w-full"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Otros tabs contenido similar... */}

          {/* Botones de acción */}
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button className="btn-secondary">
              <RotateCcw className="w-4 h-4 mr-2" />
              Restablecer
            </button>
            <button className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}