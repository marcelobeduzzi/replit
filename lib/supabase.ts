// lib/supabase.ts
import { createClient } from "@supabase/supabase-js"
import { supabaseConfig } from "./supabase-config"

// Ensure environment variables are properly set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Create a Supabase client with the anonymous key for client-side operations
// Aplicamos la configuración centralizada
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: supabaseConfig.auth,
  global: supabaseConfig.global
})

// Create a Supabase admin client with the service role key for server-side operations
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabase

// Helper function to get the Supabase client
export const getSupabase = () => supabase

// Inicializar listener para debugging de eventos de autenticación (solo en cliente)
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log(`Auth event: ${event}`, session ? 
      `User: ${session.user?.email}, Expires: ${new Date(session.expires_at! * 1000).toLocaleString()}` : 
      'No session')
  })
}