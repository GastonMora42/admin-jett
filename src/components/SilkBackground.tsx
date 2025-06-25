// =====================================================
// SILK BACKGROUND COMPONENT - src/components/SilkBackground.tsx
// =====================================================

'use client'

import React from 'react'
import { motion } from 'framer-motion'

export const SilkBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="silk-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </radialGradient>
          <filter id="silk-blur">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        <g filter="url(#silk-blur)">
          {[...Array(20)].map((_, i) => (
            <motion.path
              key={i}
              d={`M${Math.random() * 1000},${Math.random() * 1000} Q${Math.random() * 1000},${Math.random() * 1000} ${Math.random() * 1000},${Math.random() * 1000}`}
              stroke="url(#silk-gradient)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: [0, 0.5, 0],
                translateX: [0, Math.random() * 100 - 50],
                translateY: [0, Math.random() * 100 - 50]
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}

