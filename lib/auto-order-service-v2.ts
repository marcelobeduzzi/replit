// Servicio mejorado para la automatización de pedidos basado en stock-matrix

import { dbService } from "./db-service"
import { format, addDays } from "date-fns"

// Tipos
export interface AutoOrderConfig {
  enabled: boolean
  considerMorningDepletion: boolean // Considerar ventas antes de la entrega
  morningDepletionFactor: number // Factor de agotamiento matutino (0-1)
  minStockPercentage: number
  maxStockPercentage: number
  considerSeasonality: boolean
  requireApproval: boolean
  notifyOnCreation: boolean
  generateSpreadsheet: boolean // Generar planilla para pruebas
}

export interface ProductRule {
  productId: string
  productName: string
  minStock: number
  maxStock: number
  priority: "low" | "medium" | "high"
  enabled: boolean
}

export interface LocalConfig {
  locationId: number
  locationName: string
  orderDays: number[] // 0 = domingo, 1 = lunes, etc.
  productTypes: string[] // tipos de productos que se piden para este local
}

// Servicio de automatización de pedidos
export const AutoOrderService = {
  // Obtener configuración
  async getConfiguration(): Promise<AutoOrderConfig> {
    try {
      const config = await dbService.getAutoOrderConfig()
      return (
        config || {
          enabled: false,
          considerMorningDepletion: true,
          morningDepletionFactor: 0.15, // Aproximadamente 15% de las ventas diarias ocurren en las 4-6 horas antes de la entrega (8am-12/14pm)
          minStockPercentage: 30,
          maxStockPercentage: 150,
          considerSeasonality: true,
          requireApproval: true,
          notifyOnCreation: true,
          generateSpreadsheet: true,
        }
      )
    } catch (error) {
      console.error("Error al obtener configuración:", error)
      return {
        enabled: false,
        considerMorningDepletion: true,
        morningDepletionFactor: 0.15,
        minStockPercentage: 30,
        maxStockPercentage: 150,
        considerSeasonality: true,
        requireApproval: true,
        notifyOnCreation: true,
        generateSpreadsheet: true,
      }
    }
  },

  // Obtener reglas de productos
  async getProductRules(): Promise<ProductRule[]> {
    try {
      const rules = await dbService.getProductRules()
      return rules || []
    } catch (error) {
      console.error("Error al obtener reglas de productos:", error)
      return []
    }
  },

  // Obtener configuración de locales
  async getLocalConfigs(): Promise<LocalConfig[]> {
    try {
      const configs = await dbService.getLocalConfigs()
      return configs || []
    } catch (error) {
      console.error("Error al obtener configuración de locales:", error)
      return []
    }
  },

  // Generar pedidos basados en stock-matrix
  async generateOrdersFromStockMatrix(): Promise<{ ordersCreated: number; orderDetails: any[] }> {
    try {
      // 1. Obtener configuración general y reglas
      const config = await this.getConfiguration()
      const productRules = await this.getProductRules()
      const localConfigs = await this.getLocalConfigs()

      // 2. Obtener fecha actual y día de la semana
      const today = new Date()
      const dayOfWeek = today.getDay() // 0 = domingo, 1 = lunes, etc.

      // 3. Filtrar locales que pueden hacer pedidos hoy
      const localesForToday = localConfigs.filter((local) => local.orderDays.includes(dayOfWeek))

      if (localesForToday.length === 0) {
        console.log("No hay locales programados para hacer pedidos hoy")
        return { ordersCreated: 0, orderDetails: [] }
      }

      // 4. Para cada local, generar pedido
      let ordersCreated = 0
      const orderDetails: any[] = []

      for (const local of localesForToday) {
        try {
          console.log(`Generando pedido para ${local.locationName}`)

          // 4.1 Obtener último stock-matrix para este local
          const stockMatrix = await dbService.getLatestStockMatrix(local.locationId)

          if (!stockMatrix) {
            console.log(`No se encontró stock-matrix para ${local.locationName}`)
            continue
          }

          // 4.2 Obtener datos de ventas históricas
          const salesData = await dbService.getHistoricalSales(local.locationId)

          // 4.3 Calcular cantidades a pedir
          const orderItems = await this.calculateOrderQuantities(
            stockMatrix,
            salesData,
            productRules,
            config,
            local.productTypes,
          )

          // 4.4 Si hay items para pedir, crear el pedido
          if (Object.keys(orderItems).length > 0) {
            const orderData = {
              locationId: local.locationId,
              locationName: local.locationName,
              date: format(today, "yyyy-MM-dd"),
              items: orderItems,
              currentStock: this.extractCurrentStock(stockMatrix),
              deliveryDate: format(addDays(today, 1), "yyyy-MM-dd"),
              status: config.requireApproval ? "pending" : "approved",
            }

            // 4.5 Guardar pedido en la base de datos
            const savedOrder = await dbService.saveAutoOrder(orderData)
            ordersCreated++
            orderDetails.push(savedOrder)

            // 4.6 Generar planilla para pruebas si está configurado
            if (config.generateSpreadsheet) {
              await this.generateOrderSpreadsheet(orderData)
            }

            // 4.7 Notificar si está configurado
            if (config.notifyOnCreation) {
              await this.notifyOrderCreation(orderData)
            }
          } else {
            console.log(`No se necesitan productos para ${local.locationName}`)
          }
        } catch (error) {
          console.error(`Error al generar pedido para ${local.locationName}:`, error)
        }
      }

      return { ordersCreated, orderDetails }
    } catch (error) {
      console.error("Error al generar pedidos desde stock-matrix:", error)
      throw error
    }
  },

  // Extraer stock actual del stock-matrix
  extractCurrentStock(stockMatrix: any): Record<string, number> {
    const currentStock: Record<string, number> = {}

    // Asumiendo que stockMatrix tiene una estructura con detalles de productos
    if (stockMatrix && stockMatrix.details && Array.isArray(stockMatrix.details)) {
      stockMatrix.details.forEach((detail: any) => {
        if (detail.productId && detail.closingQuantity !== undefined) {
          currentStock[detail.productId] = detail.closingQuantity
        }
      })
    }

    return currentStock
  },

  // Calcular cantidades a pedir
  async calculateOrderQuantities(
    stockMatrix: any,
    salesData: Record<string, any>,
    productRules: ProductRule[],
    config: AutoOrderConfig,
    allowedProductTypes: string[],
  ): Promise<Record<string, number>> {
    const orderItems: Record<string, number> = {}

    // Extraer stock actual del stock-matrix
    const currentStock = this.extractCurrentStock(stockMatrix)

    // Para cada producto en el stock actual o en ventas históricas
    const allProductIds = [...new Set([...Object.keys(currentStock), ...Object.keys(salesData)])]

    for (const productId of allProductIds) {
      // Verificar si este tipo de producto está permitido para este local
      const productType = this.getProductType(productId)
      if (!allowedProductTypes.includes(productType)) {
        continue
      }

      // Obtener stock actual y ventas promedio
      const stock = currentStock[productId] || 0
      const averageSales = salesData[productId]?.averageQuantity || 0

      // Si no hay ventas promedio, no pedir
      if (averageSales === 0) continue

      // Encontrar regla específica para este producto o usar valores por defecto
      const rule = productRules.find((r) => r.productId === productId && r.enabled)

      if (!rule) {
        // Si no hay regla específica, verificar si hay regla por tipo
        const typeRule = productRules.find((r) => r.productId === `type_${productType}` && r.enabled)
        if (!typeRule) continue
      }

      // Usar regla específica o por tipo
      const effectiveRule = rule || productRules.find((r) => r.productId === `type_${productType}` && r.enabled)
      if (!effectiveRule) continue

      // Calcular cantidad objetivo según porcentajes de configuración
      const minTarget = (averageSales * config.minStockPercentage) / 100
      const maxTarget = (averageSales * config.maxStockPercentage) / 100

      // Ajustar según reglas específicas
      const adjustedMin = Math.max(minTarget, effectiveRule.minStock)
      const adjustedMax = Math.min(maxTarget, effectiveRule.maxStock)

      // Calcular ventas esperadas antes de la entrega (8am-12/14pm)
      let morningDepletion = 0
      if (config.considerMorningDepletion) {
        morningDepletion = averageSales * config.morningDepletionFactor // Ventas esperadas en las 4-6 horas antes de la entrega
      }

      // Calcular cantidad a pedir considerando el stock actual y las ventas matutinas
      let quantityToOrder = Math.max(0, adjustedMin - stock + morningDepletion)

      // Ajustar según prioridad
      if (effectiveRule.priority === "high") {
        // Para prioridad alta, asegurar stock cercano al máximo
        quantityToOrder = Math.max(quantityToOrder, adjustedMax - stock + morningDepletion)
      } else if (effectiveRule.priority === "low") {
        // Para prioridad baja, pedir solo si es realmente necesario
        quantityToOrder = Math.max(0, adjustedMin * 0.8 - stock + morningDepletion)
      }

      // Redondear a entero
      quantityToOrder = Math.round(quantityToOrder)

      // Si hay cantidad a pedir, agregar al pedido
      if (quantityToOrder > 0) {
        orderItems[productId] = quantityToOrder
      }
    }

    return orderItems
  },

  // Obtener tipo de producto a partir del ID
  getProductType(productId: string): string {
    // Asumiendo que el ID tiene formato "tipo_nombre"
    const parts = productId.split("_")
    return parts[0] || ""
  },

  // Generar planilla de pedido para pruebas
  async generateOrderSpreadsheet(orderData: any): Promise<string> {
    try {
      // Implementar generación de planilla (Excel, CSV, etc.)
      console.log("Generando planilla para pedido:", orderData.locationName)

      // Ejemplo: Crear un CSV simple
      let csvContent = `Pedido para ${orderData.locationName} - Fecha: ${orderData.date}\n`
      csvContent += "Producto,Cantidad,Stock Actual\n"

      // Obtener nombres de productos
      const productNames = await dbService.getProductNames()

      // Agregar cada producto al CSV
      for (const [productId, quantity] of Object.entries(orderData.items)) {
        const productName = productNames[productId] || productId
        const currentStock = orderData.currentStock[productId] || 0
        csvContent += `${productName},${quantity},${currentStock}\n`
      }

      // Guardar el CSV
      const fileName = `pedido_${orderData.locationId}_${orderData.date.replace(/-/g, "")}.csv`
      await dbService.saveOrderSpreadsheet(fileName, csvContent, orderData.id)

      return fileName
    } catch (error) {
      console.error("Error al generar planilla de pedido:", error)
      throw error
    }
  },

  // Notificar creación de pedido
  async notifyOrderCreation(orderData: any): Promise<void> {
    // Implementar notificación (email, push, etc.)
    console.log("Notificando creación de pedido para:", orderData.locationName)
    // TODO: Implementar
  },
}
