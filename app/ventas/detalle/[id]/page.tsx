"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Download, Printer, User, Phone, MapPin, Calendar, CreditCard, Tag, ShoppingBag } from "lucide-react"
import { salesService } from "@/lib/sales-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FacturaButton } from "@/components/factura-button"
import { supabase } from "@/lib/db"

// Función para mostrar el método de pago en español
const getPaymentMethodText = (method) => {
  const methods = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
    mercadopago: "MercadoPago",
  }
  return methods[method] || method
}

// Función para mostrar el canal en español
const getChannelText = (channel) => {
  const channels = {
    local: "Local",
    pedidosya: "PedidosYa",
    rappi: "Rappi",
    mercadopago: "MercadoPago",
  }
  return channels[channel] || channel
}

// Función para mostrar el estado de pago en español
const getPaymentStatusText = (status) => {
  const statuses = {
    completed: "Completado",
    pending: "Pendiente",
    cancelled: "Cancelado",
  }
  return statuses[status] || status
}

export default function DetalleVentaPage({ params }) {
  const { id } = params
  const router = useRouter()
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [facturaGenerada, setFacturaGenerada] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSale = async () => {
      setLoading(true)
      setError(null)
      try {
        const saleData = await salesService.getSaleById(id)

        if (!saleData) {
          console.error("Venta no encontrada")
          setError("Venta no encontrada")
          return
        }

        setSale(saleData)

        // Si ya tiene factura, marcar como generada
        if (saleData.invoice_number) {
          setFacturaGenerada(true)
        }
      } catch (error) {
        console.error("Error al cargar venta:", error)
        setError(error.message || "Error al cargar los datos de la venta")
      } finally {
        setLoading(false)
      }
    }

    fetchSale()
  }, [id])

  const handleFacturaSuccess = (facturaData) => {
    setFacturaGenerada(true)

    // Actualizar la venta con la información de la factura
    const updateVenta = async () => {
      try {
        if (!supabase) {
          throw new Error("El cliente de Supabase no está disponible")
        }

        await supabase
          .from("sales_orders")
          .update({
            invoice_number: facturaData.comprobante_nro,
            invoice_cae: facturaData.cae,
            invoice_cae_expiry: facturaData.vencimiento_cae,
            invoice_date: new Date().toISOString(),
            invoice_status: "completed",
          })
          .eq("id", id)

        // Actualizar el estado local
        setSale((prev) => ({
          ...prev,
          invoice_number: facturaData.comprobante_nro,
          invoice_cae: facturaData.cae,
          invoice_cae_expiry: facturaData.vencimiento_cae,
          invoice_date: new Date().toISOString(),
          invoice_status: "completed",
        }))
      } catch (error) {
        console.error("Error al actualizar la venta con datos de factura:", error)
      }
    }

    updateVenta()
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          <span className="ml-2">Cargando detalles de la venta...</span>
        </div>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-red-800 font-medium">Error</h2>
          <p className="text-red-700 mt-1">{error || "No se pudo encontrar la venta solicitada."}</p>
        </div>
        <Link href="/ventas/historial">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Ventas
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6 print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <Link href="/ventas/historial">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Venta #{sale.id}</h1>
            <p className="text-muted-foreground">
              {format(new Date(sale.createdAt), "dd MMMM yyyy, HH:mm", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>

          {!facturaGenerada && !sale.invoice_number && (
            <FacturaButton
              venta={{
                ...sale,
                total: sale.totalAmount,
                items: sale.items.map((item) => ({
                  ...item,
                  producto: {
                    id: item.productId,
                    name: item.productName,
                  },
                  cantidad: item.quantity,
                  precio: item.price,
                })),
              }}
              onSuccess={handleFacturaSuccess}
            />
          )}

          {(facturaGenerada || sale.invoice_number) && (
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Descargar Factura
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
        {/* Información del Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sale.customerName && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Nombre</div>
                <div>{sale.customerName}</div>
              </div>
            )}

            {sale.customerPhone && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Teléfono</div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {sale.customerPhone}
                </div>
              </div>
            )}

            {sale.customerAddress && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Dirección</div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {sale.customerAddress}
                </div>
              </div>
            )}

            {!sale.customerName && !sale.customerPhone && !sale.customerAddress && (
              <div className="text-muted-foreground italic">No se registraron datos del cliente</div>
            )}
          </CardContent>
        </Card>

        {/* Detalles de la Venta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Detalles de la Venta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Fecha y Hora</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {format(new Date(sale.createdAt), "dd MMMM yyyy, HH:mm", { locale: es })}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Canal</div>
              <div>
                <Badge variant="outline">{getChannelText(sale.channel)}</Badge>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Método de Pago</div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                {getPaymentMethodText(sale.paymentMethod)}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Estado</div>
              <div>
                <Badge
                  variant={
                    sale.paymentStatus === "completed"
                      ? "default"
                      : sale.paymentStatus === "pending"
                        ? "outline"
                        : "destructive"
                  }
                >
                  {getPaymentStatusText(sale.paymentStatus)}
                </Badge>
              </div>
            </div>

            {sale.createdBy && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Registrado por</div>
                <div>{sale.createdBy}</div>
              </div>
            )}

            {/* Información de factura si existe */}
            {(sale.invoice_number || facturaGenerada) && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Factura #</div>
                  <div>{sale.invoice_number || "Pendiente"}</div>
                </div>
                {sale.invoice_cae && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">CAE</div>
                    <div>{sale.invoice_cae}</div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Resumen de la Venta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <div className="text-sm font-medium text-muted-foreground">Subtotal</div>
              <div>${sale.totalAmount.toFixed(2)}</div>
            </div>

            <div className="flex justify-between">
              <div className="text-sm font-medium text-muted-foreground">Impuestos</div>
              <div>Incluidos</div>
            </div>

            <div className="flex justify-between">
              <div className="text-sm font-medium text-muted-foreground">Descuentos</div>
              <div>$0.00</div>
            </div>

            <Separator />

            <div className="flex justify-between font-bold">
              <div>Total</div>
              <div className="text-xl">${sale.totalAmount.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
          <CardDescription>Detalle de los productos incluidos en la venta</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${item.subtotal.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Total de productos: {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
          </div>
          <div className="font-bold">Total: ${sale.totalAmount.toFixed(2)}</div>
        </CardFooter>
      </Card>

      {/* Notas */}
      {sale.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{sale.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
