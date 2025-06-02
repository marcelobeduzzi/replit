import { createClient } from "@supabase/supabase-js"

// Verificar si estamos en el cliente
const isBrowser = typeof window !== "undefined"

// Variable para almacenar la instancia única
let supabaseInstance: any = null

// Función para crear el cliente Supabase
function createSupabaseClient() {
  // Si ya existe una instancia, devolverla
  if (supabaseInstance) {
    console.log("SUPABASE/CLIENT: Devolviendo instancia existente de Supabase")
    return supabaseInstance
  }

  console.log("SUPABASE/CLIENT: Creando nueva instancia de Supabase")

  // Crear una nueva instancia
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("SUPABASE/CLIENT: URL o clave anónima no definidas", {
      url: supabaseUrl ? "Definida" : "No definida",
      key: supabaseAnonKey ? "Definida" : "No definida",
    })
  }

  try {
    const instance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          // Añadir cabeceras predeterminadas para todas las solicitudes
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    })

    // SOLUCIÓN MEJORADA PARA EL ERROR DE HEADERS Y 406
    // Extender el cliente de Supabase para manejar correctamente las cabeceras
    const originalFrom = instance.from.bind(instance)
    instance.from = (table) => {
      const result = originalFrom(table)

      // Guardar la implementación original de select
      const originalSelect = result.select.bind(result)
      result.select = (...args) => {
        const selectResult = originalSelect(...args)

        // Añadir el método headers si no existe
        if (selectResult && typeof selectResult.headers !== "function") {
          selectResult.headers = (headers) => {
            // Aplicar las cabeceras a la solicitud
            if (selectResult.headers && typeof selectResult.headers === "object") {
              Object.assign(selectResult.headers, headers || {})
            } else {
              try {
                selectResult.headers = headers || {}
              } catch (e) {
                console.warn("No se pudieron aplicar cabeceras:", e)
              }
            }

            // Asegurarse de que Accept esté configurado correctamente
            if (headers && !headers["Accept"]) {
              try {
                headers["Accept"] = "application/json"
              } catch (e) {
                console.warn("No se pudo añadir Accept header:", e)
              }
            }

            return selectResult
          }
        }

        return selectResult
      }

      // Extender otros métodos de consulta para asegurar que tengan el método headers
      const methodsToExtend = [
        "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", 
        "is", "in", "contains", "containedBy", "rangeGt", "rangeGte", 
        "rangeLt", "rangeLte", "rangeAdjacent", "overlaps", "textSearch",
        "filter", "not", "or", "and"
      ]

      methodsToExtend.forEach(method => {
        if (result[method]) {
          const originalMethod = result[method].bind(result)
          result[method] = (...args) => {
            const methodResult = originalMethod(...args)
            
            // Añadir el método headers si no existe
            if (methodResult && typeof methodResult.headers !== "function") {
              methodResult.headers = (headers) => {
                // Asegurarse de que Accept esté configurado correctamente
                if (headers && !headers["Accept"]) {
                  headers["Accept"] = "application/json"
                }
                return methodResult
              }
            }
            
            return methodResult
          }
        }
      })

      // Extender métodos de modificación
      const modifyMethods = ["insert", "update", "upsert", "delete"]
      
      modifyMethods.forEach(method => {
        if (result[method]) {
          const originalMethod = result[method].bind(result)
          result[method] = (...args) => {
            const methodResult = originalMethod(...args)
            
            // Añadir el método headers si no existe
            if (methodResult && typeof methodResult.headers !== "function") {
              methodResult.headers = (headers) => {
                // Asegurarse de que Accept y Prefer estén configurados correctamente
                if (headers) {
                  if (!headers["Accept"]) headers["Accept"] = "application/json"
                  if (!headers["Prefer"]) headers["Prefer"] = "return=representation"
                }
                return methodResult
              }
            }
            
            return methodResult
          }
        }
      })

      // Extender el método single
      if (result.single) {
        const originalSingle = result.single.bind(result)
        result.single = (...args) => {
          const singleResult = originalSingle(...args)
          
          // Añadir el método headers si no existe
          if (singleResult && typeof singleResult.headers !== "function") {
            singleResult.headers = (headers) => {
              // Asegurarse de que Accept esté configurado correctamente
              if (headers && !headers["Accept"]) {
                headers["Accept"] = "application/json"
              }
              return singleResult
            }
          }
          
          return singleResult
        }
      }

      return result
    }

    // Interceptar el método rpc
    const originalRpc = instance.rpc.bind(instance)
    instance.rpc = (fn, ...args) => {
      const rpcResult = originalRpc(fn, ...args)

      // Añadir el método headers si no existe
      if (rpcResult && typeof rpcResult.headers !== "function") {
        rpcResult.headers = (headers) => {
          // Asegurarse de que Accept esté configurado correctamente
          if (headers && !headers["Accept"]) {
            headers["Accept"] = "application/json"
          }
          return rpcResult
        }
      }

      return rpcResult
    }

    // Verificar que la instancia se creó correctamente
    console.log("SUPABASE/CLIENT: Instancia de Supabase creada y extendida correctamente")

    // Guardar la instancia para futuras llamadas
    supabaseInstance = instance

    return instance
  } catch (error) {
    console.error("SUPABASE/CLIENT: Error al crear instancia de Supabase", error)
    throw error
  }
}

// Exportar el cliente Supabase
export const supabase = createSupabaseClient()

// Exportar createClient para que pueda ser importado por otros archivos
export { createClient }

// Función para reiniciar el cliente (útil para pruebas)
export function resetSupabaseClient() {
  console.log("SUPABASE/CLIENT: Reiniciando cliente Supabase")
  supabaseInstance = null
}

export default supabase