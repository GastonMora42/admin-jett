// src/app/clientes/page.tsx - VERSIÓN OPTIMIZADA
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  X
} from 'lucide-react'
import { FormularioCliente } from '@/components/FormularioCliente'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { useApi, useCacheInvalidation } from '@/lib/api-client'

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
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  const [selectedClientes, setSelectedClientes] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null)

  const api = useApi()
  const { invalidateCache } = useCacheInvalidation()

  // Función optimizada para cargar clientes
  const fetchClientes = useCallback(async (showLoading = true) => {
    try {
      console.log('🔄 Fetching clientes...')
      const data = await api.get('/api/clientes', showLoading)
      
      if (Array.isArray(data)) {
        setClientes(data)
        console.log(`✅ Loaded ${data.length} clientes`)
      } else {
        console.warn('⚠️ Expected array, got:', typeof data)
        setClientes([])
      }
      
      if (!isInitialized) {
        setIsInitialized(true)
      }
    } catch (error) {
      console.error('❌ Error fetching clientes:', error)
      if (!isInitialized) {
        setClientes([])
        setIsInitialized(true)
      }
    }
  }, [api, isInitialized])

  // Cargar datos iniciales
  useEffect(() => {
    fetchClientes(true)
    
    // Cleanup al desmontar
    return () => {
      api.cleanup()
    }
  }, [fetchClientes, api])

  // Manejar creación de cliente
  const handleCreateCliente = useCallback(async (clienteData: Partial<Cliente>) => {
    if (operationInProgress) {
      console.log('⚠️ Operation already in progress, skipping')
      return
    }

    try {
      setOperationInProgress('create')
      console.log('🆕 Creating cliente:', clienteData.email)
      
      await api.post('/api/clientes', clienteData, true)
      
      // Invalidar cache y recargar
      invalidateCache('/api/clientes')
      await fetchClientes(false)
      
      setShowForm(false)
      console.log('✅ Cliente created successfully')
    } catch (error) {
      console.error('❌ Error creating cliente:', error)
      // No mostrar alert, el error ya se maneja en el hook
    } finally {
      setOperationInProgress(null)
    }
  }, [api, invalidateCache, fetchClientes, operationInProgress])

  // Manejar edición de cliente
  const handleEditCliente = useCallback(async (clienteData: Partial<Cliente>) => {
    if (!editingCliente || operationInProgress) {
      console.log('⚠️ No cliente to edit or operation in progress')
      return
    }
    
    try {
      setOperationInProgress('edit')
      console.log('✏️ Editing cliente:', editingCliente.id)
      
      await api.put(`/api/clientes/${editingCliente.id}`, clienteData, true)
      
      // Invalidar cache y recargar
      invalidateCache('/api/clientes')
      await fetchClientes(false)
      
      setEditingCliente(null)
      console.log('✅ Cliente updated successfully')
    } catch (error) {
      console.error('❌ Error updating cliente:', error)
    } finally {
      setOperationInProgress(null)
    }
  }, [editingCliente, api, invalidateCache, fetchClientes, operationInProgress])

  // Manejar eliminación de cliente
  const handleDeleteCliente = useCallback((cliente: Cliente) => {
    setClienteToDelete(cliente)
    setShowDeleteConfirm(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!clienteToDelete || operationInProgress) {
      console.log('⚠️ No cliente to delete or operation in progress')
      return
    }
    
    try {
      setOperationInProgress('delete')
      console.log('🗑️ Deleting cliente:', clienteToDelete.id)
      
      await api.delete(`/api/clientes/${clienteToDelete.id}`, true)
      
      // Invalidar cache y recargar
      invalidateCache('/api/clientes')
      await fetchClientes(false)
      
      setShowDeleteConfirm(false)
      setClienteToDelete(null)
      console.log('✅ Cliente deleted successfully')
    } catch (error) {
      console.error('❌ Error deleting cliente:', error)
    } finally {
      setOperationInProgress(null)
    }
  }, [clienteToDelete, api, invalidateCache, fetchClientes, operationInProgress])

  // Memoizar clientes filtrados para optimizar rendimiento
  const filteredClientes = useMemo(() => {
    if (!searchTerm) return clientes
    
    const term = searchTerm.toLowerCase()
    return clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(term) ||
      cliente.email.toLowerCase().includes(term) ||
      cliente.empresa?.toLowerCase().includes(term)
    )
  }, [clientes, searchTerm])

  // Manejar refresh manual
  const handleRefresh = useCallback(async () => {
    invalidateCache('/api/clientes')
    await fetchClientes(true)
  }, [invalidateCache, fetchClientes])

  // Cancelar operaciones
  const handleCancelOperation = useCallback(() => {
    setOperationInProgress(null)
    setShowForm(false)
    setEditingCliente(null)
    setShowDeleteConfirm(false)
    setClienteToDelete(null)
  }, [])

  // Estados de carga
  const isLoading = api.loading || !isInitialized
  const hasError = api.error && clientes.length === 0
  const isEmpty = filteredClientes.length === 0 && !isLoading && !hasError

  // Mostrar spinner inicial
  if (isLoading && !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  // Mostrar error si falló la carga inicial
  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error al cargar datos</h2>
          <p className="text-gray-400 mb-4">{api.error}</p>
          <button 
            onClick={handleRefresh}
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
      {/* Header con indicador de estado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Clientes</h1>
          <p className="text-gray-400 mt-1">
            Gestiona tu base de clientes ({filteredClientes.length})
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Indicador de operación en progreso */}
          {operationInProgress && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="w-4 h-4 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" />
              <span className="text-blue-400 text-sm capitalize">
                {operationInProgress === 'create' && 'Creando cliente...'}
                {operationInProgress === 'edit' && 'Actualizando cliente...'}
                {operationInProgress === 'delete' && 'Eliminando cliente...'}
              </span>
              <button
                onClick={handleCancelOperation}
                className="text-blue-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Botón refresh */}
          <button
            onClick={handleRefresh}
            className="btn-secondary"
            disabled={api.loading || !!operationInProgress}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${api.loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          {/* Botón nuevo cliente */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="btn-primary"
            disabled={api.loading || !!operationInProgress}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </motion.button>
        </div>
      </div>

      {/* Barra de búsqueda optimizada */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-glass pl-10 w-full"
                disabled={!!operationInProgress}
              />
            </div>
            <button 
              className="btn-secondary"
              disabled={!!operationInProgress}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </button>
          </div>
          {selectedClientes.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {selectedClientes.length} seleccionados
              </span>
              <button 
                className="btn-secondary text-red-400"
                disabled={!!operationInProgress}
              >
                Eliminar seleccionados
              </button>
            </div>
          )}
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

// Componente de tarjeta de cliente optimizado
interface ClienteCardProps {
  cliente: Cliente
  index: number
  onEdit: () => void
  onDelete: () => void
  onSelect: (selected: boolean) => void
  isSelected: boolean
  disabled: boolean
}

const ClienteCard: React.FC<ClienteCardProps> = React.memo(({
  cliente,
  index,
  onEdit,
  onDelete,
  onSelect,
  isSelected,
  disabled
}) => {
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
      whileHover={{ y: -4 }}
      className={`card relative group cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Checkbox de selección */}
      <div className="absolute top-4 left-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
          disabled={disabled}
        />
      </div>

      {/* Menú de acciones */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={disabled}
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
        
        {showMenu && !disabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg py-2 z-10 min-w-[120px]"
          >
            <button
              onClick={() => { onEdit(); setShowMenu(false) }}
              className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={() => { setShowMenu(false) }}
              className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Ver detalles</span>
            </button>
            <hr className="border-white/10 my-1" />
            <button
              onClick={() => { onDelete(); setShowMenu(false) }}
              className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center space-x-2"
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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {cliente.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-white font-semibold">{cliente.nombre}</h3>
            <p className="text-gray-400 text-sm">{cliente.empresa || 'Sin empresa'}</p>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <Mail className="w-4 h-4" />
            <span className="truncate">{cliente.email}</span>
          </div>
          {cliente.telefono && (
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <Phone className="w-4 h-4" />
              <span>{cliente.telefono}</span>
            </div>
          )}
          {cliente.empresa && (
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <Building className="w-4 h-4" />
              <span className="truncate">{cliente.empresa}</span>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Proyectos</span>
            <span className="text-white font-medium">{totalProyectos}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Activos</span>
            <span className="text-blue-400 font-medium">{proyectosActivos}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Total facturado</span>
            <span className="text-green-400 font-medium">
              ${totalFacturado.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            cliente.estado === 'ACTIVO' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-gray-500/20 text-gray-400'
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