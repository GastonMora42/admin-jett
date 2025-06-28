// src/components/Sidebar.tsx - Versión migrada
'use client'

import React from 'react'
import { useAuth } from '@/components/AuthProvider' // ← Cambiado de next-auth
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  DollarSign, 
  Settings, 
  LogOut,
  User
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth() // ← Cambiado de useSession
  const pathname = usePathname()
  const router = useRouter()

  // Manejar logout
  const handleLogout = async () => {
    await logout()
    router.push('/auth/signin')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Proyectos', href: '/projects', icon: FolderOpen },
    { name: 'Facturación', href: '/billing', icon: DollarSign },
    { name: 'Configuración', href: '/settings', icon: Settings },
  ]

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-black/90 backdrop-blur-xl border-r border-white/10 z-20">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center space-x-3 p-6 border-b border-white/10">
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
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">
                {user?.given_name || user?.name || 'Usuario'}
              </div>
              <div className="text-xs text-gray-400">
                {user?.email}
              </div>
              {user?.['custom:role'] && (
                <div className="text-xs text-blue-400 capitalize">
                  {user['custom:role'].toLowerCase()}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  )
}