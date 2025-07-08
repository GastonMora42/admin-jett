
  // =====================================================
  // HOOK ESTADÍSTICAS SISTEMA - src/hooks/useSystemStats.ts
  // =====================================================
  
import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

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
    // ✅ CORREGIDO: Usar user?.['custom:role'] en lugar de user?.rol
    const canViewStats = user?.['custom:role'] === 'SUPERADMIN'
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