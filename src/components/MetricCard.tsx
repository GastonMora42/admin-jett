
// =====================================================
// METRIC CARD COMPONENT - src/components/MetricCard.tsx
// =====================================================

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface MetricCardProps {
  icon: LucideIcon
  title: string
  value: string | number
  subtitle?: string
  change?: number
  changeType?: 'positive' | 'negative'
  urgent?: boolean
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  title,
  value,
  subtitle,
  change,
  changeType,
  urgent = false
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`card relative overflow-hidden group ${
        urgent ? 'border-red-500/50 bg-red-500/5' : ''
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <Icon className={`w-8 h-8 ${urgent ? 'text-red-400' : 'text-gray-400'}`} />
          {change !== undefined && (
            <div className={`flex items-center space-x-1 text-sm ${
              changeType === 'positive' ? 'text-green-400' : 'text-red-400'
            }`}>
              {changeType === 'positive' ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        
        <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-white text-2xl font-bold mb-1">{value}</p>
        {subtitle && (
          <p className="text-gray-500 text-xs">{subtitle}</p>
        )}
        
        {urgent && (
          <div className="mt-3 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-xs font-medium">
            Requiere atención
          </div>
        )}
      </div>
    </motion.div>
  )
}

