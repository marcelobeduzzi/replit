"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { suppliersService, invoicesService } from "@/lib/services/suppliers-service"
import type { Supplier } from "@/lib/types/suppliers"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

export default function NuevaFacturaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supplierIdParam = searchParams.get("supplier")
  const { toast } = useToast()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [invoice, setInvoice] = useState({
    supplier_id: supplierIdParam || "",
    invoice_number: "",
    issue_date: new Date().toISOString().split("T")[0],
    delivery_date: "",
    due_date: "",
    total_amount: 0,
    local: "",
    notes: "",
  })

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true)
        const data = await suppliersService.getSuppliers()
        setSuppliers(data)
        setLoading(false)
      } catch (err: any) {
        console.error("Error fetching suppliers:", err)
        setError(err.message || "Error al cargar los proveedores")
        setLoading(false)
      }
    }

    fetchSuppliers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      if (!invoice.supplier_id) {
        toast({
          title: "Error",
          description: "Debes seleccionar un proveedor",
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      if (!invoice.invoice_number) {
        toast({
          title: "Error",
          description: "El número de factura es obligatorio",
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      if (!invoice.issue_date) {
        toast({
          title: "Error",
          description: "La fecha de emisión es obligatoria",
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      if (!invoice.due_date) {
        toast({
          title: "Error",
          description: "La fecha de vencimiento es obligatoria",
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      if (!invoice.total_amount || invoice.total_amount <= 0) {
        toast({
          title: "Error",
          description: "El monto total debe ser mayor a cero",
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      const createdInvoice = await invoicesService.createInvoice(invoice)

      toast({
        title: "Factura registrada",
        description: "La factura ha sido registrada exitosamente",
      })

      // Redirigir a la página de pago
      router.push(`/proveedores-pagos/pagos/${createdInvoice.id}/pagar`)
    } catch (err: any) {
      console.error("Error creating invoice:", err)
      toast({
        title: "Error",
        description: err.message || "Error al registrar la factura",
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
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Registrar Nueva Factura</h2>
            <p className="text-muted-foreground">Ingresa los datos de la factura del proveedor</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Datos de la Factura</CardTitle>
              <CardDescription>Completa todos los campos obligatorios (*)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="supplier_id">Proveedor *</Label>
                  <Select
                    value={invoice.supplier_id}
                    onValueChange={(value) => setInvoice({ ...invoice, supplier_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_number">Número de Factura *</Label>
                  <Input
                    id="invoice_number"
                    value={invoice.invoice_number}
                    onChange={(e) => setInvoice({ ...invoice, invoice_number: e.target.value })}
                    placeholder="Ej: A-0001-00000123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issue_date">Fecha de Emisión *</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={invoice.issue_date}
                    onChange={(e) => setInvoice({ ...invoice, issue_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Fecha de Entrega</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={invoice.delivery_date}
                    onChange={(e) => setInvoice({ ...invoice, delivery_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Fecha de Vencimiento *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={invoice.due_date}
                    onChange={(e) => setInvoice({ ...invoice, due_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_amount">Monto Total *</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={invoice.total_amount}
                    onChange={(e) => setInvoice({ ...invoice, total_amount: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="local">Local / Sucursal</Label>
                  <Input
                    id="local"
                    value={invoice.local}
                    onChange={(e) => setInvoice({ ...invoice, local: e.target.value })}
                    placeholder="Ej: Sucursal Centro"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={invoice.notes}
                  onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                  placeholder="Información adicional sobre la factura"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" asChild>
                  <Link href="/proveedores-pagos/pagos">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={submitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {submitting ? "Guardando..." : "Guardar Factura"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}
