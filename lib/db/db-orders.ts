import { objectToCamelCase, objectToSnakeCase } from "../utils"
import { DatabaseServiceBase } from "./db-core"

// Clase para gestionar los pedidos
export class OrderService extends DatabaseServiceBase {
  /**
   * Guarda un pedido
   * @param orderData Datos del pedido
   * @returns El pedido guardado
   */
  async saveOrder(orderData: any): Promise<any> {
    try {
      // Convertir de camelCase a snake_case
      const snakeCaseData = objectToSnakeCase(orderData)

      const { data, error } = await this.supabase.from("orders").insert([snakeCaseData]).select().single()

      if (error) {
        console.error("Error en saveOrder:", error)
        throw error
      }

      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error en saveOrder:", error)
      throw error
    }
  }

  /**
   * Obtiene un pedido por su ID
   * @param id ID del pedido
   * @returns El pedido encontrado o null si no existe
   */
  async getOrderById(id: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase.from("orders").select("*").eq("id", id).single()

      if (error) {
        console.error("Error en getOrderById:", error)
        throw error
      }

      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error en getOrderById:", error)
      return null
    }
  }

  async getAllOrders() {
    try {
      const { data, error } = await this.supabase.from("orders").select("*")

      if (error) {
        console.error("Error en getAllOrders:", error)
        throw error
      }

      return data.map((item) => objectToCamelCase(item))
    } catch (error) {
      console.error("Error en getAllOrders:", error)
      return []
    }
  }
}

// Crear una instancia del servicio
export const orderService = new OrderService()
