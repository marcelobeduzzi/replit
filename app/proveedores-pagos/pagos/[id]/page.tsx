"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, CreditCard, Download, Printer, FileText, Calendar, Building, Clock, Trash2 } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { invoicesService } from "@/lib/services/suppliers-service"
import type { InvoiceWithDetails } from "@/lib/types/suppliers"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

export default function DetalleFacturaPage() {
  const params = useParams()
  const invoiceId = params.id as string
  const router = useRouter()
  const { toast } = useToast()

  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true)
        const data = await invoicesService.getInvoiceById(invoiceId)
        setInvoice(data)
      } catch (err: any) {
        console.error("Error fetching invoice details:", err)
        setError(err.message || "Error al cargar los detalles de la factura")
      } finally {
        setLoading(false)
      }
    }

    fetchInvoiceDetails()
  }, [invoiceId])

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await invoicesService.deletePayment(paymentId)

      // Actualizar la factura después de eliminar el pago
      const updatedInvoice = await invoicesService.getInvoiceById(invoiceId)
      setInvoice(updatedInvoice)

      toast({
        title: "Pago eliminado",
        description: "El pago ha sido eliminado exitosamente",
      })
    } catch (err: any) {
      console.error("Error deleting payment:", err)
      toast({
        title: "Error",
        description: err.message || "Error al eliminar el pago",
        variant: "destructive",
      })
    }
  }

  // Calcular totales y estado
  const calculateInvoiceStatus = () => {
    if (!invoice)
      return { status: "Pendiente", statusClass: "bg-yellow-100 text-yellow-800", totalPaid: 0, remaining: 0 }

    let totalPaid = 0
    let status = "Pendiente"
    let statusClass = "bg-yellow-100 text-yellow-800"

    if (invoice.payments && invoice.payments.length > 0) {
      totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.payment_amount, 0)

      if (totalPaid >= invoice.total_amount) {
        status = "Pagada"
        statusClass = "bg-green-100 text-green-800"
      } else if (totalPaid > 0) {
        status = "Parcial"
        statusClass = "bg-blue-100 text-blue-800"
      }
    }

    // Verificar si está vencida
    const isPastDue = new Date(invoice.due_date) < new Date() && status !== "Pagada"
    if (isPastDue) {
      status = "Vencida"
      statusClass = "bg-red-100 text-red-800"
    }

    const remaining = invoice.total_amount - totalPaid

    return { status, statusClass, totalPaid, remaining }
  }

  const { status, statusClass, totalPaid, remaining } = invoice
    ? calculateInvoiceStatus()
    : { status: "Pendiente", statusClass: "bg-yellow-100 text-yellow-800", totalPaid: 0, remaining: 0 }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center">
            <Button asChild variant="outline" className="mr-4">
              <Link href="/proveedores-pagos/pagos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">Factura no encontrada</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p>La factura solicitada no existe o ha sido eliminada.</p>
              <Button asChild className="mt-4">
                <Link href="/proveedores-pagos/pagos">Ver todas las facturas</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button asChild variant="outline" className="mr-4">
              <Link href="/proveedores-pagos/pagos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Factura: {invoice.invoice_number}</h2>
              <p className="text-muted-foreground">Detalles de la factura y sus pagos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            {remaining > 0 && (
              <Button asChild>
                <Link href={`/proveedores-pagos/pagos/${invoice.id}/pagar`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Registrar Pago
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Información de la Factura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <FileText className="mr-2 h-4 w-4 mt-1" />
                    <div>
                      <p className="font-medium">Número de Factura</p>
                      <p className="text-sm">{invoice.invoice_number}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Calendar className="mr-2 h-4 w-4 mt-1" />
                    <div>
                      <p className="font-medium">Fecha de Emisión</p>
                      <p className="text-sm">{new Date(invoice.issue_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Clock className="mr-2 h-4 w-4 mt-1" />
                    <div>
                      <p className="font-medium">Fecha de Vencimiento</p>
                      <p className="text-sm">
                        {new Date(invoice.due_date).toLocaleDateString()}
                        {new Date(invoice.due_date) < new Date() && status !== "Pagada" && (
                          <Badge variant="destructive" className="ml-2">
                            Vencida
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Building className="mr-2 h-4 w-4 mt-1" />
                    <div>
                      <p className="font-medium">Local / Sucursal</p>
                      <p className="text-sm">{invoice.local || "No especificado"}</p>
                    </div>
                  </div>
                </div>
                {invoice.notes && (
                  <div className="space-y-2 md:col-span-2">
                    <p className="font-medium">Notas</p>
                    <p className="text-sm">{invoice.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proveedor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-lg">{invoice.supplier?.name}</p>
                  {invoice.supplier?.contact_name && (
                    <p className="text-sm text-muted-foreground">Contacto: {invoice.supplier.contact_name}</p>
                  )}
                </div>
                {invoice.supplier?.phone && <p className="text-sm">Teléfono: {invoice.supplier.phone}</p>}
                {invoice.supplier?.email && <p className="text-sm">Email: {invoice.supplier.email}</p>}
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/proveedores-pagos/proveedores/${invoice.supplier_id}`}>Ver Detalles del Proveedor</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${invoice.total_amount.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pagado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${remaining.toFixed(2)}</div>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                >
                  {status}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>Pagos realizados para esta factura</CardDescription>
            </div>
            {remaining > 0 && (
              <Button asChild>
                <Link href={`/proveedores-pagos/pagos/${invoice.id}/pagar`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Registrar Pago
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!invoice.payments || invoice.payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No hay pagos registrados para esta factura
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoice.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>{payment.payment_method || "—"}</TableCell>
                        <TableCell className="text-right">${payment.payment_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              payment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : payment.status === "partial"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {payment.status === "completed"
                              ? "Completado"
                              : payment.status === "partial"
                                ? "Parcial"
                                : "Pendiente"}
                          </span>
                        </TableCell>
                        <TableCell>{payment.notes || "—"}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. ¿Realmente quieres eliminar este pago?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePayment(payment.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

