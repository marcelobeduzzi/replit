// Importar directamente desde supabase/client.ts
import { supabase as supabaseClient } from "../supabase/client"

// Verificar que el cliente de Supabase es válido
console.log(
  "DB-CORE: Cliente Supabase:",
  supabaseClient ? "Disponible" : "No disponible",
  "Métodos:",
  Object.keys(supabaseClient || {}).join(", "),
)

// Exportar supabase directamente para mantener compatibilidad con el código existente
export { supabaseClient as supabase }

// Clase base que contiene funcionalidad compartida
export class DatabaseServiceBase {
  // Usar el cliente original de Supabase
  protected supabase = supabaseClient

  // Método para obtener el cliente de Supabase
  getSupabase() {
    console.log("DB-CORE: Usando cliente Supabase original")
    return this.supabase
  }

  // Mecanismo de reintento para operaciones de base de datos
  async withRetry<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error)

        if (attempt < maxRetries) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, delay * attempt))
        }
      }
    }

    throw lastError
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

  // User methods
  async getUserByEmail(email: string) {
    const { data, error } = await this.supabase.from("users").select("*").eq("email", email).single()

    if (error) throw error
    return data
  }

  async getUserById(id: string) {
    const { data, error } = await this.supabase.from("users").select("*").eq("id", id).single()

    if (error) throw error
    return data
  }

  // UPDATED: Simplified getDashboardStats method to fix the error
  async getDashboardStats() {
    try {
      // Simplificamos para evitar el error
      const { data: activeEmployees, error: employeesError } = await this.supabase
        .from("employees")
        .select("id")
        .eq("status", "active")

      if (employeesError) {
        console.error("Error fetching employees:", employeesError)
        throw employeesError
      }

      // Devolvemos datos básicos sin intentar obtener delivery_stats por ahora
      return {
        activeEmployees: Array.isArray(activeEmployees) ? activeEmployees.length : 0,
        activeEmployeesChange: 0,
        totalDeliveryOrders: 0,
        deliveryOrdersChange: 0,
        totalRevenue: 0,
        revenueChange: 0,
        averageRating: 0,
        ratingChange: 0,
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      // Return default values instead of throwing to prevent UI crashes
      return {
        activeEmployees: 0,
        activeEmployeesChange: 0,
        totalDeliveryOrders: 0,
        deliveryOrdersChange: 0,
        totalRevenue: 0,
        revenueChange: 0,
        averageRating: 0,
        ratingChange: 0,
      }
    }
  }

  async generateReports() {
    try {
      // Mock data for reports
      return [
        {
          name: "Facturación por Local",
          data: {
            labels: ["BR Cabildo", "BR Carranza", "BR Pacifico", "BR Lavalle", "BR Rivadavia"],
            datasets: [
              {
                label: "Ventas Mensuales",
                data: [150000, 120000, 180000, 90000, 160000],
                backgroundColor: "rgba(59, 130, 246, 0.5)",
                borderColor: "rgb(59, 130, 246)",
                borderWidth: 1,
              },
            ],
          },
        },
        {
          name: "Evolución de Pedidos por Plataforma",
          data: {
            labels: ["PedidosYa", "Rappi", "MercadoPago"],
            datasets: [
              {
                data: [35, 40, 25],
                backgroundColor: ["rgba(255, 99, 132, 0.5)", "rgba(54, 162, 235, 0.5)", "rgba(255, 206, 86, 0.5)"],
                borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)"],
                borderWidth: 1,
              },
            ],
          },
        },
      ]
    } catch (error) {
      console.error("Error generating reports:", error)
      throw error
    }
  }
}

// Función auxiliar para calcular la jornada laboral esperada en minutos
export function calculateExpectedWorkday(expectedCheckIn: string, expectedCheckOut: string): number {
  const checkIn = new Date(`2000-01-01T${expectedCheckIn}`)
  const checkOut = new Date(`2000-01-01T${expectedCheckOut}`)
  return Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000)
}
