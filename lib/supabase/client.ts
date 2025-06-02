import { createClient } from "@supabase/supabase-js"

// Verificar si estamos en el cliente
const isBrowser = typeof window !== "undefined"

// Variable global para la instancia única
let supabaseInstance: any = null

// Función para crear el cliente Supabase una sola vez
function createSupabaseClient() {
  // Si ya existe una instancia y estamos en el navegador, devolverla
  if (supabaseInstance && isBrowser) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Variables de entorno de Supabase no definidas")
    throw new Error("Configuración de Supabase incompleta")
  }

  // Crear nueva instancia solo si no existe
  const instance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  // Guardar la instancia solo en el navegador
  if (isBrowser) {
    supabaseInstance = instance
  }

  return instance
}

// Exportar el cliente
export const supabase = createSupabaseClient()
export { createClient }
export default supabase