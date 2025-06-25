// =====================================================
// SIDEBAR COMPONENT - src/components/Sidebar.tsx
// =====================================================

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { 
  LayoutDashboard,
  Users, 
  FolderOpen, 
  CreditCard, 
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  BarChart3,
  Calendar,
  Bell,
  Shield,
  LogOut,
  Crown,
  Briefcase
} from 'lucide-react'
import { RolUsuario } from '@/types/auth'
import { NotificationCenter } from '@/components/NotificationCenter'

const menuItems = [
  {
    title: 'Principal',
    items: [
      { href: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['SUPERADMIN', 'ADMIN', 'VENTAS'] },
      { href: '/clientes', icon: Users, label: 'Clientes', roles: ['SUPERADMIN', 'ADMIN', 'VENTAS'] },
      { href: '/proyectos', icon: FolderOpen, label: 'Proyectos', roles: ['SUPERADMIN', 'ADMIN', 'VENTAS'] },
      { href: '/pagos', icon: CreditCard, label: 'Pagos', roles: ['SUPERADMIN', 'ADMIN', 'VENTAS'] },
    ]
  },
  {
    title: 'Reportes',
    items: [
      { href: '/facturacion', icon: DollarSign, label: 'Facturación', roles: ['SUPERADMIN', 'ADMIN', 'VENTAS'] },
      { href: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['SUPERADMIN', 'ADMIN', 'VENTAS'] },
      { href: '/calendario', icon: Calendar, label: 'Calendario', roles: ['SUPERADMIN', 'ADMIN', 'VENTAS'] },
    ]
  },
  {
    title: 'Administración',
    items: [
      { href: '/admin/usuarios', icon: Shield, label: 'Usuarios', roles: ['SUPERADMIN', 'ADMIN'] },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { href: '/notificaciones', icon: Bell, label: 'Notificaciones', roles: ['SUPERADMIN', 'ADMIN', 'VENTAS'] },
      { href: '/configuracion', icon: Settings, label: 'Configuración', roles: ['SUPERADMIN'] },
      { href: '/ayuda', icon: HelpCircle, label: 'Ayuda', roles: ['SUPERADMIN', 'ADMIN', 'VENTAS'] },
    ]
  }
]

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const getRolIcon = (rol: RolUsuario) => {
    switch (rol) {
      case 'SUPERADMIN': return <Crown className="w-4 h-4" />
      case 'ADMIN': return <Shield className="w-4 h-4" />
      case 'VENTAS': return <Briefcase className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getRolColor = (rol: RolUsuario) => {
    switch (rol) {
      case 'SUPERADMIN': return 'text-purple-400'
      case 'ADMIN': return 'text-blue-400'
      case 'VENTAS': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const canAccessItem = (requiredRoles: string[]) => {
    if (!session?.user?.rol) return false
    return requiredRoles.includes(session.user.rol)
  }

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 256 }}
      className="fixed left-0 top-0 h-full bg-black/40 backdrop-blur-xl border-r border-white/10 z-40"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <motion.div 
            className="flex items-center justify-between"
            animate={{ justifyContent: isCollapsed ? 'center' : 'space-between' }}
          >
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 relative">
                  <Image
                    src="/logo.webp"
                    alt="PayTracker Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">PayTracker</h1>
                  <p className="text-xs text-gray-400">Software Factory</p>
                </div>
              </motion.div>
            )}
            {isCollapsed && (
              <div className="w-8 h-8 relative">
                <Image
                  src="/logo.webp"
                  alt="PayTracker Logo"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              {!isCollapsed && <NotificationCenter />}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {menuItems.map((section, sectionIndex) => {
            const visibleItems = section.items.filter(item => canAccessItem(item.roles))
            
            if (visibleItems.length === 0) return null

            return (
              <div key={section.title}>
                {!isCollapsed && (
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    {section.title}
                  </h2>
                )}
                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.href}>
                        <Link href={item.href}>
                          <motion.div
                            whileHover={{ x: 4 }}
                            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors relative group ${
                              isActive
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && (
                              <span className="font-medium">{item.label}</span>
                            )}
                            
                            {isCollapsed && (
                              <div className="absolute left-full ml-2 px-2 py-1 bg-black/90 backdrop-blur-sm text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {item.label}
                              </div>
                            )}
                          </motion.div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        {/* User Profile */}
        {session?.user && (
          <div className="p-4 border-t border-white/10">
            {!isCollapsed ? (
              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {session.user.nombre?.charAt(0)}{session.user.apellido?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {session.user.nombre} {session.user.apellido}
                    </p>
                    <div className={`flex items-center space-x-1 ${getRolColor(session.user.rol)}`}>
                      {getRolIcon(session.user.rol)}
                      <span className="text-xs">{session.user.rol}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Link href="/perfil" className="block">
                    <div className="flex items-center space-x-2 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Mi Perfil</span>
                    </div>
                  </Link>
                  
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="flex items-center space-x-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                {/* Notificaciones */}
                <NotificationCenter />
                
                {/* Avatar */}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {session.user.nombre?.charAt(0)}{session.user.apellido?.charAt(0)}
                  </span>
                </div>
                
                {/* Logout */}
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors group relative"
                >
                  <LogOut className="w-4 h-4" />
                  <div className="absolute left-full ml-2 px-2 py-1 bg-black/90 backdrop-blur-sm text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    Cerrar Sesión
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  )
}