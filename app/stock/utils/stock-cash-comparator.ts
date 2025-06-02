/**
 * Utilidad para comparar stock y caja
 *
 * Este archivo contiene la lógica para comparar los datos de stock con los datos de caja
 * y generar alertas cuando hay diferencias significativas
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { type ProcessedSalesData, getProcessedSalesData, getCurrentProductPrices } from "./datalive-processor"

// Tipos de datos
interface StockRecord {
  id: string
  date: string
  shift: string
  local_id: string
  local_name: string
  responsible: string
  empanadas_real: number
  empanadas_datalive: number
  gaseosa_grande_real: number
  gaseosa_grande_datalive: number
  gaseosa_chica_real: number
  gaseosa_chica_datalive: number
  agua_chica_real: number
  agua_chica_datalive: number
  cerveza_real: number
  cerveza_datalive: number
  medialunas_real: number
  medialunas_datalive: number
  almibar_real: number
  pizzas_real: number
  pizzas_datalive: number
}

interface CashRegisterClosing {
  id: string
  date: string
  local_id: string
  local_name: string
  shift: string
  responsible: string
  cash_amount: number
  card_amount: number
  mp_amount: number
  other_amount: number
  total_amount: number
}

interface StockCashAlert {
  stock_record_id: string
  cash_register_id: string
  expected_amount: number
  actual_amount: number
  difference: number
  percentage: number
  status: string
  local_id: string
  local_name: string
  date: string
}

/**
 * Compara los datos de stock con los datos de caja y genera alertas
 */
export async function compareStockAndCash(
  stockRecordId: string,
  cashRegisterId: string,
): Promise<StockCashAlert | null> {
  const supabase = createClientComponentClient()

  try {
    // 1. Obtener registro de stock
    const { data: stockRecord, error: stockError } = await supabase
      .from("stock_records")
      .select("*")
      .eq("id", stockRecordId)
      .single()

    if (stockError || !stockRecord) {
      console.error("Error al obtener registro de stock:", stockError)
      return null
    }

    // 2. Obtener cierre de caja
    const { data: cashRegister, error: cashError } = await supabase
      .from("cash_register_closings")
      .select("*")
      .eq("id", cashRegisterId)
      .single()

    if (cashError || !cashRegister) {
      console.error("Error al obtener cierre de caja:", cashError)
      return null
    }

    // 3. Obtener datos de ventas de Datalive (simulado)
    const salesData = await getProcessedSalesData(stockRecord.date, stockRecord.local_id)

    if (!salesData) {
      console.error("No se pudieron obtener datos de ventas")
      return null
    }

    // 4. Obtener precios actuales de productos
    const productPrices = await getCurrentProductPrices()

    // 5. Calcular ingreso teórico basado en stock
    const expectedAmount = calculateExpectedAmount(stockRecord, salesData, productPrices)

    // 6. Comparar con ingreso real
    const actualAmount = cashRegister.total_amount
    const difference = actualAmount - expectedAmount
    const percentage = expectedAmount > 0 ? (difference / expectedAmount) * 100 : 0

    // 7. Crear alerta si la diferencia es significativa
    const threshold = 5000 // Umbral configurable

    if (Math.abs(difference) > threshold) {
      const alert: StockCashAlert = {
        stock_record_id: stockRecordId,
        cash_register_id: cashRegisterId,
        expected_amount: expectedAmount,
        actual_amount: actualAmount,
        difference,
        percentage,
        status: "activa",
        local_id: stockRecord.local_id,
        local_name: stockRecord.local_name,
        date: new Date().toISOString(),
      }

      // Guardar alerta en la base de datos
      const { error: insertError } = await supabase.from("stock_cash_alerts").insert(alert)

      if (insertError) {
        console.error("Error al guardar alerta:", insertError)
        return null
      }

      // Crear alerta en el sistema general de alertas
      await createSystemAlert(alert, stockRecord, cashRegister)

      return alert
    }

    return null
  } catch (error) {
    console.error("Error en la comparación stock-caja:", error)
    return null
  }
}

/**
 * Calcula el ingreso teórico basado en el stock y las ventas
 */
function calculateExpectedAmount(
  stockRecord: StockRecord,
  salesData: ProcessedSalesData,
  productPrices: Record<string, number>,
): number {
  let expectedAmount = 0

  // Calcular basado en las ventas de Datalive
  Object.entries(salesData.productSales).forEach(([category, data]) => {
    if (productPrices[category]) {
      expectedAmount += data.quantity * productPrices[category]
    }
  })

  // Alternativa: calcular basado en la diferencia de stock
  // Esta es una forma alternativa de calcular, usando la diferencia entre stock real y Datalive
  const stockBasedAmount = calculateAmountFromStockDifference(stockRecord, productPrices)

  // Usar el mayor de los dos valores (más conservador)
  return Math.max(expectedAmount, stockBasedAmount)
}

