
// =====================================================
// SIDEBAR COMPONENT - src/components/Sidebar.tsx
// =====================================================

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
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
  Bell
} from 'lucide-react'

const menuItems = [
  {
    title: 'Principal',
    items: [
      { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/clientes', icon: Users, label: 'Clientes' },
      { href: '/proyectos', icon: FolderOpen, label: 'Proyectos' },
      { href: '/pagos', icon: CreditCard, label: 'Pagos' },
    ]
  },
  {
    title: 'Reportes',
    items: [
      { href: '/facturacion', icon: DollarSign, label: 'Facturación' },
      { href: '/analytics', icon: BarChart3, label: 'Analytics' },
      { href: '/calendario', icon: Calendar, label: 'Calendario' },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { href: '/notificaciones', icon: Bell, label: 'Notificaciones' },
      { href: '/configuracion', icon: Settings, label: 'Configuración' },
      { href: '/ayuda', icon: HelpCircle, label: 'Ayuda' },
    ]
  }
]

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

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
              >
                <h1 className="text-xl font-bold text-white">PayTracker</h1>
                <p className="text-xs text-gray-400">Software Factory</p>
              </motion.div>
            )}
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
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6">
          {menuItems.map((section, sectionIndex) => (
            <div key={section.title}>
              {!isCollapsed && (
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  {section.title}
                </h2>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
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
                            <div className="absolute left-full ml-2 px-2 py-1 bg-black/90 backdrop-blur-sm text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
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
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          {!isCollapsed ? (
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-1">
                Version Pro
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                Desbloquea funciones avanzadas
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded-md transition-colors">
                Actualizar
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}

