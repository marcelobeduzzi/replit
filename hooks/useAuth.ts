// hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { sessionManager } from '@/lib/session-manager'
import { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true)
        const currentUser = await sessionManager.getUser()
        setUser(currentUser)
      } catch (err: any) {
        console.error('Error al cargar usuario:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUser()
    
    // Configurar un intervalo para verificar el usuario cada minuto
    // Esto ayuda a mantener la UI sincronizada con el estado de autenticación
    const interval = setInterval(async () => {
      const currentUser = await sessionManager.getUser()
      if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
        setUser(currentUser)
      }
    }, 60000)
    
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
      
      setUser(result.data.user)
      return { success: true, data: result.data }
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
    isAuthenticated: !!user,
    error,
    login,
    logout,
    refreshSession
  }
}