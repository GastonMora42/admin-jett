// src/app/clientes/page.tsx - VERSIÓN CORREGIDA SIN BUCLES INFINITOS
'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  Users,
  Eye,
  AlertCircle,
  RefreshCw,
  X,
  Grid3X3,
  List,
  Download,
  Upload,
  Activity
} from 'lucide-react'
import { FormularioCliente } from '@/components/FormularioCliente'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { useApi } from '@/lib/api-client'

interface Cliente {
  id: string
  nombre: string
  email: string
  telefono?: string
  empresa?: string
  fechaRegistro: string
  estado: 'ACTIVO' | 'INACTIVO'
  proyectos?: Proyecto[]
}

interface Proyecto {
  id: string
  nombre: string
  montoTotal: number
  estadoProyecto: string
}

export default function ClientesPage() {
  // Estados principales
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedClientes, setSelectedClientes] = useState<string[]>([])
  
  // Estados de UI
  const [showForm, setShowForm] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  
  // Estados de control
  const [isInitialized, setIsInitialized] = useState(false)
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  
  // Refs para evitar bucles
  const isMountedRef = useRef(true)
  const fetchingRef = useRef(false)
  
  const api = useApi()

  // ✅ FUNCIÓN FETCH SIN DEPENDENCIAS CIRCULARES
  const fetchClientes = useCallback(async (showLoading = true) => {
    // Prevenir llamadas múltiples simultáneas
    if (fetchingRef.current) {
      console.log('🔄 Fetch already in progress, skipping...')
      return
    }

    if (!isMountedRef.current) {
      console.log('🔄 Component unmounted, skipping fetch...')
      return
    }

    try {
      fetchingRef.current = true
      setLocalError(null)
      
      console.log('🔄 Fetching clientes...')
      const data = await api.get('/api/clientes', showLoading)
      
      if (!isMountedRef.current) return
      
      if (Array.isArray(data)) {
        setClientes(data)
        console.log(`✅ Loaded ${data.length} clientes`)
        
        // Marcar como inicializado solo una vez
        if (!isInitialized) {
          setIsInitialized(true)
        }
      } else {
        console.warn('⚠️ Expected array, got:', typeof data)
        setClientes([])
      }
    } catch (error) {
      console.error('❌ Error fetching clientes:', error)
      if (isMountedRef.current) {
        setLocalError(error instanceof Error ? error.message : 'Error al cargar clientes')
        setClientes([])
        
        // Marcar como inicializado incluso con error
        if (!isInitialized) {
          setIsInitialized(true)
        }
      }
    } finally {
      fetchingRef.current = false
    }
  }, [api]) // ✅ SOLO depende de api, NO de isInitialized

  // ✅ EFECTO INICIAL SIN BUCLE INFINITO
  useEffect(() => {
    let mounted = true
    isMountedRef.current = true
    
    const initializeData = async () => {
      if (mounted && !isInitialized && !fetchingRef.current) {
        console.log('🚀 Initializing clientes data...')
        await fetchClientes(true)
      }
    }

    initializeData()

    return () => {
      mounted = false
      isMountedRef.current = false
    }
  }, []) // ✅ Array vacío - solo se ejecuta una vez

  // ✅ LIMPIEZA AL DESMONTAR
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      fetchingRef.current = false
    }
  }, [])

  // ✅ OPERACIONES CRUD OPTIMIZADAS
  const handleCreateCliente = useCallback(async (clienteData: Partial<Cliente>) => {
    if (operationInProgress || !isMountedRef.current) {
      console.log('⚠️ Operation already in progress or component unmounted')
      return
    }

    try {
      setOperationInProgress('create')
      setLocalError(null)
      
      console.log('🆕 Creating cliente:', clienteData.email)
      
      await api.post('/api/clientes', clienteData, true)
      
      if (!isMountedRef.current) return
      
      // Recargar datos
      await fetchClientes(false)
      
      setShowForm(false)
      console.log('✅ Cliente created successfully')
    } catch (error) {
      console.error('❌ Error creating cliente:', error)
      if (isMountedRef.current) {
        setLocalError(error instanceof Error ? error.message : 'Error al crear cliente')
      }
    } finally {
      if (isMountedRef.current) {
        setOperationInProgress(null)
      }
    }
  }, [api, fetchClientes, operationInProgress])

  const handleEditCliente = useCallback(async (clienteData: Partial<Cliente>) => {
    if (!editingCliente || operationInProgress || !isMountedRef.current) {
      console.log('⚠️ No cliente to edit, operation in progress, or component unmounted')
      return
    }
    
    try {
      setOperationInProgress('edit')
      setLocalError(null)
      
      console.log('✏️ Editing cliente:', editingCliente.id)
      
      await api.put(`/api/clientes/${editingCliente.id}`, clienteData, true)
      
      if (!isMountedRef.current) return
      
      // Recargar datos
      await fetchClientes(false)
      
      setEditingCliente(null)
      console.log('✅ Cliente updated successfully')
    } catch (error) {
      console.error('❌ Error updating cliente:', error)
      if (isMountedRef.current) {
        setLocalError(error instanceof Error ? error.message : 'Error al actualizar cliente')
      }
    } finally {
      if (isMountedRef.current) {
        setOperationInProgress(null)
      }
    }
  }, [editingCliente, api, fetchClientes, operationInProgress])

  const handleDeleteCliente = useCallback((cliente: Cliente) => {
    if (operationInProgress) return
    setClienteToDelete(cliente)
    setShowDeleteConfirm(true)
  }, [operationInProgress])

  const confirmDelete = useCallback(async () => {
    if (!clienteToDelete || operationInProgress || !isMountedRef.current) {
      console.log('⚠️ No cliente to delete, operation in progress, or component unmounted')
      return
    }
    
    try {
      setOperationInProgress('delete')
      setLocalError(null)
      
      console.log('🗑️ Deleting cliente:', clienteToDelete.id)
      
      await api.delete(`/api/clientes/${clienteToDelete.id}`, true)
      
      if (!isMountedRef.current) return
      
      // Recargar datos
      await fetchClientes(false)
      
      setShowDeleteConfirm(false)
      setClienteToDelete(null)
      console.log('✅ Cliente deleted successfully')
    } catch (error) {
      console.error('❌ Error deleting cliente:', error)
      if (isMountedRef.current) {
        setLocalError(error instanceof Error ? error.message : 'Error al eliminar cliente')
      }
    } finally {
      if (isMountedRef.current) {
        setOperationInProgress(null)
      }
    }
  }, [clienteToDelete, api, fetchClientes, operationInProgress])

  // ✅ REFRESH MANUAL
  const handleRefresh = useCallback(async () => {
    if (operationInProgress) return
    console.log('🔄 Manual refresh requested')
    await fetchClientes(true)
  }, [fetchClientes, operationInProgress])

  // ✅ CANCELAR OPERACIONES
  const handleCancelOperation = useCallback(() => {
    if (!operationInProgress) return
    
    console.log('❌ Cancelling operation:', operationInProgress)
    setOperationInProgress(null)
    setShowForm(false)
    setEditingCliente(null)
    setShowDeleteConfirm(false)
    setClienteToDelete(null)
    setLocalError(null)
  }, [operationInProgress])

  // ✅ MEMOIZAR CLIENTES FILTRADOS
  const filteredClientes = useMemo(() => {
    let result = clientes

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(cliente =>
        cliente.nombre.toLowerCase().includes(term) ||
        cliente.email.toLowerCase().includes(term) ||
        cliente.empresa?.toLowerCase().includes(term)
      )
    }

    if (filtroEstado !== 'todos') {
      result = result.filter(cliente => cliente.estado === filtroEstado)
    }

    return result
  }, [clientes, searchTerm, filtroEstado])

  // ✅ MEMOIZAR ESTADÍSTICAS
  const stats = useMemo(() => ({
    total: clientes.length,
    activos: clientes.filter(c => c.estado === 'ACTIVO').length,
    inactivos: clientes.filter(c => c.estado === 'INACTIVO').length,
    conProyectos: clientes.filter(c => c.proyectos && c.proyectos.length > 0).length
  }), [clientes])

  // ✅ SELECCIÓN MÚLTIPLE
  const handleSelectAll = useCallback(() => {
    if (selectedClientes.length === filteredClientes.length) {
      setSelectedClientes([])
    } else {
      setSelectedClientes(filteredClientes.map(c => c.id))
    }
  }, [selectedClientes.length, filteredClientes])

  // ✅ CLEAR ERROR
  const clearError = useCallback(() => {
    setLocalError(null)
    api.clearError()
  }, [api])

  // Estados derivados
  const isLoading = (api.loading && !isInitialized) || operationInProgress === 'delete'
  const hasError = (api.error || localError) && clientes.length === 0 && isInitialized
  const isEmpty = filteredClientes.length === 0 && !isLoading && !hasError && isInitialized
  const error = localError || api.error

  // ✅ LOADING INICIAL
  if (!isInitialized && api.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-400 mt-4">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  // ✅ ERROR INICIAL
  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error al cargar datos</h2>
          <p className="text-gray-400 mb-4">{error}</p>
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
              disabled={api.loading || !!operationInProgress}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${api.loading ? 'animate-spin' : ''}`} />
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
      className="space-y-6"
    >
      {/* Header mejorado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Clientes</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              {stats.total} total
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              {stats.activos} activos
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              {stats.conProyectos} con proyectos
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Indicador de operación */}
          {operationInProgress && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="w-4 h-4 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" />
              <span className="text-blue-400 text-sm">
                {operationInProgress === 'create' && 'Creando...'}
                {operationInProgress === 'edit' && 'Actualizando...'}
                {operationInProgress === 'delete' && 'Eliminando...'}
              </span>
              <button
                onClick={handleCancelOperation}
                className="text-blue-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Controles de vista */}
          <div className="flex bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-400'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-400'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="btn-secondary"
            disabled={api.loading || !!operationInProgress}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${api.loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          
          <motion.button
            whileHover={{ scale: !!operationInProgress ? 1 : 1.05 }}
            whileTap={{ scale: !!operationInProgress ? 1 : 0.95 }}
            onClick={() => setShowForm(true)}
            className="btn-primary"
            disabled={!!operationInProgress}
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nuevo</span>
            <span className="sm:hidden">Cliente</span>
          </motion.button>
        </div>
      </div>

      {/* Error banner */}
      {error && clientes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}

      {/* Búsqueda y filtros */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar clientes por nombre, email o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-glass pl-10 w-full"
              disabled={!!operationInProgress}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="input-glass"
              disabled={!!operationInProgress}
            >
              <option value="todos">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary ${showFilters ? 'bg-white/10' : ''}`}
              disabled={!!operationInProgress}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </button>
          </div>
        </div>
        
        {/* Selección múltiple */}
        {selectedClientes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mt-4 pt-4 border-t border-white/10"
          >
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {selectedClientes.length} de {filteredClientes.length} seleccionados
              </span>
              <button
                onClick={handleSelectAll}
                className="text-blue-400 hover:text-blue-300 text-sm"
                disabled={!!operationInProgress}
              >
                {selectedClientes.length === filteredClientes.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className="btn-secondary text-green-400 text-sm"
                disabled={!!operationInProgress}
              >
                <Mail className="w-4 h-4 mr-1" />
                Enviar email
              </button>
              <button 
                className="btn-secondary text-blue-400 text-sm"
                disabled={!!operationInProgress}
              >
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Lista de clientes */}
      {isEmpty ? (
        <EmptyState
          icon={Users}
          title="No hay clientes"
          description={searchTerm ? "No se encontraron clientes con ese criterio" : "Comienza agregando tu primer cliente"}
          action={searchTerm ? "Limpiar búsqueda" : "Agregar Cliente"}
          onAction={() => searchTerm ? setSearchTerm('') : setShowForm(true)}
        />
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredClientes.map((cliente, index) => (
                  <ClienteCard
                    key={cliente.id}
                    cliente={cliente}
                    index={index}
                    onEdit={() => setEditingCliente(cliente)}
                    onDelete={() => handleDeleteCliente(cliente)}
                    onSelect={(selected) => {
                      if (selected) {
                        setSelectedClientes([...selectedClientes, cliente.id])
                      } else {
                        setSelectedClientes(selectedClientes.filter(id => id !== cliente.id))
                      }
                    }}
                    isSelected={selectedClientes.includes(cliente.id)}
                    disabled={!!operationInProgress}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <ClientesTable
              clientes={filteredClientes}
              selectedClientes={selectedClientes}
              onSelectCliente={(id, selected) => {
                if (selected) {
                  setSelectedClientes([...selectedClientes, id])
                } else {
                  setSelectedClientes(selectedClientes.filter(cId => cId !== id))
                }
              }}
              onEdit={setEditingCliente}
              onDelete={handleDeleteCliente}
              disabled={!!operationInProgress}
            />
          )}
        </>
      )}

      {/* Formulario de cliente */}
      <FormularioCliente
        isOpen={showForm || !!editingCliente}
        onClose={() => {
          if (!operationInProgress) {
            setShowForm(false)
            setEditingCliente(null)
          }
        }}
        onSubmit={editingCliente ? handleEditCliente : handleCreateCliente}
        cliente={editingCliente}
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          if (!operationInProgress) {
            setShowDeleteConfirm(false)
            setClienteToDelete(null)
          }
        }}
        onConfirm={confirmDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que quieres eliminar a ${clienteToDelete?.nombre}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
      />
    </motion.div>
  )
}

