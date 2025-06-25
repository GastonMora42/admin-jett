// =====================================================
// PÁGINA DE PAGOS - src/app/pagos/page.tsx
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  CreditCard,
  User,
  FolderOpen,
  Eye,
  Edit,
  MoreVertical,
  Banknote,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { RegistrarPago } from '@/components/RegistrarPago'
import { PagoDetalle } from '@/components/PagoDetalle'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'

interface Pago {
  id: string
  numeroCuota: number
  montoCuota: number
  fechaVencimiento: string
  fechaPagoReal?: string
  estadoPago: EstadoPago
  metodoPago?: string
  notas?: string
  proyectoId: string
  proyecto?: Proyecto
}

type EstadoPago = 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'PARCIAL'

interface Proyecto {
  id: string
  nombre: string
  cliente?: Cliente
}

interface Cliente {
  id: string
  nombre: string
  empresa?: string
}

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroFecha, setFiltroFecha] = useState<string>('todos')
  const [showRegistrarPago, setShowRegistrarPago] = useState(false)
  const [pagoToRegister, setPagoToRegister] = useState<Pago | null>(null)
  const [viewingPago, setViewingPago] = useState<Pago | null>(null)
  const [selectedPagos, setSelectedPagos] = useState<string[]>([])
  const [vista, setVista] = useState<'cards' | 'calendar' | 'table'>('cards')

  useEffect(() => {
    fetchPagos()
    // Marcar pagos vencidos automáticamente
    const interval = setInterval(marcarPagosVencidos, 60000) // Cada minuto
    return () => clearInterval(interval)
  }, [])

  const fetchPagos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pagos')
      if (!response.ok) throw new Error('Error al cargar pagos')
      const data = await response.json()
      setPagos(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const marcarPagosVencidos = async () => {
    try {
      await fetch('/api/pagos/marcar-vencidos', { method: 'POST' })
      fetchPagos()
    } catch (error) {
      console.error('Error al marcar pagos vencidos:', error)
    }
  }

  const handleRegistrarPago = async (pagoData: Partial<Pago>) => {
    if (!pagoToRegister) return
    
    try {
      const response = await fetch(`/api/pagos/${pagoToRegister.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pagoData,
          estadoPago: 'PAGADO',
          fechaPagoReal: new Date().toISOString()
        })
      })
      
      if (!response.ok) throw new Error('Error al registrar pago')
      
      await fetchPagos()
      setShowRegistrarPago(false)
      setPagoToRegister(null)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleMarcarPagado = (pago: Pago) => {
    setPagoToRegister(pago)
    setShowRegistrarPago(true)
  }

  const filteredPagos = pagos.filter(pago => {
    const matchesSearch = pago.proyecto?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pago.proyecto?.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pago.proyecto?.cliente?.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEstado = filtroEstado === 'todos' || pago.estadoPago === filtroEstado
    
    let matchesFecha = true
    if (filtroFecha !== 'todos') {
      const fecha = new Date(pago.fechaVencimiento)
      const hoy = new Date()
      
      switch (filtroFecha) {
        case 'vencidos':
          matchesFecha = fecha < hoy && pago.estadoPago === 'PENDIENTE'
          break
        case 'esta_semana':
          const finSemana = new Date()
          finSemana.setDate(hoy.getDate() + 7)
          matchesFecha = fecha >= hoy && fecha <= finSemana
          break
        case 'este_mes':
          matchesFecha = fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
          break
        case 'proximo_mes':
          const proximoMes = new Date()
          proximoMes.setMonth(hoy.getMonth() + 1)
          matchesFecha = fecha.getMonth() === proximoMes.getMonth() && fecha.getFullYear() === proximoMes.getFullYear()
          break
      }
    }
    
    return matchesSearch && matchesEstado && matchesFecha
  })

  const estadisticas = {
    total: pagos.length,
    pendientes: pagos.filter(p => p.estadoPago === 'PENDIENTE').length,
    pagados: pagos.filter(p => p.estadoPago === 'PAGADO').length,
    vencidos: pagos.filter(p => p.estadoPago === 'VENCIDO').length,
    totalPendiente: pagos.filter(p => p.estadoPago === 'PENDIENTE' || p.estadoPago === 'VENCIDO').reduce((sum, p) => sum + p.montoCuota, 0),
    totalCobrado: pagos.filter(p => p.estadoPago === 'PAGADO').reduce((sum, p) => sum + p.montoCuota, 0)
  }

  const pagosVencenProximosMes = pagos.filter(p => {
    const fecha = new Date(p.fechaVencimiento)
    const hoy = new Date()
    const proximoMes = new Date()
    proximoMes.setMonth(hoy.getMonth() + 1)
    return fecha.getMonth() === proximoMes.getMonth() && fecha.getFullYear() === proximoMes.getFullYear() && p.estadoPago === 'PENDIENTE'
  }).reduce((sum, p) => sum + p.montoCuota, 0)

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pagos</h1>
          <p className="text-gray-400 mt-1">
            Gestiona todos los pagos de tus proyectos ({filteredPagos.length} de {pagos.length})
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setVista('cards')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                vista === 'cards' ? 'bg-white/10 text-white' : 'text-gray-400'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setVista('calendar')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                vista === 'calendar' ? 'bg-white/10 text-white' : 'text-gray-400'
              }`}
            >
              Calendario
            </button>
            <button
              onClick={() => setVista('table')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                vista === 'table' ? 'bg-white/10 text-white' : 'text-gray-400'
              }`}
            >
              Tabla
            </button>
          </div>
          <button className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card p-4 text-center">
          <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-green-400">
            ${estadisticas.totalCobrado.toLocaleString()}
          </p>
          <p className="text-gray-400 text-sm">Cobrado</p>
        </div>
        <div className="card p-4 text-center">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-red-400">
            ${estadisticas.totalPendiente.toLocaleString()}
          </p>
          <p className="text-gray-400 text-sm">Pendiente</p>
        </div>
        <div className="card p-4 text-center">
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-400">{estadisticas.pagados}</p>
          <p className="text-gray-400 text-sm">Pagados</p>
        </div>
        <div className="card p-4 text-center">
          <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-400">{estadisticas.pendientes}</p>
          <p className="text-gray-400 text-sm">Pendientes</p>
        </div>
        <div className="card p-4 text-center">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-400">{estadisticas.vencidos}</p>
          <p className="text-gray-400 text-sm">Vencidos</p>
        </div>
        <div className="card p-4 text-center">
          <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-blue-400">
            ${pagosVencenProximosMes.toLocaleString()}
          </p>
          <p className="text-gray-400 text-sm">Próximo mes</p>
        </div>
      </div>

      {/* Alertas importantes */}
      {estadisticas.vencidos > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card bg-red-500/10 border-red-500/30 p-4"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-red-400 font-medium">
                Tienes {estadisticas.vencidos} pagos vencidos
              </h3>
              <p className="text-gray-400 text-sm">
                Es importante hacer seguimiento para mantener el flujo de caja
              </p>
            </div>
            <button
              onClick={() => setFiltroEstado('VENCIDO')}
              className="btn-secondary text-red-400 border-red-500/30"
            >
              Ver pagos vencidos
            </button>
          </div>
        </motion.div>
      )}

      {/* Filtros y búsqueda */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por proyecto, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-glass pl-10 w-full"
            />
          </div>
          
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="input-glass"
          >
            <option value="todos">Todos los estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="PAGADO">Pagados</option>
            <option value="VENCIDO">Vencidos</option>
            <option value="PARCIAL">Parciales</option>
          </select>
          
          <select
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="input-glass"
          >
            <option value="todos">Todas las fechas</option>
            <option value="vencidos">Vencidos</option>
            <option value="esta_semana">Esta semana</option>
            <option value="este_mes">Este mes</option>
            <option value="proximo_mes">Próximo mes</option>
          </select>
        </div>
        
        {selectedPagos.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <span className="text-sm text-gray-400">
              {selectedPagos.length} pagos seleccionados
            </span>
            <div className="flex items-center space-x-2">
              <button className="btn-secondary text-green-400">
                Marcar como pagados
              </button>
              <button className="btn-secondary text-blue-400">
                Enviar recordatorio
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de pagos */}
      {filteredPagos.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No hay pagos"
          description="Los pagos aparecerán aquí cuando se creen proyectos"
          action=""
          onAction={() => {}}
        />
      ) : vista === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredPagos.map((pago, index) => (
              <PagoCard
                key={pago.id}
                pago={pago}
                index={index}
                onMarcarPagado={() => handleMarcarPagado(pago)}
                onView={() => setViewingPago(pago)}
                onSelect={(selected) => {
                  if (selected) {
                    setSelectedPagos([...selectedPagos, pago.id])
                  } else {
                    setSelectedPagos(selectedPagos.filter(id => id !== pago.id))
                  }
                }}
                isSelected={selectedPagos.includes(pago.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : vista === 'table' ? (
        <PagosTable
          pagos={filteredPagos}
          onMarcarPagado={handleMarcarPagado}
          onView={setViewingPago}
          selectedPagos={selectedPagos}
          onSelectPago={(id, selected) => {
            if (selected) {
              setSelectedPagos([...selectedPagos, id])
            } else {
              setSelectedPagos(selectedPagos.filter(pid => pid !== id))
            }
          }}
        />
      ) : (
        <div className="card p-6 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Vista de Calendario</h3>
          <p className="text-gray-400">Próximamente - Vista de calendario para pagos</p>
        </div>
      )}

      {/* Registrar pago */}
      <RegistrarPago
        isOpen={showRegistrarPago}
        onClose={() => {
          setShowRegistrarPago(false)
          setPagoToRegister(null)
        }}
        onSubmit={handleRegistrarPago}
        pago={pagoToRegister}
      />

      {/* Detalle del pago */}
      <PagoDetalle
        pago={viewingPago}
        isOpen={!!viewingPago}
        onClose={() => setViewingPago(null)}
        onMarcarPagado={() => {
          if (viewingPago) {
            handleMarcarPagado(viewingPago)
            setViewingPago(null)
          }
        }}
      />
    </motion.div>
  )
}

// Componente de tarjeta de pago
interface PagoCardProps {
  pago: Pago
  index: number
  onMarcarPagado: () => void
  onView: () => void
  onSelect: (selected: boolean) => void
  isSelected: boolean
}

const PagoCard: React.FC<PagoCardProps> = ({
  pago,
  index,
  onMarcarPagado,
  onView,
  onSelect,
  isSelected
}) => {
  const [showMenu, setShowMenu] = useState(false)
  
  const getEstadoColor = (estado: EstadoPago) => {
    switch (estado) {
      case 'PAGADO': return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'PENDIENTE': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'VENCIDO': return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'PARCIAL': return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getEstadoIcon = (estado: EstadoPago) => {
    switch (estado) {
      case 'PAGADO': return <CheckCircle className="w-4 h-4" />
      case 'PENDIENTE': return <Clock className="w-4 h-4" />
      case 'VENCIDO': return <AlertCircle className="w-4 h-4" />
      case 'PARCIAL': return <CreditCard className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const esVencido = pago.estadoPago === 'VENCIDO' || 
    (pago.estadoPago === 'PENDIENTE' && new Date(pago.fechaVencimiento) < new Date())

  const diasRestantes = Math.ceil((new Date(pago.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className={`card relative group cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''
      } ${esVencido ? 'border-red-500/30 bg-red-500/5' : ''}`}
      onClick={onView}
    >
      {/* Checkbox y menú */}
      <div className="flex items-center justify-between mb-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation()
            onSelect(e.target.checked)
          }}
          className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
        />
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="p-2 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>

        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-0 top-12 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg py-2 z-10 min-w-[160px]"
          >
            {pago.estadoPago !== 'PAGADO' && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarcarPagado() }}
                className="w-full px-4 py-2 text-left text-green-400 hover:text-green-300 hover:bg-green-500/10 flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Marcar como pagado</span>
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onView() }}
              className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Ver detalles</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="w-full px-4 py-2 text-left text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 flex items-center space-x-2"
            >
              <Banknote className="w-4 h-4" />
              <span>Enviar recordatorio</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Contenido principal */}
      <div>
        {/* Monto y cuota */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xl font-bold text-white">
              ${pago.montoCuota.toLocaleString()}
            </p>
            <p className="text-gray-400 text-sm">
              Cuota {pago.numeroCuota}
            </p>
          </div>
          <div className={`px-3 py-1 rounded border text-xs font-medium flex items-center space-x-1 ${getEstadoColor(pago.estadoPago)}`}>
            {getEstadoIcon(pago.estadoPago)}
            <span>{pago.estadoPago}</span>
          </div>
        </div>

        {/* Proyecto y cliente */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm truncate">
              {pago.proyecto?.nombre || 'Proyecto no encontrado'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm truncate">
              {pago.proyecto?.cliente?.nombre || 'Cliente no asignado'}
            </span>
          </div>
        </div>

        {/* Fechas */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Vencimiento</span>
            <span className={`text-sm ${esVencido ? 'text-red-400' : 'text-gray-300'}`}>
              {new Date(pago.fechaVencimiento).toLocaleDateString()}
            </span>
          </div>
          {pago.fechaPagoReal && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Fecha de pago</span>
              <span className="text-green-400 text-sm">
                {new Date(pago.fechaPagoReal).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Método de pago */}
        {pago.metodoPago && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Método</span>
            <span className="text-gray-300 text-sm">{pago.metodoPago}</span>
          </div>
        )}

        {/* Indicador de tiempo */}
        {pago.estadoPago !== 'PAGADO' && (
          <div className="pt-4 border-t border-white/10">
            {esVencido ? (
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Vencido hace {Math.abs(diasRestantes)} días
                </span>
              </div>
            ) : diasRestantes <= 7 ? (
              <div className="flex items-center space-x-2 text-yellow-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Vence en {diasRestantes} días
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Vence en {diasRestantes} días
                </span>
              </div>
            )}
          </div>
        )}

        {/* Acción rápida */}
        {pago.estadoPago !== 'PAGADO' && (
          <div className="pt-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMarcarPagado()
              }}
              className="w-full btn-primary text-sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar como pagado
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Componente de tabla (simplificado)
const PagosTable: React.FC<{
  pagos: Pago[]
  onMarcarPagado: (pago: Pago) => void
  onView: (pago: Pago) => void
  selectedPagos: string[]
  onSelectPago: (id: string, selected: boolean) => void
}> = ({ pagos, onMarcarPagado, onView, selectedPagos, onSelectPago }) => {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-4 text-gray-400 font-medium">
                <input type="checkbox" className="rounded bg-white/10 border-white/20" />
              </th>
              <th className="text-left p-4 text-gray-400 font-medium">Cuota</th>
              <th className="text-left p-4 text-gray-400 font-medium">Monto</th>
              <th className="text-left p-4 text-gray-400 font-medium">Proyecto</th>
              <th className="text-left p-4 text-gray-400 font-medium">Cliente</th>
              <th className="text-left p-4 text-gray-400 font-medium">Vencimiento</th>
              <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
              <th className="text-left p-4 text-gray-400 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((pago, index) => (
              <motion.tr
                key={pago.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-t border-white/5 hover:bg-white/5"
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedPagos.includes(pago.id)}
                    onChange={(e) => onSelectPago(pago.id, e.target.checked)}
                    className="rounded bg-white/10 border-white/20"
                  />
                </td>
                <td className="p-4 text-gray-300">
                  Cuota {pago.numeroCuota}
                </td>
                <td className="p-4 text-green-400 font-medium">
                  ${pago.montoCuota.toLocaleString()}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => onView(pago)}
                    className="text-white hover:text-blue-400 text-left"
                  >
                    {pago.proyecto?.nombre || 'N/A'}
                  </button>
                </td>
                <td className="p-4 text-gray-300">
                  {pago.proyecto?.cliente?.nombre || 'N/A'}
                </td>
                <td className="p-4 text-gray-300">
                  {new Date(pago.fechaVencimiento).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    pago.estadoPago === 'PAGADO' ? 'bg-green-500/20 text-green-400' :
                    pago.estadoPago === 'PENDIENTE' ? 'bg-yellow-500/20 text-yellow-400' :
                    pago.estadoPago === 'VENCIDO' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {pago.estadoPago}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    {pago.estadoPago !== 'PAGADO' && (
                      <button
                        onClick={() => onMarcarPagado(pago)}
                        className="text-green-400 hover:text-green-300"
                        title="Marcar como pagado"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onView(pago)}
                      className="text-gray-400 hover:text-gray-300"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}