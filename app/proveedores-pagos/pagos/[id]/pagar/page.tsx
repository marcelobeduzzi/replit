"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { invoicesService } from "@/lib/services/suppliers-service"
import type { InvoiceWithDetails } from "@/lib/types/suppliers"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

export default function RegistrarPagoPage() {
  const params = useParams()
  const invoiceId = params.id as string
  const router = useRouter()
  const { toast } = useToast()

  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [payment, setPayment] = useState({
    invoice_id: invoiceId,
    payment_date: new Date().toISOString().split("T")[0],
    payment_amount: 0,
    payment_method: "",
    is_brozziano: false,
    bank_payment: false,
    bank_payment_amount: 0,
    bank_payment_date: "",
    cash_payment: false,
    cash_payment_amount: 0,
    cash_payment_date: "",
    status: "completed" as "pending" | "partial" | "completed",
    notes: "",
  })

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true)
        const data = await invoicesService.getInvoiceById(invoiceId)
        setInvoice(data)

        // Calcular el monto pendiente de pago
        let totalPaid = 0
        if (data.payments && data.payments.length > 0) {
          totalPaid = data.payments.reduce((sum, p) => sum + p.payment_amount, 0)
        }

        const remainingAmount = data.total_amount - totalPaid

        // Actualizar el monto de pago con el monto pendiente
        setPayment({
          ...payment,
          payment_amount: remainingAmount,
          // Si el proveedor es Brozziano, marcar la opción correspondiente
          is_brozziano: data.supplier?.name?.toLowerCase().includes("brozziano") || false,
        })
      } catch (err: any) {
        console.error("Error fetching invoice details:", err)
        setError(err.message || "Error al cargar los detalles de la factura")
      } finally {
        setLoading(false)
      }
    }

    fetchInvoiceDetails()
  }, [invoiceId, payment])

  // Actualizar los montos de pago dividido cuando cambia is_brozziano
  useEffect(() => {
    if (payment.is_brozziano) {
      // Si es Brozziano, dividir el monto en dos partes iguales por defecto
      const halfAmount = payment.payment_amount / 2
      setPayment({
        ...payment,
        bank_payment: true,
        bank_payment_amount: halfAmount,
        bank_payment_date: payment.payment_date,
        cash_payment: true,
        cash_payment_amount: halfAmount,
        cash_payment_date: payment.payment_date,
      })
    } else {
      // Si no es Brozziano, resetear los campos de pago dividido
      setPayment({
        ...payment,
        bank_payment: false,
        bank_payment_amount: 0,
        bank_payment_date: "",
        cash_payment: false,
        cash_payment_amount: 0,
        cash_payment_date: "",
      })
    }
  }, [payment.is_brozziano, payment.payment_date, payment.payment_amount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      if (!payment.payment_date) {
        toast({
          title: "Error",
          description: "La fecha de pago es obligatoria",
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      if (!payment.payment_amount || payment.payment_amount <= 0) {
        toast({
          title: "Error",
          description: "El monto de pago debe ser mayor a cero",
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      if (!payment.payment_method) {
        toast({
          title: "Error",
          description: "El método de pago es obligatorio",
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      // Validar pagos divididos para Brozziano
      if (payment.is_brozziano) {
        if (payment.bank_payment && (!payment.bank_payment_amount || !payment.bank_payment_date)) {
          toast({
            title: "Error",
            description: "Debe completar el monto y fecha del pago bancario",
            variant: "destructive",
          })
          setSubmitting(false)
          return
        }

        if (payment.cash_payment && (!payment.cash_payment_amount || !payment.cash_payment_date)) {
          toast({
            title: "Error",
            description: "Debe completar el monto y fecha del pago en efectivo",
            variant: "destructive",
          })
          setSubmitting(false)
          return
        }

        // Verificar que la suma de los pagos divididos sea igual al monto total
        const totalDividedAmount =
          (payment.bank_payment ? payment.bank_payment_amount : 0) +
          (payment.cash_payment ? payment.cash_payment_amount : 0)

        if (Math.abs(totalDividedAmount - payment.payment_amount) > 0.01) {
          toast({
            title: "Error",
            description: "La suma de los pagos divididos debe ser igual al monto total",
            variant: "destructive",
          })
          setSubmitting(false)
          return
        }
      }

      await invoicesService.createPayment(payment)

      toast({
        title: "Pago registrado",
        description: "El pago ha sido registrado exitosamente",
      })

      // Redirigir a la página de detalle de la factura
      router.push(`/proveedores-pagos/pagos/${invoiceId}`)
    } catch (err: any) {
      console.error("Error creating payment:", err)
      toast({
        title: "Error",
        description: err.message || "Error al registrar el pago",
        variant: "destructive",
      })
      setSubmitting(false)
    }
  }

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

  // Calcular monto pendiente
  let totalPaid = 0
  if (invoice.payments && invoice.payments.length > 0) {
    totalPaid = invoice.payments.reduce((sum, p) => sum + p.payment_amount, 0)
  }
  const remainingAmount = invoice.total_amount - totalPaid

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center">
          <Button asChild variant="outline" className="mr-4">
            <Link href={`/proveedores-pagos/pagos/${invoiceId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Registrar Pago</h2>
            <p className="text-muted-foreground">
              Factura: {invoice.invoice_number} - Proveedor: {invoice.supplier?.name}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Datos del Pago</CardTitle>
              <CardDescription>Completa todos los campos obligatorios (*)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="payment_date">Fecha de Pago *</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={payment.payment_date}
                    onChange={(e) => setPayment({ ...payment, payment_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Método de Pago *</Label>
                  <Select
                    value={payment.payment_method}
                    onValueChange={(value) => setPayment({ ...payment, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_amount">Monto a Pagar *</Label>
                  <Input
                    id="payment_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={remainingAmount}
                    value={payment.payment_amount}
                    onChange={(e) => setPayment({ ...payment, payment_amount: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                  <p className="text-sm text-muted-foreground">Monto pendiente: ${remainingAmount.toFixed(2)}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado del Pago</Label>
                  <Select
                    value={payment.status}
                    onValueChange={(value: "pending" | "partial" | "completed") =>
                      setPayment({ ...payment, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="partial">Parcial</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_brozziano"
                    checked={payment.is_brozziano}
                    onCheckedChange={(checked) => setPayment({ ...payment, is_brozziano: checked as boolean })}
                  />
                  <Label htmlFor="is_brozziano">Este es un pago a Brozziano (pago dividido)</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Marcar esta opción si el pago es para Brozziano y requiere ser dividido entre banco y efectivo.
                </p>
              </div>

              {payment.is_brozziano && (
                <div className="border p-4 rounded-md space-y-4">
                  <h3 className="font-medium">Pago Dividido para Brozziano</h3>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="bank_payment"
                        checked={payment.bank_payment}
                        onCheckedChange={(checked) => setPayment({ ...payment, bank_payment: checked as boolean })}
                      />
                      <Label htmlFor="bank_payment">Pago Bancario</Label>
                    </div>
                  </div>

                  {payment.bank_payment && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                      <div className="space-y-2">
                        <Label htmlFor="bank_payment_amount">Monto Bancario</Label>
                        <Input
                          id="bank_payment_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={payment.bank_payment_amount}
                          onChange={(e) => setPayment({ ...payment, bank_payment_amount: Number(e.target.value) })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_payment_date">Fecha Pago Bancario</Label>
                        <Input
                          id="bank_payment_date"
                          type="date"
                          value={payment.bank_payment_date}
                          onChange={(e) => setPayment({ ...payment, bank_payment_date: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cash_payment"
                        checked={payment.cash_payment}
                        onCheckedChange={(checked) => setPayment({ ...payment, cash_payment: checked as boolean })}
                      />
                      <Label htmlFor="cash_payment">Pago en Efectivo</Label>
                    </div>
                  </div>

                  {payment.cash_payment && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                      <div className="space-y-2">
                        <Label htmlFor="cash_payment_amount">Monto en Efectivo</Label>
                        <Input
                          id="cash_payment_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={payment.cash_payment_amount}
                          onChange={(e) => setPayment({ ...payment, cash_payment_amount: Number(e.target.value) })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cash_payment_date">Fecha Pago Efectivo</Label>
                        <Input
                          id="cash_payment_date"
                          type="date"
                          value={payment.cash_payment_date}
                          onChange={(e) => setPayment({ ...payment, cash_payment_date: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={payment.notes}
                  onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
                  placeholder="Información adicional sobre el pago"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" asChild>
                  <Link href={`/proveedores-pagos/pagos/${invoiceId}`}>Cancelar</Link>
                </Button>
                <Button type="submit" disabled={submitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {submitting ? "Guardando..." : "Registrar Pago"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}

