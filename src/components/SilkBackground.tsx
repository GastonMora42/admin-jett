// =====================================================
// SILK BACKGROUND COMPONENT FIXED - src/components/SilkBackground.tsx
// =====================================================

'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface PathData {
  d: string
  duration: number
  delay: number
}

export const SilkBackground = () => {
  const [paths, setPaths] = useState<PathData[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Generar paths solo en el cliente para evitar problemas de hidratación
    const generatedPaths: PathData[] = Array.from({ length: 15 }, (_, i) => ({
      d: `M${Math.random() * 1000},${Math.random() * 1000} Q${Math.random() * 1000},${Math.random() * 1000} ${Math.random() * 1000},${Math.random() * 1000}`,
      duration: 8 + Math.random() * 12,
      delay: i * 0.5
    }))
    
    setPaths(generatedPaths)
  }, [])

  if (!isClient) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/5 to-black/20" />
      </div>
    )
  }

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
          {paths.map((path, i) => (
            <motion.path
              key={i}
              d={path.d}
              stroke="url(#silk-gradient)"
              strokeWidth="1"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: path.duration,
                repeat: Infinity,
                repeatType: "reverse",
                delay: path.delay,
                ease: "easeInOut"
              }}
            />
          ))}
        </g>
      </svg>
      
      {/* Gradient overlay para mejor visual */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/5 to-black/20" />
    </div>
  )
}