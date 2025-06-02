/**
 * Servicio para integración con TusFacturasAPP (AFIP/ARCA)
 */

// Tipos para la API de TusFacturasAPP
export interface TusFacturasCredentials {
  apitoken: string
  apikey: string
  usertoken: string
}

export interface TusFacturasCliente {
  documento_tipo: string // DNI, CUIT, etc.
  condicion_iva: string // CF (Consumidor Final), RI (Responsable Inscripto), etc.
  domicilio: string
  condicion_pago: string // Código de condición de pago
  documento_nro: string
  razon_social: string
  provincia: string // Código de provincia
  email: string
  envia_por_mail: "S" | "N"
  rg5329: "S" | "N"
}

export interface TusFacturasProducto {
  descripcion: string
  codigo: number | string
  lista_precios: string
  leyenda: string
  unidad_bulto: number
  alicuota: number // Porcentaje de IVA (21, 10.5, etc.)
  actualiza_precio: "S" | "N"
  rg5329: "S" | "N"
  precio_unitario_sin_iva: number
}

export interface TusFacturasDetalle {
  cantidad: number
  afecta_stock: "S" | "N"
  actualiza_precio: "S" | "N"
  bonificacion_porcentaje: number
  producto: TusFacturasProducto
}

export interface TusFacturasTributo {
  id: number
  importe: number
  base_imponible: number
  alicuota: number
  descripcion: string
}

export interface TusFacturasComprobante {
  rubro: string
  tipo: string // "FACTURA A", "FACTURA B", etc.
  numero: number
  operacion: "V" // V para venta
  detalle: TusFacturasDetalle[]
  fecha: string // Formato DD/MM/YYYY
  vencimiento: string // Formato DD/MM/YYYY
  rubro_grupo_contable: string
  total: number
  cotizacion: number
  moneda: string // "PES" para pesos argentinos
  punto_venta: string // IMPORTANTE: Debe ser string, no number
  tributos: TusFacturasTributo[]
}

export interface TusFacturasRequest {
  apitoken: string
  apikey: string
  usertoken: string
  cliente: TusFacturasCliente
  comprobante: TusFacturasComprobante
}

export interface TusFacturasResponse {
  error: boolean
  errores?: string[]
  cae?: string
  vencimiento_cae?: string
  comprobante_nro?: string
  resultado?: string
  observaciones?: string[]
}

class TusFacturasService {
  // Credenciales por defecto (se deben reemplazar con las reales)
  private credentials: TusFacturasCredentials = {
    apitoken: "915b4a37bf2f23d66a28f90b04f695c0",
    apikey: "67223",
    usertoken: "3835ddfd15adf0df7b4af6153400613a40ca1091e0c7059166672395afbf2884",
  }

  // URL del proxy para evitar problemas de CORS
  private apiUrl = "/api/facturacion"
  private puntoVenta = 1 // Será formateado como "00001"
  private webhookToken = "f4d4396fc72399554b81235603acb2fa595cb9dea8a357b4d7fffce6263d3012"

  constructor() {
    // Intentar cargar credenciales desde localStorage al inicializar
    this.loadCredentials()
  }

  /**
   * Establece las credenciales para la API
   */
  setCredentials(credentials: TusFacturasCredentials): void {
    this.credentials = credentials

    // Guardar credenciales en localStorage para uso futuro
    if (typeof window !== "undefined") {
      localStorage.setItem("tusfacturas_credentials", JSON.stringify(credentials))
    }
  }

