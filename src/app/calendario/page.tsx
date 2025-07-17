// src/app/calendario/page.tsx - VERSIÓN FUNCIONAL COMPLETA
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock,
  AlertCircle,
  CheckCircle,
  DollarSign,
  User,
  FolderOpen,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  X
} from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useApi } from '@/lib/api-client'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  type: 'pago_vencimiento' | 'proyecto_entrega' | 'reunion' | 'seguimiento' | 'evento_personalizado'
  status: 'pendiente' | 'completado' | 'vencido' | 'en_progreso'
  description?: string
  relatedId?: string
  priority: 'low' | 'medium' | 'high'
  metadata?: {
    clienteNombre?: string
    proyectoNombre?: string
    monto?: number
    metodoPago?: string
  }
}

interface EventFormData {
  title: string
  date: string
  time: string
  type: CalendarEvent['type']
  description: string
  priority: CalendarEvent['priority']
}

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const api = useApi()

  useEffect(() => {
    loadCalendarData()
    // No es necesario limpiar nada aquí porque 'api.cleanup' no existe
  }, [])

  useEffect(() => {
    applyFilters()
  }, [events, filterType, filterStatus])

  const loadCalendarData = async () => {
    try {
      setLoading(true)
      
      // Cargar datos de pagos y proyectos para generar eventos
      const [pagos, proyectos] = await Promise.all([
        api.get('/api/pagos', false),
        api.get('/api/proyectos', false)
      ])

      // Generar eventos del calendario
      const generatedEvents = generateCalendarEvents(
        Array.isArray(pagos) ? pagos : [],
        Array.isArray(proyectos) ? proyectos : []
      )
      setEvents(generatedEvents)
    } catch (error) {
      console.error('Error al cargar los datos del calendario:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCalendarEvents = (pagos: any[], proyectos: any[]): CalendarEvent[] => {
    const events: CalendarEvent[] = []

    // Eventos de pagos
    pagos.forEach(pago => {
      const fechaVencimiento = new Date(pago.fechaVencimiento)
      const hoy = new Date()
      let status: CalendarEvent['status'] = 'pendiente'
      
      if (pago.estadoPago === 'PAGADO') {
        status = 'completado'
      } else if (fechaVencimiento < hoy) {
        status = 'vencido'
      }

      events.push({
        id: `pago-${pago.id}`,
        title: `Vencimiento pago - ${pago.proyecto?.cliente?.nombre || 'Cliente'}`,
        date: pago.fechaVencimiento,
        type: 'pago_vencimiento',
        status,
        description: `Cuota ${pago.numeroCuota} por $${pago.montoCuota.toLocaleString()}`,
        relatedId: pago.id,
        priority: status === 'vencido' ? 'high' : 'medium',
        metadata: {
          clienteNombre: pago.proyecto?.cliente?.nombre,
          proyectoNombre: pago.proyecto?.nombre,
          monto: pago.montoCuota,
          metodoPago: pago.metodoPago
        }
      })
    })

    // Eventos de entregas de proyectos
    proyectos.forEach(proyecto => {
      if (proyecto.fechaEntrega) {
        const fechaEntrega = new Date(proyecto.fechaEntrega)
        const hoy = new Date()
        let status: CalendarEvent['status'] = 'pendiente'
        
        if (proyecto.estadoProyecto === 'COMPLETADO') {
          status = 'completado'
        } else if (fechaEntrega < hoy) {
          status = 'vencido'
        } else if (proyecto.estadoProyecto === 'EN_DESARROLLO') {
          status = 'en_progreso'
        }

        events.push({
          id: `entrega-${proyecto.id}`,
          title: `Entrega - ${proyecto.nombre}`,
          date: proyecto.fechaEntrega,
          type: 'proyecto_entrega',
          status,
          description: `Entrega del proyecto ${proyecto.nombre} para ${proyecto.cliente?.nombre}`,
          relatedId: proyecto.id,
          priority: status === 'vencido' ? 'high' : 'medium',
          metadata: {
            clienteNombre: proyecto.cliente?.nombre,
            proyectoNombre: proyecto.nombre,
            monto: proyecto.montoTotal
          }
        })
      }
    })

    // Eventos de seguimiento automático (próximos contactos)
    const clientesConProyectos = new Map()
    proyectos.forEach(proyecto => {
      if (proyecto.estadoProyecto === 'EN_DESARROLLO') {
        const clienteId = proyecto.clienteId
        if (!clientesConProyectos.has(clienteId)) {
          clientesConProyectos.set(clienteId, proyecto.cliente)
          
          // Crear evento de seguimiento para la próxima semana
          const fechaSeguimiento = new Date()
          fechaSeguimiento.setDate(fechaSeguimiento.getDate() + 7)
          
          events.push({
            id: `seguimiento-${clienteId}`,
            title: `Seguimiento - ${proyecto.cliente?.nombre}`,
            date: fechaSeguimiento.toISOString(),
            type: 'seguimiento',
            status: 'pendiente',
            description: `Seguimiento del progreso con ${proyecto.cliente?.nombre}`,
            relatedId: clienteId,
            priority: 'low',
            metadata: {
              clienteNombre: proyecto.cliente?.nombre
            }
          })
        }
      }
    })

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const applyFilters = () => {
    let filtered = events

    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.type === filterType)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(event => event.status === filterStatus)
    }

    setFilteredEvents(filtered)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Días del mes anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i)
      days.push({ date: day, isCurrentMonth: false })
    }
    
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i)
      days.push({ date: day, isCurrentMonth: true })
    }
    
    // Días del próximo mes para completar la grilla
    const totalCells = Math.ceil(days.length / 7) * 7
    for (let i = 1; days.length < totalCells; i++) {
      const day = new Date(year, month + 1, i)
      days.push({ date: day, isCurrentMonth: false })
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return filteredEvents.filter(event => 
      event.date.split('T')[0] === dateStr
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const eventsForDate = getEventsForDate(date)
    if (eventsForDate.length === 1) {
      setSelectedEvent(eventsForDate[0])
    }
  }

  const handleCreateEvent = async (eventData: EventFormData) => {
    try {
      const newEvent: CalendarEvent = {
        id: `custom-${Date.now()}`,
        title: eventData.title,
        date: `${eventData.date}T${eventData.time || '09:00'}:00`,
        time: eventData.time,
        type: eventData.type,
        status: 'pendiente',
        description: eventData.description,
        priority: eventData.priority
      }

      setEvents(prev => [...prev, newEvent])
      setShowEventForm(false)
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setEvents(prev => prev.filter(e => e.id !== eventId))
      setSelectedEvent(null)
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'pago_vencimiento': return <DollarSign className="w-3 h-3" />
      case 'proyecto_entrega': return <FolderOpen className="w-3 h-3" />
      case 'reunion': return <User className="w-3 h-3" />
      case 'seguimiento': return <Clock className="w-3 h-3" />
      default: return <Calendar className="w-3 h-3" />
    }
  }

  const getEventTypeColor = (type: CalendarEvent['type'], status: CalendarEvent['status']) => {
    if (status === 'vencido') return 'bg-red-500/20 text-red-400 border-red-500/30'
    if (status === 'completado') return 'bg-green-500/20 text-green-400 border-green-500/30'
    
    switch (type) {
      case 'pago_vencimiento': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'proyecto_entrega': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'reunion': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'seguimiento': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-green-500/20 text-green-400 border-green-500/30'
    }
  }

  const getStatusIcon = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'completado': return <CheckCircle className="w-3 h-3 text-green-400" />
      case 'vencido': return <AlertCircle className="w-3 h-3 text-red-400" />
      case 'en_progreso': return <Clock className="w-3 h-3 text-blue-400" />
      default: return <Clock className="w-3 h-3 text-gray-400" />
    }
  }

  const days = getDaysInMonth(currentDate)
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendario</h1>
          <p className="text-gray-400 mt-1">
            Gestiona fechas importantes y vencimientos ({filteredEvents.length} eventos)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCalendarData}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button 
            onClick={() => setShowEventForm(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Evento
          </button>
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-glass"
            >
              <option value="all">Todos los tipos</option>
              <option value="pago_vencimiento">Vencimientos de pago</option>
              <option value="proyecto_entrega">Entregas de proyecto</option>
              <option value="reunion">Reuniones</option>
              <option value="seguimiento">Seguimientos</option>
              <option value="evento_personalizado">Eventos personalizados</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-glass"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En progreso</option>
              <option value="completado">Completado</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="btn-secondary text-sm"
            >
              Hoy
            </button>
            <div className="flex bg-white/5 rounded-lg p-1">
              {(['month', 'week', 'day'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === mode ? 'bg-white/10 text-white' : 'text-gray-400'
                  }`}
                >
                  {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Día'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendario principal */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            {/* Header del calendario */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button 
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="text-center text-gray-400 text-sm font-medium p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Grilla del calendario */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const dayEvents = getEventsForDate(day.date)
                const hasEvents = dayEvents.length > 0
                const hasUrgentEvents = dayEvents.some(e => e.status === 'vencido' || e.priority === 'high')
                
                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleDateClick(day.date)}
                    className={`
                      relative p-2 min-h-[80px] border rounded-lg cursor-pointer transition-all
                      ${day.isCurrentMonth ? 'bg-white/5 border-white/10' : 'bg-gray-800/50 border-gray-700/50'}
                      ${isToday(day.date) ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}
                      ${isSelected(day.date) ? 'ring-2 ring-purple-500 bg-purple-500/10' : ''}
                      ${hasUrgentEvents ? 'border-red-500/50 bg-red-500/5' : ''}
                      hover:bg-white/10
                    `}
                  >
                    <div className={`text-sm font-medium ${
                      day.isCurrentMonth ? 'text-white' : 'text-gray-500'
                    } ${isToday(day.date) ? 'text-blue-400' : ''}`}>
                      {day.date.getDate()}
                    </div>
                    
                    {hasEvents && (
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs px-1 py-0.5 rounded border truncate flex items-center gap-1 ${
                              getEventTypeColor(event.type, event.status)
                            }`}
                            title={event.title}
                          >
                            {getEventTypeIcon(event.type)}
                            <span className="truncate">
                              {event.title.length > 10 ? event.title.substring(0, 10) + '...' : event.title}
                            </span>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-400">
                            +{dayEvents.length - 2} más
                          </div>
                        )}
                      </div>
                    )}

                    {hasUrgentEvents && (
                      <div className="absolute top-1 right-1">
                        <AlertCircle className="w-3 h-3 text-red-400" />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Resumen de eventos */}
          <div className="card p-4">
            <h3 className="text-white font-semibold mb-4">Resumen</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Total eventos</span>
                <span className="text-white font-medium">{filteredEvents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Pendientes</span>
                <span className="text-yellow-400 font-medium">
                  {filteredEvents.filter(e => e.status === 'pendiente').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Vencidos</span>
                <span className="text-red-400 font-medium">
                  {filteredEvents.filter(e => e.status === 'vencido').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Completados</span>
                <span className="text-green-400 font-medium">
                  {filteredEvents.filter(e => e.status === 'completado').length}
                </span>
              </div>
            </div>
          </div>

          {/* Eventos del día seleccionado */}
          {selectedDate && (
            <div className="card p-4">
              <h3 className="text-white font-semibold mb-4">
                {selectedDate.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h3>
              <div className="space-y-2">
                {getEventsForDate(selectedDate).map(event => (
                  <motion.div
                    key={event.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedEvent(event)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      getEventTypeColor(event.type, event.status)
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(event.type)}
                        <span className="font-medium text-sm truncate">{event.title}</span>
                      </div>
                      {getStatusIcon(event.status)}
                    </div>
                    {event.time && (
                      <div className="text-xs opacity-75">{event.time}</div>
                    )}
                    {event.metadata?.monto && (
                      <div className="text-xs opacity-75">
                        ${event.metadata.monto.toLocaleString()}
                      </div>
                    )}
                  </motion.div>
                ))}
                {getEventsForDate(selectedDate).length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No hay eventos para este día
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Próximos eventos urgentes */}
          <div className="card p-4">
            <h3 className="text-white font-semibold mb-4">Próximos Urgentes</h3>
            <div className="space-y-2">
              {filteredEvents
                .filter(e => e.status === 'vencido' || (e.priority === 'high' && e.status === 'pendiente'))
                .slice(0, 5)
                .map(event => (
                  <div
                    key={event.id}
                    className="p-2 bg-red-500/10 border border-red-500/20 rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 text-red-400" />
                      <span className="text-red-400 font-medium truncate">{event.title}</span>
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              {filteredEvents.filter(e => e.status === 'vencido' || (e.priority === 'high' && e.status === 'pendiente')).length === 0 && (
                <p className="text-gray-400 text-sm text-center py-2">
                  No hay eventos urgentes
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalle de evento */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Detalle del Evento</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    getEventTypeColor(selectedEvent.type, selectedEvent.status)
                  }`}>
                    {getEventTypeIcon(selectedEvent.type)}
                    <span>{selectedEvent.title}</span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Fecha y hora</p>
                  <p className="text-white">
                    {new Date(selectedEvent.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {selectedEvent.time && ` a las ${selectedEvent.time}`}
                  </p>
                </div>

                {selectedEvent.description && (
                  <div>
                    <p className="text-gray-400 text-sm">Descripción</p>
                    <p className="text-white">{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.metadata && (
                  <div className="space-y-2">
                    {selectedEvent.metadata.clienteNombre && (
                      <div>
                        <p className="text-gray-400 text-sm">Cliente</p>
                        <p className="text-white">{selectedEvent.metadata.clienteNombre}</p>
                      </div>
                    )}
                    {selectedEvent.metadata.proyectoNombre && (
                      <div>
                        <p className="text-gray-400 text-sm">Proyecto</p>
                        <p className="text-white">{selectedEvent.metadata.proyectoNombre}</p>
                      </div>
                    )}
                    {selectedEvent.metadata.monto && (
                      <div>
                        <p className="text-gray-400 text-sm">Monto</p>
                        <p className="text-green-400 font-medium">
                          ${selectedEvent.metadata.monto.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4">
                  {selectedEvent.id.startsWith('custom-') && (
                    <>
                      <button
                        onClick={() => {
                          setEditingEvent(selectedEvent)
                          setSelectedEvent(null)
                          setShowEventForm(true)
                        }}
                        className="btn-secondary flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteEvent(selectedEvent.id)
                        }}
                        className="btn-secondary text-red-400 flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </button>
                    </>
                  )}
                  {selectedEvent.relatedId && (
                    <button
                      onClick={() => {
                        // Aquí podrías redirigir al detalle del pago/proyecto
                        console.log('Navigate to:', selectedEvent.relatedId)
                      }}
                      className="btn-primary flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalle
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario de evento */}
      <EventFormModal
        isOpen={showEventForm}
        onClose={() => {
          setShowEventForm(false)
          setEditingEvent(null)
        }}
        onSubmit={handleCreateEvent}
        editingEvent={editingEvent}
        selectedDate={selectedDate}
      />
    </motion.div>
  )
}

// Componente del formulario de eventos
interface EventFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EventFormData) => void
  editingEvent?: CalendarEvent | null
  selectedDate?: Date | null
}

const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingEvent,
  selectedDate
}) => {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    date: '',
    time: '',
    type: 'evento_personalizado',
    description: '',
    priority: 'medium'
  })

  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setFormData({
          title: editingEvent.title,
          date: editingEvent.date.split('T')[0],
          time: editingEvent.time || '',
          type: editingEvent.type,
          description: editingEvent.description || '',
          priority: editingEvent.priority
        })
      } else {
        const dateStr = selectedDate ? 
          selectedDate.toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0]
        
        setFormData({
          title: '',
          date: dateStr,
          time: '09:00',
          type: 'evento_personalizado',
          description: '',
          priority: 'medium'
        })
      }
    }
  }, [isOpen, editingEvent, selectedDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
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
        className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Título *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="input-glass w-full"
              placeholder="Título del evento"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fecha *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hora
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="input-glass w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de evento
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as any})}
              className="input-glass w-full"
            >
              <option value="evento_personalizado">Evento personalizado</option>
              <option value="reunion">Reunión</option>
              <option value="seguimiento">Seguimiento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prioridad
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
              className="input-glass w-full"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="input-glass w-full resize-none"
              placeholder="Descripción del evento..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              {editingEvent ? 'Actualizar' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}