// ✅ COMPONENTE CLIENTE CARD OPTIMIZADO
const ClienteCard: React.FC<{
  cliente: Cliente
  index: number
  onEdit: () => void
  onDelete: () => void
  onSelect: (selected: boolean) => void
  isSelected: boolean
  disabled: boolean
}> = React.memo(function ClienteCard({
  cliente,
  index,
  onEdit,
  onDelete,
  onSelect,
  isSelected,
  disabled
}) {
  const [showMenu, setShowMenu] = useState(false)
  const totalProyectos = cliente.proyectos?.length || 0
  const totalFacturado = cliente.proyectos?.reduce((sum, p) => sum + p.montoTotal, 0) || 0
  const proyectosActivos = cliente.proyectos?.filter(p => p.estadoProyecto === 'EN_DESARROLLO').length || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: disabled ? 0 : -4 }}
      className={`card relative group cursor-pointer transition-all hover:shadow-2xl ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Checkbox de selección */}
      <div className="absolute top-4 left-4 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
          disabled={disabled}
        />
      </div>

      {/* Menú de acciones */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
          disabled={disabled}
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
        
        {showMenu && !disabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg py-2 z-20 min-w-[140px] shadow-xl"
          >
            <button
              onClick={() => { onEdit(); setShowMenu(false) }}
              className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 flex items-center space-x-2 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={() => { setShowMenu(false) }}
              className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 flex items-center space-x-2 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Ver detalles</span>
            </button>
            <button
              onClick={() => { setShowMenu(false) }}
              className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 flex items-center space-x-2 transition-colors"
            >
              <Activity className="w-4 h-4" />
              <span>Actividad</span>
            </button>
            <hr className="border-white/10 my-1" />
            <button
              onClick={() => { onDelete(); setShowMenu(false) }}
              className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center space-x-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Contenido principal */}
      <div className="pt-8">
        {/* Avatar y nombre */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-semibold text-lg">
              {cliente.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate">{cliente.nombre}</h3>
            <p className="text-gray-400 text-sm truncate">{cliente.empresa || 'Sin empresa'}</p>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{cliente.email}</span>
          </div>
          {cliente.telefono && (
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{cliente.telefono}</span>
            </div>
          )}
          {cliente.empresa && (
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <Building className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{cliente.empresa}</span>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Proyectos</span>
            <span className="text-white font-medium">{totalProyectos}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Activos</span>
            <span className="text-blue-400 font-medium">{proyectosActivos}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Facturado</span>
            <span className="text-green-400 font-medium">
              ${totalFacturado.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Estado y fecha */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            cliente.estado === 'ACTIVO' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {cliente.estado}
          </span>
          <span className="text-gray-500 text-xs">
            {new Date(cliente.fechaRegistro).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  )
})

// ✅ COMPONENTE TABLA SIMPLIFICADO
const ClientesTable: React.FC<{
  clientes: Cliente[]
  selectedClientes: string[]
  onSelectCliente: (id: string, selected: boolean) => void
  onEdit: (cliente: Cliente) => void
  onDelete: (cliente: Cliente) => void
  disabled: boolean
}> = React.memo(function ClientesTable({ 
  clientes, 
  selectedClientes, 
  onSelectCliente, 
  onEdit, 
  onDelete, 
  disabled 
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-4">
                <input 
                  type="checkbox" 
                  className="rounded bg-white/10 border-white/20"
                  disabled={disabled}
                />
              </th>
              <th className="text-left p-4 text-gray-400 font-medium">Cliente</th>
              <th className="text-left p-4 text-gray-400 font-medium">Email</th>
              <th className="text-left p-4 text-gray-400 font-medium">Empresa</th>
              <th className="text-left p-4 text-gray-400 font-medium">Proyectos</th>
              <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
              <th className="text-left p-4 text-gray-400 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente, index) => (
              <motion.tr
                key={cliente.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-t border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedClientes.includes(cliente.id)}
                    onChange={(e) => onSelectCliente(cliente.id, e.target.checked)}
                    className="rounded bg-white/10 border-white/20"
                    disabled={disabled}
                  />
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {cliente.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white font-medium">{cliente.nombre}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-300">{cliente.email}</td>
                <td className="p-4 text-gray-300">{cliente.empresa || '-'}</td>
                <td className="p-4 text-blue-400">{cliente.proyectos?.length || 0}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    cliente.estado === 'ACTIVO' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {cliente.estado}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(cliente)}
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                      disabled={disabled}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(cliente)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      disabled={disabled}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})