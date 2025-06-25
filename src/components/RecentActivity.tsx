
// =====================================================
// RECENT ACTIVITY - src/components/RecentActivity.tsx
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  UserPlus, 
  FolderPlus,
  DollarSign,
  Calendar
} from 'lucide-react'

interface Activity {
  id: string
  tipo: 'pago_recibido' | 'proyecto_creado' | 'cliente_agregado' | 'pago_vencido'
  titulo: string
  descripcion: string
  fecha: string
  monto?: number
  urgente?: boolean
}

export const RecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      // Simular actividades recientes
      const data: Activity[] = [
        {
          id: '1',
          tipo: 'pago_recibido',
          titulo: 'Pago Recibido',
          descripcion: 'Juan Pérez - Sistema CRM (Cuota 1)',
          fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
          monto: 2500
        },
        {
          id: '2',
          tipo: 'proyecto_creado',
          titulo: 'Nuevo Proyecto',
          descripcion: 'E-commerce para María García',
          fecha: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 horas atrás
          monto: 8000
        },
        {
          id: '3',
          tipo: 'pago_vencido',
          titulo: 'Pago Vencido',
          descripcion: 'Carlos López - Landing Page',
          fecha: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 día atrás
          monto: 1500,
          urgente: true
        },
        {
          id: '4',
          tipo: 'cliente_agregado',
          titulo: 'Nuevo Cliente',
          descripcion: 'Ana Rodríguez - TechStart SRL',
          fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 días atrás
        },
        {
          id: '5',
          tipo: 'pago_recibido',
          titulo: 'Pago Recibido',
          descripcion: 'Luis Martín - App Móvil (Final)',
          fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 días atrás
          monto: 4000
        }
      ]
      setActivities(data)
    } catch (error) {
      console.error('Error al cargar actividades:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (tipo: Activity['tipo']) => {
    switch (tipo) {
      case 'pago_recibido':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'proyecto_creado':
        return <FolderPlus className="w-4 h-4 text-blue-400" />
      case 'cliente_agregado':
        return <UserPlus className="w-4 h-4 text-purple-400" />
      case 'pago_vencido':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getTimeAgo = (fecha: string) => {
    const now = new Date()
    const time = new Date(fecha)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Hace unos minutos'
    if (diffInHours < 24) return `Hace ${diffInHours}h`
    const diffInDays = Math.floor(diffInHours / 24)
    return `Hace ${diffInDays}d`
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold text-lg">Actividad Reciente</h3>
          <p className="text-gray-400 text-sm">Últimas acciones en tu sistema</p>
        </div>
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="loading-shimmer h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-colors hover:bg-white/5 ${
                activity.urgente ? 'bg-red-500/10 border border-red-500/20' : ''
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.tipo)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium text-sm">{activity.titulo}</h4>
                  <span className="text-gray-400 text-xs whitespace-nowrap ml-2">
                    {getTimeAgo(activity.fecha)}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1 truncate">
                  {activity.descripcion}
                </p>
                {activity.monto && (
                  <p className="text-green-400 font-medium text-sm mt-1">
                    ${activity.monto.toLocaleString()}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-white/10">
        <button className="w-full btn-secondary text-sm">
          Ver toda la actividad
        </button>
      </div>
    </div>
  )
}
