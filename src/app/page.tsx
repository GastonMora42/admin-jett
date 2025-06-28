// =====================================================
// LANDING PAGE PRINCIPAL - src/app/page.tsx
// =====================================================

'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider' // ← Cambiado de next-auth
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ArrowRight, 
  Shield, 
  Users, 
  BarChart3, 
  Zap,
  CheckCircle,
  Star
} from 'lucide-react'
import { SilkBackground } from '@/components/SilkBackground'

export default function LandingPage() {
  const { user, isAuthenticated, isLoading } = useAuth() // ← Cambiado de useSession
  const router = useRouter()

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, router])

  // Mostrar loading mientras verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Si ya está autenticado, no mostrar nada (será redirigido)
  if (isAuthenticated && user) {
    return null
  }

  const features = [
    {
      icon: Users,
      title: "Gestión de Clientes",
      description: "Administra tu cartera de clientes de manera eficiente"
    },
    {
      icon: BarChart3,
      title: "Control de Proyectos",
      description: "Seguimiento completo del ciclo de vida de tus proyectos"
    },
    {
      icon: Shield,
      title: "Seguimiento de Pagos",
      description: "Nunca pierdas un pago con nuestro sistema de recordatorios"
    },
    {
      icon: Zap,
      title: "Reportes Avanzados",
      description: "Analytics detallados para optimizar tu negocio"
    }
  ]

  const testimonials = [
    {
      name: "María García",
      company: "Digital Solutions",
      text: "Ha transformado completamente nuestra gestión de proyectos",
      rating: 5
    },
    {
      name: "Carlos López",
      company: "TechStart",
      text: "Imprescindible para cualquier software factory",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <SilkBackground />
      
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 relative">
              <Image
                src="/logo.webp"
                alt="Jett Labs Logo"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">Jett Labs</h1>
              <p className="text-xs text-gray-400">Software Factory</p>
            </div>
          </div>
          
          <Link href="/auth/signin">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary"
            >
              Iniciar Sesión
              <ArrowRight className="w-4 h-4 ml-2" />
            </motion.button>
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              PayTracker
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              La plataforma definitiva para gestionar tu software factory. 
              <span className="text-blue-400 font-medium"> Clientes, proyectos y pagos</span> en un solo lugar.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth/signin">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl transition-all"
              >
                Acceder al Sistema
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </motion.button>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-xl font-semibold text-lg backdrop-blur-sm transition-all"
            >
              Ver Demo
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Todo lo que necesitas
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Herramientas profesionales diseñadas específicamente para software factories
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all group"
              >
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-3xl p-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <h3 className="text-4xl font-bold text-blue-400 mb-2">500+</h3>
                <p className="text-gray-300">Proyectos Gestionados</p>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-purple-400 mb-2">98%</h3>
                <p className="text-gray-300">Tasa de Cobro</p>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-green-400 mb-2">150+</h3>
                <p className="text-gray-300">Clientes Satisfechos</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Lo que dicen nuestros usuarios
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 text-lg mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-gray-400">{testimonial.company}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-3xl p-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              ¿Listo para optimizar tu negocio?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Únete a las software factories que ya confían en PayTracker
            </p>
            <Link href="/auth/signin">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-2xl transition-all"
              >
                Comenzar Ahora
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-8 h-8 relative">
                <Image
                  src="/logo.webp"
                  alt="Jett Labs Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <p className="font-semibold">Jett Labs</p>
                <p className="text-xs text-gray-400">Software Factory Management</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">
                © 2025 Jett Labs. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}