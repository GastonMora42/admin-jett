// src/components/Sidebar.tsx - VERSIÓN PROFESIONAL Y RESPONSIVE
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  DollarSign, 
  Settings, 
  LogOut,
  User,
  Calendar,
  BarChart3,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setIsCollapsed(false) // En móvil, no colapsar sino mostrar/ocultar completamente
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cerrar sidebar en móvil al hacer clic en un enlace
  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false)
    }
  }

  // Manejar logout
  const handleLogout = async () => {
    console.log('🚪 Sidebar logout initiated')
    await logout()
  }

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      description: 'Vista general' 
    },
    { 
      name: 'Clientes', 
      href: '/clientes', 
      icon: Users,
      description: 'Gestión de clientes' 
    },
    { 
      name: 'Proyectos', 
      href: '/proyectos', 
      icon: FolderOpen,
      description: 'Proyectos activos' 
    },
    { 
      name: 'Pagos', 
      href: '/pagos', 
      icon: DollarSign,
      description: 'Control de pagos' 
    },
    { 
      name: 'Facturación', 
      href: '/facturacion', 
      icon: BarChart3,
      description: 'Reportes financieros' 
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: BarChart3,
      description: 'Análisis y métricas' 
    },
    { 
      name: 'Calendario', 
      href: '/calendario', 
      icon: Calendar,
      description: 'Agenda y fechas' 
    },
  ]

  // Sidebar para móvil (overlay)
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-72 bg-slate-950/95 backdrop-blur-xl border-r border-white/10 z-50 lg:hidden"
            >
              <SidebarContent
                navigation={navigation}
                pathname={pathname}
                user={user}
                isCollapsed={false}
                userMenuOpen={userMenuOpen}
                setUserMenuOpen={setUserMenuOpen}
                onLinkClick={handleLinkClick}
                onLogout={handleLogout}
                onClose={() => setIsOpen(false)}
                isMobile={true}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    )
  }

  // Sidebar para desktop
  return (
    <motion.div
      animate={{ 
        width: isCollapsed ? 80 : 280 
      }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed left-0 top-0 h-full bg-slate-950/95 backdrop-blur-xl border-r border-white/10 z-30 hidden lg:block"
    >
      <SidebarContent
        navigation={navigation}
        pathname={pathname}
        user={user}
        isCollapsed={isCollapsed}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onLogout={handleLogout}
        isMobile={false}
      />
    </motion.div>
  )
}

// Contenido del sidebar reutilizable
interface SidebarContentProps {
  navigation: Array<{
    name: string
    href: string
    icon: React.ComponentType<any>
    description: string
  }>
  pathname: string
  user: any
  isCollapsed: boolean
  userMenuOpen: boolean
  setUserMenuOpen: (open: boolean) => void
  onLinkClick?: () => void
  onToggleCollapse?: () => void
  onLogout: () => void
  onClose?: () => void
  isMobile: boolean
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  navigation,
  pathname,
  user,
  isCollapsed,
  userMenuOpen,
  setUserMenuOpen,
  onLinkClick,
  onToggleCollapse,
  onLogout,
  onClose,
  isMobile
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 relative">
              <Image
                src="/logo.webp"
                alt="Jett Labs"
                fill
                className="object-contain rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Jett Labs</h2>
              <p className="text-xs text-gray-400">Management</p>
            </div>
          </motion.div>
        )}
        
        {isCollapsed && (
          <div className="w-8 h-8 relative mx-auto">
            <Image
              src="/logo.webp"
              alt="Jett Labs"
              fill
              className="object-contain rounded-lg"
            />
          </div>
        )}

        {/* Controles */}
        <div className="flex items-center space-x-2">
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {!isMobile && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search bar (solo cuando no está colapsado) */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <motion.div
              key={item.name}
              whileHover={{ x: isCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={item.href}
                onClick={onLinkClick}
                className={`group flex items-center px-3 py-3 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {/* Indicador activo */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-8 bg-white rounded-r-full"
                    initial={false}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  />
                )}
                
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`} />
                  
                  {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs opacity-75 truncate">{item.description}</p>
                    </div>
                  )}
                </div>

                {/* Tooltip para modo colapsado */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    <p className="text-sm font-medium text-white whitespace-nowrap">{item.name}</p>
                    <p className="text-xs text-gray-400 whitespace-nowrap">{item.description}</p>
                  </div>
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-4">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-200 ${
              userMenuOpen ? 'bg-white/10' : ''
            }`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {user?.given_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium text-white truncate">
                    {user?.given_name || user?.name || 'Usuario'}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {user?.email || 'email@example.com'}
                  </div>
                  {user?.['custom:role'] && (
                    <div className="text-xs text-blue-400 capitalize">
                      {user['custom:role'].toLowerCase()}
                    </div>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                  userMenuOpen ? 'rotate-180' : ''
                }`} />
              </>
            )}
          </button>

          {/* User menu */}
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute ${isCollapsed ? 'left-full ml-2' : 'bottom-full mb-2'} ${
                  isCollapsed ? 'w-48' : 'left-0 right-0'
                } bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg py-2 z-50`}
              >
                <button
                  onClick={() => {/* Ir a perfil */}}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Mi Perfil</span>
                </button>
                
                <button
                  onClick={() => {/* Ir a configuración */}}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Configuración</span>
                </button>

                <button
                  onClick={() => {/* Ver notificaciones */}}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span className="text-sm">Notificaciones</span>
                </button>
                
                <hr className="border-white/10 my-2" />
                
                <button
                  onClick={onLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Cerrar Sesión</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// Asignar displayName
Sidebar.displayName = 'Sidebar'

export default Sidebar