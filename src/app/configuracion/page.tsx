// src/app/configuracion/page.tsx - ACTUALIZADA CON SISTEMA DE MONEDA
'use client'

import React, { useState, useEffect } from 'react'
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
  RotateCcw,
  DollarSign,
  TrendingUp,
  Globe,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useCurrency, CURRENCIES, Currency } from '@/lib/currency-config'
import { LoadingSpinner } from '@/components/LoadingSpinner'

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
      timezone: 'America/Argentina/Buenos_Aires',
      formatoFecha: 'DD/MM/YYYY',
      idioma: 'es',
      tema: 'dark'
    }
  })

  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Configuración de moneda
  const currencySystem = useCurrency()
  const [tempCurrencySettings, setTempCurrencySettings] = useState(currencySystem.settings)

  useEffect(() => {
    setTempCurrencySettings(currencySystem.settings)
  }, [currencySystem.settings])

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'moneda', label: 'Moneda', icon: DollarSign },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'sistema', label: 'Sistema', icon: Settings },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
    { id: 'integraciones', label: 'Integraciones', icon: Database }
  ]

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setSaveError(null)
      setSaveMessage(null)

      // Guardar configuración general
      localStorage.setItem('app_settings', JSON.stringify(settings))

      // Guardar configuración de moneda si cambió
      if (activeTab === 'moneda') {
        await currencySystem.updateSettings(tempCurrencySettings)
      }

      setSaveMessage('Configuración guardada exitosamente')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveError('Error al guardar la configuración')
      setTimeout(() => setSaveError(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleResetSettings = () => {
    if (activeTab === 'moneda') {
      setTempCurrencySettings(currencySystem.settings)
    } else {
      // Reset other settings to default
      setSettings(prev => ({
        ...prev,
        [activeTab]: {
          // Valores por defecto según la pestaña
        }
      }))
    }
  }

  const updateExchangeRate = async () => {
    try {
      // Simular actualización de tasa de cambio
      const newRate = 1000 + Math.random() * 100
      setTempCurrencySettings(prev => ({
        ...prev,
        exchangeRate: Math.round(newRate)
      }))
    } catch (error) {
      console.error('Error updating exchange rate:', error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Configuración</h1>
          <p className="text-gray-400 mt-1">Personaliza tu experiencia y configuraciones del sistema</p>
        </div>
        
        {/* Indicadores de estado */}
        <div className="flex items-center gap-3">
          {saveMessage && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">{saveMessage}</span>
            </div>
          )}
          
          {saveError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{saveError}</span>
            </div>
          )}
          
          {currencySystem.loading && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="w-4 h-4 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" />
              <span className="text-blue-400 text-sm">Sincronizando...</span>
            </div>
          )}
        </div>
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

          {activeTab === 'moneda' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <DollarSign className="w-6 h-6 mr-2" />
                Configuración de Moneda
              </h2>
              
              <div className="space-y-8">
                {/* Moneda por defecto */}
                <div>
                  <h3 className="text-white font-medium mb-4">Moneda por Defecto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(CURRENCIES).map(([code, config]) => (
                      <label
                        key={code}
                        className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                          tempCurrencySettings.defaultCurrency === code
                            ? 'border-blue-500/50 bg-blue-500/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <input
                          type="radio"
                          name="defaultCurrency"
                          value={code}
                          checked={tempCurrencySettings.defaultCurrency === code}
                          onChange={(e) => setTempCurrencySettings({
                            ...tempCurrencySettings,
                            defaultCurrency: e.target.value as Currency
                          })}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            tempCurrencySettings.defaultCurrency === code
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-600 text-gray-300'
                          }`}>
                            {config.symbol}
                          </div>
                          <div>
                            <p className={`font-medium ${
                              tempCurrencySettings.defaultCurrency === code ? 'text-blue-400' : 'text-white'
                            }`}>
                              {config.name}
                            </p>
                            <p className="text-gray-400 text-sm">{code}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tasa de cambio */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">Tasa de Cambio</h3>
                    <button
                      onClick={updateExchangeRate}
                      className="btn-secondary text-sm"
                      disabled={currencySystem.loading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${currencySystem.loading ? 'animate-spin' : ''}`} />
                      Actualizar
                    </button>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">1 USD =</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={tempCurrencySettings.exchangeRate}
                          onChange={(e) => setTempCurrencySettings({
                            ...tempCurrencySettings,
                            exchangeRate: parseFloat(e.target.value) || 0
                          })}
                          className="input-glass w-32 text-right"
                          step="0.01"
                        />
                        <span className="text-gray-300">ARS</span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                      Última actualización: {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Opciones avanzadas */}
                <div>
                  <h3 className="text-white font-medium mb-4">Opciones Avanzadas</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Conversión Automática</p>
                        <p className="text-gray-400 text-sm">Convertir automáticamente entre monedas en los reportes</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={tempCurrencySettings.autoConvert}
                        onChange={(e) => setTempCurrencySettings({
                          ...tempCurrencySettings,
                          autoConvert: e.target.checked
                        })}
                        className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Mostrar Ambas Monedas</p>
                        <p className="text-gray-400 text-sm">Mostrar tanto USD como ARS en los reportes</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={tempCurrencySettings.showBothCurrencies}
                        onChange={(e) => setTempCurrencySettings({
                          ...tempCurrencySettings,
                          showBothCurrencies: e.target.checked
                        })}
                        className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Vista previa */}
                <div>
                  <h3 className="text-white font-medium mb-4">Vista Previa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-2">Formato USD</p>
                      <p className="text-xl font-bold text-green-400">
                        {currencySystem.formatCurrency(15000, 'USD')}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-2">Formato ARS</p>
                      <p className="text-xl font-bold text-green-400">
                        {currencySystem.formatCurrency(15000000, 'ARS')}
                      </p>
                    </div>
                  </div>
                  
                  {tempCurrencySettings.showBothCurrencies && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-400 text-sm mb-2">Con ambas monedas habilitadas:</p>
                      <p className="text-white">
                        US$15,000 <span className="text-gray-400">≈</span> $15,000,000
                      </p>
                    </div>
                  )}
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tema
                  </label>
                  <select
                    value={settings.sistema.tema}
                    onChange={(e) => setSettings({
                      ...settings,
                      sistema: { ...settings.sistema, tema: e.target.value }
                    })}
                    className="input-glass w-full"
                  >
                    <option value="dark">Oscuro</option>
                    <option value="light">Claro</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button 
              onClick={handleResetSettings}
              className="btn-secondary"
              disabled={saving}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restablecer
            </button>
            <button 
              onClick={handleSaveSettings}
              className="btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}