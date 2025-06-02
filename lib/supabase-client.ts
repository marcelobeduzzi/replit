import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Verificar que las variables de entorno estén definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Variables de entorno de Supabase no definidas:", {
    url: !!supabaseUrl ? "definida" : "no definida",
    key: !!supabaseKey ? "definida" : "no definida",
  })
}

// Singleton: mantener una única instancia del cliente
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

// Función para obtener la instancia del cliente (patrón singleton)
function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Variables de entorno de Supabase no definidas")
  }
  
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey)
  }
  
  return supabaseInstance
}

// Crear una instancia del cliente para exportar directamente
export const supabase = supabaseUrl && supabaseKey ? getSupabaseClient() : null

// Función para crear un cliente de Supabase (para mantener compatibilidad con código existente)
export function createClient() {
  return getSupabaseClient()
}

export default supabase





