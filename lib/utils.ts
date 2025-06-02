import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte una cadena de camelCase a snake_case
 * Ejemplo: "bankSalary" -> "bank_salary"
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Convierte una cadena de snake_case a camelCase
 * Ejemplo: "bank_salary" -> "bankSalary"
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Convierte un objeto con claves en snake_case a un objeto con claves en camelCase
 */
export function objectToCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = toCamelCase(key)
      const value = obj[key]

      // Si el valor es un objeto (pero no un array o null), convertir recursivamente
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[camelKey] = objectToCamelCase(value)
      } else {
        result[camelKey] = value
      }
    }
  }

  return result
}

/**
 * Convierte un objeto con claves en camelCase a un objeto con claves en snake_case
 */
export function objectToSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = toSnakeCase(key)
      const value = obj[key]

      // Si el valor es un objeto (pero no un array o null), convertir recursivamente
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[snakeKey] = objectToSnakeCase(value)
      } else {
        result[snakeKey] = value
      }
    }
  }

  return result
}

/**
 * Formatea un número como moneda en formato argentino
 * Ejemplo: 1234.56 -> "$1.234,56"
 */
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(numAmount)
}

/**
 * Formatea una fecha para mostrarla en formato argentino
 * Ejemplo: 2023-01-15 -> "15/01/2023"
 */
export function formatDateToDisplay(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/**
 * Formatea una fecha a formato ISO
 * Ejemplo: Date -> "2023-01-15T00:00:00.000Z"
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString()
}
