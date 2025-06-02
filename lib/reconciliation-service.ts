import { supabase } from "@/lib/supabase/client"

// Mapa para convertir entre IDs numéricos y códigos de texto de locales
const localIdMap: Record<number, string> = {
  1: "cabildo",
  2: "carranza",
  3: "pacifico",
  4: "lavalle",
  5: "rivadavia",
  6: "aguero",
  7: "dorrego",
  8: "dean",
}

// Mapa inverso para convertir de códigos de texto a IDs numéricos
const localCodeMap: Record<string, number> = {
  cabildo: 1,
  carranza: 2,
  pacifico: 3,
  lavalle: 4,
  rivadavia: 5,
  aguero: 6,
  dorrego: 7,
  dean: 8,
}

export const ReconciliationService = {
  // Obtener la última fecha con discrepancias para un local
  async getLastDiscrepancyDate(localId: number) {
    return await supabase
      .from("stock_discrepancies")
      .select("date, shift")
      .eq("location_id", localId)
      .order("date", { ascending: false })
      .limit(1)
  },

  // Obtener discrepancias de stock para un local y fecha específicos
  async getStockDiscrepancies(date: string, localId: number, shift?: string) {
    try {
      if (!date || !localId) {
        console.error("Fecha o ID de local no proporcionados")
        return []
      }

      console.log(
        `Consultando discrepancias de stock para fecha=${date}, localId=${localId}, shift=${shift || "todos"}`,
      )

      let query = supabase
        .from("stock_discrepancies")
        .select(`
          id,
          date,
          location_id,
          shift,
          product_id,
          product_name,
          category,
          expected_quantity,
          actual_quantity,
          difference,
          unit_cost,
          total_value,
          status,
          reconciliation_id
        `)
        .eq("date", date)
        .eq("location_id", localId)

      if (shift && shift !== "todos") {
        query = query.eq("shift", shift)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error en getStockDiscrepancies:", error)
        return []
      }

      console.log(`Encontradas ${data?.length || 0} discrepancias de stock`)

      // Mapear los datos a un formato más amigable
      return (data || []).map((item) => ({
        id: item.id,
        date: item.date,
        localId: item.location_id,
        shift: item.shift,
        productId: item.product_id,
        productName: item.product_name || "Producto sin nombre",
        category: item.category || "Sin categoría",
        expectedQuantity: item.expected_quantity || 0,
        actualQuantity: item.actual_quantity || 0,
        difference: item.difference || 0,
        unitCost: item.unit_cost || 0,
        totalValue: item.total_value || 0,
        status: item.status || "pending",
        reconciliationId: item.reconciliation_id,
      }))
    } catch (error) {
      console.error("Error en getStockDiscrepancies:", error)
      return []
    }
  },

  // Obtener discrepancias de stock para todos los locales
  async getStockDiscrepanciesAllLocations(date: string, shift?: string) {
    try {
      if (!date) {
        console.error("Fecha no proporcionada")
        return []
      }

      let query = supabase
        .from("stock_discrepancies")
        .select(`
          id,
          date,
          location_id,
          shift,
          product_id,
          product_name,
          category,
          expected_quantity,
          actual_quantity,
          difference,
          unit_cost,
          total_value,
          status,
          reconciliation_id
        `)
        .eq("date", date)

      if (shift && shift !== "todos") {
        query = query.eq("shift", shift)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error en getStockDiscrepanciesAllLocations:", error)
        return []
      }

      // Mapear los datos a un formato más amigable
      return (data || []).map((item) => ({
        id: item.id,
        date: item.date,
        localId: item.location_id,
        shift: item.shift,
        productId: item.product_id,
        productName: item.product_name || "Producto sin nombre",
        category: item.category || "Sin categoría",
        expectedQuantity: item.expected_quantity || 0,
        actualQuantity: item.actual_quantity || 0,
        difference: item.difference || 0,
        unitCost: item.unit_cost || 0,
        totalValue: item.total_value || 0,
        status: item.status || "pending",
        reconciliationId: item.reconciliation_id,
      }))
    } catch (error) {
      console.error("Error en getStockDiscrepanciesAllLocations:", error)
      return []
    }
  },

  // Obtener discrepancias de caja para un local y fecha específicos
  async getCashDiscrepancies(date: string, localId: number, shift?: string) {
    try {
      if (!date || !localId) {
        console.error("Fecha o ID de local no proporcionados")
        return []
      }

      console.log(`Consultando discrepancias de caja para fecha=${date}, localId=${localId}, shift=${shift || "todos"}`)

      // Primero, intentemos obtener directamente de la tabla cash_discrepancies
      let query = supabase
        .from("cash_discrepancies")
        .select(`
          id,
          date,
          location_id,
          shift,
          payment_method,
          expected_amount,
          actual_amount,
          difference,
          status,
          reconciliation_id
        `)
        .eq("date", date)
        .eq("location_id", localId)

      if (shift && shift !== "todos") {
        query = query.eq("shift", shift)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error en getCashDiscrepancies:", error)
        return []
      }

      console.log(`Encontradas ${data?.length || 0} discrepancias de caja`)

      // Si no hay discrepancias de caja, intentemos verificar si hay cierres de caja para esta fecha/local/turno
      if (!data || data.length === 0) {
        console.log("No se encontraron discrepancias de caja, verificando cierres de caja...")

        // Convertir el ID numérico al código de texto del local
        const localCode = localIdMap[localId]

        if (!localCode) {
          console.error(`No se encontró un código de local para el ID ${localId}`)
          return []
        }

        console.log(`Buscando cierres de caja para local_id=${localCode}`)

        // Consultar la tabla de cierres de caja con el código de texto del local
        let closingsQuery = supabase
          .from("cash_register_closings")
          .select("*")
          .eq("date", date)
          .eq("local_id", localCode)

        if (shift && shift !== "todos") {
          closingsQuery = closingsQuery.eq("shift", shift)
        }

        const { data: cashClosings, error: cashClosingsError } = await closingsQuery

        if (cashClosingsError) {
          console.error("Error al verificar cierres de caja:", cashClosingsError)
        } else {
          console.log(`Se encontraron ${cashClosings?.length || 0} cierres de caja para esta fecha/local`)

          // Si hay cierres pero no hay discrepancias, podría ser un problema con la generación
          if (cashClosings && cashClosings.length > 0) {
            console.log("ADVERTENCIA: Hay cierres de caja pero no se generaron discrepancias")
          }
        }
      }

      // Mapear los datos a un formato más amigable
      return (data || []).map((item) => ({
        id: item.id,
        date: item.date,
        localId: item.location_id,
        shift: item.shift,
        paymentMethod: item.payment_method || "unknown",
        expectedAmount: item.expected_amount || 0,
        actualAmount: item.actual_amount || 0,
        difference: item.difference || 0,
        status: item.status || "pending",
        reconciliationId: item.reconciliation_id,
      }))
    } catch (error) {
      console.error("Error en getCashDiscrepancies:", error)
      return []
    }
  },

  // Obtener discrepancias de caja para todos los locales
  async getCashDiscrepanciesAllLocations(date: string, shift?: string) {
    try {
      if (!date) {
        console.error("Fecha no proporcionada")
        return []
      }

      let query = supabase
        .from("cash_discrepancies")
        .select(`
          id,
          date,
          location_id,
          shift,
          payment_method,
          expected_amount,
          actual_amount,
          difference,
          status,
          reconciliation_id
        `)
        .eq("date", date)

      if (shift && shift !== "todos") {
        query = query.eq("shift", shift)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error en getCashDiscrepanciesAllLocations:", error)
        return []
      }

      // Mapear los datos a un formato más amigable
      return (data || []).map((item) => ({
        id: item.id,
        date: item.date,
        localId: item.location_id,
        shift: item.shift,
        paymentMethod: item.payment_method || "unknown",
        expectedAmount: item.expected_amount || 0,
        actualAmount: item.actual_amount || 0,
        difference: item.difference || 0,
        status: item.status || "pending",
        reconciliationId: item.reconciliation_id,
      }))
    } catch (error) {
      console.error("Error en getCashDiscrepanciesAllLocations:", error)
      return []
    }
  },

  // Generar discrepancias de caja manualmente
  async generateCashDiscrepancies(date: string, localId: number, shift?: string) {
    try {
      if (!date || !localId) {
        console.error("Fecha o ID de local no proporcionados")
        return { success: false, error: "Datos incompletos" }
      }

      console.log(`Generando discrepancias de caja para fecha=${date}, localId=${localId}, shift=${shift || "todos"}`)

      // Verificar si ya existen discrepancias para esta fecha/local/turno
      let existingQuery = supabase.from("cash_discrepancies").select("id").eq("date", date).eq("location_id", localId)

      if (shift && shift !== "todos") {
        existingQuery = existingQuery.eq("shift", shift)
      }

      const { data: existingData, error: existingError } = await existingQuery

      if (existingError) {
        console.error("Error al verificar discrepancias existentes:", existingError)
        return { success: false, error: existingError.message }
      }

      if (existingData && existingData.length > 0) {
        console.log(`Ya existen ${existingData.length} discrepancias de caja para esta fecha/local/turno`)
        return { success: true, message: "Ya existen discrepancias para esta fecha/local/turno" }
      }

      // Convertir el ID numérico al código de texto del local
      const localCode = localIdMap[localId]

      if (!localCode) {
        console.error(`No se encontró un código de local para el ID ${localId}`)
        return { success: false, error: `No se encontró un código de local para el ID ${localId}` }
      }

      console.log(`Buscando cierres de caja para local_id=${localCode}`)

      // Buscar cierres de caja para esta fecha/local/turno
      let closingsQuery = supabase.from("cash_register_closings").select("*").eq("date", date).eq("local_id", localCode)

      if (shift && shift !== "todos") {
        closingsQuery = closingsQuery.eq("shift", shift)
      }

      const { data: cashClosings, error: cashClosingsError } = await closingsQuery

      if (cashClosingsError) {
        console.error("Error al buscar cierres de caja:", cashClosingsError)
        return { success: false, error: cashClosingsError.message }
      }

      if (!cashClosings || cashClosings.length === 0) {
        console.log("No se encontraron cierres de caja para esta fecha/local/turno")
        return { success: false, error: "No se encontraron cierres de caja para esta fecha/local/turno" }
      }

      console.log(`Se encontraron ${cashClosings.length} cierres de caja para esta fecha/local/turno`)

      // Generar discrepancias de caja a partir de los cierres
      const discrepanciesToInsert = []

      for (const closing of cashClosings) {
        // Verificar si hay diferencias en efectivo
        const expectedCash = closing.cash_sales || 0
        const actualCash = closing.actual_balance || 0

        if (expectedCash !== actualCash) {
          discrepanciesToInsert.push({
            date: date,
            location_id: localId,
            shift: closing.shift || shift,
            payment_method: "cash",
            expected_amount: expectedCash,
            actual_amount: actualCash,
            difference: actualCash - expectedCash,
            status: "pending",
          })
        }

        // Verificar si hay diferencias en tarjeta de crédito
        const expectedCreditCard = closing.credit_card_sales || 0
        const actualCreditCard = closing.posnet_impreso || 0

        if (expectedCreditCard !== actualCreditCard && actualCreditCard > 0) {
          discrepanciesToInsert.push({
            date: date,
            location_id: localId,
            shift: closing.shift || shift,
            payment_method: "card",
            expected_amount: expectedCreditCard,
            actual_amount: actualCreditCard,
            difference: actualCreditCard - expectedCreditCard,
            status: "pending",
          })
        }

        // Verificar si hay diferencias en tarjeta de débito
        const expectedDebitCard = closing.debit_card_sales || 0

        if (expectedDebitCard > 0) {
          discrepanciesToInsert.push({
            date: date,
            location_id: localId,
            shift: closing.shift || shift,
            payment_method: "debit_card",
            expected_amount: expectedDebitCard,
            actual_amount: expectedDebitCard, // Asumimos que es igual ya que no hay columna específica
            difference: 0,
            status: "pending",
          })
        }

        // Verificar si hay diferencias en transferencias
        const expectedTransfer = closing.transfer_sales || 0

        if (expectedTransfer > 0) {
          discrepanciesToInsert.push({
            date: date,
            location_id: localId,
            shift: closing.shift || shift,
            payment_method: "transfer",
            expected_amount: expectedTransfer,
            actual_amount: expectedTransfer, // Asumimos que es igual ya que no hay columna específica
            difference: 0,
            status: "pending",
          })
        }

        // Verificar si hay diferencias en Mercado Pago
        const expectedMercadoPago = closing.mercado_pago_sales || 0

        if (expectedMercadoPago > 0) {
          discrepanciesToInsert.push({
            date: date,
            location_id: localId,
            shift: closing.shift || shift,
            payment_method: "mercado_pago",
            expected_amount: expectedMercadoPago,
            actual_amount: expectedMercadoPago, // Asumimos que es igual ya que no hay columna específica
            difference: 0,
            status: "pending",
          })
        }

        // Verificar si hay diferencias en otros métodos de pago
        const expectedOther = closing.other_sales || 0

        if (expectedOther > 0) {
          discrepanciesToInsert.push({
            date: date,
            location_id: localId,
            shift: closing.shift || shift,
            payment_method: "other",
            expected_amount: expectedOther,
            actual_amount: expectedOther, // Asumimos que es igual ya que no hay columna específica
            difference: 0,
            status: "pending",
          })
        }
      }

      if (discrepanciesToInsert.length === 0) {
        console.log("No se encontraron diferencias en los cierres de caja")
        return { success: true, message: "No se encontraron diferencias en los cierres de caja" }
      }

      console.log(`Insertando ${discrepanciesToInsert.length} discrepancias de caja`)

      // Insertar las discrepancias en la base de datos
      const { error: insertError } = await supabase.from("cash_discrepancies").insert(discrepanciesToInsert)

      if (insertError) {
        console.error("Error al insertar discrepancias de caja:", insertError)
        return { success: false, error: insertError.message }
      }

      return {
        success: true,
        message: `Se generaron ${discrepanciesToInsert.length} discrepancias de caja correctamente`,
      }
    } catch (error: any) {
      console.error("Error en generateCashDiscrepancies:", error)
      return { success: false, error: error.message || "Error desconocido" }
    }
  },

  // Obtener conciliaciones existentes
  async getReconciliations(date: string, localId?: number, shift?: string) {
    try {
      if (!date) {
        console.error("Fecha no proporcionada")
        return []
      }

      let query = supabase
        .from("reconciliations")
        .select(`
          id,
          date,
          location_id,
          shift,
          total_stock_value,
          total_cash_value,
          difference,
          status,
          notes,
          created_by,
          created_at,
          reconciliation_details (*)
        `)
        .eq("date", date)

      if (localId) {
        query = query.eq("location_id", localId)
      }

      if (shift && shift !== "todos") {
        query = query.eq("shift", shift)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error en getReconciliations:", error)
        return []
      }

      // Mapear los datos a un formato más amigable
      return (data || []).map((item) => ({
        id: item.id,
        date: item.date,
        localId: item.location_id,
        shift: item.shift,
        totalStockValue: item.total_stock_value || 0,
        totalCashValue: item.total_cash_value || 0,
        difference: item.difference || 0,
        status: item.status || "pending",
        notes: item.notes || "",
        createdBy: item.created_by || "",
        createdAt: item.created_at || new Date().toISOString(),
        details: item.reconciliation_details || [],
      }))
    } catch (error) {
      console.error("Error en getReconciliations:", error)
      return []
    }
  },

  // Ejecutar conciliación automática
  async autoReconcile(stockDiscrepancies: any[], cashDiscrepancies: any[]) {
    try {
      // Algoritmo simple de conciliación automática
      const matches = []
      const usedStockIds = new Set()
      const usedCashIds = new Set()

      // Ordenar discrepancias por valor absoluto (de mayor a menor)
      const sortedStock = [...stockDiscrepancies].sort(
        (a, b) => Math.abs(b.totalValue || 0) - Math.abs(a.totalValue || 0),
      )

      const sortedCash = [...cashDiscrepancies].sort(
        (a, b) => Math.abs(b.difference || 0) - Math.abs(a.difference || 0),
      )

      // Intentar emparejar discrepancias con valores similares
      for (const stockItem of sortedStock) {
        if (!stockItem || !stockItem.id || usedStockIds.has(stockItem.id)) continue

        const stockValue = stockItem.totalValue || 0

        for (const cashItem of sortedCash) {
          if (!cashItem || !cashItem.id || usedCashIds.has(cashItem.id)) continue

          const cashValue = cashItem.difference || 0

          // Calcular la diferencia porcentual entre los valores
          const maxValue = Math.max(Math.abs(stockValue), Math.abs(cashValue))
          const difference = Math.abs(Math.abs(stockValue) - Math.abs(cashValue))
          const percentDifference = maxValue > 0 ? (difference / maxValue) * 100 : 0

          // Si la diferencia es menor al 20%, considerar como una coincidencia
          if (percentDifference <= 20) {
            const confidence = 100 - percentDifference

            matches.push({
              id: `match-${stockItem.id}-${cashItem.id}`,
              stockDiscrepancyId: stockItem.id,
              cashDiscrepancyId: cashItem.id,
              stockValue: stockValue,
              cashValue: cashValue,
              confidence: Math.round(confidence),
              selected: confidence >= 90, // Preseleccionar coincidencias con alta confianza
            })

            usedStockIds.add(stockItem.id)
            usedCashIds.add(cashItem.id)
            break
          }
        }
      }

      return {
        matches,
        unmatchedStock: stockDiscrepancies.filter((item) => item && item.id && !usedStockIds.has(item.id)),
        unmatchedCash: cashDiscrepancies.filter((item) => item && item.id && !usedCashIds.has(item.id)),
      }
    } catch (error) {
      console.error("Error en autoReconcile:", error)
      return { matches: [], unmatchedStock: [], unmatchedCash: [] }
    }
  },

  // Guardar conciliaciones
  async saveReconciliations(matches: any[], date: string, localId: number | null, localName: string, shift: string) {
    try {
      if (!matches || matches.length === 0 || !date || !localName || !shift) {
        console.error("Datos incompletos para guardar conciliaciones")
        return { success: false, error: "Datos incompletos" }
      }

      // Crear una nueva conciliación
      const { data: reconciliation, error: reconciliationError } = await supabase
        .from("reconciliations")
        .insert({
          date,
          location_id: localId,
          location_name: localName,
          shift,
          total_stock_value: matches.reduce((sum, match) => sum + Math.abs(match.stockValue || 0), 0),
          total_cash_value: matches.reduce((sum, match) => sum + Math.abs(match.cashValue || 0), 0),
          difference: 0, // Calcular la diferencia
          status: "completed",
          notes: `Conciliación automática generada el ${new Date().toLocaleString()}`,
        })
        .select("id")
        .single()

      if (reconciliationError) {
        console.error("Error al crear conciliación:", reconciliationError)
        return { success: false, error: reconciliationError.message }
      }

      const reconciliationId = reconciliation.id

      // Crear detalles de conciliación para cada coincidencia
      for (const match of matches) {
        if (!match || !match.stockDiscrepancyId || !match.cashDiscrepancyId) continue

        try {
          // Actualizar el estado de la discrepancia de stock
          await supabase
            .from("stock_discrepancies")
            .update({
              status: "reconciled",
              reconciliation_id: reconciliationId,
            })
            .eq("id", match.stockDiscrepancyId)

          // Actualizar el estado de la discrepancia de caja
          await supabase
            .from("cash_discrepancies")
            .update({
              status: "reconciled",
              reconciliation_id: reconciliationId,
            })
            .eq("id", match.cashDiscrepancyId)

          // Crear detalle de conciliación
          await supabase.from("reconciliation_details").insert({
            reconciliation_id: reconciliationId,
            stock_discrepancy_id: match.stockDiscrepancyId,
            cash_discrepancy_id: match.cashDiscrepancyId,
            matched_value: Math.min(Math.abs(match.stockValue || 0), Math.abs(match.cashValue || 0)),
            notes: `Coincidencia automática con confianza del ${match.confidence || 0}%`,
          })
        } catch (detailError) {
          console.error("Error al procesar detalle de conciliación:", detailError)
          // Continuar con el siguiente detalle
        }
      }

      return { success: true, reconciliationId }
    } catch (error: any) {
      console.error("Error en saveReconciliations:", error)
      return { success: false, error: error.message || "Error desconocido" }
    }
  },
}
