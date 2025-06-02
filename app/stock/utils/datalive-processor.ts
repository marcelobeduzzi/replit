// Tipos de datos
export interface DataliveSale {
  codigo_sucursal: number
  codigo_comanda: number
  fecha: string
  hora: string
  tipo_venta: string
  total_final: number
  estado_comanda: number
}

export interface DataliveSaleDetail {
  codigo_detalle: number
  codigo_sucursal: number
  codigo_comanda: number
  codigo_producto: number
  descripcion_producto: string
  cantidad: number
  precio_total: number
  precio_unitario: number
  tab: string
  rubro: string
  subrubro: string
  fecha: string
}

export interface ProcessedSalesData {
  localId: string
  date: string
  totalSales: number
  productSales: {
    [key: string]: {
      quantity: number
      totalAmount: number
    }
  }
}

// Mapeo de códigos de sucursal a IDs de local
const sucursalToLocalMap: Record<number, string> = {
  1: "cabildo",
  2: "carranza",
  3: "pacifico",
  4: "lavalle",
  5: "rivadavia",
  6: "aguero",
  7: "dorrego",
  8: "dean_dennys",
}

// Mapeo de códigos de producto a categorías
const productCategoryMap: Record<number, string> = {
  // Empanadas
  101: "empanadas",
  102: "empanadas",
  103: "empanadas",
  104: "empanadas",
  105: "empanadas",

  // Medialunas
  201: "medialunas",
  202: "medialunas",

  // Pizzas
  301: "pizzas",
  302: "pizzas",
  303: "pizzas",

  // Bebidas
  401: "gaseosa_grande",
  402: "gaseosa_chica",
  403: "agua_chica",
  404: "cerveza",
}

/**
 * Simula la obtención de datos de ventas desde Datalive
 * En producción, esto leería archivos del FTP
 */
export async function fetchDataliveSalesData(
  date: string,
  localId: string,
): Promise<{
  sales: DataliveSale[]
  details: DataliveSaleDetail[]
}> {
  // Convertir localId a código de sucursal
  const sucursalCode = Object.entries(sucursalToLocalMap).find(([_, id]) => id === localId)?.[0]

  if (!sucursalCode) {
    throw new Error(`Local ID ${localId} no encontrado en el mapeo de sucursales`)
  }

  // Generar datos de prueba
  // En producción, esto leería los archivos CSV del FTP
  const mockSales: DataliveSale[] = []
  const mockDetails: DataliveSaleDetail[] = []

  // Formato de fecha para Datalive (AAAAMMDD)
  const dataliveDate = date.replace(/-/g, "")

  // Generar entre 10 y 30 comandas para el día
  const numComandas = Math.floor(Math.random() * 20) + 10

  for (let i = 1; i <= numComandas; i++) {
    // Crear comanda
    const comanda: DataliveSale = {
      codigo_sucursal: Number.parseInt(sucursalCode),
      codigo_comanda: 1000 + i,
      fecha: dataliveDate,
      hora: `${Math.floor(Math.random() * 12) + 8}:${Math.floor(Math.random() * 60)
        .toString()
        .padStart(2, "0")}`,
      tipo_venta: ["M", "R", "D"][Math.floor(Math.random() * 3)],
      total_final: 0, // Se calculará después
      estado_comanda: Math.random() > 0.1 ? 8 : 3, // 90% entregadas, 10% anuladas
    }

    // Generar entre 1 y 5 productos por comanda
    const numProductos = Math.floor(Math.random() * 5) + 1
    let comandaTotal = 0

    for (let j = 1; j <= numProductos; j++) {
      // Seleccionar un producto aleatorio
      const productCodes = Object.keys(productCategoryMap).map(Number)
      const productCode = productCodes[Math.floor(Math.random() * productCodes.length)]

      // Determinar precio unitario según el producto
      let precioUnitario = 0

      if (productCategoryMap[productCode] === "empanadas") {
        precioUnitario = 800
      } else if (productCategoryMap[productCode] === "medialunas") {
        precioUnitario = 500
      } else if (productCategoryMap[productCode] === "pizzas") {
        precioUnitario = 5000
      } else if (productCategoryMap[productCode] === "gaseosa_grande") {
        precioUnitario = 1500
      } else if (productCategoryMap[productCode] === "gaseosa_chica") {
        precioUnitario = 1000
      } else if (productCategoryMap[productCode] === "agua_chica") {
        precioUnitario = 800
      } else if (productCategoryMap[productCode] === "cerveza") {
        precioUnitario = 2000
      }

      // Cantidad aleatoria entre 1 y 3
      const cantidad = Math.floor(Math.random() * 3) + 1
      const precioTotal = precioUnitario * cantidad
      comandaTotal += precioTotal

      // Crear detalle
      const detalle: DataliveSaleDetail = {
        codigo_detalle: (1000 + i) * 100 + j,
        codigo_sucursal: Number.parseInt(sucursalCode),
        codigo_comanda: 1000 + i,
        codigo_producto: productCode,
        descripcion_producto: `Producto ${productCode}`,
        cantidad: cantidad,
        precio_total: precioTotal,
        precio_unitario: precioUnitario,
        tab: "Tab1",
        rubro: "Rubro1",
        subrubro: "Subrubro1",
        fecha: dataliveDate,
      }

      // Solo agregar detalles si la comanda está entregada
      if (comanda.estado_comanda === 8) {
        mockDetails.push(detalle)
      }
    }

    // Actualizar total de la comanda
    comanda.total_final = comandaTotal

    // Solo agregar comandas entregadas
    if (comanda.estado_comanda === 8) {
      mockSales.push(comanda)
    }
  }

  return {
    sales: mockSales,
    details: mockDetails,
  }
}

