// =====================================================
// PÁGINA DE PROYECTOS CORREGIDA - src/app/proyectos/page.tsx
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
  Eye,
  Calendar,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  FolderOpen
} from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { FormularioProyecto } from '@/components/FormularioProyecto'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface Proyecto {
  id: string
  nombre: string
  tipo: TipoProyecto
  montoTotal: number
  formaPago: FormaPago
  cuotas?: number
  fechaInicio: string
  fechaEntrega?: string
  estadoProyecto: EstadoProyecto
  estadoPago: EstadoPago
  clienteId: string
  cliente?: Cliente
  pagos?: Pago[]
  progreso?: number
}

type TipoProyecto = 'SOFTWARE_A_MEDIDA' | 'ECOMMERCE' | 'LANDING_PAGE' | 'SISTEMA_WEB' | 'APP_MOVIL' | 'MANTENIMIENTO'
type FormaPago = 'PAGO_UNICO' | 'DOS_CUOTAS' | 'TRES_CUOTAS' | 'MENSUAL'
type EstadoProyecto = 'EN_DESARROLLO' | 'COMPLETADO' | 'EN_PAUSA' | 'CANCELADO'
type EstadoPago = 'PENDIENTE' | 'PARCIAL' | 'COMPLETO'

interface Cliente {
  id: string
  nombre: string
  email: string
  empresa?: string
}

