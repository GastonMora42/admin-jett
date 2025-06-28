// =====================================================
// PÁGINA DE CONFIRMACIÓN - src/app/auth/confirm/page.tsx
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Shield, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle,
  Mail,
  RefreshCw
} from 'lucide-react'
import { SilkBackground } from '@/components/SilkBackground'
import Link from 'next/link'
import Image from 'next/image'

export default function ConfirmPage() {
  const [confirmationCode, setConfirmationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!confirmationCode.trim()) {
      setError('El código de confirmación es requerido')
      return
    }

    if (!email) {
      setError('Email no encontrado. Por favor, vuelve a registrarte.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          confirmationCode: confirmationCode.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          router.push('/auth/signin?message=account-confirmed')
        }, 2000)
      } else {
        setError(data.message || 'Código de confirmación inválido')
      }
    } catch (error) {
      setError('Error de conexión. Por favor, intenta más tarde.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) {
      setError('Email no encontrado')
      return
    }

    setResendLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setError('')
        // Mostrar mensaje de éxito temporal
        const successMessage = 'Código reenviado correctamente'
        setError(`✓ ${successMessage}`)
        setTimeout(() => setError(''), 3000)
      } else {
        setError(data.message || 'Error al reenviar código')
      }
    } catch (error) {
      setError('Error de conexión. Por favor, intenta más tarde.')
    } finally {
      setResendLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <SilkBackground />
        <div className="relative z-10 text-center max-w-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
          >
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">¡Cuenta Confirmada!</h1>
            <p className="text-gray-400 mb-4">
              Tu cuenta ha sido activada exitosamente.
            </p>
            <p className="text-sm text-gray-500">
              Redirigiendo al login...
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <SilkBackground />
      
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 left-6 z-20"
      >
        <Link href="/auth/signin">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver al login</span>
          </motion.button>
        </Link>
      </motion.div>

      <div className="flex items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 relative">
                <Image
                  src="/logo.webp"
                  alt="Jett Labs Logo"
                  fill
                  className="object-contain rounded-xl"
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
              <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Confirmar tu cuenta
              </h2>
              <p className="text-gray-400 text-sm">
                Revisa tu email y ingresa el código de confirmación
              </p>
              {email && (
                <p className="text-blue-400 text-sm mt-2 font-medium">
                  Enviado a: {email}
                </p>
              )}
            </div>

            {/* Instrucciones */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 text-sm font-medium mb-1">
                    Código de confirmación enviado
                  </p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Hemos enviado un código de 6 dígitos a tu email. 
                    Revisa también tu carpeta de spam si no lo encuentras.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
                  error.startsWith('✓') 
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-red-500/10 border border-red-500/20'
                }`}
              >
                {error.startsWith('✓') ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    error.startsWith('✓') ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {error.startsWith('✓') ? 'Éxito' : 'Error'}
                  </p>
                  <p className={`text-xs mt-1 ${
                    error.startsWith('✓') ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {error.replace('✓ ', '')}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Confirmation Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Código de confirmación
                </label>
                <input
                  type="text"
                  required
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-center text-2xl tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                  disabled={loading}
                  style={{ letterSpacing: '0.5em' }}
                />
                <p className="text-gray-500 text-xs mt-2">
                  Ingresa el código de 6 dígitos que recibiste por email
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !confirmationCode.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    Confirmando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Confirmar Cuenta
                  </div>
                )}
              </button>
            </form>

            {/* Resend code */}
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-400 text-sm mb-3">
                ¿No recibiste el código?
              </p>
              <button
                onClick={handleResendCode}
                disabled={resendLoading}
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium disabled:text-gray-500"
              >
                {resendLoading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Reenviando...
                  </div>
                ) : (
                  'Reenviar código'
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <p className="text-gray-500 text-xs">
                Una vez confirmada tu cuenta, podrás acceder al sistema
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}