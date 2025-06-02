import { objectToCamelCase } from "../utils"
import { DatabaseServiceBase } from "./db-core"

// Clase para gestionar el inventario
export class StockService extends DatabaseServiceBase {
  /**
   * Obtiene el promedio de ventas para un local
   * @param localId ID del local
   * @returns Objeto con los promedios de ventas por producto
   */
  async getAverageSales(localId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await this.supabase.from("sales_average").select("*").eq("local_id", localId).single()

      if (error) {
        console.error("Error en getAverageSales:", error)
        throw error
      }

      return objectToCamelCase(data.averages || {})
    } catch (error) {
      console.error("Error en getAverageSales:", error)
      return {}
    }
  }

  /**
   * Obtiene el stock actual para un local
   * @param localId ID del local
   * @returns Objeto con el stock actual por producto
   */
  async getCurrentStock(localId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await this.supabase
        .from("stock")
        .select("*")
        .eq("local_id", localId)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("Error en getCurrentStock:", error)
        throw error
      }

      return objectToCamelCase(data[0]?.items || {})
    } catch (error) {
      console.error("Error en getCurrentStock:", error)
      return {}
    }
  }

  // Delivery stats methods
  async getDeliveryStats(startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from("delivery_stats")
      .select("*")
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString())
      .order("date")

    if (error) throw error
    return data.map((item) => objectToCamelCase(item))
  }

  /**
   * Obtiene los productos más vendidos
   * @param limit Límite de productos a obtener
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns Lista de productos más vendidos
   */
  async getTopSellingProducts(limit = 10, startDate?: Date, endDate?: Date) {
    try {
      console.log("Obteniendo productos más vendidos", { limit, startDate, endDate })

      // Construir la consulta base
      // Asumimos que existe una tabla o vista que contiene esta información
      let query = this.supabase.from("product_sales").select("*")

      // Aplicar filtros de fecha si se proporcionan
      if (startDate) {
        query = query.gte("date", startDate.toISOString())
      }

      if (endDate) {
        query = query.lte("date", endDate.toISOString())
      }

      // Ordenar por cantidad vendida descendente y limitar resultados
      query = query.order("quantity", { ascending: false }).limit(limit)

      const { data, error } = await query

      if (error) {
        console.error("Error al obtener productos más vendidos:", error)
        // Devolver array vacío en caso de error para evitar que la aplicación falle
        return []
      }

      // Si no hay datos, devolver array vacío
      if (!data || data.length === 0) {
        console.log("No se encontraron datos de productos más vendidos")
        return []
      }

      // Convertir de snake_case a camelCase
      return data.map((item) => objectToCamelCase(item))
    } catch (error) {
      console.error("Error en getTopSellingProducts:", error)
      // Devolver array vacío en caso de error para evitar que la aplicación falle
      return []
    }
  }

  // Método para verificar la estructura de la tabla
  async checkTableStructure(tableName: string) {
    try {
      // Consultar una fila para ver la estructura
      const { data, error } = await this.supabase.from(tableName).select("*").limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        console.log(`Estructura de la tabla ${tableName}:`, Object.keys(data[0]))
        return Object.keys(data[0])
      } else {
        console.log(`La tabla ${tableName} está vacía o no existe`)
        return []
      }
    } catch (error) {
      console.error(`Error al verificar la estructura de la tabla ${tableName}:`, error)
      throw error
    }
  }
}

// Crear una instancia del servicio
export const stockService = new StockService()
