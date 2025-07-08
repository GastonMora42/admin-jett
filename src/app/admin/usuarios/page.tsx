// =====================================================
// PANEL ADMIN USUARIOS CORREGIDO - src/app/admin/usuarios/page.tsx
// =====================================================

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  User,
  Crown,
  Briefcase,
  Eye,
  Mail,
  Calendar
} from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { RolUsuario } from '@/types/auth'
import { FormularioUsuario } from '@/components/FormularioUsuario'

interface Usuario {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: RolUsuario
  estado: string
  fechaCreacion: string
  fechaLogin?: string
  _count: {
    clientesCreados: number
    proyectosCreados: number
    pagosGestionados: number
  }
}

// ✅ CORREGIDO: Tipo específico para datos del formulario
interface UsuarioFormData {
  email: string
  nombre: string
  apellido: string
  rol: RolUsuario
  password?: string
  estado?: string
}

export default function AdminUsuariosPage() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroRol, setFiltroRol] = useState<string>('todos')
  const [showForm, setShowForm] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null)

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/usuarios')
      if (!response.ok) throw new Error('Error al cargar usuarios')
      const data = await response.json()
      setUsuarios(data)
    } catch (error) {
      console.error('Error:', error)
      console.error('Error al cargar usuarios:', error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsuarios()
  }, [fetchUsuarios])

  // ✅ CORREGIDO: Tipo específico para el parámetro
  const handleCreateUsuario = async (usuarioData: UsuarioFormData) => {
    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuarioData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al crear usuario')
      }
      
      await fetchUsuarios()
      setShowForm(false)
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al crear usuario'
      console.error('Error al crear usuario:', errorMessage)
    }
  }

  // ✅ CORREGIDO: Tipo específico para el parámetro
  const handleEditUsuario = async (usuarioData: UsuarioFormData) => {
    if (!editingUsuario) return
    
    try {
      const response = await fetch(`/api/usuarios/${editingUsuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuarioData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al actualizar usuario')
      }
      
      await fetchUsuarios()
      setEditingUsuario(null)
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar usuario'
      console.error('Error al actualizar usuario:', errorMessage)
    }
  }

  const handleDeleteUsuario = async (usuario: Usuario) => {
    setUsuarioToDelete(usuario)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!usuarioToDelete) return
    
    try {
      const response = await fetch(`/api/usuarios/${usuarioToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al eliminar usuario')
      }
      
      await fetchUsuarios()
      setShowDeleteConfirm(false)
      setUsuarioToDelete(null)
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar usuario'
      console.error('Error al eliminar usuario:', errorMessage)
    }
  }

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRol = filtroRol === 'todos' || usuario.rol === filtroRol
    
    return matchesSearch && matchesRol
  })

  const getRolIcon = (rol: RolUsuario) => {
    switch (rol) {
      case 'SUPERADMIN': return <Crown className="w-4 h-4" />
      case 'ADMIN': return <Shield className="w-4 h-4" />
      case 'VENTAS': return <Briefcase className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getRolColor = (rol: RolUsuario) => {
    switch (rol) {
      case 'SUPERADMIN': return 'text-purple-400 bg-purple-500/20 border-purple-500/30'
      case 'ADMIN': return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      case 'VENTAS': return 'text-green-400 bg-green-500/20 border-green-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const estadisticas = {
    total: usuarios.length,
    superadmin: usuarios.filter(u => u.rol === 'SUPERADMIN').length,
    admin: usuarios.filter(u => u.rol === 'ADMIN').length,
    ventas: usuarios.filter(u => u.rol === 'VENTAS').length,
    activos: usuarios.filter(u => u.estado === 'ACTIVO').length,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
          <p className="text-gray-400 mt-1">
            Administra los usuarios del sistema ({filteredUsuarios.length} de {usuarios.length})
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </motion.button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-white">{estadisticas.total}</p>
          <p className="text-gray-400 text-sm">Total</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{estadisticas.superadmin}</p>
          <p className="text-gray-400 text-sm">Superadmin</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{estadisticas.admin}</p>
          <p className="text-gray-400 text-sm">Admin</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{estadisticas.ventas}</p>
          <p className="text-gray-400 text-sm">Ventas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{estadisticas.activos}</p>
          <p className="text-gray-400 text-sm">Activos</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-glass pl-10 w-full"
            />
          </div>
          
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="input-glass"
          >
            <option value="todos">Todos los roles</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="ADMIN">Admin</option>
            <option value="VENTAS">Ventas</option>
          </select>
        </div>
      </div>

      {/* Lista de usuarios */}
      {filteredUsuarios.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay usuarios"
          description="Comienza agregando el primer usuario al sistema"
          action="Agregar Usuario"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredUsuarios.map((usuario, index) => (
              <UsuarioCard
                key={usuario.id}
                usuario={usuario}
                index={index}
                currentUserId={user?.sub}
                onEdit={() => setEditingUsuario(usuario)}
                onDelete={() => handleDeleteUsuario(usuario)}
                getRolIcon={getRolIcon}
                getRolColor={getRolColor}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Formulario de usuario */}
      <FormularioUsuario
        isOpen={showForm || !!editingUsuario}
        onClose={() => {
          setShowForm(false)
          setEditingUsuario(null)
        }}
        onSubmit={editingUsuario ? handleEditUsuario : handleCreateUsuario}
        usuario={editingUsuario}
        title={editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
        currentUserRole={(user?.['custom:role'] as RolUsuario) || 'VENTAS'}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que quieres eliminar a ${usuarioToDelete?.nombre} ${usuarioToDelete?.apellido}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
      />
    </motion.div>
  )
}

// Componente de tarjeta de usuario
interface UsuarioCardProps {
  usuario: Usuario
  index: number
  currentUserId?: string
  onEdit: () => void
  onDelete: () => void
  getRolIcon: (rol: RolUsuario) => React.ReactNode
  getRolColor: (rol: RolUsuario) => string
}

const UsuarioCard: React.FC<UsuarioCardProps> = ({
  usuario,
  index,
  currentUserId,
  onEdit,
  onDelete,
  getRolIcon,
  getRolColor
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const isCurrentUser = usuario.id === currentUserId

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="card relative group cursor-pointer transition-all"
    >
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
            {!isCurrentUser && (
              <button
                onClick={onDelete}
                className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Contenido principal */}
      <div className="pt-8">
        {/* Avatar y nombre */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {usuario.nombre.charAt(0).toUpperCase()}{usuario.apellido.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {usuario.nombre} {usuario.apellido}
              {isCurrentUser && <span className="text-blue-400 text-sm ml-2">(Tú)</span>}
            </h3>
            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded border text-xs ${getRolColor(usuario.rol)}`}>
              {getRolIcon(usuario.rol)}
              <span>{usuario.rol}</span>
            </div>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <Mail className="w-4 h-4" />
            <span className="truncate">{usuario.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <Calendar className="w-4 h-4" />
            <span>Creado: {new Date(usuario.fechaCreacion).toLocaleDateString()}</span>
          </div>
          {usuario.fechaLogin && (
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <Eye className="w-4 h-4" />
              <span>Último acceso: {new Date(usuario.fechaLogin).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Estadísticas de actividad */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Clientes creados</span>
            <span className="text-white font-medium">{usuario._count.clientesCreados}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Proyectos creados</span>
            <span className="text-blue-400 font-medium">{usuario._count.proyectosCreados}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Pagos gestionados</span>
            <span className="text-green-400 font-medium">{usuario._count.pagosGestionados}</span>
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            usuario.estado === 'ACTIVO' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {usuario.estado}
          </span>
        </div>
      </div>
    </motion.div>
  )
}