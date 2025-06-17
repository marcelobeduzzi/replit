import { useState, useEffect, useCallback } from 'react'
import { sessionManager } from '@/lib/session-manager'

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [isInitialized, setIsInitialized] = useState(false)

  const checkSession = useCallback(async () => {
    try {
      console.log('useAuth - Verificando sesión...')

      const sessionData = await sessionManager.validateSession()
      console.log('useAuth - Resultado de validación:', sessionData)

      if (sessionData.valid && sessionData.user) {
        console.log('useAuth - Usuario cargado:', sessionData.user.email)
        setUser(sessionData.user)
        setSessionStatus('valid')

        // Guardar en sessionStorage
        sessionStorage.setItem('user', JSON.stringify(sessionData.user))
      } else {
        console.log('useAuth - Sesión inválida')
        setUser(null)
        setSessionStatus('invalid')
        sessionStorage.removeItem('user')
      }
    } catch (error) {
      console.error('useAuth - Error verificando sesión:', error)
      setUser(null)
      setSessionStatus('invalid')
      sessionStorage.removeItem('user')
    } finally {
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    if (!isInitialized) {
      console.log('useAuth - Hook inicializado, verificando sesión')
      checkSession()
    }
  }, [checkSession, isInitialized])

  return {
    user,
    sessionStatus,
    checkSession,
    isInitialized
  }
}