  /**
   * Establece el punto de venta
   */
  setPuntoVenta(puntoVenta: number): void {
    this.puntoVenta = puntoVenta

    // Guardar punto de venta en localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("tusfacturas_punto_venta", puntoVenta.toString())
    }
  }

  /**
   * Carga las credenciales desde localStorage
   */
  loadCredentials(): void {
    if (typeof window !== "undefined") {
      // Cargar punto de venta
      const savedPuntoVenta = localStorage.getItem("tusfacturas_punto_venta")
      if (savedPuntoVenta) {
        try {
          this.puntoVenta = Number.parseInt(savedPuntoVenta, 10)
        } catch (error) {
          console.error("Error al cargar punto de venta de TusFacturas:", error)
        }
      }

      // Cargar credenciales
      const savedCredentials = localStorage.getItem("tusfacturas_credentials")
      if (savedCredentials) {
        try {
          this.credentials = JSON.parse(savedCredentials)
        } catch (error) {
          console.error("Error al cargar credenciales de TusFacturas:", error)
        }
      }
    }
  }

  /**
   * Verifica si las credenciales están configuradas
   */
  hasCredentials(): boolean {
    console.log("Verificando credenciales:", this.credentials)
    return (
      this.credentials !== null &&
      this.credentials.apitoken !== "" &&
      this.credentials.apikey !== "" &&
      this.credentials.usertoken !== ""
    )
  }

  /**
   * Obtiene las credenciales actuales
   */
  getCredentials(): TusFacturasCredentials {
    return this.credentials
  }

  /**
   * Obtiene el punto de venta formateado como "00001"
   */
  getPuntoVentaFormateado(): string {
    return this.puntoVenta.toString().padStart(5, "0")
  }

  /**
   * Genera una factura electrónica
   */
  async generarFactura(cliente: TusFacturasCliente, comprobante: TusFacturasComprobante): Promise<TusFacturasResponse> {
    console.log("generarFactura - Inicio")
    if (!this.hasCredentials()) {
      console.error("No se han configurado las credenciales para TusFacturasAPP")
      throw new Error("No se han configurado las credenciales para TusFacturasAPP")
    }

    // Asegurarse de que el punto de venta esté correctamente configurado como string
    comprobante.punto_venta = this.getPuntoVentaFormateado()

    // Asegurarse de que los campos obligatorios estén presentes
    if (!cliente.documento_nro || cliente.documento_nro === "0") {
      // Si es DNI, asegurarse de que sea un número válido
      if (cliente.documento_tipo === "DNI") {
        console.error("Para DNI, el número de documento debe ser mayor a cero")
        throw new Error("Para DNI, el número de documento debe ser mayor a cero")
      }
      // Si no es DNI, usar un valor por defecto
      cliente.documento_nro = "0"
    }

    if (!cliente.razon_social) cliente.razon_social = "Consumidor Final"
    if (!cliente.condicion_iva) cliente.condicion_iva = "CF"
    if (!cliente.documento_tipo) cliente.documento_tipo = "DNI"
    if (!cliente.domicilio) cliente.domicilio = "Sin dirección"
    if (!cliente.provincia) cliente.provincia = "2" // Buenos Aires por defecto
    if (!cliente.condicion_pago) cliente.condicion_pago = "201" // Contado

    // Asegurarse de que los detalles tengan todos los campos necesarios
    comprobante.detalle = comprobante.detalle.map((detalle) => {
      if (!detalle.producto.codigo) detalle.producto.codigo = "0"
      if (!detalle.producto.lista_precios) detalle.producto.lista_precios = "standard"
      if (!detalle.producto.unidad_bulto) detalle.producto.unidad_bulto = 1
      if (!detalle.producto.alicuota) detalle.producto.alicuota = 21
      return detalle
    })

    const requestData: TusFacturasRequest = {
      ...this.credentials,
      cliente,
      comprobante,
    }

    console.log("URL de la API:", this.apiUrl)
    console.log("Datos de la solicitud:", JSON.stringify(requestData, null, 2))

    try {
      console.log("Enviando solicitud a la API...")
      // Usar nuestro endpoint de proxy en lugar de llamar directamente a TusFacturas
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      console.log("Estado de la respuesta HTTP:", response.status, response.statusText)

      // Obtener el texto de la respuesta para depuración
      const responseText = await response.text()
      console.log("Respuesta en texto plano:", responseText)

      // Intentar parsear la respuesta como JSON
      let data: TusFacturasResponse
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Error al parsear la respuesta JSON:", parseError)
        return {
          error: true,
          errores: ["Error al parsear la respuesta del servidor: " + responseText],
        }
      }

      if (!response.ok) {
        console.error("Respuesta no OK:", response.status, response.statusText)
        return {
          error: true,
          errores: [`Error en la solicitud: ${response.status} ${response.statusText}`],
        }
      }

      console.log("Datos de la respuesta:", data)
      return data
    } catch (error) {
      console.error("Error al generar factura:", error)
      return {
        error: true,
        errores: [error instanceof Error ? error.message : "Error desconocido"],
      }
    }
  }

  /**
   * Genera una factura de prueba para verificar la conexión
   */
  async generarFacturaPrueba(): Promise<TusFacturasResponse> {
    // Cliente de prueba
    const cliente: TusFacturasCliente = {
      documento_tipo: "DNI",
      condicion_iva: "CF", // Consumidor Final
      domicilio: "Av. Test 123",
      condicion_pago: "201", // Contado
      documento_nro: "11111111", // Número válido para DNI
      razon_social: "Cliente de Prueba",
      provincia: "2", // Buenos Aires
      email: "test@example.com",
      envia_por_mail: "N",
      rg5329: "N",
    }

    // Fecha actual en formato DD/MM/YYYY
    const hoy = new Date()
    const fechaFormateada = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${hoy.getFullYear()}`

    // Fecha de vencimiento (30 días después)
    const vencimiento = new Date(hoy)
    vencimiento.setDate(vencimiento.getDate() + 30)
    const vencimientoFormateado = `${String(vencimiento.getDate()).padStart(2, "0")}/${String(vencimiento.getMonth() + 1).padStart(2, "0")}/${vencimiento.getFullYear()}`

    // Comprobante de prueba
    const comprobante: TusFacturasComprobante = {
      rubro: "Gastronomía",
      tipo: "FACTURA B", // Por defecto Factura B
      numero: 0, // El número lo asigna TusFacturas
      operacion: "V", // Venta
      detalle: [
        {
          cantidad: 1,
          afecta_stock: "S",
          actualiza_precio: "N",
          bonificacion_porcentaje: 0,
          producto: {
            descripcion: "Producto de prueba",
            codigo: "1",
            lista_precios: "standard",
            leyenda: "",
            unidad_bulto: 1,
            alicuota: 21, // IVA 21%
            actualiza_precio: "N",
            rg5329: "N",
            precio_unitario_sin_iva: 100, // Precio sin IVA
          },
        },
      ],
      fecha: fechaFormateada,
      vencimiento: vencimientoFormateado,
      rubro_grupo_contable: "Gastronomía",
      total: 121, // Precio con IVA
      cotizacion: 1,
      moneda: "PES", // Pesos argentinos
      punto_venta: this.getPuntoVentaFormateado(),
      tributos: [], // Sin tributos adicionales
    }

    return this.generarFactura(cliente, comprobante)
  }

  /**
   * Convierte una venta del sistema a formato TusFacturas
   */
  convertirVentaAFactura(venta: any): { cliente: TusFacturasCliente; comprobante: TusFacturasComprobante } {
    console.log("convertirVentaAFactura - Inicio")
    console.log("Datos de venta recibidos:", venta)

    // Obtener la fecha actual en formato DD/MM/YYYY
    const hoy = new Date()
    const fechaFormateada = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${hoy.getFullYear()}`

    // Fecha de vencimiento (30 días después)
    const vencimiento = new Date(hoy)
    vencimiento.setDate(vencimiento.getDate() + 30)
    const vencimientoFormateado = `${String(vencimiento.getDate()).padStart(2, "0")}/${String(vencimiento.getMonth() + 1).padStart(2, "0")}/${vencimiento.getFullYear()}`

    // Extraer información del cliente
    const customerName = venta.customerName || venta.cliente?.nombre || "Consumidor Final"
    const customerDocument = venta.customerDocument || venta.cliente?.documento || "11111111" // Valor por defecto válido
    const customerAddress = venta.customerAddress || venta.cliente?.direccion || "Sin dirección"
    const customerEmail = venta.customerEmail || venta.cliente?.email || ""

    // Datos del cliente (por defecto consumidor final)
    const cliente: TusFacturasCliente = {
      documento_tipo: "DNI",
      condicion_iva: "CF", // Consumidor Final
      domicilio: customerAddress,
      condicion_pago: "201", // Contado
      documento_nro: customerDocument,
      razon_social: customerName,
      provincia: "2", // Buenos Aires por defecto
      email: customerEmail,
      envia_por_mail: "N",
      rg5329: "N",
    }

    // Extraer información de los items
    const items = venta.items || []
    console.log("Items de la venta:", items)

    // Detalles de los productos
    const detalle: TusFacturasDetalle[] = items.map((item: any) => {
      // Extraer información del producto
      const quantity = item.quantity || item.cantidad || 1
      const price = item.price || item.precio || 0
      const productName = item.productName || item.producto?.name || item.producto?.nombre || "Producto sin nombre"
      const productId = item.productId || item.producto?.id || item.product_id || "0"

      // Calcular precio sin IVA (dividir por 1.21 para IVA del 21%)
      const precioSinIva = Number.parseFloat((price / 1.21).toFixed(2))

      return {
        cantidad: quantity,
        afecta_stock: "S",
        actualiza_precio: "N",
        bonificacion_porcentaje: 0,
        producto: {
          descripcion: productName,
          codigo: productId,
          lista_precios: "standard",
          leyenda: "",
          unidad_bulto: 1,
          alicuota: 21, // IVA 21% por defecto
          actualiza_precio: "N",
          rg5329: "N",
          precio_unitario_sin_iva: precioSinIva,
        },
      }
    })

    // Si no hay items, agregar uno genérico
    if (detalle.length === 0) {
      const totalAmount = venta.totalAmount || venta.total || 0
      detalle.push({
        cantidad: 1,
        afecta_stock: "S",
        actualiza_precio: "N",
        bonificacion_porcentaje: 0,
        producto: {
          descripcion: "Venta general",
          codigo: "0",
          lista_precios: "standard",
          leyenda: "",
          unidad_bulto: 1,
          alicuota: 21,
          actualiza_precio: "N",
          rg5329: "N",
          precio_unitario_sin_iva: Number.parseFloat((totalAmount / 1.21).toFixed(2)),
        },
      })
    }

    // Calcular el total
    const total = venta.totalAmount || venta.total || 0

    // Datos del comprobante
    const comprobante: TusFacturasComprobante = {
      rubro: "Gastronomía",
      tipo: "FACTURA B", // Por defecto Factura B
      numero: 0, // El número lo asigna TusFacturas
      operacion: "V", // Venta
      detalle,
      fecha: fechaFormateada,
      vencimiento: vencimientoFormateado,
      rubro_grupo_contable: "Gastronomía",
      total,
      cotizacion: 1,
      moneda: "PES", // Pesos argentinos
      punto_venta: this.getPuntoVentaFormateado(), // Usar el punto de venta formateado como string
      tributos: [], // Sin tributos adicionales
    }

    console.log("convertirVentaAFactura - Fin")
    return { cliente, comprobante }
  }
}

// Exportar una instancia única del servicio
export const tusFacturasService = new TusFacturasService()
