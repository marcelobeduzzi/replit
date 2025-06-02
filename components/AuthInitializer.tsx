// components/AuthInitializer.tsx
'use client'

import { useEffect, useState, ReactNode } from 'react'
import { sessionManager } from '@/lib/session-manager'

interface AuthInitializerProps {
  children: ReactNode
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    const initialize = async () => {
      try {
        // Inicializar el gestor de sesiones
        const session = await sessionManager.getSession()
        console.log('AuthInitializer: Sesión inicializada', session ? 'con sesión activa' : 'sin sesión')
      } catch (error) {
        console.error('AuthInitializer: Error al inicializar sesión', error)
      } finally {
        setIsInitialized(true)
      }
    }
    
    initialize()
  }, [])
  
  // Mostrar un indicador de carga mientras se inicializa
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }
  
  return <>{children}</>
}