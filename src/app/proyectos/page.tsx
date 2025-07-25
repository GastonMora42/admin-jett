// src/app/proyectos/page.tsx - VERSIÓN CORREGIDA CON MEJOR DEBUGGING
'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  Target,
  Zap,
  Star,
  Menu
} from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { FormularioProyecto } from '@/components/FormularioProyecto'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useApi } from '@/lib/api-client'
import type { 
  Proyecto as ProyectoType, 
  Cliente as ClienteType,
  CreateProyectoData,
  TipoProyecto, 
  FormaPago,
  EstadoProyecto, 
  EstadoPago 
} from '@/types/index'

interface Proyecto extends ProyectoType {
  progreso?: number
}
interface Cliente extends ClienteType {}

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroCliente, setFiltroCliente] = useState<string>('todos')
  const [showForm, setShowForm] = useState(false)
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [proyectoToDelete, setProyectoToDelete] = useState<Proyecto | null>(null)
  const [selectedProyectos, setSelectedProyectos] = useState<string[]>([])
  const [vista, setVista] = useState<'cards' | 'table'>('cards')
  const [sortBy, setSortBy] = useState<'fecha' | 'monto' | 'nombre' | 'estado'>('fecha')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [detailedError, setDetailedError] = useState<string | null>(null)

  const api = useApi()

  // Función de carga de datos mejorada con debugging
  const loadData = useCallback(async (showSpinner = true) => {
    try {
      console.log('🔄 Loading projects and clients data...')
      
      if (showSpinner) {
        setLoadingState('loading')
      }
      setDetailedError(null)

      // Cargar proyectos primero
      console.log('📡 Fetching proyectos...')
      const proyectosData = await api.get('/api/proyectos', false)
      console.log('✅ Proyectos response:', {
        type: typeof proyectosData,
        isArray: Array.isArray(proyectosData),
        length: Array.isArray(proyectosData) ? proyectosData.length : 'N/A',
        firstItem: Array.isArray(proyectosData) && proyectosData.length > 0 ? 
          { id: proyectosData[0].id, nombre: proyectosData[0].nombre } : 'N/A'
      })
      
      // Cargar clientes después
      console.log('📡 Fetching clientes...')
      const clientesData = await api.get('/api/clientes', false)
      console.log('✅ Clientes response:', {
        type: typeof clientesData,
        isArray: Array.isArray(clientesData),
        length: Array.isArray(clientesData) ? clientesData.length : 'N/A'
      })

      // Validar y establecer datos
      const validProyectos = Array.isArray(proyectosData) ? proyectosData : []
      const validClientes = Array.isArray(clientesData) ? clientesData : []

      console.log(`✅ Setting ${validProyectos.length} proyectos and ${validClientes.length} clientes`)
      
      setProyectos(validProyectos)
      setClientes(validClientes)
      setLoadingState('success')
      
      console.log('✅ Data loading completed successfully')
      
    } catch (error) {
      console.error('❌ Error loading data:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setDetailedError(`Error al cargar datos: ${errorMessage}`)
      setLoadingState('error')
      
      // Mantener datos existentes en caso de error
      console.log('⚠️ Keeping existing data on error')
    }
  }, [api])

  // Cargar datos al montar el componente
  useEffect(() => {
    console.log('🚀 Component mounted, loading initial data...')
    loadData()
  }, [loadData])

  const handleCreateProyecto = async (proyectoData: CreateProyectoData) => {
    try {
      console.log('🆕 Creating new project:', proyectoData.nombre)
      setDetailedError(null)
      
      await api.post('/api/proyectos', proyectoData, true)
      console.log('✅ Project created successfully')
      
      // Recargar datos después de crear
      console.log('🔄 Reloading data after creation...')
      await loadData(false)
      
      setShowForm(false)
      console.log('✅ Project creation flow completed')
    } catch (error) {
      console.error('❌ Error creating project:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al crear proyecto'
      setDetailedError(errorMessage)
    }
  }

  const handleEditProyecto = async (proyectoData: Partial<Proyecto>) => {
    if (!editingProyecto) return
    
    try {
      console.log('✏️ Editing project:', editingProyecto.id)
      setDetailedError(null)
      
      await api.put(`/api/proyectos/${editingProyecto.id}`, proyectoData, true)
      console.log('✅ Project updated successfully')
      
      await loadData(false)
      setEditingProyecto(null)
      console.log('✅ Project edit flow completed')
    } catch (error) {
      console.error('❌ Error editing project:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar proyecto'
      setDetailedError(errorMessage)
    }
  }

  const handleDeleteProyecto = async (proyecto: Proyecto) => {
    setProyectoToDelete(proyecto)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!proyectoToDelete) return
    
    try {
      console.log('🗑️ Deleting project:', proyectoToDelete.id)
      setDetailedError(null)
      
      await api.delete(`/api/proyectos/${proyectoToDelete.id}`, true)
      console.log('✅ Project deleted successfully')
      
      await loadData(false)
      setShowDeleteConfirm(false)
      setProyectoToDelete(null)
      console.log('✅ Project deletion flow completed')
    } catch (error) {
      console.error('❌ Error deleting project:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar proyecto'
      setDetailedError(errorMessage)
    }
  }

  const handleEstadoChange = async (proyecto: Proyecto, nuevoEstado: EstadoProyecto) => {
    try {
      console.log('📝 Changing project status:', proyecto.id, 'to', nuevoEstado)
      setDetailedError(null)
      
      await api.put(`/api/proyectos/${proyecto.id}`, { estadoProyecto: nuevoEstado }, true)
      console.log('✅ Project status updated successfully')
      
      await loadData(false)
    } catch (error) {
      console.error('❌ Error changing project status:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar estado'
      setDetailedError(errorMessage)
    }
  }

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered')
    await loadData(true)
  }

  const clearError = () => {
    console.log('🧹 Clearing error state')
    setDetailedError(null)
    api.clearError()
  }

  // Filtros y ordenamiento optimizados
  const filteredAndSortedProyectos = useMemo(() => {
    console.log('🔍 Filtering and sorting projects...', {
      totalProyectos: proyectos.length,
      searchTerm,
      filtroEstado,
      filtroTipo,
      filtroCliente
    })

    let filtered = proyectos.filter(proyecto => {
      const matchesSearch = proyecto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           proyecto.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           proyecto.cliente?.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesEstado = filtroEstado === 'todos' || proyecto.estadoProyecto === filtroEstado
      const matchesTipo = filtroTipo === 'todos' || proyecto.tipo === filtroTipo
      const matchesCliente = filtroCliente === 'todos' || proyecto.clienteId === filtroCliente
      
      return matchesSearch && matchesEstado && matchesTipo && matchesCliente
    })

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

    console.log(`✅ Filtered to ${filtered.length} projects`)
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

  // Estados de UI
  const isLoading = loadingState === 'loading'
  const hasError = loadingState === 'error' || !!detailedError || !!api.error
  const hasData = proyectos.length > 0
  const isEmpty = !isLoading && !hasError && !hasData
  const currentError = detailedError || api.error

  console.log('🎨 Render state:', { 
    loadingState, 
    hasError, 
    hasData, 
    isEmpty, 
    proyectosLength: proyectos.length,
    clientesLength: clientes.length 
  })

  // Loading inicial
  if (isLoading && !hasData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-400 mt-4">Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  // Error sin datos
  if (hasError && !hasData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error al cargar datos</h2>
          <p className="text-gray-400 mb-4">{currentError}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={clearError}
              className="btn-secondary"
            >
              Limpiar Error
            </button>
            <button 
              onClick={handleRefresh}
              className="btn-primary"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 lg:space-y-6 p-2 sm:p-4 lg:p-6"
    >
      {/* Header mejorado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Proyectos</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Gestiona todos tus proyectos ({filteredAndSortedProyectos.length} de {proyectos.length})
          </p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {isLoading && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="w-4 h-4 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" />
              <span className="text-blue-400 text-sm">Cargando...</span>
            </div>
          )}
          
          <button
            onClick={handleRefresh}
            className="btn-secondary p-2 sm:px-4 sm:py-2"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''} sm:mr-2`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="btn-primary px-3 py-2 sm:px-4 sm:py-2"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo Proyecto</span>
          </motion.button>
        </div>
      </div>

      {/* Error banner para cuando hay datos */}
      {hasError && hasData && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-300 text-sm">{currentError}</p>
            </div>
          </div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </motion.div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4">
        <motion.div whileHover={{ scale: 1.02 }} className="card p-3 sm:p-4 text-center">
          <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-lg sm:text-2xl font-bold text-white">{estadisticas.total}</p>
          <p className="text-gray-400 text-xs">Total</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="card p-3 sm:p-4 text-center">
          <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-lg sm:text-2xl font-bold text-blue-400">{estadisticas.enDesarrollo}</p>
          <p className="text-gray-400 text-xs">En Desarrollo</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="card p-3 sm:p-4 text-center">
          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mx-auto mb-2" />
          <p className="text-lg sm:text-2xl font-bold text-green-400">{estadisticas.completados}</p>
          <p className="text-gray-400 text-xs">Completados</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="card p-3 sm:p-4 text-center">
          <PauseCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-lg sm:text-2xl font-bold text-yellow-400">{estadisticas.enPausa}</p>
          <p className="text-gray-400 text-xs">En Pausa</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="card p-3 sm:p-4 text-center">
          <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mx-auto mb-2" />
          <p className="text-sm sm:text-xl font-bold text-green-400">
            ${estadisticas.totalFacturado.toLocaleString()}
          </p>
          <p className="text-gray-400 text-xs">Facturado</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="card p-3 sm:p-4 text-center">
          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-sm sm:text-xl font-bold text-purple-400">
            ${estadisticas.promedioProyecto.toLocaleString()}
          </p>
          <p className="text-gray-400 text-xs">Promedio</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="card p-3 sm:p-4 text-center">
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mx-auto mb-2" />
          <p className="text-lg sm:text-2xl font-bold text-green-400">{estadisticas.tasaExito}%</p>
          <p className="text-gray-400 text-xs">Tasa Éxito</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className={`card p-3 sm:p-4 text-center ${
          estadisticas.conRetraso > 0 ? 'border-red-500/30 bg-red-500/5' : ''
        }`}>
          <AlertCircle className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 ${
            estadisticas.conRetraso > 0 ? 'text-red-400' : 'text-gray-400'
          }`} />
          <p className={`text-lg sm:text-2xl font-bold ${
            estadisticas.conRetraso > 0 ? 'text-red-400' : 'text-gray-400'
          }`}>{estadisticas.conRetraso}</p>
          <p className="text-gray-400 text-xs">Con Retraso</p>
        </motion.div>
      </div>

      {/* Contenido principal */}
      {isEmpty ? (
        <EmptyState
          icon={FolderOpen}
          title="No hay proyectos"
          description="Comienza creando tu primer proyecto"
          action="Crear Proyecto"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <>
          {/* Filtros simplificados para debug */}
          <div className="card p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar proyectos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-glass pl-10 w-full"
                />
              </div>
              <button
                onClick={() => setVista(vista === 'cards' ? 'table' : 'cards')}
                className="btn-secondary"
              >
                {vista === 'cards' ? <List className="w-4 h-4" /> : <GridIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Lista de proyectos */}
          {vista === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
            <div className="card p-4">
              <p className="text-gray-400 text-center">Vista de tabla simplificada para debug</p>
              {filteredAndSortedProyectos.map(proyecto => (
                <div key={proyecto.id} className="border-b border-white/10 py-2">
                  <p className="text-white">{proyecto.nombre} - {proyecto.cliente?.nombre}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Formulario de proyecto */}
      <FormularioProyecto
        isOpen={showForm || !!editingProyecto}
        onClose={() => {
          setShowForm(false)
          setEditingProyecto(null)
        }}
        onSubmit={editingProyecto ? handleEditProyecto : handleCreateProyecto}
        proyecto={editingProyecto}
        clientes={clientes}
        title={editingProyecto ? 'Editar Proyecto' : 'Nuevo Proyecto'}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Eliminar Proyecto"
        message={`¿Estás seguro de que quieres eliminar el proyecto "${proyectoToDelete?.nombre}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
      />
    </motion.div>
  )
}

// Componente simplificado para debug
const ProyectoCard: React.FC<{
  proyecto: Proyecto
  index: number
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  onEstadoChange: (estado: EstadoProyecto) => void
  onSelect: (selected: boolean) => void
  isSelected: boolean
}> = ({ proyecto, index, onEdit, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="card p-4"
    >
      <h3 className="text-white font-semibold mb-2">{proyecto.nombre}</h3>
      <p className="text-gray-400 text-sm mb-2">{proyecto.cliente?.nombre}</p>
      <p className="text-green-400 font-bold">${proyecto.montoTotal.toLocaleString()}</p>
      <div className="flex gap-2 mt-4">
        <button onClick={onEdit} className="btn-secondary text-xs px-2 py-1">
          <Edit className="w-3 h-3 mr-1" /> Editar
        </button>
        <button onClick={onDelete} className="btn-secondary text-red-400 text-xs px-2 py-1">
          <Trash2 className="w-3 h-3 mr-1" /> Eliminar
        </button>
      </div>
    </motion.div>
  )
}