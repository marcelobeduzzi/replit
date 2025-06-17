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

class SessionManager {
  async validateSession(): Promise<{ valid: boolean; user?: User; error?: string }> {
    try {
      console.log('SessionManager - Validando sesión...')

      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        console.log('SessionManager - Sesión inválida')
        return { valid: false, error: error?.message || 'No session' }
      }

      console.log('SessionManager - Sesión válida para:', user.email)

      const userData: User = {
        id: user.id,
        email: user.email || '',
        name: user.email?.split('@')[0] || '',
        role: 'admin',
        isActive: true,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString()
      }

      return { valid: true, user: userData }
    } catch (error: any) {
      console.error('SessionManager - Error validando sesión:', error)
      return { valid: false, error: error.message }
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      console.log('SessionManager - Refrescando sesión...')

      const { data, error } = await supabase.auth.refreshSession()

      if (error || !data.session) {
        console.log('SessionManager - No se pudo refrescar la sesión')
        return false
      }

      console.log('SessionManager - Sesión refrescada exitosamente')
      return true
    } catch (error) {
      console.error('SessionManager - Error refrescando sesión:', error)
      return false
    }
  }

  public async login(email: string, password: string): Promise<{ success: boolean, user?: User, error?: string }> {
    try {
      console.log(`Intentando iniciar sesión con: ${email}`)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Error durante el login:', error)
        return { success: false, error: error.message }
      }

      const user: User = {
        id: data.user!.id,
        email: data.user!.email!,
        name: data.user!.email?.split('@')[0] || '',
        role: 'admin',
        isActive: true,
        createdAt: data.user!.created_at,
        updatedAt: data.user!.updated_at!
      }

      console.log('Login exitoso:', data.user?.email)

      return { success: true, user: user }
    } catch (error: any) {
      console.error('Excepción durante el login:', error)
      return { success: false, error: error.message }
    }
  }

  public async logout(): Promise<{ success: boolean, error?: string }> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Error durante el logout:', error)
        return { success: false, error: error.message }
      }

      console.log('Logout exitoso')
      return { success: true }
    } catch (error: any) {
      console.error('Error durante el logout:', error)
      return { success: false, error: error.message }
    }
  }

  public isAuthenticated(): boolean {
    try {
      const session = supabase.auth.getSession()
      return !!session;
    } catch (error) {
      console.error("Error checking authentication:", error)
      return false;
    }
  }
}

export const sessionManager = new SessionManager()

export function useSessionManager() {
  return sessionManager
}