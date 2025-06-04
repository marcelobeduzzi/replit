
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Crear una sola instancia global con verificación de entorno
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
  // Solo crear la instancia en el cliente
  if (typeof window === 'undefined') {
    return null
  }

  if (!supabaseInstance) {
    console.log('Creando nueva instancia de Supabase client')
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })
  }
  return supabaseInstance
}

export const supabase = getSupabase()
