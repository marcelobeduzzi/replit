// Este archivo sirve como proxy para mantener compatibilidad con el código existente
// Importa y reexporta todo desde el nuevo sistema modular

console.log("DB-SERVICE-PROXY: Cargando proxy de servicio de base de datos")

// Importar directamente desde supabase/client.ts
import { supabase as originalSupabase } from "./supabase/client"
import * as dbModule from "./db"

// Verificar que el cliente de Supabase es válido
console.log(
  "DB-SERVICE-PROXY: Cliente Supabase:",
  originalSupabase ? "Disponible" : "No disponible",
  "Métodos:",
  Object.keys(originalSupabase || {}).join(", "),
)

// Reexportar todo
export const dbService = dbModule.dbService
export const getSupabase = () => {
  console.log("DB-SERVICE-PROXY: Obteniendo cliente Supabase original")
  return originalSupabase
}
export const db = dbModule.db
export const supabase = originalSupabase // Exportar el cliente original

// Exportar por defecto para mantener compatibilidad con importaciones por defecto
export default dbModule.dbService
