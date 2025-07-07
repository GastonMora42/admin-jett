// =====================================================
// PÁGINA DE PROYECTOS CORREGIDA - src/app/proyectos/page.tsx
// =====================================================

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  FolderOpen,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  GridIcon,
  List,
  MapPin,
  Target,
  Zap,
  Star
} from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { FormularioProyecto } from '@/components/FormularioProyecto'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useApi } from '@/lib/api-client'

// Importar tipos correctos de types/index.ts
import type { 
  Proyecto as ProyectoType, 
  Cliente as ClienteType,
  CreateProyectoData,
  TipoProyecto, 
  FormaPago,
  EstadoProyecto, 
  EstadoPago 
} from '@/types/index'

// Usar los tipos importados
interface Proyecto extends ProyectoType {
  progreso?: number
}

interface Cliente extends ClienteType {}

interface Pago {
  id: string
  montoCuota: number
  fechaVencimiento: string
  estadoPago: string
}

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroCliente, setFiltroCliente] = useState<string>('todos')
  const [showForm, setShowForm] = useState(false)
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null)
  const [viewingProyecto] = useState<Proyecto | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [proyectoToDelete, setProyectoToDelete] = useState<Proyecto | null>(null)
  const [selectedProyectos, setSelectedProyectos] = useState<string[]>([])
  const [vista, setVista] = useState<'cards' | 'table' | 'kanban'>('cards')
  const [sortBy, setSortBy] = useState<'fecha' | 'monto' | 'nombre' | 'estado'>('fecha')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const api = useApi()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [proyectosData, clientesData] = await Promise.all([
        api.get('/api/proyectos'),
        api.get('/api/clientes')
      ])
      setProyectos(Array.isArray(proyectosData) ? proyectosData : [])
      setClientes(Array.isArray(clientesData) ? clientesData : [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleCreateProyecto = async (proyectoData: CreateProyectoData) => {
    try {
      await api.post('/api/proyectos', proyectoData)
      await loadData()
      setShowForm(false)
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al crear proyecto')
    }
  }

  const handleEditProyecto = async (proyectoData: Partial<Proyecto>) => {
    if (!editingProyecto) return
    
    try {
      await api.put(`/api/proyectos/${editingProyecto.id}`, proyectoData)
      await loadData()
      setEditingProyecto(null)
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al actualizar proyecto')
    }
  }

  const handleDeleteProyecto = async (proyecto: Proyecto) => {
    setProyectoToDelete(proyecto)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!proyectoToDelete) return
    
    try {
      await api.delete(`/api/proyectos/${proyectoToDelete.id}`)
      await loadData()
      setShowDeleteConfirm(false)
      setProyectoToDelete(null)
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar proyecto')
    }
  }

  const handleEstadoChange = async (proyecto: Proyecto, nuevoEstado: EstadoProyecto) => {
    try {
      await api.put(`/api/proyectos/${proyecto.id}`, { estadoProyecto: nuevoEstado })
      await loadData()
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al actualizar estado')
    }
  }

  // Filtros y ordenamiento mejorados
  const filteredAndSortedProyectos = useMemo(() => {
    let filtered = proyectos.filter(proyecto => {
      const matchesSearch = proyecto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           proyecto.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           proyecto.cliente?.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesEstado = filtroEstado === 'todos' || proyecto.estadoProyecto === filtroEstado
      const matchesTipo = filtroTipo === 'todos' || proyecto.tipo === filtroTipo
      const matchesCliente = filtroCliente === 'todos' || proyecto.clienteId === filtroCliente
      
      return matchesSearch && matchesEstado && matchesTipo && matchesCliente
    })

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'fecha':
          aValue = new Date(a.fechaInicio).getTime()
          bValue = new Date(b.fechaInicio).getTime()
          break
        case 'monto':
          aValue = a.montoTotal
          bValue = b.montoTotal
          break
        case 'nombre':
          aValue = a.nombre.toLowerCase()
          bValue = b.nombre.toLowerCase()
          break
        case 'estado':
          aValue = a.estadoProyecto
          bValue = b.estadoProyecto
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [proyectos, searchTerm, filtroEstado, filtroTipo, filtroCliente, sortBy, sortOrder])

  const estadisticas = useMemo(() => {
    const total = proyectos.length
    const enDesarrollo = proyectos.filter(p => p.estadoProyecto === 'EN_DESARROLLO').length
    const completados = proyectos.filter(p => p.estadoProyecto === 'COMPLETADO').length
    const enPausa = proyectos.filter(p => p.estadoProyecto === 'EN_PAUSA').length
    const cancelados = proyectos.filter(p => p.estadoProyecto === 'CANCELADO').length
    const totalFacturado = proyectos.reduce((sum, p) => sum + p.montoTotal, 0)
    const promedioProyecto = total > 0 ? totalFacturado / total : 0
    
    // Proyectos con retraso (fecha entrega pasada y no completados)
    const hoy = new Date()
    const conRetraso = proyectos.filter(p => 
      p.fechaEntrega && 
      new Date(p.fechaEntrega) < hoy && 
      p.estadoProyecto !== 'COMPLETADO'
    ).length

    return {
      total,
      enDesarrollo,
      completados,
      enPausa,
      cancelados,
      totalFacturado,
      promedioProyecto,
      conRetraso,
      tasaExito: total > 0 ? Math.round((completados / total) * 100) : 0
    }
  }, [proyectos])

  if (api.loading && proyectos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (api.error && proyectos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error al cargar datos</h2>
          <p className="text-gray-400 mb-4">{api.error}</p>
          <button 
            onClick={loadData}
            className="btn-primary"
            disabled={api.loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${api.loading ? 'animate-spin' : ''}`} />
            {api.loading ? 'Cargando...' : 'Reintentar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header mejorado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Proyectos</h1>
          <p className="text-gray-400 mt-1">
            Gestiona todos tus proyectos ({filteredAndSortedProyectos.length} de {proyectos.length})
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Indicador de loading */}
          {api.loading && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="w-4 h-4 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" />
              <span className="text-blue-400 text-sm">Sincronizando...</span>
            </div>
          )}
          
          <button
            onClick={loadData}
            className="btn-secondary"
            disabled={api.loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${api.loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          <button className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="btn-primary"
            disabled={api.loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proyecto
          </motion.button>
        </div>
      </div>

      {/* Estadísticas mejoradas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} className="card p-4 text-center">
          <FolderOpen className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{estadisticas.total}</p>
          <p className="text-gray-400 text-xs">Total</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="card p-4 text-center">
          <PlayCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-400">{estadisticas.enDesarrollo}</p>
          <p className="text-gray-400 text-xs">En Desarrollo</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="card p-4 text-center">
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-400">{estadisticas.completados}</p>
          <p className="text-gray-400 text-xs">Completados</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="card p-4 text-center">
          <PauseCircle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-400">{estadisticas.enPausa}</p>
          <p className="text-gray-400 text-xs">En Pausa</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="card p-4 text-center">
          <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-green-400">
            ${estadisticas.totalFacturado.toLocaleString()}
          </p>
          <p className="text-gray-400 text-xs">Facturado</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="card p-4 text-center">
          <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-purple-400">
            ${estadisticas.promedioProyecto.toLocaleString()}
          </p>
          <p className="text-gray-400 text-xs">Promedio</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="card p-4 text-center">
          <Zap className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-400">{estadisticas.tasaExito}%</p>
          <p className="text-gray-400 text-xs">Tasa Éxito</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className={`card p-4 text-center ${
          estadisticas.conRetraso > 0 ? 'border-red-500/30 bg-red-500/5' : ''
        }`}>
          <AlertCircle className={`w-6 h-6 mx-auto mb-2 ${
            estadisticas.conRetraso > 0 ? 'text-red-400' : 'text-gray-400'
          }`} />
          <p className={`text-2xl font-bold ${
            estadisticas.conRetraso > 0 ? 'text-red-400' : 'text-gray-400'
          }`}>{estadisticas.conRetraso}</p>
          <p className="text-gray-400 text-xs">Con Retraso</p>
        </motion.div>
      </div>

      {/* Filtros y búsqueda mejorados */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar proyectos, clientes..."
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
              <option value="EN_DESARROLLO">En Desarrollo</option>
              <option value="COMPLETADO">Completado</option>
              <option value="EN_PAUSA">En Pausa</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
            
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="input-glass"
            >
              <option value="todos">Todos los tipos</option>
              <option value="SOFTWARE_A_MEDIDA">Software a Medida</option>
              <option value="ECOMMERCE">E-commerce</option>
              <option value="LANDING_PAGE">Landing Page</option>
              <option value="SISTEMA_WEB">Sistema Web</option>
              <option value="APP_MOVIL">App Móvil</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
            </select>

            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="input-glass"
            >
              <option value="todos">Todos los clientes</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Ordenamiento */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input-glass text-sm"
            >
              <option value="fecha">Ordenar por fecha</option>
              <option value="monto">Ordenar por monto</option>
              <option value="nombre">Ordenar por nombre</option>
              <option value="estado">Ordenar por estado</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn-secondary p-2"
              title={`Orden ${sortOrder === 'asc' ? 'ascendente' : 'descendente'}`}
            >
              {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </button>

            {/* Vista */}
            <div className="flex bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setVista('cards')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  vista === 'cards' ? 'bg-white/10 text-white' : 'text-gray-400'
                }`}
              >
                <GridIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setVista('table')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  vista === 'table' ? 'bg-white/10 text-white' : 'text-gray-400'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setVista('kanban')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  vista === 'kanban' ? 'bg-white/10 text-white' : 'text-gray-400'
                }`}
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {selectedProyectos.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <span className="text-sm text-gray-400">
              {selectedProyectos.length} proyectos seleccionados
            </span>
            <div className="flex items-center space-x-2">
              <button className="btn-secondary text-yellow-400">
                <PauseCircle className="w-4 h-4 mr-2" />
                Pausar
              </button>
              <button className="btn-secondary text-green-400">
                <CheckCircle className="w-4 h-4 mr-2" />
                Completar
              </button>
              <button className="btn-secondary text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de proyectos */}
      {filteredAndSortedProyectos.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No hay proyectos"
          description={searchTerm || filtroEstado !== 'todos' || filtroTipo !== 'todos' 
            ? "No se encontraron proyectos con los filtros aplicados" 
            : "Comienza creando tu primer proyecto"
          }
          action={searchTerm || filtroEstado !== 'todos' || filtroTipo !== 'todos' ? "Limpiar filtros" : "Crear Proyecto"}
          onAction={() => {
            if (searchTerm || filtroEstado !== 'todos' || filtroTipo !== 'todos') {
              setSearchTerm('')
              setFiltroEstado('todos')
              setFiltroTipo('todos')
              setFiltroCliente('todos')
            } else {
              setShowForm(true)
            }
          }}
        />
      ) : vista === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredAndSortedProyectos.map((proyecto, index) => (
              <ProyectoCard
                key={proyecto.id}
                proyecto={proyecto}
                index={index}
                onEdit={() => setEditingProyecto(proyecto)}
                onDelete={() => handleDeleteProyecto(proyecto)}
                onView={() => {}}
                onEstadoChange={(nuevoEstado) => handleEstadoChange(proyecto, nuevoEstado)}
                onSelect={(selected) => {
                  if (selected) {
                    setSelectedProyectos([...selectedProyectos, proyecto.id])
                  } else {
                    setSelectedProyectos(selectedProyectos.filter(id => id !== proyecto.id))
                  }
                }}
                isSelected={selectedProyectos.includes(proyecto.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-gray-400">Vista de tabla y kanban próximamente</p>
        </div>
      )}

      {/* Formulario de proyecto - CORREGIDO */}
      <FormularioProyecto
        isOpen={showForm || !!editingProyecto}
        onClose={() => {
          setShowForm(false)
          setEditingProyecto(null)
        }}
        onSubmit={editingProyecto ? handleEditProyecto : handleCreateProyecto}
        proyecto={editingProyecto} // Ahora es del tipo correcto
        clientes={clientes}
        title={editingProyecto ? 'Editar Proyecto' : 'Nuevo Proyecto'}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Eliminar Proyecto"
        message={`¿Estás seguro de que quieres eliminar el proyecto "${proyectoToDelete?.nombre}"? Esta acción eliminará también todos los pagos asociados.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
      />
    </motion.div>
  )
}

// Componente de tarjeta de proyecto mejorado
interface ProyectoCardProps {
  proyecto: Proyecto
  index: number
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  onEstadoChange: (estado: EstadoProyecto) => void
  onSelect: (selected: boolean) => void
  isSelected: boolean
}

const ProyectoCard: React.FC<ProyectoCardProps> = ({
  proyecto,
  index,
  onEdit,
  onDelete,
  onEstadoChange,
  onSelect,
  isSelected
}) => {
  const [showMenu, setShowMenu] = useState(false)
  
  const getEstadoIcon = (estado: EstadoProyecto) => {
    switch (estado) {
      case 'EN_DESARROLLO': return <PlayCircle className="w-4 h-4" />
      case 'COMPLETADO': return <CheckCircle className="w-4 h-4" />
      case 'EN_PAUSA': return <PauseCircle className="w-4 h-4" />
      case 'CANCELADO': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getEstadoColor = (estado: EstadoProyecto) => {
    switch (estado) {
      case 'EN_DESARROLLO': return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      case 'COMPLETADO': return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'EN_PAUSA': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'CANCELADO': return 'text-red-400 bg-red-500/20 border-red-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getTipoLabel = (tipo: TipoProyecto) => {
    const labels = {
      SOFTWARE_A_MEDIDA: 'Software a Medida',
      ECOMMERCE: 'E-commerce',
      LANDING_PAGE: 'Landing Page',
      SISTEMA_WEB: 'Sistema Web',
      APP_MOVIL: 'App Móvil',
      MANTENIMIENTO: 'Mantenimiento'
    }
    return labels[tipo] || tipo
  }

  const pagosPagados = proyecto.pagos?.filter(p => p.estadoPago === 'PAGADO').length || 0
  const totalPagos = proyecto.pagos?.length || 0
  const progreso = totalPagos > 0 ? (pagosPagados / totalPagos) * 100 : 0

  // Verificar si está retrasado
  const esRetrasado = proyecto.fechaEntrega && 
    new Date(proyecto.fechaEntrega) < new Date() && 
    proyecto.estadoProyecto !== 'COMPLETADO'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`card relative group cursor-pointer transition-all hover:shadow-2xl ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''
      } ${esRetrasado ? 'border-red-500/30 bg-red-500/5' : ''}`}
    >
      {/* Indicadores especiales */}
      {esRetrasado && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>Retrasado</span>
        </div>
      )}

      {proyecto.estadoProyecto === 'COMPLETADO' && (
        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
          <Star className="w-3 h-3" />
          <span>Completado</span>
        </div>
      )}

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
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </button>
            {proyecto.estadoProyecto === 'EN_DESARROLLO' && (
              <button
                onClick={(e) => { e.stopPropagation(); onEstadoChange('EN_PAUSA') }}
                className="w-full px-4 py-2 text-left text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 flex items-center space-x-2"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Pausar</span>
              </button>
            )}
            {proyecto.estadoProyecto !== 'COMPLETADO' && (
              <button
                onClick={(e) => { e.stopPropagation(); onEstadoChange('COMPLETADO') }}
                className="w-full px-4 py-2 text-left text-green-400 hover:text-green-300 hover:bg-green-500/10 flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Completar</span>
              </button>
            )}
            <hr className="border-white/10 my-1" />
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Contenido principal */}
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1 truncate">
              {proyecto.nombre}
            </h3>
            <p className="text-gray-400 text-sm">
              {getTipoLabel(proyecto.tipo)}
            </p>
          </div>
          <div className={`px-2 py-1 rounded border text-xs font-medium flex items-center space-x-1 ${getEstadoColor(proyecto.estadoProyecto)}`}>
            {getEstadoIcon(proyecto.estadoProyecto)}
            <span>{proyecto.estadoProyecto.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Cliente */}
        <div className="flex items-center space-x-2 mb-4">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 text-sm truncate">
            {proyecto.cliente?.nombre || 'Cliente no asignado'}
          </span>
        </div>

        {/* Monto destacado */}
        <div className="bg-white/5 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Valor del proyecto</span>
            <span className="text-green-400 font-bold text-lg">
              ${proyecto.montoTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Fechas */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Inicio</span>
            <span className="text-gray-300">
              {new Date(proyecto.fechaInicio).toLocaleDateString()}
            </span>
          </div>
          {proyecto.fechaEntrega && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Entrega</span>
              <span className={`${esRetrasado ? 'text-red-400' : 'text-gray-300'}`}>
                {new Date(proyecto.fechaEntrega).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Progreso de pagos mejorado */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Progreso de pagos</span>
            <span className="text-gray-300 text-sm font-medium">
              {pagosPagados}/{totalPagos} ({progreso.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progreso}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}