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

  const checkSession = useCallback(async (retryCount = 0) => {
    try {
      console.log('useAuth - Verificando sesión...', { retryCount, isInitialized })

      const sessionData = await sessionManager.validateSession()
      console.log('useAuth - Resultado de validación:', sessionData)

      if (sessionData.valid && sessionData.user) {
        console.log('useAuth - Usuario cargado:', sessionData.user.email)
        setUser(sessionData.user)
        setSessionStatus('valid')
      } else {
        console.log('useAuth - Sesión inválida, pero verificando si hay datos locales')

        // Verificar si hay datos de usuario en sessionStorage como respaldo
        try {
          const localUser = sessionStorage.getItem('user')
          if (localUser && !isInitialized) {
            const userData = JSON.parse(localUser)
            console.log('useAuth - Recuperando usuario desde localStorage:', userData.email)
            setUser(userData)
            setSessionStatus('valid')
            return
          }
        } catch (e) {
          console.log('useAuth - No hay datos locales válidos')
        }

        setUser(null)
        setSessionStatus('invalid')
      }
    } catch (error) {
      console.error('useAuth - Error verificando sesión:', error)

      // Retry logic - máximo 2 reintentos solo en la carga inicial
      if (retryCount < 2 && !isInitialized) {
        console.log(`useAuth - Reintentando verificación de sesión (${retryCount + 1}/2)`)
        setTimeout(() => checkSession(retryCount + 1), 1000)
        return
      }

      // En caso de error persistente, verificar localStorage
      try {
        const localUser = sessionStorage.getItem('user')
        if (localUser) {
          const userData = JSON.parse(localUser)
          console.log('useAuth - Usando datos locales por error de red:', userData.email)
          setUser(userData)
          setSessionStatus('valid')
          return
        }
      } catch (e) {
        console.log('useAuth - No se pudo recuperar datos locales')
      }

      setUser(null)
      setSessionStatus('invalid')
    } finally {
      if (!isInitialized) {
        setIsInitialized(true)
      }
    }
  }, [isInitialized])

  useEffect(() => {
    if (!isInitialized) {
      console.log('useAuth - Hook inicializado, verificando sesión')
      checkSession()
    }
  }, [checkSession, isInitialized])

  // Guardar usuario en sessionStorage cuando cambie
  useEffect(() => {
    if (user && sessionStatus === 'valid') {
      sessionStorage.setItem('user', JSON.stringify(user))
    } else if (sessionStatus === 'invalid') {
      sessionStorage.removeItem('user')
    }
  }, [user, sessionStatus])

  return {
    user,
    sessionStatus,
    checkSession,
    isInitialized
  }
}