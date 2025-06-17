import { supabase } from './supabase/client'
import { Session, User } from '@supabase/supabase-js'

/**
 * Gestor centralizado de sesiones simplificado
 */
class SessionManager {
  private static instance: SessionManager
  private refreshTimeout: NodeJS.Timeout | null = null
  private currentSession: Session | null = null
  private initialized: boolean = false
  private userMetadata: any = null
  private maxListeners = 5

  private refreshTimer: NodeJS.Timeout | null = null
  private isRefreshing = false
  private lastValidationTime = 0
  private validationCache: { valid: boolean; user?: any; timestamp: number } | null = null
  private readonly CACHE_DURATION = 30000 // 30 segundos de cache

  private constructor() {
    // Inicializar solo en el cliente
    if (typeof window !== 'undefined') {
      this.initSession()
      this.setupRefreshInterval()
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

      // Configurar límite de listeners para evitar warnings
      if (supabase.auth.setMaxListeners) {
        supabase.auth.setMaxListeners(this.maxListeners)
      }

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

  // Métodos públicos simplificados
  async getSession(): Promise<{ success: boolean, session: Session | null, error?: string }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error obteniendo sesión:', error)
        return { success: false, session: null, error: error.message }
      }

      if (!session) {
        // Intentar obtener usuario directamente como fallback
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (user && !userError) {
          console.log('Usuario encontrado sin sesión activa:', user.email)
          // Crear sesión mínima
          const mockSession = { 
            user, 
            access_token: 'mock_token', 
            refresh_token: 'mock_refresh',
            expires_at: Date.now() / 1000 + 3600 // 1 hora
          } as Session
          return { success: true, session: mockSession, error: null }
        }
        return { success: false, session: null, error: 'No hay sesión activa' }
      }

      return { success: true, session, error: null }
    } catch (error: any) {
      console.error('Error en getSession:', error)
      return { success: false, session: null, error: error.message }
    }
  }

  private setupRefreshInterval() {
    console.log('Configurando el refresco de sesión')

    // Refrescar cada 10 minutos (reducido para evitar conflictos)
    const REFRESH_INTERVAL = 10 * 60 * 1000

    console.log('Programando primer refresco en 600 segundos')
    this.refreshTimer = setInterval(async () => {
      try {
        await this.refreshSession()
      } catch (error) {
        console.error('Error en refresco automático de sesión:', error)
      }
    }, REFRESH_INTERVAL)
  }

  async validateSession(): Promise<{ valid: boolean; user?: any; error?: string }> {
    try {
      // Usar cache si está disponible y es reciente
      const now = Date.now()
      if (this.validationCache && (now - this.validationCache.timestamp) < this.CACHE_DURATION) {
        console.log('SessionManager - Usando cache de validación')
        return {
          valid: this.validationCache.valid,
          user: this.validationCache.user
        }
      }

      const response = await fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        console.error('SessionManager - Error validando sesión:', response.status, response.statusText)

        // Actualizar cache con resultado inválido
        this.validationCache = {
          valid: false,
          timestamp: now
        }

        return { valid: false, error: `HTTP ${response.status}` }
      }

      const data = await response.json()
      console.log('SessionManager - Respuesta de validación:', data.valid ? 'válida' : 'inválida')

      // Actualizar cache
      this.validationCache = {
        valid: data.valid,
        user: data.user,
        timestamp: now
      }

      if (data.valid && data.user) {
        this.lastValidationTime = now
        return { valid: true, user: data.user }
      } else {
        return { valid: false, error: data.error || 'Sesión inválida' }
      }
    } catch (error) {
      console.error('SessionManager - Error en validateSession:', error)

      // En caso de error de red, si tenemos cache válido reciente, usarlo
      if (this.validationCache && this.validationCache.valid && (Date.now() - this.validationCache.timestamp) < 60000) {
        console.log('SessionManager - Usando cache válido por error de red')
        return {
          valid: this.validationCache.valid,
          user: this.validationCache.user
        }
      }

      return { valid: false, error: 'Error de conexión' }
    }
  }

  async refreshSession(): Promise<{ success: boolean; error?: string }> {
    if (this.isRefreshing) {
      console.log('Ya hay un refresh en progreso, saltando...')
      return { success: false, error: 'Refresh ya en progreso' }
    }

    try {
      this.isRefreshing = true
      console.log('Intentando refrescar sesión...')

      const response = await fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        console.error('Error refrescando sesión:', response.status)
        return { success: false, error: `HTTP ${response.status}` }
      }

      const data = await response.json()

      if (data.valid) {
        console.log('Session refreshed')

        // Limpiar cache para forzar nueva validación
        this.validationCache = null

        return { success: true }
      } else {
        console.log('No hay sesión disponible para refrescar')
        return { success: false, error: 'No hay sesión válida' }
      }
    } catch (error) {
      console.error('Error refrescando sesión:', error)
      return { success: false, error: 'Error de conexión' }
    } finally {
      this.isRefreshing = false
    }
  }

  clearCache() {
    this.validationCache = null
  }

  cleanup() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
    this.clearCache()
  }


  public async refreshSession(): Promise<{ success: boolean, error?: string }> {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('Error al refrescar sesión:', error)
        return { success: false, error: error.message }
      }

      this.currentSession = data.session
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