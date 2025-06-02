// lib/supabase-config.ts

/**
 * Configuración centralizada para Supabase
 * Esto asegura que todos los clientes de Supabase usen la misma configuración
 */
export const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
  },
  global: {
    headers: { 'x-application-name': 'sistema-gastronomico' },
  },
  // Configuración de sesión y refresco
  session: {
    // Aumentamos el margen de refresco para evitar deslogueos
    refreshMarginMinutes: 15, // Refrescar cuando queden 15 minutos para expirar
    maxAgeSeconds: 24 * 60 * 60, // 24 horas
    // Número máximo de intentos de refresco antes de forzar deslogueo
    maxRefreshAttempts: 3,
  }
}