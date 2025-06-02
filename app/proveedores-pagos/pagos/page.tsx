"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Download, ArrowLeft, Eye, CreditCard, Filter } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { invoicesService } from "@/lib/services/suppliers-service"
import type { InvoiceWithDetails } from "@/lib/types/suppliers"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function PagosProveedoresPage() {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true)
        const data = await invoicesService.getInvoices()
        setInvoices(data)
        setFilteredInvoices(data)
      } catch (err: any) {
        console.error("Error fetching invoices:", err)
        setError(err.message || "Error al cargar las facturas")
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  useEffect(() => {
    let filtered = [...invoices]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (invoice.supplier?.name && invoice.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (invoice.local && invoice.local.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => {
        if (!invoice.payments || invoice.payments.length === 0) {
          return statusFilter === "pending"
        }

        const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.payment_amount, 0)

        if (totalPaid >= invoice.total_amount) {
          return statusFilter === "completed"
        } else if (totalPaid > 0) {
          return statusFilter === "partial"
        } else {
          return statusFilter === "pending"
        }
      })
    }

    setFilteredInvoices(filtered)
  }, [searchTerm, statusFilter, invoices])

  const exportToCSV = () => {
    const headers = [
      "Nº Factura",
      "Proveedor",
      "Fecha Emisión",
      "Fecha Vencimiento",
      "Monto Total",
      "Monto Pagado",
      "Estado",
      "Local",
    ]

    const rows = filteredInvoices.map((invoice) => {
      // Calcular monto pagado y estado
      let totalPaid = 0
      let status = "Pendiente"

      if (invoice.payments && invoice.payments.length > 0) {
        totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.payment_amount, 0)
        if (totalPaid >= invoice.total_amount) {
          status = "Pagada"
        } else if (totalPaid > 0) {
          status = "Parcial"
        }
      }

      return [
        invoice.invoice_number,
        invoice.supplier?.name || "Desconocido",
        new Date(invoice.issue_date).toLocaleDateString(),
        new Date(invoice.due_date).toLocaleDateString(),
        invoice.total_amount.toFixed(2),
        totalPaid.toFixed(2),
        status,
        invoice.local || "No especificado",
      ]
    })

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `facturas_proveedores_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button asChild variant="outline" className="mr-4">
              <Link href="/proveedores-pagos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Pago a Proveedores</h2>
              <p className="text-muted-foreground">Gestiona los pagos a tus proveedores</p>
            </div>
          </div>
          <Button asChild>
            <Link href="/proveedores-pagos/pagos/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Factura
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Facturas Pendientes de Pago</CardTitle>
            <CardDescription>Gestiona las facturas y realiza pagos a tus proveedores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar factura..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="partial">Pago Parcial</SelectItem>
                      <SelectItem value="completed">Pagadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Factura</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="hidden md:table-cell">Fecha Emisión</TableHead>
                    <TableHead className="hidden md:table-cell">Vencimiento</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Pagado</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        No hay facturas que coincidan con los filtros
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => {
                      // Determinar el estado de la factura
                      let totalPaid = 0
                      let status = "Pendiente"
                      let statusClass = "bg-yellow-100 text-yellow-800"
                      const isPastDue = new Date(invoice.due_date) < new Date()

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

                      // Si está vencida y pendiente, cambiar el estilo
                      if (isPastDue && status === "Pendiente") {
                        statusClass = "bg-red-100 text-red-800"
                        status = "Vencida"
                      }

                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{invoice.supplier?.name || "Desconocido"}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {new Date(invoice.issue_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center">
                              {new Date(invoice.due_date).toLocaleDateString()}
                              {isPastDue && status !== "Pagada" && (
                                <Badge variant="destructive" className="ml-2">
                                  Vencida
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">${invoice.total_amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right hidden md:table-cell">${totalPaid.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                            >
                              {status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button asChild variant="ghost" size="icon">
                                <Link href={`/proveedores-pagos/pagos/${invoice.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button asChild variant="ghost" size="icon">
                                <Link href={`/proveedores-pagos/pagos/${invoice.id}/pagar`}>
                                  <CreditCard className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
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
