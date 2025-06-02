import { getSupabase } from "@/lib/db" // Cambiado de "@/lib/supabase" a "@/lib/db"
import type { Balance } from "@/types/balance"
import { objectToCamelCase, objectToSnakeCase } from "@/lib/utils"

export class BalanceService {
  // Obtener balances con filtros
  async getBalances(filters: { year?: number; month?: number; local?: string } = {}) {
    try {
      // Usar getSupabase() para obtener el cliente inicializado
      const supabaseClient = getSupabase()

      let query = supabaseClient.from("balances").select("*")

      // Aplicar filtros
      if (filters.year) {
        query = query.eq("year", filters.year)
      }

      if (filters.month) {
        query = query.eq("month", filters.month)
      }

      if (filters.local && filters.local !== "all") {
        query = query.eq("local", filters.local)
      }

      // Ordenar por fecha
      query = query.order("year", { ascending: false }).order("month", { ascending: false })

      const { data, error } = await query

      if (error) throw error

      return (data || []).map((balance) => objectToCamelCase(balance) as Balance)
    } catch (error) {
      console.error("Error al obtener balances:", error)
      return []
    }
  }

  // Obtener un balance por ID
  async getBalanceById(id: string) {
    try {
      // Usar getSupabase() para obtener el cliente inicializado
      const supabaseClient = getSupabase()

      const { data, error } = await supabaseClient.from("balances").select("*").eq("id", id).single()

      if (error) throw error

      // Obtener los servicios asociados a este balance
      const { data: serviciosData, error: serviciosError } = await supabaseClient
        .from("balance_servicios")
        .select("*")
        .eq("balance_id", id)
        .single()

      if (serviciosError && serviciosError.code !== "PGRST116") {
        // PGRST116 es el código cuando no se encuentra ningún registro
        throw serviciosError
      }

      const balance = objectToCamelCase(data) as Balance

      if (serviciosData) {
        balance.servicios = objectToCamelCase(serviciosData).total || 0
      }

      return balance
    } catch (error) {
      console.error(`Error al obtener balance con ID ${id}:`, error)
      return null
    }
  }

  // Crear un nuevo balance
  async createBalance(
    balanceData: Omit<Balance, "id" | "cmvPorcentaje" | "sueldosPorcentaje" | "retornoNeto">,
    serviciosData: any,
  ) {
    try {
      // Usar getSupabase() para obtener el cliente inicializado
      const supabaseClient = getSupabase()

      const now = new Date().toISOString()

      // Calcular totales de ingresos
      const totalIngresos =
        balanceData.ventasRappi +
        balanceData.ventasPedidosYa +
        balanceData.ventasDebitoCreditoQR + // Corregido: ventasDebitoCreditoQR con QR en mayúsculas
        balanceData.ventasEfectivo

      // Calcular porcentajes
      const cmvPorcentaje = totalIngresos > 0 ? (balanceData.cmv * 100) / totalIngresos : 0
      const sueldosPorcentaje = totalIngresos > 0 ? (balanceData.sueldos * 100) / totalIngresos : 0

      // Calcular total de servicios
      const totalServicios =
        serviciosData.prosegur +
        serviciosData.internet +
        serviciosData.seguro +
        serviciosData.desinfectacion +
        serviciosData.edenor +
        serviciosData.metrogas +
        serviciosData.abl +
        serviciosData.expensas +
        serviciosData.autonomo +
        serviciosData.abogado +
        serviciosData.contador +
        serviciosData.datalive +
        serviciosData.payway +
        serviciosData.personal

      // Calcular retorno neto
      const retornoNeto =
        totalIngresos -
        balanceData.cmv -
        balanceData.desperdicio -
        balanceData.consumos -
        balanceData.contribucionMarginal -
        totalServicios -
        balanceData.fee -
        balanceData.alquiler -
        balanceData.sueldos -
        balanceData.gastos -
        balanceData.ebit -
        balanceData.iva -
        balanceData.iibb -
        balanceData.ccss -
        balanceData.tarjeta

      // Preparar datos completos del balance
      const completeBalanceData = {
        ...balanceData,
        cmv_porcentaje: cmvPorcentaje,
        sueldos_porcentaje: sueldosPorcentaje,
        servicios: totalServicios,
        retorno_neto: retornoNeto,
        created_at: now,
        updated_at: now,
      }

      // Insertar balance
      const { data: balanceInsertado, error: balanceError } = await supabaseClient
        .from("balances")
        .insert([objectToSnakeCase(completeBalanceData)])
        .select()
        .single()

      if (balanceError) throw balanceError

      // Preparar datos de servicios
      const completeServiciosData = {
        ...serviciosData,
        balance_id: balanceInsertado.id,
        total: totalServicios,
        created_at: now,
        updated_at: now,
      }

      // Insertar servicios
      const { error: serviciosError } = await supabaseClient
        .from("balance_servicios")
        .insert([objectToSnakeCase(completeServiciosData)])

      if (serviciosError) throw serviciosError

      return objectToCamelCase(balanceInsertado) as Balance
    } catch (error) {
      console.error("Error al crear balance:", error)
      throw error
    }
  }

