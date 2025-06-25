// =====================================================
// CENTRO DE NOTIFICACIONES - src/components/NotificationCenter.tsx
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  X, 
  Check, 
  AlertCircle, 
  Clock, 
  DollarSign,
  Users,
  FolderOpen,
  Settings,
  Trash2,
  MoreVertical
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Notification {
  id: string
  tipo: 'pago_vencido' | 'pago_proximo' | 'proyecto_completado' | 'nuevo_cliente' | 'sistema' | 'recordatorio'
  titulo: string
  mensaje: string
  fecha: string
  leida: boolean
  urgente: boolean
  accion?: {
    label: string
    url: string
  }
  metadata?: {
    clienteId?: string
    proyectoId?: string
    pagoId?: string
    monto?: number
  }
}

export const NotificationCenter = () => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'todas' | 'no_leidas' | 'urgentes'>('todas')

  useEffect(() => {
    fetchNotifications()
    // Configurar polling para nuevas notificaciones
    const interval = setInterval(fetchNotifications, 30000) // Cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notificaciones')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notificaciones/${notificationId}/read`, {
        method: 'PUT'
      })
      
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, leida: true } : n
      ))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notificaciones/mark-all-read', {
        method: 'PUT'
      })
      
      setNotifications(notifications.map(n => ({ ...n, leida: true })))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notificaciones/${notificationId}`, {
        method: 'DELETE'
      })
      
      setNotifications(notifications.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (tipo: Notification['tipo']) => {
    switch (tipo) {
      case 'pago_vencido': return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'pago_proximo': return <Clock className="w-5 h-5 text-yellow-400" />
      case 'proyecto_completado': return <FolderOpen className="w-5 h-5 text-green-400" />
      case 'nuevo_cliente': return <Users className="w-5 h-5 text-blue-400" />
      case 'sistema': return <Settings className="w-5 h-5 text-purple-400" />
      case 'recordatorio': return <Bell className="w-5 h-5 text-gray-400" />
      default: return <Bell className="w-5 h-5 text-gray-400" />
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'no_leidas': return !notification.leida
      case 'urgentes': return notification.urgente
      default: return true
    }
  })

  const unreadCount = notifications.filter(n => !n.leida).length

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              className="fixed right-0 top-0 h-full w-96 bg-black/90 backdrop-blur-xl border-l border-white/20 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Notificaciones</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Filters */}
                <div className="flex space-x-2">
                  {[
                    { key: 'todas', label: 'Todas' },
                    { key: 'no_leidas', label: 'No leídas' },
                    { key: 'urgentes', label: 'Urgentes' }
                  ].map((filterOption) => (
                    <button
                      key={filterOption.key}
                      onClick={() => setFilter(filterOption.key as any)}
                      className={`px-3 py-1 rounded text-xs transition-colors ${
                        filter === filterOption.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {filterOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {notifications.some(n => !n.leida) && (
                <div className="px-6 py-3 border-b border-white/10">
                  <button
                    onClick={markAllAsRead}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    <Check className="w-4 h-4 inline mr-1" />
                    Marcar todas como leídas
                  </button>
                </div>
              )}

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="loading-shimmer h-4 rounded mb-2" />
                    <div className="loading-shimmer h-4 rounded mb-2" />
                    <div className="loading-shimmer h-4 rounded" />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400">No hay notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {filteredNotifications.map((notification, index) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        index={index}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// Componente individual de notificación
interface NotificationItemProps {
  notification: Notification
  index: number
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  index,
  onMarkAsRead,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false)

  const getNotificationIcon = (tipo: Notification['tipo']) => {
    switch (tipo) {
      case 'pago_vencido': return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'pago_proximo': return <Clock className="w-5 h-5 text-yellow-400" />
      case 'proyecto_completado': return <FolderOpen className="w-5 h-5 text-green-400" />
      case 'nuevo_cliente': return <Users className="w-5 h-5 text-blue-400" />
      case 'sistema': return <Settings className="w-5 h-5 text-purple-400" />
      case 'recordatorio': return <Bell className="w-5 h-5 text-gray-400" />
      default: return <Bell className="w-5 h-5 text-gray-400" />
    }
  }

  const timeAgo = (fecha: string) => {
    const now = new Date()
    const time = new Date(fecha)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Hace unos minutos'
    if (diffInHours < 24) return `Hace ${diffInHours}h`
    const diffInDays = Math.floor(diffInHours / 24)
    return `Hace ${diffInDays}d`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-4 hover:bg-white/5 transition-colors relative ${
        !notification.leida ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''
      } ${notification.urgente ? 'border-l-2 border-l-red-500' : ''}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.tipo)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-medium ${
              !notification.leida ? 'text-white' : 'text-gray-300'
            }`}>
              {notification.titulo}
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">{timeAgo(notification.fecha)}</span>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">
            {notification.mensaje}
          </p>
          
          {notification.metadata?.monto && (
            <p className="text-sm text-green-400 mt-1 font-medium">
              ${notification.metadata.monto.toLocaleString()}
            </p>
          )}
          
          {notification.accion && (
            <button className="text-blue-400 hover:text-blue-300 text-xs mt-2 transition-colors">
              {notification.accion.label} →
            </button>
          )}
        </div>
      </div>

      {/* Menu contextual */}
      {showMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute right-4 top-12 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg py-2 z-10 min-w-[120px]"
        >
          {!notification.leida && (
            <button
              onClick={() => {
                onMarkAsRead(notification.id)
                setShowMenu(false)
              }}
              className="w-full px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 text-xs"
            >
              <Check className="w-3 h-3 inline mr-2" />
              Marcar como leída
            </button>
          )}
          <button
            onClick={() => {
              onDelete(notification.id)
              setShowMenu(false)
            }}
            className="w-full px-3 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
          >
            <Trash2 className="w-3 h-3 inline mr-2" />
            Eliminar
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

// Hook para usar notificaciones
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notificaciones')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: Notification) => !n.leida).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'fecha'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      fecha: new Date().toISOString()
    }
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    notifications,
    unreadCount,
    addNotification,
    fetchNotifications
  }
}