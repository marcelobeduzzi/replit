// lib/auth-context.tsx
"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "./supabase/client"
import { supervisorService, type SupervisorWithPin } from "./supervisor-service"
import type { User, UserRole } from "@/types/auth"
import { AuthChangeEvent, Session } from '@supabase/supabase-js'

// Modificar la interfaz UserMetadata para que coincida con User
interface UserMetadata extends Omit<User, 'name'> {
  first_name?: string
  last_name?: string
  local?: string
  position?: string
}

// Hacer metadataCache mutable
let metadataCache: Record<string, UserMetadata> = {}

// Extender el tipo AuthContextType para incluir las nuevas funciones
type AuthContextType = {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setError: (error: string | null) => void
  validateSupervisorPin: (pin: string) => Promise<boolean>
  supervisors: SupervisorWithPin[]
  updateSupervisorPin: (userId: string, newPin: string) => Promise<boolean>
  refreshSession: () => Promise<boolean>
  refreshUserMetadata: () => Promise<void>
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Lista de rutas que no requieren autenticación
const publicRoutes = ["/login", "/forgot-password", "/reset-password", "/secure-redirect"]

// Flag para evitar múltiples inicializaciones
let isInitializing = false

/**
 * Carga los metadatos de un usuario de manera segura con múltiples fallbacks
 */
async function loadUserMetadata(userId: string): Promise<UserMetadata> {
  // Si ya tenemos los datos en caché, los devolvemos
  if (metadataCache[userId]) {
    console.log("Usando metadatos en caché para usuario:", userId)
    return metadataCache[userId]
  }

  console.log("Cargando metadatos para usuario:", userId)

  try {
    // Intento 1: Cargar desde la tabla employees (preferido)
    try {
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, local, position, role, is_active, created_at, updated_at")
        .eq("id", userId)
        .single()

      if (!employeeError && employeeData) {
        console.log("Metadatos cargados desde tabla employees:", employeeData)
        const metadata: UserMetadata = {
          id: userId,
          email: employeeData.email || '',
          role: (employeeData.role as UserRole) || 'admin',
          isActive: Boolean(employeeData.is_active ?? true),
          createdAt: employeeData.created_at || new Date().toISOString(),
          updatedAt: employeeData.updated_at || new Date().toISOString(),
          first_name: employeeData.first_name,
          last_name: employeeData.last_name,
          local: employeeData.local,
          position: employeeData.position,
        }
        metadataCache[userId] = metadata
        return metadata
      }
    } catch (err) {
      console.error("Error al cargar desde employees:", err)
    }

    // Intento 2: Cargar desde la sesión actual
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (!sessionError && session?.user) {
        console.log("Metadatos cargados desde sesión:", session.user)
        const metadata: UserMetadata = {
          id: userId,
          email: session.user.email || '',
          role: (session.user.user_metadata?.role as UserRole) || 'admin',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          first_name: session.user.user_metadata?.first_name,
          last_name: session.user.user_metadata?.last_name,
          local: session.user.user_metadata?.local,
          position: session.user.user_metadata?.position,
        }
        metadataCache[userId] = metadata
        return metadata
      }
    } catch (err) {
      console.error("Error al cargar desde sesión:", err)
    }

    // Si no se pudo cargar de ninguna fuente, crear un usuario básico
    console.log("Creando metadatos básicos para usuario:", userId)
    const basicMetadata: UserMetadata = {
      id: userId,
      email: '',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    metadataCache[userId] = basicMetadata
    return basicMetadata
  } catch (error) {
    console.error("Error al cargar metadatos:", error)
    throw error
  }
}

/**
 * Limpia la caché de metadatos para un usuario específico o para todos
 */
function clearMetadataCache(userId?: string) {
  if (userId) {
    delete metadataCache[userId]
  } else {
    // Limpiar toda la caché
    Object.keys(metadataCache).forEach((key) => {
      delete metadataCache[key]
    })
  }
}

// Proveedor de autenticación
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supervisors, setSupervisors] = useState<SupervisorWithPin[]>([])
  const [supervisorsLoaded, setSupervisorsLoaded] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Función para cargar los datos del usuario
  const loadUserData = useCallback(async (userId: string) => {
    if (!userId) return

    try {
      setIsLoadingUser(true)

      // Usar nuestra función robusta para cargar metadatos
      const metadata = await loadUserMetadata(userId)

      // Crear un nuevo objeto User con todas las propiedades requeridas
      setUser((currentUser) => {
        const updatedUser: User = {
          id: userId,
          email: metadata.email || currentUser?.email || "",
          name: metadata.first_name
            ? `${metadata.first_name} ${metadata.last_name || ""}`.trim()
            : currentUser?.name || metadata.email?.split("@")[0] || "Usuario",
          role: metadata.role || "admin",
          isActive: Boolean(metadata.isActive ?? true),
          createdAt: metadata.createdAt || new Date().toISOString(),
          updatedAt: metadata.updatedAt || new Date().toISOString(),
        }

        console.log("User object updated:", updatedUser)
        return updatedUser
      })
    } catch (error) {
      console.error("Error al cargar datos de usuario:", error)
      // No interrumpir el flujo si hay un error, usar datos mínimos
    } finally {
      setIsLoadingUser(false)
    }
  }, [])

  // Función para refrescar los metadatos del usuario
  const refreshUserMetadata = useCallback(async () => {
    if (user?.id) {
      clearMetadataCache(user.id)
      await loadUserData(user.id)
    }
  }, [user?.id, loadUserData])

  // Función para refrescar la sesión
  const refreshSession = async () => {
    try {
      console.log("Intentando refrescar sesión...")
      
      // Verificar si hay una sesión antes de intentar refrescar
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error("Error al verificar sesión actual:", sessionError)
        return false
      }
      
      if (!currentSession) {
        console.log("No hay sesión disponible para refrescar")
        return false
      }

      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        // Si es un error de sesión faltante, no es grave
        if (error.message.includes('Auth session missing')) {
          console.log("Sesión faltante durante el refresco, el usuario puede haber cerrado sesión")
          return false
        }
        console.error("Error al refrescar sesión:", error)
        return false
      }

      if (data.session) {
        console.log("Sesión refrescada exitosamente")
        // Actualizar datos del usuario si es necesario
        if (data.session.user && user?.id === data.session.user.id) {
          await loadUserData(data.session.user.id)
        }
        return true
      } else {
        console.log("No hay sesión para refrescar")
        return false
      }
    } catch (err: any) {
      // Manejar errores de sesión faltante de manera silenciosa
      if (err.message?.includes('Auth session missing')) {
        console.log("Sesión faltante durante el refresco, el usuario puede haber cerrado sesión")
        return false
      }
      console.error("Error durante el refresco de sesión:", err)
      return false
    }
  }

  // Cargar supervisores desde la base de datos
  useEffect(() => {
    const loadSupervisors = async () => {
      try {
        const data = await supervisorService.getAllSupervisors()
        setSupervisors(data)
      } catch (err) {
        console.error("Error al cargar supervisores:", err)
      } finally {
        setSupervisorsLoaded(true)
      }
    }

    if (!supervisorsLoaded) {
      loadSupervisors()
    }
  }, [supervisorsLoaded])

  // Verificar sesión al cargar - versión simplificada y mejorada
  useEffect(() => {
    if (isInitializing) return
    isInitializing = true

    const checkSession = async () => {
      try {
        console.log("Verificando sesión inicial...")
        
        // Usar un delay para evitar conflictos con otras instancias
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error al obtener sesión:", error)
          setUser(null)
        } else if (session?.user) {
          console.log("Sesión encontrada para:", session.user.email)
          
          // Cargar metadatos del usuario
          try {
            const metadata = await loadUserMetadata(session.user.id)
            const userData: User = {
              id: session.user.id,
              email: session.user.email || metadata.email || '',
              name: metadata.first_name 
                ? `${metadata.first_name} ${metadata.last_name || ""}`.trim()
                : session.user.email?.split('@')[0] || 'Usuario',
              role: metadata.role || 'admin',
              isActive: Boolean(metadata.isActive ?? true),
              createdAt: metadata.createdAt || new Date().toISOString(),
              updatedAt: metadata.updatedAt || new Date().toISOString(),
            }
            console.log("Usuario cargado con metadatos:", userData)
            setUser(userData)
          } catch (metadataError) {
            console.error("Error al cargar metadatos, usando datos básicos:", metadataError)
            // Si falla la carga de metadatos, usar datos básicos
            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.email?.split('@')[0] || 'Usuario',
              role: (session.user.user_metadata?.role as UserRole) || 'admin',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            setUser(userData)
          }
        } else {
          console.log("No hay sesión activa")
          setUser(null)
        }
      } catch (err: any) {
        console.error("Error verificando sesión:", err)
        setUser(null)
      } finally {
        setIsLoading(false)
        setAuthChecked(true)
        isInitializing = false
      }
    }

    checkSession()

    // Suscribirse a cambios de autenticación con delay para evitar conflictos
    const setupAuthListener = () => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        console.log("Auth state changed:", event, session ? `User: ${session.user?.email}` : 'No session')

        if (event === "SIGNED_IN" && session?.user) {
          console.log("Usuario ha iniciado sesión:", session.user.email)
          // Cargar metadatos inmediatamente
          try {
            const metadata = await loadUserMetadata(session.user.id)
            const userData: User = {
              id: session.user.id,
              email: session.user.email || metadata.email || '',
              name: metadata.first_name 
                ? `${metadata.first_name} ${metadata.last_name || ""}`.trim()
                : session.user.email?.split('@')[0] || 'Usuario',
              role: metadata.role || 'admin',
              isActive: Boolean(metadata.isActive ?? true),
              createdAt: metadata.createdAt || new Date().toISOString(),
              updatedAt: metadata.updatedAt || new Date().toISOString(),
            }
            console.log("Usuario actualizado después del login:", userData)
            setUser(userData)
          } catch (error) {
            console.error("Error al cargar metadatos iniciales:", error)
            // Crear un usuario básico temporal
            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.email?.split('@')[0] || 'Usuario',
              role: (session.user.user_metadata?.role as UserRole) || 'admin',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            setUser(userData)
          }
        } else if (event === "SIGNED_OUT") {
          console.log("Usuario ha cerrado sesión")
          setUser(null)
          // Limpiar caché de metadatos
          metadataCache = {}
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          console.log("Token refrescado exitosamente")
          // Mantener los datos actuales del usuario si existe
          if (user?.id === session.user.id) {
            console.log("Token refrescado para el usuario actual")
          }
        }
      })

      return subscription
    }

    // Configurar el listener con un pequeño delay
    const timeoutId = setTimeout(() => {
      const subscription = setupAuthListener()
      
      // Limpiar al desmontar
      return () => {
        subscription.unsubscribe()
      }
    }, 200)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [loadUserData])

  // Efecto para manejar la redirección basada en la autenticación
  useEffect(() => {
    // Solo redirigir si ya se verificó la autenticación y no estamos cargando
    if (!isLoading && authChecked) {
      const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))

      if (!user && !isPublicRoute) {
        console.log("Redirigiendo a login desde:", pathname)
        router.push("/login")
      }
    }
  }, [user, isLoading, router, authChecked, pathname])

  // Efecto para refrescar periódicamente la sesión
  useEffect(() => {
    if (user) {
      // Refrescar la sesión cada 10 minutos para mantenerla activa
      const refreshInterval = setInterval(
        () => {
          refreshSession().catch(console.error)
        },
        10 * 60 * 1000,
      ) // 10 minutos

      return () => clearInterval(refreshInterval)
    }
  }, [user])

  // Función de login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("Intentando iniciar sesión con:", email)

      // Iniciar sesión con Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error("Error de inicio de sesión:", signInError)
        throw signInError
      }

      console.log("Login exitoso:", data)

      if (data.user) {
        // Crear un usuario básico inicialmente
        const userData: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.email?.split('@')[0] || 'Usuario',
          role: (data.user.user_metadata?.role as UserRole) || 'admin',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        setUser(userData)

        // Cargar metadatos completos en segundo plano
        loadUserData(data.user.id)

        router.push("/")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Error al iniciar sesión")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Función de logout
  const logout = async () => {
    try {
      setIsLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      // Limpiar caché de metadatos al cerrar sesión
      clearMetadataCache()
      router.push("/login")
    } catch (err: any) {
      console.error("Logout error:", err)
      setError(err.message || "Error al cerrar sesión")
      // Incluso si hay un error, intentamos limpiar el estado
      setUser(null)
      clearMetadataCache()
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para validar PIN de supervisor
  const validateSupervisorPin = async (pin: string): Promise<boolean> => {
    try {
      // Verificar si el PIN coincide con algún supervisor o gerente en la base de datos
      return await supervisorService.validatePin(pin)
    } catch (error) {
      console.error("Error al validar PIN:", error)
      // Si hay un error en la base de datos, intentar validar con los datos en memoria
      return supervisors.some((supervisor) => supervisor.pin === pin)
    }
  }

  // Función para actualizar el PIN de un supervisor
  const updateSupervisorPin = async (userId: string, newPin: string): Promise<boolean> => {
    try {
      // Buscar si el usuario ya existe en la lista de supervisores
      const existingSupervisor = supervisors.find((s) => s.id === userId)

      if (existingSupervisor) {
        // Si existe, actualizar su PIN
        const updatedSupervisor = {
          ...existingSupervisor,
          pin: newPin,
        }

        // Guardar en la base de datos
        const success = await supervisorService.updateSupervisorPin(updatedSupervisor)

        if (success) {
          // Actualizar el estado local
          setSupervisors((prevSupervisors) => prevSupervisors.map((s) => (s.id === userId ? { ...s, pin: newPin } : s)))
        }

        return success
      } else {
        // Si no existe, buscar el usuario en los usuarios mock y agregarlo a la lista
        const userToAdd = mockUsers.find((u) => u.id === userId)

        if (userToAdd) {
          const newSupervisor: SupervisorWithPin = {
            id: userToAdd.id,
            name: userToAdd.name,
            email: userToAdd.email,
            role: userToAdd.role,
            pin: newPin,
          }

          // Guardar en la base de datos
          const success = await supervisorService.updateSupervisorPin(newSupervisor)

          if (success) {
            // Actualizar el estado local
            setSupervisors((prevSupervisors) => [...prevSupervisors, newSupervisor])
          }

          return success
        }
      }

      return false
    } catch (error) {
      console.error("Error al actualizar PIN:", error)
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        setError,
        validateSupervisorPin,
        supervisors,
        updateSupervisorPin,
        refreshSession,
        refreshUserMetadata,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Importar mockUsers para poder agregar nuevos supervisores
import { mockUsers } from "@/lib/mock-data"