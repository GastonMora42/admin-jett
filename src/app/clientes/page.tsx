// =====================================================
// PÁGINA DE CLIENTES ACTUALIZADA - src/app/clientes/page.tsx
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
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
  Star,
  AlertCircle
} from 'lucide-react'
import { FormularioCliente } from '@/components/FormularioCliente'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { useApi } from '@/lib/api-client' // ← Nuevo import

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

  // ← Usar el nuevo hook de API
  const api = useApi()

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      const data = await api.get('/api/clientes')
      setClientes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
      setClientes([])
    }
  }

  const handleCreateCliente = async (clienteData: Partial<Cliente>) => {
    try {
      await api.post('/api/clientes', clienteData)
      await fetchClientes()
      setShowForm(false)
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al crear cliente')
    }
  }

  const handleEditCliente = async (clienteData: Partial<Cliente>) => {
    if (!editingCliente) return
    
    try {
      await api.put(`/api/clientes/${editingCliente.id}`, clienteData)
      await fetchClientes()
      setEditingCliente(null)
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al actualizar cliente')
    }
  }

  const handleDeleteCliente = async (cliente: Cliente) => {
    setClienteToDelete(cliente)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!clienteToDelete) return
    
    try {
      await api.delete(`/api/clientes/${clienteToDelete.id}`)
      await fetchClientes()
      setShowDeleteConfirm(false)
      setClienteToDelete(null)
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar cliente')
    }
  }

  const filteredClientes = (clientes || []).filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const calcularTotalProyectos = (cliente: Cliente) => {
    return cliente.proyectos?.reduce((sum, p) => sum + p.montoTotal, 0) || 0
  }

  // ← Mostrar loading del hook useApi
  if (api.loading && clientes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  // ← Mostrar error del hook useApi
  if (api.error && clientes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error al cargar datos</h2>
          <p className="text-gray-400 mb-4">{api.error}</p>
          <button 
            onClick={fetchClientes}
            className="btn-primary"
            disabled={api.loading}
          >
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Clientes</h1>
          <p className="text-gray-400 mt-1">
            Gestiona tu base de clientes ({filteredClientes.length})
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="btn-primary"
          disabled={api.loading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </motion.button>
      </div>

      {/* Mostrar indicador de loading si hay una operación en curso */}
      {api.loading && clientes.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" />
            <span className="text-blue-400 text-sm">Procesando...</span>
          </div>
        </div>
      )}

      {/* Filtros y búsqueda */}
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
              />
            </div>
            <button className="btn-secondary">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </button>
          </div>
          {selectedClientes.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {selectedClientes.length} seleccionados
              </span>
              <button className="btn-secondary text-red-400">
                Eliminar seleccionados
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de clientes */}
      {filteredClientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay clientes"
          description="Comienza agregando tu primer cliente"
          action="Agregar Cliente"
          onAction={() => setShowForm(true)}
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
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Formulario de cliente */}
      <FormularioCliente
        isOpen={showForm || !!editingCliente}
        onClose={() => {
          setShowForm(false)
          setEditingCliente(null)
        }}
        onSubmit={editingCliente ? handleEditCliente : handleCreateCliente}
        cliente={editingCliente}
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
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

// Componente de tarjeta de cliente (sin cambios)
interface ClienteCardProps {
  cliente: Cliente
  index: number
  onEdit: () => void
  onDelete: () => void
  onSelect: (selected: boolean) => void
  isSelected: boolean
}

const ClienteCard: React.FC<ClienteCardProps> = ({
  cliente,
  index,
  onEdit,
  onDelete,
  onSelect,
  isSelected
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
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className={`card relative group cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''
      }`}
    >
      {/* Checkbox de selección */}
      <div className="absolute top-4 left-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Menú de acciones */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
        
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg py-2 z-10 min-w-[120px]"
          >
            <button
              onClick={onEdit}
              className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={() => {}}
              className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Ver detalles</span>
            </button>
            <hr className="border-white/10 my-1" />
            <button
              onClick={onDelete}
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
}