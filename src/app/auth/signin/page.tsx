// src/app/auth/signin/page.tsx - LOGIN SIMPLIFICADO
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react'
import { SilkBackground } from '@/components/SilkBackground'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/AuthProvider'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, isLoading } = useAuth()
  
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

    // Mostrar mensaje de URL si existe
    if (urlMessage === 'account-confirmed') {
      setMessage('¡Cuenta confirmada exitosamente! Ya puedes iniciar sesión.')
    }
  }, [isAuthenticated, isLoading, router, callbackUrl, urlMessage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      console.log('🔐 Starting login process...')
      
      const result = await login(email, password)

      if (result.success) {
        console.log('✅ Login successful, forcing auth refresh...')

        if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
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

      {/* Contenido centrado */}
      <div className="flex items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
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
                <p className="text-sm text-gray-400">Management System</p>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Iniciar Sesión
              </h2>
              <p className="text-gray-400 text-sm">
                Accede a tu panel de control
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
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                  placeholder="tu@email.com"
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
                    placeholder="Tu contraseña"
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
  )
}