import { DatabaseServiceBase } from "./db-core"
import { objectToCamelCase, objectToSnakeCase } from "../utils"

export class ConciliationService extends DatabaseServiceBase {
  // Billing methods
  async getBilling(startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from("billing")
      .select("*")
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString())
      .order("date", { ascending: false })

    if (error) throw error
    return data.map((item) => objectToCamelCase(item))
  }

  async createBilling(billing: Omit<any, "id">) {
    const billingData = objectToSnakeCase(billing)
    const { data, error } = await this.supabase.from("billing").insert([billingData]).select().single()

    if (error) throw error
    return objectToCamelCase(data)
  }

  // Balance methods
  async getBalance(startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from("balance")
      .select("*")
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString())
      .order("date")

    if (error) throw error
    return data.map((item) => objectToCamelCase(item))
  }

  async createBalance(balance: Omit<any, "id">) {
    const balanceData = objectToSnakeCase(balance)
    const { data, error } = await this.supabase.from("balance").insert([balanceData]).select().single()

    if (error) throw error
    return objectToCamelCase(data)
  }

  /**
   * Obtiene estadísticas de ventas
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns Estadísticas de ventas
   */
  async getSalesStats(startDate?: Date, endDate?: Date) {
    try {
      console.log("Obteniendo estadísticas de ventas", { startDate, endDate })

      // Construir la consulta base
      let query = this.supabase.from("sales_stats").select("*")

      // Aplicar filtros de fecha si se proporcionan
      if (startDate) {
        query = query.gte("date", startDate.toISOString())
      }

      if (endDate) {
        query = query.lte("date", endDate.toISOString())
      }

      // Ordenar por fecha
      query = query.order("date", { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error("Error al obtener estadísticas de ventas:", error)
        // Devolver datos vacíos en caso de error para evitar que la aplicación falle
        return {
          totalSales: 0,
          averageTicket: 0,
          salesByPlatform: {},
          salesByPaymentMethod: {},
          salesByDay: [],
        }
      }

      // Si no hay datos, devolver estructura vacía
      if (!data || data.length === 0) {
        console.log("No se encontraron estadísticas de ventas")
        return {
          totalSales: 0,
          averageTicket: 0,
          salesByPlatform: {},
          salesByPaymentMethod: {},
          salesByDay: [],
        }
      }

      // Procesar los datos para el formato esperado
      // Esto es una implementación básica, ajustar según la estructura real de los datos
      const result = {
        totalSales: data.reduce((sum, item) => sum + (item.total_amount || 0), 0),
        averageTicket: data.reduce((sum, item) => sum + (item.average_ticket || 0), 0) / data.length,
        salesByPlatform: {},
        salesByPaymentMethod: {},
        salesByDay: data.map((item) => ({
          date: item.date,
          amount: item.total_amount || 0,
        })),
      }

      // Agrupar por plataforma si existe
      if (data[0].platform) {
        const platforms = {}
        data.forEach((item) => {
          if (item.platform) {
            platforms[item.platform] = (platforms[item.platform] || 0) + (item.total_amount || 0)
          }
        })
        result.salesByPlatform = platforms
      }

      // Agrupar por método de pago si existe
      if (data[0].payment_method) {
        const methods = {}
        data.forEach((item) => {
          if (item.payment_method) {
            methods[item.payment_method] = (methods[item.payment_method] || 0) + (item.total_amount || 0)
          }
        })
        result.salesByPaymentMethod = methods
      }

      return result
    } catch (error) {
      console.error("Error en getSalesStats:", error)
      // Devolver datos vacíos en caso de error para evitar que la aplicación falle
      return {
        totalSales: 0,
        averageTicket: 0,
        salesByPlatform: {},
        salesByPaymentMethod: {},
        salesByDay: [],
      }
    }
  }
}

// Crear una instancia del servicio
export const conciliationService = new ConciliationService()