/**
 * Calcula el ingreso teórico basado en la diferencia de stock
 */
function calculateAmountFromStockDifference(stockRecord: StockRecord, productPrices: Record<string, number>): number {
  let amount = 0

  // Empanadas
  const empanadasDiff = stockRecord.empanadas_datalive - stockRecord.empanadas_real
  if (empanadasDiff > 0) {
    amount += empanadasDiff * productPrices.empanadas
  }

  // Medialunas
  const medialunasDiff = stockRecord.medialunas_datalive - stockRecord.medialunas_real
  if (medialunasDiff > 0) {
    amount += medialunasDiff * productPrices.medialunas
  }

  // Pizzas
  const pizzasDiff = stockRecord.pizzas_datalive - stockRecord.pizzas_real
  if (pizzasDiff > 0) {
    amount += pizzasDiff * productPrices.pizzas
  }

  // Gaseosa Grande
  const gaseosaGrandeDiff = stockRecord.gaseosa_grande_datalive - stockRecord.gaseosa_grande_real
  if (gaseosaGrandeDiff > 0) {
    amount += gaseosaGrandeDiff * productPrices.gaseosa_grande
  }

  // Gaseosa Chica
  const gaseosaChicaDiff = stockRecord.gaseosa_chica_datalive - stockRecord.gaseosa_chica_real
  if (gaseosaChicaDiff > 0) {
    amount += gaseosaChicaDiff * productPrices.gaseosa_chica
  }

  // Agua Chica
  const aguaChicaDiff = stockRecord.agua_chica_datalive - stockRecord.agua_chica_real
  if (aguaChicaDiff > 0) {
    amount += aguaChicaDiff * productPrices.agua_chica
  }

  // Cerveza
  const cervezaDiff = stockRecord.cerveza_datalive - stockRecord.cerveza_real
  if (cervezaDiff > 0) {
    amount += cervezaDiff * productPrices.cerveza
  }

  return amount
}

/**
 * Crea una alerta en el sistema general de alertas
 */
async function createSystemAlert(
  stockCashAlert: StockCashAlert,
  stockRecord: StockRecord,
  cashRegister: CashRegisterClosing,
): Promise<void> {
  const supabase = createClientComponentClient()

  try {
    // Formatear mensaje de alerta
    const difference = stockCashAlert.difference
    const formattedDifference = Math.abs(difference).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    })

    const alertType = difference < 0 ? "faltante" : "sobrante"
    const message = `Diferencia ${alertType} de ${formattedDifference} entre ventas y caja en ${stockRecord.local_name} (${stockRecord.shift})`

    // Crear alerta en el sistema
    await supabase.from("alerts").insert({
      type: "stock_cash",
      message,
      status: "activa",
      local_id: stockRecord.local_id,
      local_name: stockRecord.local_name,
      reference_id: stockCashAlert.stock_record_id,
      reference_type: "stock_cash_alert",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error al crear alerta en el sistema:", error)
  }
}

/**
 * Ejecuta la comparación para todos los registros pendientes
 * Esta función se puede ejecutar periódicamente o después de cada cierre de caja
 */
export async function runPendingComparisons(): Promise<void> {
  const supabase = createClientComponentClient()

  try {
    // Obtener registros de stock sin alertas asociadas
    const { data: stockRecords, error: stockError } = await supabase
      .from("stock_records")
      .select("*")
      .order("date", { ascending: false })
      .limit(10)

    if (stockError || !stockRecords) {
      console.error("Error al obtener registros de stock:", stockError)
      return
    }

    // Para cada registro de stock, buscar el cierre de caja correspondiente
    for (const stockRecord of stockRecords) {
      // Buscar cierre de caja para el mismo local, fecha y turno
      const { data: cashRegisters, error: cashError } = await supabase
        .from("cash_register_closings")
        .select("*")
        .eq("local_id", stockRecord.local_id)
        .eq("date", stockRecord.date)
        .eq("shift", stockRecord.shift)

      if (cashError || !cashRegisters || cashRegisters.length === 0) {
        continue // No hay cierre de caja correspondiente
      }

      // Verificar si ya existe una alerta para este par
      const { data: existingAlerts, error: alertError } = await supabase
        .from("stock_cash_alerts")
        .select("id")
        .eq("stock_record_id", stockRecord.id)
        .eq("cash_register_id", cashRegisters[0].id)

      if (alertError) {
        console.error("Error al verificar alertas existentes:", alertError)
        continue
      }

      // Si no hay alerta, ejecutar comparación
      if (!existingAlerts || existingAlerts.length === 0) {
        await compareStockAndCash(stockRecord.id, cashRegisters[0].id)
      }
    }
  } catch (error) {
    console.error("Error al ejecutar comparaciones pendientes:", error)
  }
}

