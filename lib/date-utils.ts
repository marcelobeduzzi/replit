import { format, parseISO, isValid } from "date-fns"
import { es } from "date-fns/locale"

/**
 * Formatea una fecha para mostrar en la UI
 * @param dateString Fecha en formato string o Date
 * @param formatStr Formato de fecha (opcional)
 * @returns Fecha formateada como string
 */
export function formatDisplayDate(dateString: string | Date | undefined, formatStr = "dd/MM/yyyy"): string {
  if (!dateString) return ""

  try {
    // Si es string, convertir a objeto Date
    let date: Date

    if (typeof dateString === "string") {
      // Si la fecha es solo YYYY-MM-DD (sin tiempo)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Dividir la fecha en año, mes y día
        const [year, month, day] = dateString.split("-").map(Number)
        // Crear una fecha usando la zona horaria local (sin ajustes UTC)
        date = new Date(year, month - 1, day, 12, 0, 0)
      }
      // Si la fecha incluye tiempo (T), puede haber problemas de zona horaria
      else if (dateString.includes("T")) {
        // Extraer solo la parte de fecha
        const [year, month, day] = dateString.split("T")[0].split("-").map(Number)
        // Crear fecha usando el constructor Date con hora del mediodía para evitar problemas de zona horaria
        date = new Date(year, month - 1, day, 12, 0, 0)
      } else {
        // Si no incluye tiempo, simplemente parseamos la fecha
        date = parseISO(dateString)
      }
    } else {
      date = dateString
    }

    // Verificar si la fecha es válida
    if (!isValid(date)) {
      return dateString.toString()
    }

    // Formatear con date-fns usando locale español
    return format(date, formatStr, { locale: es })
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return typeof dateString === "string" ? dateString : dateString.toString()
  }
}

/**
 * Prepara una fecha para guardar en la base de datos
 * @param date Fecha a preparar
 * @returns Fecha en formato ISO sin tiempo (YYYY-MM-DD)
 */
export function prepareForDatabase(date: Date | string | undefined): string {
  if (!date) return ""

  try {
    // Asegurarse de que es un objeto Date
    let dateObj: Date

    if (typeof date === "string") {
      // Si la fecha ya está en formato YYYY-MM-DD, devolverla directamente
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date
      }

      // Convertir string a Date
      dateObj = new Date(date)
    } else {
      dateObj = date
    }

    // Verificar si la fecha es válida
    if (!isValid(dateObj)) {
      console.warn("Fecha inválida:", date)
      return ""
    }

    // Convertir a formato ISO sin la parte de tiempo para evitar problemas de zona horaria
    // Esto almacenará la fecha como YYYY-MM-DD
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, "0") // +1 porque getMonth() es 0-indexed
    const day = String(dateObj.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  } catch (error) {
    console.error("Error al preparar fecha para la base de datos:", error)
    return ""
  }
}

/**
 * Convierte una fecha de la base de datos a fecha local
 * @param dateString Fecha en formato ISO de la base de datos
 * @returns Fecha local
 */
export function dbDateToLocal(dateString: string | undefined): Date | null {
  if (!dateString) return null

  try {
    // Si la fecha incluye tiempo (T), puede haber problemas de zona horaria
    if (dateString.includes("T")) {
      // Crear fecha usando el constructor Date que respeta la zona horaria local
      const [year, month, day] = dateString.split("T")[0].split("-").map(Number)
      return new Date(year, month - 1, day) // month es 0-indexed en JavaScript
    }

    // Si no incluye tiempo, simplemente parseamos la fecha
    return parseISO(dateString)
  } catch (error) {
    console.error("Error al convertir fecha de DB a local:", error)
    return null
  }
}

/**
 * Corrige el problema del día anterior
 * @param dateString Fecha en formato ISO
 * @returns Fecha corregida o null si hay error
 */
export function correctDateOffset(dateString: string | undefined): Date | null {
  if (!dateString) return null

  try {
    // Si la fecha incluye tiempo (T), puede haber problemas de zona horaria
    if (dateString.includes("T")) {
      // Extraer solo la parte de fecha
      const datePart = dateString.split("T")[0]
      // Crear fecha usando el constructor Date que respeta la zona horaria local
      const [year, month, day] = datePart.split("-").map(Number)
      return new Date(year, month - 1, day) // month es 0-indexed en JavaScript
    }

    // Si no incluye tiempo, simplemente parseamos la fecha
    return parseISO(dateString)
  } catch (error) {
    console.error("Error al corregir offset de fecha:", error)
    return null
  }
}

/**
 * Normaliza una fecha a formato ISO (YYYY-MM-DD) para usar en consultas a la base de datos
 * @param date Fecha a normalizar (puede ser Date, string o null)
 * @returns Fecha normalizada en formato YYYY-MM-DD
 */
export function normalizeDate(date: Date | string | null): string {
  if (!date) {
    return format(new Date(), "yyyy-MM-dd")
  }

  if (typeof date === "string") {
    // Si ya tiene formato YYYY-MM-DD, devolverlo directamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }

    try {
      // Si la fecha incluye tiempo (T), puede haber problemas de zona horaria
      if (date.includes("T")) {
        // Extraer solo la parte de fecha
        const [year, month, day] = date.split("T")[0].split("-").map(Number)
        // Crear fecha usando el constructor Date con hora del mediodía para evitar problemas de zona horaria
        const dateObj = new Date(year, month - 1, day, 12, 0, 0)
        return format(dateObj, "yyyy-MM-dd")
      }

      // Intentar parsear la fecha
      return format(parseISO(date), "yyyy-MM-dd")
    } catch (error) {
      console.error("Error al parsear fecha:", error)
      return format(new Date(), "yyyy-MM-dd")
    }
  }

  // Si es un objeto Date
  return format(date, "yyyy-MM-dd")
}

// Exportar el objeto DateUtils para mantener compatibilidad con código existente
export const DateUtils = {
  formatDisplayDate,
  prepareForDatabase,
  dbDateToLocal,
  correctDateOffset,
  normalizeDate,
}
