"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, FileText, Download, Printer, Truck, CreditCard, History, Calculator } from "lucide-react"
import Link from "next/link"
import { suppliersService, invoicesService } from "@/lib/services/suppliers-service"
import type { Supplier, InvoiceWithDetails } from "@/lib/types/suppliers"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function ProveedoresPagosPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [suppliersData, invoicesData] = await Promise.all([
          suppliersService.getSuppliers(),
          invoicesService.getInvoices(),
        ])
        setSuppliers(suppliersData)
        setInvoices(invoicesData)
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Error al cargar los datos")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calcular estadísticas
  const totalPaid = invoices
    .flatMap((invoice) => invoice.payments || [])
    .reduce((sum, payment) => sum + payment.payment_amount, 0)

  const totalInvoices = invoices.length
  const pendingInvoices = invoices.filter(
    (invoice) => !invoice.payments || invoice.payments.every((payment) => payment.status !== "completed"),
  ).length

  const averageInvoiceAmount =
    totalInvoices > 0 ? invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0) / totalInvoices : 0

  // Filtrar las facturas más recientes
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
    .slice(0, 5)

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
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Proveedores y Pagos</h2>
            <p className="text-muted-foreground">Gestiona los proveedores, facturas y pagos</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/proveedores-pagos/proveedores">
                <Truck className="mr-2 h-4 w-4" />
                Gestionar Proveedores
              </Link>
            </Button>
            <Button asChild>
              <Link href="/proveedores-pagos/pagos">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Pago
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Pagos realizados a proveedores</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas Recibidas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvoices}</div>
              <p className="text-xs text-muted-foreground">Total de facturas registradas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes de Pago</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvoices}</div>
              <p className="text-xs text-muted-foreground">Facturas sin pago completo</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monto Promedio</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${averageInvoiceAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Promedio por factura</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Accesos Rápidos</CardTitle>
              <CardDescription>Accede rápidamente a las funciones principales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start">
                <Link href="/proveedores-pagos/proveedores">
                  <Truck className="mr-2 h-4 w-4" />
                  Gestión de Proveedores
                </Link>
              </Button>
              <Button asChild className="w-full justify-start">
                <Link href="/proveedores-pagos/pagos">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pago a Proveedores
                </Link>
              </Button>
              <Button asChild className="w-full justify-start">
                <Link href="/proveedores-pagos/historial">
                  <History className="mr-2 h-4 w-4" />
                  Historial de Pagos
                </Link>
              </Button>
              <Button asChild className="w-full justify-start">
                <Link href="/proveedores-pagos/simulacion-costos">
                  <Calculator className="mr-2 h-4 w-4" />
                  Simulación de Costos
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Proveedores Activos</CardTitle>
              <CardDescription>Lista de proveedores registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suppliers.length === 0 ? (
                  <p className="text-center text-muted-foreground">No hay proveedores registrados</p>
                ) : (
                  suppliers.slice(0, 5).map((supplier) => (
                    <div key={supplier.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-muted-foreground">{supplier.contact_name || "Sin contacto"}</p>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/proveedores-pagos/proveedores/${supplier.id}`}>Ver</Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/proveedores-pagos/proveedores">Ver todos los proveedores</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Facturas Recientes</CardTitle>
            <CardDescription>Últimas facturas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Buscar factura..." className="pl-8" />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
                <Button variant="outline">
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
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No hay facturas registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentInvoices.map((invoice) => {
                      // Determinar el estado de la factura
                      let status = "Pendiente"
                      let statusClass = "bg-yellow-100 text-yellow-800"

                      if (invoice.payments && invoice.payments.length > 0) {
                        const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.payment_amount, 0)
                        if (totalPaid >= invoice.total_amount) {
                          status = "Pagada"
                          statusClass = "bg-green-100 text-green-800"
                        } else if (totalPaid > 0) {
                          status = "Parcial"
                          statusClass = "bg-blue-100 text-blue-800"
                        }
                      }

                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                          <TableCell>{invoice.supplier?.name || "Desconocido"}</TableCell>
                          <TableCell>{invoice.local || "No especificado"}</TableCell>
                          <TableCell>${invoice.total_amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                            >
                              {status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/proveedores-pagos/pagos/${invoice.id}`}>Ver</Link>
                            </Button>
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


