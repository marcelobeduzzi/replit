
// lib/db-service.ts
// Este archivo sirve como proxy para mantener compatibilidad con el código existente
// Importa y reexporta todo desde el nuevo sistema modular

import { dbService, getSupabase, db, supabase } from "./db"

// Reexportar todo
export { dbService, getSupabase, db, supabase }

// Exportar por defecto para mantener compatibilidad con importaciones por defecto
export default dbService
