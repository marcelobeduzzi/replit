
import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

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

      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        console.log('useAuth - No hay usuario autenticado')
        setUser(null)
        setSessionStatus('invalid')
        sessionStorage.removeItem('user')
      } else {
        console.log('useAuth - Usuario autenticado:', user.email)
        
        // Crear objeto de usuario simplificado
        const userData = {
          id: user.id,
          email: user.email || '',
          name: user.email?.split('@')[0] || '',
          role: 'admin', // Rol por defecto
          isActive: true,
          createdAt: user.created_at || new Date().toISOString(),
          updatedAt: user.updated_at || new Date().toISOString()
        }
        
        setUser(userData)
        setSessionStatus('valid')
        sessionStorage.setItem('user', JSON.stringify(userData))
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
