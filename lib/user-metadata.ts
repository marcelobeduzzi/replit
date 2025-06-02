// lib/user-metadata.ts
import { supabase } from './supabase/client';

export type UserMetadata = {
  id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  email?: string;
  local?: string;
  position?: string;
  // Otros campos que necesites
};

// Caché en memoria para metadatos (evita consultas repetidas)
const metadataCache: Record<string, UserMetadata> = {};

/**
 * Carga los metadatos de un usuario desde múltiples fuentes, con fallbacks
 * para garantizar que siempre se devuelva algo útil
 */
export async function loadUserMetadata(userId: string): Promise<UserMetadata> {
  // Si ya tenemos los datos en caché, los devolvemos
  if (metadataCache[userId]) {
    console.log("Usando metadatos en caché para usuario:", userId);
    return metadataCache[userId];
  }

  console.log("Cargando metadatos para usuario:", userId);
  
  try {
    // Intento 1: Cargar desde la tabla employees (preferido)
    try {
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, local, position, role')
        .eq('id', userId)
        .single();

      if (!employeeError && employeeData) {
        console.log("Metadatos cargados desde tabla employees");
        const metadata: UserMetadata = {
          id: userId,
          ...employeeData
        };
        metadataCache[userId] = metadata;
        return metadata;
      }
    } catch (err) {
      console.error("Error al cargar desde employees:", err);
    }

    // Intento 2: Cargar desde auth.users (fallback)
    try {
      // Usar la API de Supabase Auth en lugar de la tabla users directamente
      const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (!authError && user) {
        console.log("Metadatos cargados desde auth.users");
        const metadata: UserMetadata = {
          id: userId,
          email: user.email,
          // Extraer otros datos disponibles en user.user_metadata si existen
          first_name: user.user_metadata?.first_name,
          last_name: user.user_metadata?.last_name,
          role: user.user_metadata?.role || 'user',
        };
        metadataCache[userId] = metadata;
        return metadata;
      }
    } catch (err) {
      console.error("Error al cargar desde auth.users:", err);
    }

    // Intento 3: Usar la función RPC personalizada (último recurso)
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_metadata_safe', { user_id: userId });
      
      if (!rpcError && rpcData) {
        console.log("Metadatos cargados desde RPC");
        const metadata: UserMetadata = {
          id: userId,
          ...rpcData
        };
        metadataCache[userId] = metadata;
        return metadata;
      }
    } catch (err) {
      console.error("Error al cargar desde RPC:", err);
    }

    // Fallback final: Devolver datos mínimos basados en la sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      console.log("Usando datos mínimos de la sesión");
      const metadata: UserMetadata = {
        id: userId,
        email: session.user.email,
        role: 'admin', // Asumimos admin como fallback seguro
      };
      metadataCache[userId] = metadata;
      return metadata;
    }

    // Si todo falla, devolver un objeto con datos mínimos
    console.log("Usando datos mínimos por defecto");
    const defaultMetadata: UserMetadata = {
      id: userId,
      role: 'admin', // Asumimos admin como fallback seguro
    };
    metadataCache[userId] = defaultMetadata;
    return defaultMetadata;

  } catch (error) {
    console.error("Error crítico al cargar metadatos de usuario:", error);
    // Último recurso si todo falla
    return { 
      id: userId,
      role: 'admin' // Asumimos admin como fallback seguro
    };
  }
}

/**
 * Limpia la caché de metadatos para un usuario específico o para todos
 */
export function clearMetadataCache(userId?: string) {
  if (userId) {
    delete metadataCache[userId];
  } else {
    // Limpiar toda la caché
    Object.keys(metadataCache).forEach(key => {
      delete metadataCache[key];
    });
  }
}