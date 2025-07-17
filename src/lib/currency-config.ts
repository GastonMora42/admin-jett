// src/lib/currency-config.ts - SISTEMA DE CONFIGURACIÓN DE MONEDA MEJORADO
'use client'

import React from 'react'
import { useState, useEffect, useContext, createContext, ReactNode, useCallback } from 'react'

export type Currency = 'USD' | 'ARS'

interface CurrencyConfig {
  code: Currency
  symbol: string
  name: string
  locale: string
  position: 'before' | 'after'
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: 'US$',
    name: 'Dólar Estadounidense',
    locale: 'en-US',
    position: 'before'
  },
  ARS: {
    code: 'ARS',
    symbol: '$',
    name: 'Peso Argentino',
    locale: 'es-AR',
    position: 'before'
  }
}

interface CurrencySettings {
  defaultCurrency: Currency
  projectCurrencies: Record<string, Currency> // proyectoId -> currency
  exchangeRate: number // USD to ARS rate
  autoConvert: boolean
  showBothCurrencies: boolean
}

interface CurrencyContextType {
  settings: CurrencySettings
  updateSettings: (newSettings: Partial<CurrencySettings>) => Promise<void>
  formatCurrency: (amount: number, currency?: Currency, projectId?: string) => string
  getProjectCurrency: (projectId: string) => Currency
  setProjectCurrency: (projectId: string, currency: Currency) => Promise<void>
  convertCurrency: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number
  getCurrencySymbol: (currency: Currency) => string
  loading: boolean
  error: string | null
}

const CurrencyContext = createContext<CurrencyContextType | null>(null)

const DEFAULT_SETTINGS: CurrencySettings = {
  defaultCurrency: 'ARS',
  projectCurrencies: {},
  exchangeRate: 1200, // 1 USD = 1200 ARS (ejemplo actualizado)
  autoConvert: false,
  showBothCurrencies: false
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CurrencySettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar desde localStorage como fallback
      const localSettings = localStorage.getItem('currency_settings')
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings)
          setSettings({ ...DEFAULT_SETTINGS, ...parsed })
        } catch (parseError) {
          console.warn('Error parsing local currency settings:', parseError)
        }
      }

      // Intentar cargar desde el servidor
      try {
        const response = await fetch('/api/configuracion/currency')
        if (response.ok) {
          const serverSettings = await response.json()
          const mergedSettings = { ...DEFAULT_SETTINGS, ...serverSettings }
          setSettings(mergedSettings)
          // Sincronizar con localStorage
          localStorage.setItem('currency_settings', JSON.stringify(mergedSettings))
        }
      } catch {
        console.log('Server settings not available, using local settings')
      }

      // Obtener tasa de cambio actualizada
      await updateExchangeRate()
    } catch (err) {
      console.error('Error loading currency settings:', err)
      setError('Error al cargar configuración de moneda')
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar configuración al inicializar
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const updateExchangeRate = async () => {
    try {
      // En un entorno real, aquí harías una llamada a una API de cambio como:
      // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      // const data = await response.json()
      // const rate = data.rates.ARS
      
      // Por ahora usamos un valor simulado con fluctuación
      const mockRate = 1200 + Math.random() * 100 // Simular fluctuación
      setSettings(prev => ({ ...prev, exchangeRate: Math.round(mockRate) }))
    } catch {
      console.log('Error updating exchange rate, using cached value')
    }
  }

  const updateSettings = async (newSettings: Partial<CurrencySettings>) => {
    try {
      setLoading(true)
      setError(null)

      const updatedSettings = { ...settings, ...newSettings }
      
      // Actualizar estado local
      setSettings(updatedSettings)
      
      // Guardar en localStorage inmediatamente
      localStorage.setItem('currency_settings', JSON.stringify(updatedSettings))

      // Intentar guardar en el servidor
      try {
        const response = await fetch('/api/configuracion/currency', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSettings)
        })
        
        if (!response.ok) {
          console.warn('Could not save to server, saved locally')
        }
      } catch {
        console.log('Could not save to server, saved locally')
      }

      console.log('Currency settings updated:', updatedSettings)
    } catch (err) {
      console.error('Error updating currency settings:', err)
      setError('Error al guardar configuración')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency?: Currency, projectId?: string): string => {
    // Determinar la moneda a usar
    let targetCurrency = currency
    if (!targetCurrency && projectId) {
      targetCurrency = settings.projectCurrencies[projectId]
    }
    if (!targetCurrency) {
      targetCurrency = settings.defaultCurrency
    }

    const config = CURRENCIES[targetCurrency]
    
    try {
      const formatted = new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)

      return config.position === 'before' 
        ? `${config.symbol}${formatted}`
        : `${formatted} ${config.symbol}`
    } catch {
      // Fallback manual si falla Intl.NumberFormat
      const formattedAmount = amount.toLocaleString(config.locale)
      return config.position === 'before' 
        ? `${config.symbol}${formattedAmount}`
        : `${formattedAmount} ${config.symbol}`
    }
  }

  const getProjectCurrency = (projectId: string): Currency => {
    return settings.projectCurrencies[projectId] || settings.defaultCurrency
  }

  const setProjectCurrency = async (projectId: string, currency: Currency) => {
    const newProjectCurrencies = {
      ...settings.projectCurrencies,
      [projectId]: currency
    }
    
    await updateSettings({
      projectCurrencies: newProjectCurrencies
    })
  }

  const convertCurrency = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) return amount
    
    if (fromCurrency === 'USD' && toCurrency === 'ARS') {
      return amount * settings.exchangeRate
    }
    
    if (fromCurrency === 'ARS' && toCurrency === 'USD') {
      return amount / settings.exchangeRate
    }
    
    return amount
  }

  const getCurrencySymbol = (currency: Currency): string => {
    return CURRENCIES[currency].symbol
  }

  const contextValue: CurrencyContextType = {
    settings,
    updateSettings,
    formatCurrency,
    getProjectCurrency,
    setProjectCurrency,
    convertCurrency,
    getCurrencySymbol,
    loading,
    error
  }

  return React.createElement(
    CurrencyContext.Provider,
    { value: contextValue },
    children
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

// Hook para formatear moneda de forma simple
export function useCurrencyFormat() {
  const { formatCurrency, settings, getCurrencySymbol } = useCurrency()
  
  return {
    format: formatCurrency,
    defaultCurrency: settings.defaultCurrency,
    symbol: getCurrencySymbol(settings.defaultCurrency),
    getSymbol: getCurrencySymbol
  }
}