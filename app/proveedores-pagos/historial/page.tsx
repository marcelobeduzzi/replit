"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, ArrowLeft, Eye, Filter, Calendar, FileText, Printer } from "lucide-react"
import Link from "next/link"
import { invoicesService } from "@/lib/services/suppliers-service"
import type { PaymentWithDetails } from "@/lib/types/suppliers"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import type { DateRange } from "react-day-picker"
import { addDays } from "date-fns"

export default function HistorialPagosPage() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [filteredPayments, setFilteredPayments] = useState<PaymentWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        setLoading(true)
        // Usar un array vacío como fallback en caso de error
        const data = await invoicesService.getPaymentHistory().catch(() => [])
        setPayments(data)
        setFilteredPayments(data)
      } catch (err: any) {
        console.error("Error fetching payment history:", err)
        setError(err.message || "Error al cargar el historial de pagos")
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentHistory()
  }, [])

  useEffect(() => {
    let filtered = [...payments]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          (payment.invoice?.invoice_number &&
            payment.invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (payment.supplier?.name && payment.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (payment.payment_method && payment.payment_method.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filtrar por método de pago
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter((payment) => payment.payment_method === paymentMethodFilter)
    }

    // Filtrar por rango de fechas
    if (date?.from) {
      filtered = filtered.filter((payment) => {
        if (!payment.payment_date) return false
        const paymentDate = new Date(payment.payment_date)
        return paymentDate >= date.from!
      })
    }

    if (date?.to) {
      filtered = filtered.filter((payment) => {
        if (!payment.payment_date) return false
        const paymentDate = new Date(payment.payment_date)
        return paymentDate <= date.to!
      })
    }

    setFilteredPayments(filtered)
  }, [searchTerm, paymentMethodFilter, date, payments])

  const exportToCSV = () => {
    const headers = ["Nº Factura", "Proveedor", "Fecha de Pago", "Monto", "Método de Pago", "Estado", "Notas"]

    const rows = filteredPayments.map((payment) => [
      payment.invoice?.invoice_number || "Desconocido",
      payment.supplier?.name || "Desconocido",
      payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "No especificado",
      payment.payment_amount.toFixed(2),
      payment.payment_method || "No especificado",
      payment.status,
      payment.notes || "",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `historial_pagos_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calcular estadísticas
  const totalPaid = filteredPayments.reduce((sum, payment) => sum + payment.payment_amount, 0)
  const uniqueSuppliers = new Set(filteredPayments.map((payment) => payment.supplier?.id).filter(Boolean)).size
  const uniqueInvoices = new Set(filteredPayments.map((payment) => payment.invoice_id)).size

  // Obtener métodos de pago únicos
  const uniquePaymentMethods = Array.from(
    new Set(payments.filter((payment) => payment.payment_method).map((payment) => payment.payment_method)),
  )

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
            <Link href="/proveedores-pagos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Historial de Pagos</h2>
            <p className="text-muted-foreground">Consulta el historial de pagos realizados a proveedores</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">En el período seleccionado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proveedores</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueSuppliers}</div>
              <p className="text-xs text-muted-foreground">Proveedores con pagos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas Pagadas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueInvoices}</div>
              <p className="text-xs text-muted-foreground">Facturas con pagos registrados</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Historial de Pagos</CardTitle>
            <CardDescription>Consulta los pagos realizados a proveedores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar pago..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los métodos</SelectItem>
                      {uniquePaymentMethods.map((method) => (
                        <SelectItem key={method} value={method || ""}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <DatePickerWithRange date={date} setDate={setDate} />
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={exportToCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                  <Button variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Factura</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha de Pago</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="hidden md:table-cell">Método de Pago</TableHead>
                    <TableHead className="hidden md:table-cell">Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No hay pagos que coincidan con los filtros
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.invoice?.invoice_number || "—"}</TableCell>
                        <TableCell>{payment.supplier?.name || "—"}</TableCell>
                        <TableCell>
                          {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">${payment.payment_amount.toFixed(2)}</TableCell>
                        <TableCell className="hidden md:table-cell">{payment.payment_method || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">{payment.notes || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/proveedores-pagos/pagos/${payment.invoice_id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
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
