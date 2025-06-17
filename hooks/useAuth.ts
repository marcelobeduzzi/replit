
import { useState, useEffect } from 'react'
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

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          setUser(null)
          setSessionStatus('invalid')
        } else {
          const userData = {
            id: user.id,
            email: user.email || '',
            name: user.email?.split('@')[0] || '',
            role: 'admin',
            isActive: true,
            createdAt: user.created_at || new Date().toISOString(),
            updatedAt: user.updated_at || new Date().toISOString()
          }
          
          setUser(userData)
          setSessionStatus('valid')
        }
      } catch (error) {
        console.error('Error verificando sesión:', error)
        setUser(null)
        setSessionStatus('invalid')
      } finally {
        setIsInitialized(true)
      }
    }

    if (!isInitialized) {
      checkSession()
    }
  }, [isInitialized])

  const checkSession = async () => {
    setSessionStatus('loading')
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        setUser(null)
        setSessionStatus('invalid')
      } else {
        const userData = {
          id: user.id,
          email: user.email || '',
          name: user.email?.split('@')[0] || '',
          role: 'admin',
          isActive: true,
          createdAt: user.created_at || new Date().toISOString(),
          updatedAt: user.updated_at || new Date().toISOString()
        }
        
        setUser(userData)
        setSessionStatus('valid')
      }
    } catch (error) {
      console.error('Error verificando sesión:', error)
      setUser(null)
      setSessionStatus('invalid')
    }
  }

  return {
    user,
    sessionStatus,
    checkSession,
    isInitialized
  }
}
