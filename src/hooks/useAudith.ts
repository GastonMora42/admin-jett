// =====================================================
// HOOK AUDITORÍA CORREGIDO - src/hooks/useAudit.ts
// =====================================================
import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

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
    // ✅ CORREGIDO: Usar user?.['custom:role'] en lugar de user?.rol
    const canViewAudit = user?.['custom:role'] === 'SUPERADMIN' || user?.['custom:role'] === 'ADMIN'
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