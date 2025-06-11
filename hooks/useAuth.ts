// hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { sessionManager } from '@/lib/session-manager'
import { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calcular sessionStatus basado en el estado actual
  const sessionStatus = isLoading ? "loading" : (user ? "valid" : "invalid")

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true)
        const currentUser = await sessionManager.getUser()
        console.log("useAuth - Usuario cargado:", currentUser ? currentUser.email : "null")
        setUser(currentUser)
      } catch (err: any) {
        console.error('Error al cargar usuario:', err)
        setError(err.message)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()

    // Verificación muy reducida para mejorar performance
    const interval = setInterval(async () => {
      try {
        const currentUser = await sessionManager.getUser()
        if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
          setUser(currentUser)
        }
      } catch (err) {
        console.error('Error al verificar usuario:', err)
        setUser(null)
      }
    }, 300000) // Cada 5 minutos para reducir carga

    return () => clearInterval(interval)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await sessionManager.login(email, password)

      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión')
        return { success: false, error: result.error }
      }

      setUser(result.user)
      return { success: true, data: { user: result.user } }
    } catch (err: any) {
      console.error('Error en login:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)

    try {
      const result = await sessionManager.logout()

      if (result.success) {
        setUser(null)
      } else {
        setError(result.error || 'Error al cerrar sesión')
      }

      return result
    } catch (err: any) {
      console.error('Error en logout:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      const result = await sessionManager.refreshSession()
      if (result.success) {
        const currentUser = await sessionManager.getUser()
        setUser(currentUser)
      }
      return result.success
    } catch (err: any) {
      console.error('Error en refreshSession:', err)
      setError(err.message)
      return false
    }
  }

  return {
    user,
    isLoading,
    sessionStatus, // Agregar sessionStatus al return
    isAuthenticated: !!user,
    error,
    login,
    logout,
    refreshSession
  }
}