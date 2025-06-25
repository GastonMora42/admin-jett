// =====================================================
// HOOK CONFIGURACIONES - src/hooks/useSettings.ts
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

  const canEditSettings = user?.rol === 'SUPERADMIN'

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

// =====================================================
// HOOK AUDITORÍA - src/hooks/useAudit.ts
// =====================================================

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface AuditFilters {
  userId?: string
  action?: string
  resource?: string
  severity?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export const useAudit = () => {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  const canViewAudit = user?.rol === 'SUPERADMIN' || user?.rol === 'ADMIN'

  const fetchLogs = async (filters: AuditFilters = {}) => {
    if (!canViewAudit) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/audit?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const logAction = async (
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>,
    severity: AuditLog['severity'] = 'low'
  ) => {
    try {
      await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          resource,
          resourceId,
          details,
          severity
        })
      })
    } catch (error) {
      console.error('Error logging audit action:', error)
    }
  }

  const exportLogs = async (filters: AuditFilters = {}) => {
    if (!canViewAudit) return

    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/audit/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error)
    }
  }

  useEffect(() => {
    if (canViewAudit) {
      fetchLogs()
    }
  }, [user])

  return {
    logs,
    loading,
    pagination,
    canViewAudit,
    fetchLogs,
    logAction,
    exportLogs
  }
}

// =====================================================
// HOOK ESTADÍSTICAS SISTEMA - src/hooks/useSystemStats.ts
// =====================================================

interface SystemStats {
  database: {
    totalUsers: number
    activeUsers: number
    totalClients: number
    totalProjects: number
    totalPayments: number
    diskUsage: number
  }
  performance: {
    uptime: number
    responseTime: number
    errorRate: number
    requestsPerMinute: number
  }
  security: {
    loginAttempts: number
    failedLogins: number
    blockedIPs: number
    activeSessions: number
  }
}

export const useSystemStats = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  const canViewStats = user?.rol === 'SUPERADMIN'

  const fetchStats = async () => {
    if (!canViewStats) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/system/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching system stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = () => {
    fetchStats()
  }

  useEffect(() => {
    fetchStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [user])

  return {
    stats,
    loading,
    canViewStats,
    refreshStats
  }
}