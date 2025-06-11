import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Crear una sola instancia global con configuración para evitar múltiples instancias
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
  if (typeof window !== 'undefined' && !supabaseInstance) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: false, // Evitar detección automática para reducir conflictos
        storage: window.localStorage,
        storageKey: 'sb-nomina-auth-token', // Clave única para evitar conflictos
        autoRefreshToken: true,
        debug: false // Reducir logs en producción
      }
    })
  }
  return supabaseInstance
}

export const supabase = getSupabase()