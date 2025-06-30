'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, AlertCircle, ArrowLeft, Shield, Zap, Users, UserPlus, CheckCircle } from 'lucide-react'
import { SilkBackground } from '@/components/SilkBackground'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/AuthProvider' // Usar el contexto

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null) // null = no verificado aún
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, isLoading } = useAuth() // Usar el contexto, eliminado forceRefresh porque no existe en AuthContextType
  
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const urlMessage = searchParams.get('message')
  useEffect(() => {
    // Solo verificar redirección si no está en proceso de loading
    if (isLoading) {
      console.log('⏳ Auth still loading, waiting...')
      return
    }

    // Si ya está autenticado, redirigir inmediatamente
    if (isAuthenticated) {
      console.log('✅ User already authenticated, redirecting to:', callbackUrl)
      router.push(callbackUrl)
      return
    }

    console.log('👤 User not authenticated, showing login form')

    // Verificar si el registro está habilitado solo una vez
    if (registrationEnabled === null) { // Solo llamar si aún no se ha verificado
      checkRegistrationStatus()
    }

    // Mostrar mensaje de URL si existe
    if (urlMessage === 'account-confirmed') {
      setMessage('¡Cuenta confirmada exitosamente! Ya puedes iniciar sesión.')
    }
  }, [isAuthenticated, isLoading, router, callbackUrl, urlMessage, registrationEnabled])

  const checkRegistrationStatus = async () => {
    try {
      const response = await fetch('/api/auth/registration-status')
      const data = await response.json()
      setRegistrationEnabled(data.enabled)
    } catch (error) {
      console.error('Error checking registration status:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      console.log('🔐 Starting login process...')
      
      // Usar la función de login del contexto
      const result = await login(email, password)

      if (result.success) {
        console.log('✅ Login successful, forcing auth refresh...')

        // Forzar actualización del estado de autenticación
        if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
          // Recargar la página para asegurar que el estado de autenticación se actualice correctamente
          window.location.reload()
        } else {
          console.log('⚠️ No se pudo forzar la actualización del estado de autenticación (no window disponible)')
        }
        setTimeout(() => {
          router.push(callbackUrl)
        }, 100)
      } else {
        // Manejar errores específicos
        if (result.error?.includes('UserNotConfirmedException') || result.error?.includes('no confirmado')) {
          setError('Tu cuenta no está confirmada. Revisa tu email para el código de confirmación.')
        } else if (result.error?.includes('NotAuthorizedException') || result.error?.includes('incorrectos')) {
          setError('Email o contraseña incorrectos.')
        } else if (result.error?.includes('UserNotFoundException') || result.error?.includes('no encontrado')) {
          setError('No existe una cuenta con este email.')
        } else {
          setError(result.error || 'Error al iniciar sesión. Verifica tus credenciales.')
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error during login:', error)
      setError('Error de conexión. Por favor, intenta más tarde.')
    } finally {
      setLoading(false)
    }
  }

  // Si está cargando la autenticación, mostrar loading
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

  // Si ya está autenticado, no mostrar el formulario
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: Users,
      title: "Gestión Integral",
      description: "Administra clientes, proyectos y pagos desde una sola plataforma"
    },
    {
      icon: Shield,
      title: "Seguridad Avanzada",
      description: "Autenticación robusta y protección de datos empresariales"
    },
    {
      icon: Zap,
      title: "Análisis en Tiempo Real",
      description: "Métricas y reportes que impulsan tu toma de decisiones"
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <SilkBackground />
      
      {/* Back to home */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 left-6 z-20"
      >
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver al inicio</span>
          </motion.button>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left side - Features */}
        <div className="hidden lg:flex flex-col justify-center p-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-lg"
          >
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 relative">
                <Image
                  src="/logo.webp"
                  alt="Jett Labs Logo"
                  fill
                  className="object-contain rounded-xl"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Jett Labs</h1>
                <p className="text-sm text-gray-400">Software Factory Management</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Potencia tu 
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> Software Factory</span>
            </h2>
            
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              La plataforma definitiva para gestionar todos los aspectos de tu negocio de desarrollo de software.
            </p>

            <div className="space-y-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start space-x-4"
                >
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right side - Login form */}
        <div className="flex flex-col justify-center p-6 lg:p-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-md mx-auto"
          >
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-10 h-10 relative">
                  <Image
                    src="/logo.webp"
                    alt="Jett Labs Logo"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Jett Labs</h1>
                  <p className="text-xs text-gray-400">Software Factory Management</p>
                </div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Bienvenido de vuelta
                </h2>
                <p className="text-gray-400 text-sm">
                  Accede a tu panel de control administrativo
                </p>
              </div>

              {/* Success Message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start space-x-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-400 text-sm font-medium">Éxito</p>
                    <p className="text-green-300 text-xs mt-1">{message}</p>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 text-sm font-medium">Error de autenticación</p>
                    <p className="text-red-300 text-xs mt-1">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email corporativo
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                    placeholder="usuario@empresa.com"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all pr-12"
                      placeholder="Tu contraseña segura"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-400">Recordarme</span>
                  </label>
                  <button 
                    type="button"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-all relative overflow-hidden group"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                      Verificando credenciales...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <LogIn className="w-5 h-5 mr-2" />
                      Acceder al Sistema
                    </div>
                  )}
                </button>
              </form>

              {/* Registration link */}
              {registrationEnabled === true && (
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                  <p className="text-gray-400 text-sm mb-3">
                    ¿No tienes una cuenta?
                  </p>
                  <Link href="/auth/register">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      Crear Nueva Cuenta
                    </motion.button>
                  </Link>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-center text-gray-500 text-xs">
                  Sistema administrativo interno • Acceso restringido
                </p>
              </div>
            </div>

            {/* Additional info */}
            <div className="text-center mt-6">
              <p className="text-gray-500 text-xs">
                Jett Labs v2.0 • Desarrollado por Jett Labs
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}