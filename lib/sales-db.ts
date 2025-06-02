import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { objectToCamelCase, objectToSnakeCase } from "./utils"

// Crear el cliente de Supabase usando la misma configuración que el resto de la aplicación
export const supabase = createClientComponentClient()

// Exportar las funciones de utilidad para que puedan ser usadas en sales-service.ts
export { objectToCamelCase, objectToSnakeCase }