  // Actualizar un balance existente
  async updateBalance(id: string, balanceData: Partial<Balance>, serviciosData?: Partial<any>) {
    try {
      // Usar getSupabase() para obtener el cliente inicializado
      const supabaseClient = getSupabase()

      const now = new Date().toISOString()

      // Obtener el balance actual para calcular los nuevos valores
      const currentBalance = await this.getBalanceById(id)
      if (!currentBalance) {
        throw new Error(`No se encontró el balance con ID ${id}`)
      }

      // Obtener los servicios actuales
      const { data: currentServicios, error: serviciosError } = await supabaseClient
        .from("balance_servicios")
        .select("*")
        .eq("balance_id", id)
        .single()

      if (serviciosError && serviciosError.code !== "PGRST116") {
        throw serviciosError
      }

      // Combinar datos actuales con actualizaciones
      const updatedBalance = { ...currentBalance, ...balanceData }
      const updatedServicios = currentServicios
        ? { ...objectToCamelCase(currentServicios), ...serviciosData }
        : serviciosData

      // Calcular totales de ingresos
      const totalIngresos =
        updatedBalance.ventasRappi +
        updatedBalance.ventasPedidosYa +
        updatedBalance.ventasDebitoCreditoQR + // Corregido: ventasDebitoCreditoQR con QR en mayúsculas
        updatedBalance.ventasEfectivo

      // Calcular porcentajes
      const cmvPorcentaje = totalIngresos > 0 ? (updatedBalance.cmv * 100) / totalIngresos : 0
      const sueldosPorcentaje = totalIngresos > 0 ? (updatedBalance.sueldos * 100) / totalIngresos : 0

      // Calcular total de servicios si hay datos de servicios
      let totalServicios = updatedBalance.servicios

      if (updatedServicios) {
        totalServicios =
          (updatedServicios.prosegur || 0) +
          (updatedServicios.internet || 0) +
          (updatedServicios.seguro || 0) +
          (updatedServicios.desinfectacion || 0) +
          (updatedServicios.edenor || 0) +
          (updatedServicios.metrogas || 0) +
          (updatedServicios.abl || 0) +
          (updatedServicios.expensas || 0) +
          (updatedServicios.autonomo || 0) +
          (updatedServicios.abogado || 0) +
          (updatedServicios.contador || 0) +
          (updatedServicios.datalive || 0) +
          (updatedServicios.payway || 0) +
          (updatedServicios.personal || 0)
      }

      // Calcular retorno neto
      const retornoNeto =
        totalIngresos -
        updatedBalance.cmv -
        updatedBalance.desperdicio -
        updatedBalance.consumos -
        updatedBalance.contribucionMarginal -
        totalServicios -
        updatedBalance.fee -
        updatedBalance.alquiler -
        updatedBalance.sueldos -
        updatedBalance.gastos -
        updatedBalance.ebit -
        updatedBalance.iva -
        updatedBalance.iibb -
        updatedBalance.ccss -
        updatedBalance.tarjeta

      // Preparar datos completos del balance
      const completeBalanceData = {
        ...objectToSnakeCase(balanceData),
        cmv_porcentaje: cmvPorcentaje,
        sueldos_porcentaje: sueldosPorcentaje,
        servicios: totalServicios,
        retorno_neto: retornoNeto,
        updated_at: now,
      }

      // Actualizar balance
      const { data: balanceActualizado, error: balanceError } = await supabaseClient
        .from("balances")
        .update(completeBalanceData)
        .eq("id", id)
        .select()
        .single()

      if (balanceError) throw balanceError

      // Actualizar servicios si se proporcionaron datos
      if (serviciosData && Object.keys(serviciosData).length > 0) {
        const completeServiciosData = {
          ...objectToSnakeCase(serviciosData),
          total: totalServicios,
          updated_at: now,
        }

        if (currentServicios) {
          // Actualizar servicios existentes
          const { error: updateServiciosError } = await supabaseClient
            .from("balance_servicios")
            .update(completeServiciosData)
            .eq("id", currentServicios.id)

          if (updateServiciosError) throw updateServiciosError
        } else {
          // Crear nuevo registro de servicios
          const { error: createServiciosError } = await supabaseClient.from("balance_servicios").insert([
            {
              ...completeServiciosData,
              balance_id: id,
              created_at: now,
            },
          ])

          if (createServiciosError) throw createServiciosError
        }
      }

      return objectToCamelCase(balanceActualizado) as Balance
    } catch (error) {
      console.error(`Error al actualizar balance con ID ${id}:`, error)
      throw error
    }
  }

  // Eliminar un balance
  async deleteBalance(id: string) {
    try {
      // Usar getSupabase() para obtener el cliente inicializado
      const supabaseClient = getSupabase()

      // Primero eliminar los servicios asociados
      const { error: serviciosError } = await supabaseClient.from("balance_servicios").delete().eq("balance_id", id)

      if (serviciosError) throw serviciosError

      // Luego eliminar el balance
      const { error: balanceError } = await supabaseClient.from("balances").delete().eq("id", id)

      if (balanceError) throw balanceError

      return true
    } catch (error) {
      console.error(`Error al eliminar balance con ID ${id}:`, error)
      throw error
    }
  }

  // Obtener servicios de un balance
  async getBalanceServices(balanceId: string) {
    try {
      // Usar getSupabase() para obtener el cliente inicializado
      const supabaseClient = getSupabase()

      const { data, error } = await supabaseClient
        .from("balance_servicios")
        .select("*")
        .eq("balance_id", balanceId)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // No se encontraron servicios
          return null
        }
        throw error
      }

      return objectToCamelCase(data) as any
    } catch (error) {
      console.error(`Error al obtener servicios para balance ${balanceId}:`, error)
      return null
    }
  }
}

// Exportar una instancia del servicio
export const balanceService = new BalanceService()