/**
 * Procesa los datos de ventas de Datalive
 */
export function processDataliveSales(sales: DataliveSale[], details: DataliveSaleDetail[]): ProcessedSalesData | null {
  if (sales.length === 0 || details.length === 0) {
    return null
  }

  // Obtener información del primer registro
  const firstSale = sales[0]
  const localId = sucursalToLocalMap[firstSale.codigo_sucursal] || "unknown"
  const date = `${firstSale.fecha.substring(0, 4)}-${firstSale.fecha.substring(4, 6)}-${firstSale.fecha.substring(6, 8)}`

  // Inicializar datos procesados
  const processedData: ProcessedSalesData = {
    localId,
    date,
    totalSales: 0,
    productSales: {},
  }

  // Procesar detalles de ventas
  details.forEach((detail) => {
    // Solo procesar detalles de comandas entregadas
    const sale = sales.find((s) => s.codigo_comanda === detail.codigo_comanda)
    if (!sale || sale.estado_comanda !== 8) return

    // Obtener categoría del producto
    const category = productCategoryMap[detail.codigo_producto] || "otros"

    // Inicializar categoría si no existe
    if (!processedData.productSales[category]) {
      processedData.productSales[category] = {
        quantity: 0,
        totalAmount: 0,
      }
    }

    // Sumar cantidad y monto
    processedData.productSales[category].quantity += detail.cantidad
    processedData.productSales[category].totalAmount += detail.precio_total

    // Sumar al total de ventas
    processedData.totalSales += detail.precio_total
  })

  return processedData
}

/**
 * Obtiene los datos de ventas procesados para un local y fecha específicos
 */
export async function getProcessedSalesData(date: string, localId: string): Promise<ProcessedSalesData | null> {
  try {
    // Obtener datos de Datalive
    const { sales, details } = await fetchDataliveSalesData(date, localId)

    // Procesar datos
    return processSales(sales, details)
  } catch (error) {
    console.error("Error al obtener datos de ventas:", error)
    return null
  }
}

/**
 * Procesa las ventas para obtener datos estructurados
 */
export function processSales(sales: DataliveSale[], details: DataliveSaleDetail[]): ProcessedSalesData | null {
  return processDataliveSales(sales, details)
}

/**
 * Obtiene los precios actuales de los productos
 */
export async function getCurrentProductPrices(): Promise<Record<string, number>> {
  // En producción, esto obtendría los precios de la base de datos
  return {
    empanadas: 800,
    medialunas: 500,
    pizzas: 5000,
    gaseosa_grande: 1500,
    gaseosa_chica: 1000,
    agua_chica: 800,
    cerveza: 2000,
    almibar: 1200,
  }
}

