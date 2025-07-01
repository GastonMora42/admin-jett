// =====================================================
// PÁGINA PRINCIPAL - src/app/page.tsx
// =====================================================

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Users,
  BarChart3,
  CreditCard,
  Globe
} from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: Users,
      title: 'Gestión de Clientes',
      description: 'Centraliza toda la información de tus clientes en un solo lugar'
    },
    {
      icon: BarChart3,
      title: 'Proyectos y Pagos',
      description: 'Controla el estado de tus proyectos y pagos de forma eficiente'
    },
    {
      icon: CreditCard,
      title: 'Facturación Automática',
      description: 'Genera facturas y controla el flujo de caja automáticamente'
    },
    {
      icon: Shield,
      title: 'Seguridad Avanzada',
      description: 'Protección con AWS Cognito y autenticación de múltiples factores'
    },
    {
      icon: Zap,
      title: 'Análisis en Tiempo Real',
      description: 'Obtén insights valiosos con métricas y reportes avanzados'
    },
    {
      icon: Globe,
      title: 'Acceso Global',
      description: 'Accede desde cualquier lugar con nuestra plataforma web'
    }
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-black" />
      
      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 relative">
              <Image
                src="/logo.webp"
                alt="Jett Labs"
                fill
                className="object-contain rounded-2xl"
              />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Jett Labs
            </span>
          </h1>
          
          <h2 className="text-2xl md:text-3xl text-gray-300 mb-8">
            Software Factory Management
          </h2>
          
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            La plataforma integral para gestionar tu software factory. 
            Controla proyectos, clientes, pagos y métricas desde una interfaz moderna y potente.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/auth/signin" className="btn-primary text-lg px-8 py-4">
              Iniciar Sesión
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            
            <Link href="/auth/register" className="btn-secondary text-lg px-8 py-4">
              Crear Cuenta
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-20"
        >
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            Todo lo que necesitas para gestionar tu negocio
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="card p-6 hover:border-blue-500/30 transition-colors"
              >
                <feature.icon className="w-12 h-12 text-blue-400 mb-4" />
                <h4 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="card p-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
            <h3 className="text-2xl font-bold text-white mb-4">
              ¿Listo para optimizar tu software factory?
            </h3>
            <p className="text-gray-300 mb-6">
              Únete a las empresas que ya confían en Jett Labs para gestionar sus proyectos y clientes.
            </p>
            <Link href="/auth/signin" className="btn-primary text-lg px-8 py-4">
              Comenzar Ahora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 Jett Labs. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}