interface Pago {
  id: string
  montoCuota: number
  fechaVencimiento: string
  estadoPago: string
}

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]) // ← Inicializado como array vacío
  const [clientes, setClientes] = useState<Cliente[]>([]) // ← Inicializado como array vacío
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // ← Agregado manejo de errores
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [showForm, setShowForm] = useState(false)
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null)
  const [viewingProyecto, setViewingProyecto] = useState<Proyecto | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [proyectoToDelete, setProyectoToDelete] = useState<Proyecto | null>(null)
  const [selectedProyectos, setSelectedProyectos] = useState<string[]>([])
  const [vista, setVista] = useState<'cards' | 'table'>('cards')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        await Promise.all([
          fetchProyectos(),
          fetchClientes()
        ])
      } catch (err) {
        setError('Error al cargar los datos')
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const fetchProyectos = async () => {
    try {
      const response = await fetch('/api/proyectos')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar proyectos')
      }
      const data = await response.json()
      setProyectos(Array.isArray(data) ? data : []) // ← Asegurar que siempre sea un array
    } catch (error) {
      console.error('Error:', error)
      setProyectos([]) // ← Asegurar array vacío en caso de error
      throw error
    }
  }

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar clientes')
      }
      const data = await response.json()
      setClientes(Array.isArray(data) ? data : []) // ← Asegurar que siempre sea un array
    } catch (error) {
      console.error('Error:', error)
      setClientes([]) // ← Asegurar array vacío en caso de error
      throw error
    }
  }

  const handleCreateProyecto = async (proyectoData: Partial<Proyecto>) => {
    try {
      const response = await fetch('/api/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proyectoData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear proyecto')
      }
      
      await fetchProyectos()
      setShowForm(false)
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al crear proyecto')
    }
  }

  const handleEditProyecto = async (proyectoData: Partial<Proyecto>) => {
    if (!editingProyecto) return
    
    try {
      const response = await fetch(`/api/proyectos/${editingProyecto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proyectoData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar proyecto')
      }
      
      await fetchProyectos()
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
      const response = await fetch(`/api/proyectos/${proyectoToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar proyecto')
      }
      
      await fetchProyectos()
      setShowDeleteConfirm(false)
      setProyectoToDelete(null)
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar proyecto')
    }
  }

  const handleEstadoChange = async (proyecto: Proyecto, nuevoEstado: EstadoProyecto) => {
    try {
      const response = await fetch(`/api/proyectos/${proyecto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoProyecto: nuevoEstado })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar estado')
      }
      
      await fetchProyectos()
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al actualizar estado')
    }
  }

  // ← Asegurar que proyectos sea un array antes de filtrar
  const filteredProyectos = (proyectos || []).filter(proyecto => {
    const matchesSearch = proyecto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proyecto.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proyecto.cliente?.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEstado = filtroEstado === 'todos' || proyecto.estadoProyecto === filtroEstado
    const matchesTipo = filtroTipo === 'todos' || proyecto.tipo === filtroTipo
    
    return matchesSearch && matchesEstado && matchesTipo
  })

  const estadisticas = {
    total: proyectos.length,
    enDesarrollo: proyectos.filter(p => p.estadoProyecto === 'EN_DESARROLLO').length,
    completados: proyectos.filter(p => p.estadoProyecto === 'COMPLETADO').length,
    enPausa: proyectos.filter(p => p.estadoProyecto === 'EN_PAUSA').length,
    totalFacturado: proyectos.reduce((sum, p) => sum + p.montoTotal, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error al cargar datos</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Reintentar
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
          <h1 className="text-3xl font-bold text-white">Proyectos</h1>
          <p className="text-gray-400 mt-1">
            Gestiona todos tus proyectos ({filteredProyectos.length} de {proyectos.length})
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
              onClick={() => setVista('table')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                vista === 'table' ? 'bg-white/10 text-white' : 'text-gray-400'
              }`}
            >
              Tabla
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proyecto
          </motion.button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-white">{estadisticas.total}</p>
          <p className="text-gray-400 text-sm">Total</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{estadisticas.enDesarrollo}</p>
          <p className="text-gray-400 text-sm">En Desarrollo</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{estadisticas.completados}</p>
          <p className="text-gray-400 text-sm">Completados</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{estadisticas.enPausa}</p>
          <p className="text-gray-400 text-sm">En Pausa</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            ${estadisticas.totalFacturado.toLocaleString()}
          </p>
          <p className="text-gray-400 text-sm">Facturado</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
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
        </div>
        
        {selectedProyectos.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <span className="text-sm text-gray-400">
              {selectedProyectos.length} proyectos seleccionados
            </span>
            <div className="flex items-center space-x-2">
              <button className="btn-secondary text-yellow-400">
                Pausar
              </button>
              <button className="btn-secondary text-red-400">
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de proyectos */}
      {filteredProyectos.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No hay proyectos"
          description="Comienza creando tu primer proyecto"
          action="Crear Proyecto"
          onAction={() => setShowForm(true)}
        />
      ) : vista === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredProyectos.map((proyecto, index) => (
              <ProyectoCard
                key={proyecto.id}
                proyecto={proyecto}
                index={index}
                onEdit={() => setEditingProyecto(proyecto)}
                onDelete={() => handleDeleteProyecto(proyecto)}
                onView={() => setViewingProyecto(proyecto)}
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
        <ProyectosTable
          proyectos={filteredProyectos} // ← Pasar los proyectos filtrados
          onEdit={setEditingProyecto}
          onDelete={handleDeleteProyecto}
          onView={setViewingProyecto}
          selectedProyectos={selectedProyectos}
          onSelectProyecto={(id, selected) => {
            if (selected) {
              setSelectedProyectos([...selectedProyectos, id])
            } else {
              setSelectedProyectos(selectedProyectos.filter(pid => pid !== id))
            }
          }}
        />
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
        message={`¿Estás seguro de que quieres eliminar el proyecto "${proyectoToDelete?.nombre}"? Esta acción eliminará también todos los pagos asociados.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
      />
    </motion.div>
  )
}

// Componente de tarjeta de proyecto (sin cambios en la lógica)
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
  onView,
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
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onView() }}
              className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Ver detalles</span>
            </button>
            <hr className="border-white/10 my-1" />
            <button
              onClick={(e) => { e.stopPropagation(); onEstadoChange('EN_PAUSA') }}
              className="w-full px-4 py-2 text-left text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 flex items-center space-x-2"
            >
              <PauseCircle className="w-4 h-4" />
              <span>Pausar</span>
            </button>
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
          <div>
            <h3 className="text-white font-semibold text-lg mb-1">
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
          <span className="text-gray-300 text-sm">
            {proyecto.cliente?.nombre || 'Cliente no asignado'}
          </span>
        </div>

        {/* Monto y fechas */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Monto</span>
            <span className="text-green-400 font-semibold">
              ${proyecto.montoTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Inicio</span>
            <span className="text-gray-300 text-sm">
              {new Date(proyecto.fechaInicio).toLocaleDateString()}
            </span>
          </div>
          {proyecto.fechaEntrega && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Entrega</span>
              <span className="text-gray-300 text-sm">
                {new Date(proyecto.fechaEntrega).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Progreso de pagos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Progreso de pagos</span>
            <span className="text-gray-300 text-sm">
              {pagosPagados}/{totalPagos}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Componente de tabla (corregido para manejar arrays)
const ProyectosTable: React.FC<{
  proyectos: Proyecto[] // ← Especificar que es un array
  onEdit: (proyecto: Proyecto) => void
  onDelete: (proyecto: Proyecto) => void
  onView: (proyecto: Proyecto) => void
  selectedProyectos: string[]
  onSelectProyecto: (id: string, selected: boolean) => void
}> = ({ proyectos, onEdit, onDelete, onView, selectedProyectos, onSelectProyecto }) => {
  // ← Verificar que proyectos sea un array antes de hacer map
  if (!Array.isArray(proyectos)) {
    return (
      <div className="card p-6 text-center">
        <p className="text-gray-400">Error: Los datos no están en el formato correcto</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-4 text-gray-400 font-medium">
                <input type="checkbox" className="rounded bg-white/10 border-white/20" />
              </th>
              <th className="text-left p-4 text-gray-400 font-medium">Proyecto</th>
              <th className="text-left p-4 text-gray-400 font-medium">Cliente</th>
              <th className="text-left p-4 text-gray-400 font-medium">Tipo</th>
              <th className="text-left p-4 text-gray-400 font-medium">Monto</th>
              <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
              <th className="text-left p-4 text-gray-400 font-medium">Progreso</th>
              <th className="text-left p-4 text-gray-400 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.map((proyecto, index) => (
              <motion.tr
                key={proyecto.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-t border-white/5 hover:bg-white/5"
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedProyectos.includes(proyecto.id)}
                    onChange={(e) => onSelectProyecto(proyecto.id, e.target.checked)}
                    className="rounded bg-white/10 border-white/20"
                  />
                </td>
                <td className="p-4">
                  <button
                    onClick={() => onView(proyecto)}
                    className="text-white font-medium hover:text-blue-400 text-left"
                  >
                    {proyecto.nombre}
                  </button>
                </td>
                <td className="p-4 text-gray-300">
                  {proyecto.cliente?.nombre || 'No asignado'}
                </td>
                <td className="p-4 text-gray-300">
                  {proyecto.tipo.replace('_', ' ')}
                </td>
                <td className="p-4 text-green-400 font-medium">
                  ${proyecto.montoTotal.toLocaleString()}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    proyecto.estadoProyecto === 'EN_DESARROLLO' ? 'bg-blue-500/20 text-blue-400' :
                    proyecto.estadoProyecto === 'COMPLETADO' ? 'bg-green-500/20 text-green-400' :
                    proyecto.estadoProyecto === 'EN_PAUSA' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {proyecto.estadoProyecto.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4">
                  <div className="w-20 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(proyecto.pagos?.filter(p => p.estadoPago === 'PAGADO').length || 0) / (proyecto.pagos?.length || 1) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(proyecto)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onView(proyecto)}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(proyecto)}
                      className="text-red-400 hover:text-red-300"
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
}