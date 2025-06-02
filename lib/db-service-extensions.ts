// Extensiones para el servicio de base de datos para soportar el sistema de pedidos automáticos

import { dbService } from "./db-service"
import { createClient } from "@supabase/supabase-js"
import { format, subDays } from "date-fns"

// Inicializar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// Extender el servicio de base de datos
Object.assign(dbService, {
  // Obtener último stock-matrix para un local
  async getLatestStockMatrix(locationId: number) {
    try {
      // Obtener la última planilla de stock para este local
      const { data: sheet, error: sheetError } = await supabase
        .from("stock_matrix_sheets")
        .select("id, date, location_id, status")
        .eq("location_id", locationId)
        .eq("status", "completado")
        .order("date", { ascending: false })
        .limit(1)
        .single()

      if (sheetError || !sheet) {
        console.error("Error al obtener stock-matrix sheet:", sheetError)
        return null
      }

      // Obtener los detalles de esta planilla
      const { data: details, error: detailsError } = await supabase
        .from("stock_matrix_details")
        .select("*")
        .eq("stock_sheet_id", sheet.id)

      if (detailsError) {
        console.error("Error al obtener detalles de stock-matrix:", detailsError)
        return null
      }

      // Convertir a formato camelCase
      const camelCaseDetails = (details || []).map((detail) => ({
        id: detail.id,
        stockSheetId: detail.stock_sheet_id,
        productId: detail.product_id.toString(), // Convertir a string para consistencia
        productName: detail.product_name,
        openingQuantity: detail.opening_quantity || 0,
        incomingQuantity: detail.incoming_quantity || 0,
        unitsSold: detail.units_sold || 0,
        discardedQuantity: detail.discarded_quantity || 0,
        internalConsumption: detail.internal_consumption || 0,
        closingQuantity: detail.closing_quantity || 0,
        difference: detail.difference || 0,
        unitValue: detail.unit_value || 0,
      }))

      return {
        id: sheet.id,
        date: sheet.date,
        locationId: sheet.location_id,
        status: sheet.status,
        details: camelCaseDetails,
      }
    } catch (error) {
      console.error("Error al obtener último stock-matrix:", error)
      return null
    }
  },

  // Obtener datos de ventas históricas
  async getHistoricalSales(locationId: number, days = 30) {
    try {
      const salesData: Record<string, any> = {}

      // Obtener planillas de stock de los últimos N días
      const startDate = format(subDays(new Date(), days), "yyyy-MM-dd")

      const { data: sheets, error: sheetsError } = await supabase
        .from("stock_matrix_sheets")
        .select("id, date")
        .eq("location_id", locationId)
        .eq("status", "completado")
        .gte("date", startDate)
        .order("date", { ascending: false })

      if (sheetsError) {
        console.error("Error al obtener planillas históricas:", sheetsError)
        return salesData
      }

      if (!sheets || sheets.length === 0) {
        console.log(`No hay datos históricos para el local ${locationId}`)
        return salesData
      }

      // Obtener todos los detalles de estas planillas
      const sheetIds = sheets.map((sheet) => sheet.id)

      const { data: details, error: detailsError } = await supabase
        .from("stock_matrix_details")
        .select("product_id, product_name, units_sold")
        .in("stock_sheet_id", sheetIds)

      if (detailsError) {
        console.error("Error al obtener detalles históricos:", detailsError)
        return salesData
      }

      // Agrupar por producto y calcular promedios
      const productSales: Record<string, number[]> = {}

      details?.forEach((detail) => {
        if (!detail.product_id) return

        const productId = detail.product_id.toString() // Convertir a string para consistencia

        if (!productSales[productId]) {
          productSales[productId] = []
        }

        if (detail.units_sold !== null && detail.units_sold !== undefined) {
          productSales[productId].push(detail.units_sold)
        }
      })

      // Calcular promedios
      for (const [productId, sales] of Object.entries(productSales)) {
        if (sales.length > 0) {
          const total = sales.reduce((sum, qty) => sum + qty, 0)
          const average = total / sales.length

          salesData[productId] = {
            averageQuantity: average,
            dataPoints: sales.length,
            maxQuantity: Math.max(...sales),
            minQuantity: Math.min(...sales),
          }
        }
      }

      return salesData
    } catch (error) {
      console.error("Error al obtener ventas históricas:", error)
      return {}
    }
  },

  // Obtener nombres de productos
  async getProductNames() {
    try {
      // Intentar obtener de sales_products primero
      const { data, error } = await supabase.from("sales_products").select("id, name")

      if (error || !data || data.length === 0) {
        // Si no hay datos en sales_products, intentar con otra tabla que tenga productos
        const { data: altData, error: altError } = await supabase
          .from("stock_matrix_details")
          .select("product_id, product_name")
          .distinct()

        if (altError) throw altError

        const productNames: Record<string, string> = {}
        altData?.forEach((product) => {
          productNames[product.product_id.toString()] = product.product_name
        })

        return productNames
      }

      const productNames: Record<string, string> = {}
      data?.forEach((product) => {
        productNames[product.id.toString()] = product.name
      })

      return productNames
    } catch (error) {
      console.error("Error al obtener nombres de productos:", error)
      return {}
    }
  },

  // Guardar planilla de pedido
  async saveOrderSpreadsheet(fileName: string, content: string, orderId?: number) {
    try {
      // Guardar en storage de Supabase
      const { error } = await supabase.storage.from("order-spreadsheets").upload(fileName, content, {
        contentType: "text/csv",
        upsert: true,
      })

      if (error) throw error

      // Obtener URL pública
      const { data } = supabase.storage.from("order-spreadsheets").getPublicUrl(fileName)

      // Guardar referencia en la base de datos
      await supabase.from("auto_order_spreadsheets").insert({
        auto_order_id: orderId,
        file_name: fileName,
        file_url: data.publicUrl,
        created_at: new Date().toISOString(),
      })

      return data.publicUrl
    } catch (error) {
      console.error("Error al guardar planilla de pedido:", error)
      throw error
    }
  },

  // Obtener configuración de pedidos automáticos
  async getAutoOrderConfig() {
    try {
      const { data, error } = await supabase.from("auto_order_config").select("*").limit(1).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error al obtener configuración:", error)
        return null
      }

      // Convertir a camelCase
      if (data) {
        return {
          enabled: data.enabled,
          considerMorningDepletion: data.consider_morning_depletion,
          morningDepletionFactor: data.morning_depletion_factor,
          minStockPercentage: data.min_stock_percentage,
          maxStockPercentage: data.max_stock_percentage,
          considerSeasonality: data.consider_seasonality,
          requireApproval: data.require_approval,
          notifyOnCreation: data.notify_on_creation,
          generateSpreadsheet: data.generate_spreadsheet,
        }
      }

      return null
    } catch (error) {
      console.error("Error al obtener configuración:", error)
      return null
    }
  },

  // Guardar configuración de pedidos automáticos
  async saveAutoOrderConfig(config: any) {
    try {
      // Convertir a snake_case
      const snakeCaseConfig = {
        enabled: config.enabled,
        consider_morning_depletion: config.considerMorningDepletion,
        morning_depletion_factor: config.morningDepletionFactor,
        min_stock_percentage: config.minStockPercentage,
        max_stock_percentage: config.maxStockPercentage,
        consider_seasonality: config.considerSeasonality,
        require_approval: config.requireApproval,
        notify_on_creation: config.notifyOnCreation,
        generate_spreadsheet: config.generateSpreadsheet,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("auto_order_config").update(snakeCaseConfig).eq("id", 1)

      if (error) throw error
    } catch (error) {
      console.error("Error al guardar configuración:", error)
      throw error
    }
  },

  // Obtener reglas de productos
  async getProductRules() {
    try {
      const { data, error } = await supabase.from("auto_order_product_rules").select("*")

      if (error) {
        console.error("Error al obtener reglas de productos:", error)
        return []
      }

      // Convertir a camelCase
      return (data || []).map((rule) => ({
        id: rule.id,
        productId: rule.product_id,
        productName: rule.product_name,
        minStock: rule.min_stock,
        maxStock: rule.max_stock,
        priority: rule.priority,
        enabled: rule.enabled,
      }))
    } catch (error) {
      console.error("Error al obtener reglas de productos:", error)
      return []
    }
  },

  // Obtener configuración de locales
  async getLocalConfigs() {
    try {
      const { data, error } = await supabase.from("auto_order_local_configs").select("*")

      if (error) {
        console.error("Error al obtener configuración de locales:", error)
        return []
      }

      // Convertir a camelCase
      return (data || []).map((config) => ({
        id: config.id,
        locationId: config.location_id,
        locationName: config.location_name,
        orderDays: config.order_days,
        productTypes: config.product_types,
      }))
    } catch (error) {
      console.error("Error al obtener configuración de locales:", error)
      return []
    }
  },

  // Guardar un pedido automático
  async saveAutoOrder(orderData: any) {
    try {
      // Convertir a snake_case para la base de datos
      const snakeCaseOrder = {
        location_id: orderData.locationId,
        date: orderData.date,
        items: orderData.items,
        current_stock: orderData.currentStock,
        delivery_date: orderData.deliveryDate,
        status: orderData.status,
      }

      const { data, error } = await supabase.from("auto_orders").insert([snakeCaseOrder]).select()

      if (error) throw error

      return data?.[0] || null
    } catch (error) {
      console.error("Error al guardar pedido automático:", error)
      throw error
    }
  },

  // Obtener pedidos automáticos recientes
  async getRecentAutoOrders() {
    try {
      const { data, error } = await supabase
        .from("auto_orders")
        .select(`
          id,
          location_id,
          locations:location_id (name),
          date,
          delivery_date,
          status,
          items
        `)
        .order("date", { ascending: false })
        .limit(10)

      if (error) throw error

      // Convertir a camelCase
      return (data || []).map((order) => ({
        id: order.id,
        locationId: order.location_id,
        locationName: order.locations?.name || "Desconocido",
        date: order.date,
        deliveryDate: order.delivery_date,
        status: order.status,
        totalItems: Object.values(order.items || {}).reduce((sum: number, qty: any) => sum + (qty || 0), 0),
      }))
    } catch (error) {
      console.error("Error al obtener pedidos recientes:", error)
      return []
    }
  },

  // Obtener planillas recientes
  async getRecentSpreadsheets() {
    try {
      const { data, error } = await supabase
        .from("auto_order_spreadsheets")
        .select(`
          id,
          auto_order_id,
          file_name,
          file_url,
          created_at,
          auto_orders:auto_order_id (location_id, locations:location_id(name))
        `)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error

      // Convertir a camelCase
      return (data || []).map((sheet) => ({
        id: sheet.id,
        orderId: sheet.auto_order_id,
        fileName: sheet.file_name,
        fileUrl: sheet.file_url,
        createdAt: sheet.created_at,
        locationId: sheet.auto_orders?.location_id,
        locationName: sheet.auto_orders?.locations?.name || "Desconocido",
      }))
    } catch (error) {
      console.error("Error al obtener planillas recientes:", error)
      return []
    }
  },
})

export { dbService }
