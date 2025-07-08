// HOOK CONFIGURACIONES CORREGIDO - src/hooks/useSettings.ts
// =====================================================
import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
interface SystemSettings {
general: {
siteName: string
siteDescription: string
timezone: string
defaultCurrency: string
dateFormat: string
language: string
}
email: {
smtpHost: string
smtpPort: number
smtpUser: string
smtpPassword: string
fromEmail: string
fromName: string
enabled: boolean
}
notifications: {
emailEnabled: boolean
smsEnabled: boolean
pushEnabled: boolean
paymentReminders: boolean
projectUpdates: boolean
weeklyReports: boolean
}
security: {
sessionTimeout: number
passwordMinLength: number
requireMFA: boolean
allowedDomains: string[]
maxLoginAttempts: number
}
features: {
clientPortal: boolean
paymentGateway: boolean
autoBackups: boolean
analytics: boolean
apiAccess: boolean
}
}
const defaultSettings: SystemSettings = {
general: {
siteName: 'PayTracker',
siteDescription: 'Sistema de gestión de pagos',
timezone: 'America/Argentina/Buenos_Aires',
defaultCurrency: 'ARS',
dateFormat: 'DD/MM/YYYY',
language: 'es'
},
email: {
smtpHost: '',
smtpPort: 587,
smtpUser: '',
smtpPassword: '',
fromEmail: '',
fromName: 'PayTracker',
enabled: false
},
notifications: {
emailEnabled: true,
smsEnabled: false,
pushEnabled: true,
paymentReminders: true,
projectUpdates: true,
weeklyReports: false
},
security: {
sessionTimeout: 24,
passwordMinLength: 8,
requireMFA: false,
allowedDomains: [],
maxLoginAttempts: 5
},
features: {
clientPortal: false,
paymentGateway: false,
autoBackups: true,
analytics: true,
apiAccess: false
}
}
export const useSettings = () => {
const { user } = useAuth()
const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
const [loading, setLoading] = useState(true)
const [saving, setSaving] = useState(false)
const [error, setError] = useState<string | null>(null)
// ✅ CORREGIDO: Usar user?.['custom:role'] en lugar de user?.rol
const canEditSettings = user?.['custom:role'] === 'SUPERADMIN'
const fetchSettings = async () => {
if (!canEditSettings) {
setLoading(false)
return
}
try {
  setLoading(true)
  const response = await fetch('/api/configuracion')
  if (response.ok) {
    const data = await response.json()
    setSettings({ ...defaultSettings, ...data })
  } else {
    throw new Error('Error al cargar configuraciones')
  }
} catch (err) {
  setError(err instanceof Error ? err.message : 'Error desconocido')
} finally {
  setLoading(false)
}
}
const updateSettings = async (newSettings: Partial<SystemSettings>) => {
if (!canEditSettings) {
throw new Error('No tienes permisos para modificar configuraciones')
}
try {
  setSaving(true)
  setError(null)

  const response = await fetch('/api/configuracion', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSettings)
  })

  if (response.ok) {
    const updatedSettings = await response.json()
    setSettings({ ...settings, ...updatedSettings })
    return true
  } else {
    throw new Error('Error al guardar configuraciones')
  }
} catch (err) {
  setError(err instanceof Error ? err.message : 'Error al guardar')
  throw err
} finally {
  setSaving(false)
}
}
const resetSettings = async () => {
return updateSettings(defaultSettings)
}
const testEmailSettings = async () => {
try {
const response = await fetch('/api/configuracion/test-email', {
method: 'POST'
})
  if (response.ok) {
    return { success: true, message: 'Email de prueba enviado correctamente' }
  } else {
    const error = await response.json()
    throw new Error(error.message || 'Error al enviar email de prueba')
  }
} catch (err) {
  return { 
    success: false, 
    message: err instanceof Error ? err.message : 'Error al enviar email' 
  }
}
}
useEffect(() => {
fetchSettings()
}, [user])
return {
settings,
loading,
saving,
error,
canEditSettings,
updateSettings,
resetSettings,
testEmailSettings,
refreshSettings: fetchSettings
}
}