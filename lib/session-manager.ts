import { supabase } from './supabase/client'
import { Session, User } from '@supabase/supabase-js'

/**
 * Gestor centralizado de sesiones simplificado
 */
class SessionManager {
  private static instance: SessionManager
  private currentSession: Session | null = null
  private initialized: boolean = false
  private userMetadata: any = null

  private constructor() {
    // Inicializar solo en el cliente
    if (typeof window !== 'undefined') {
      this.initSession()
    }
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  private async initSession() {
    if (this.initialized) return

    try {
      console.log('Inicializando gestor de sesiones...')

      const { data } = await supabase.auth.getSession()
      this.currentSession = data.session

      if (data.session) {
        console.log(`Sesión existente encontrada para ${data.session.user.email}`)
        await this.loadUserMetadata(data.session.user.id)
      } else {
        console.log('No hay sesión activa')
      }

      this.initialized = true
    } catch (error) {
      console.error('Error al inicializar sesión:', error)
    }
  }

  private async loadUserMetadata(userId: string) {
    try {
      // Crear metadatos básicos con rol admin por defecto
      this.userMetadata = {
        id: userId,
        role: 'admin'
      }

      try {
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id, first_name, last_name, email, local, position, role')
          .eq('id', userId)
          .single()

        if (!employeeError && employeeData) {
          console.log("Metadatos cargados desde tabla employees")
          this.userMetadata = {
            id: userId,
            ...employeeData,
            role: employeeData.role || 'admin'
          }
        }
      } catch (err) {
        console.log("Usando metadatos por defecto")
      }
    } catch (error) {
      console.error('Error al cargar metadatos de usuario:', error)
      this.userMetadata = {
        id: userId,
        role: 'admin'
      }
    }
  }

  async getSession(): Promise<{ success: boolean, session: Session | null, error?: string }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error obteniendo sesión:', error)
        return { success: false, session: null, error: error.message }
      }

      if (!session) {
        return { success: false, session: null, error: 'No hay sesión activa' }
      }

      return { success: true, session, error: null }
    } catch (error: any) {
      console.error('Error en getSession:', error)
      return { success: false, session: null, error: error.message }
    }
  }

  async validateSession(): Promise<{ valid: boolean; user?: any; error?: string }> {
    try {
      // Verificar sesión directamente con Supabase
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        console.log('SessionManager - Sesión inválida:', error?.message || 'No user')
        return { valid: false, error: error?.message || 'No hay usuario autenticado' }
      }

      // Construir objeto de usuario simplificado
      const userData = {
        id: user.id,
        email: user.email || '',
        name: user.email?.split('@')[0] || 'Usuario',
        role: 'admin',
        isActive: true,
        createdAt: user.created_at,
        updatedAt: user.updated_at || user.created_at
      }

      console.log('SessionManager - Sesión válida para:', user.email)
      return { valid: true, user: userData }

    } catch (error) {
      console.error('SessionManager - Error en validateSession:', error)
      return { valid: false, error: 'Error de conexión' }
    }
  }

  async refreshSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('Error al refrescar sesión:', error)
        return { success: false, error: error.message }
      }

      this.currentSession = data.session
      console.log('Sesión refrescada exitosamente')
      return { success: true }
    } catch (error: any) {
      console.error('Error al refrescar sesión:', error)
      return { success: false, error: error.message }
    }
  }

  public async getUser(): Promise<User | null> {
    const sessionResult = await this.getSession()
    return sessionResult.session?.user || null
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

      console.log('Login exitoso:', data.user?.email)
      this.currentSession = data.session
      await this.loadUserMetadata(data.user.id)

      return { success: true, user: data.user }
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

      this.currentSession = null
      this.userMetadata = null
      console.log('Logout exitoso')
      return { success: true }
    } catch (error: any) {
      console.error('Error durante el logout:', error)
      return { success: false, error: error.message }
    }
  }

  public isAuthenticated(): boolean {
    return !!this.currentSession
  }

  public getUserMetadata(): any {
    return this.userMetadata || { role: 'admin' }
  }
}

// Exportar instancia singleton
export const sessionManager = SessionManager.getInstance()

// Exportar función para usar en componentes
export function useSessionManager() {
  return sessionManager
}