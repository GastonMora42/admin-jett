// =====================================================
// AUTH PROVIDER - src/components/AuthProvider.tsx
// =====================================================

'use client'

import React from 'react'
import { SessionProvider } from 'next-auth/react'

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      {children}
    </SessionProvider>
  )
}