"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, FileText, Calendar, DollarSign, Users, CheckCircle, Clock, AlertCircle, Plus, RefreshCw, Eye, Edit, Download } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"

// Tipos de datos para payroll
interface Employee {
  id: string
  first_name: string
  last_name: string
  position: string
  base_salary: number
  hand_salary: number
  bank_salary: number
}

interface Payroll {
  id: string
  employee_id: string
  employees: Employee
  year: number
  month: number
  hand_salary: number
  bank_salary: number
  final_hand_salary: number
  total_salary: number
  is_paid: boolean
  is_paid_hand: boolean
  is_paid_bank: boolean
  created_at: string
  updated_at: string
}

export default function NominaPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Estados principales
  const [loading, setLoading] = useState(false)
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [allPayrollsStats, setAllPayrollsStats] = useState<any>(null) // Para estadísticas globales
  const [loadingPayrolls, setLoadingPayrolls] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [monthFilter, setMonthFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Estados para generación
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [generatingPayroll, setGeneratingPayroll] = useState(false)

  // Estado para tab activa
  const [activeTab, setActiveTab] = useState("overview")

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const recordsPerPage = 20
  const totalPages = Math.ceil(totalRecords / recordsPerPage)
  const hasNext = currentPage < totalPages
  const hasPrev = currentPage > 1

  // Cargar datos al iniciar
  useEffect(() => {
    loadPayrolls()
  }, [])

  // Recargar cuando cambien los filtros
  useEffect(() => {
    if (monthFilter !== "all" || yearFilter !== "all" || statusFilter !== "all") {
      loadPayrolls(1)
    }
  }, [monthFilter, yearFilter, statusFilter])

  // Función para cargar estadísticas globales (sin paginación)
  const loadGlobalStats = async () => {
    try {
      console.log("Cargando estadísticas globales...")

      const params = new URLSearchParams()
      if (monthFilter && monthFilter !== 'all') params.append('month', monthFilter)
      if (yearFilter && yearFilter !== 'all') params.append('year', yearFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('stats_only', 'true') // Parámetro especial para obtener solo estadísticas

      const response = await fetch(`/api/payroll?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data?.payrolls) {
          // Calcular estadísticas sobre todos los registros
          const stats = {
            total: data.payrolls.length,
            pending: data.payrolls.filter((p: any) => !p.is_paid).length,
            paid: data.payrolls.filter((p: any) => p.is_paid).length,
            totalToPay: data.payrolls.filter((p: any) => !p.is_paid).reduce((sum: number, p: any) => sum + (p.total_salary || 0), 0),
            totalPaid: data.payrolls.filter((p: any) => p.is_paid).reduce((sum: number, p: any) => sum + (p.total_salary || 0), 0)
          }
          setAllPayrollsStats(stats)
          console.log("Estadísticas globales cargadas:", stats)
        }
      }
    } catch (error) {
      console.error("Error cargando estadísticas globales:", error)
    }
  }

  const loadPayrolls = async (page: number = 1) => {
    try {
      setLoadingPayrolls(true)
      setError(null)
      setCurrentPage(page)

      console.log("Nóminas - Cargando datos de payroll...")

      // Construir parámetros de filtro
      const params = new URLSearchParams()
      if (monthFilter && monthFilter !== 'all') params.append('month', monthFilter)
      if (yearFilter && yearFilter !== 'all') params.append('year', yearFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('page', page.toString())
      params.append('limit', recordsPerPage.toString())

      const response = await fetch(`/api/payroll?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Nóminas - Error en respuesta:", response.status, errorData)

        if (response.status === 401) {
          setError("Sin autorización - Por favor inicie sesión nuevamente")
          // No lanzar error aquí para evitar redirects automáticos
          return
        }
        throw new Error(`Error del servidor: ${response.status} - ${errorData}`)
      }

      const data = await response.json()

      console.log("Nóminas - Respuesta completa del servidor:", data)
      console.log(`Nóminas - Payrolls cargados: ${data?.payrolls?.length || 0}`)

      if (data?.payrolls) {
        setPayrolls(data.payrolls)
        setTotalRecords(data.totalRecords || 0)

        // Si es la primera página, también cargar estadísticas globales
        if (page === 1) {
          loadGlobalStats()
        }
      } else {
        console.error("Nóminas - No se encontraron payrolls en la respuesta:", data)
        setPayrolls([])
        setTotalRecords(0)
      }

    } catch (error: any) {
      console.error("Nóminas - Error cargando nóminas:", error)
      setError(error.message || "Error al cargar las nóminas")
    } finally {
      setLoadingPayrolls(false)
    }
  }

  // Función para generar nóminas
  const handleGeneratePayroll = async () => {
    try {
      setGeneratingPayroll(true)
      console.log(`Generando nóminas para ${selectedMonth}/${selectedYear}`)

      const response = await fetch("/api/payroll/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          action: "generate"
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Éxito",
          description: `Nóminas generadas correctamente: ${data.generated || 0} empleados`,
        })
        await loadPayrolls() // Recargar datos
      } else {
        throw new Error(data.error || "Error al generar nóminas")
      }
    } catch (error: any) {
      console.error("Error generando nóminas:", error)
      toast({
        title: "Error",
        description: error.message || "Error al generar nóminas",
        variant: "destructive",
      })
    } finally {
      setGeneratingPayroll(false)
    }
  }

  // Función para regenerar nóminas
  const handleRegeneratePayroll = async () => {
    try {
      setGeneratingPayroll(true)
      console.log(`Regenerando nóminas para ${selectedMonth}/${selectedYear}`)

      const response = await fetch("/api/payroll/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          action: "regenerate"
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Éxito",
          description: `Nóminas regeneradas correctamente: ${data.generated || 0} empleados`,
        })
        await loadPayrolls() // Recargar datos
      } else {
        throw new Error(data.error || "Error al regenerar nóminas")
      }
    } catch (error: any) {
      console.error("Error regenerando nóminas:", error)
      toast({
        title: "Error",
        description: error.message || "Error al regenerar nóminas",
        variant: "destructive",
      })
    } finally {
      setGeneratingPayroll(false)
    }
  }

  // Función para generar liquidaciones
  const handleGenerateLiquidations = () => {
    router.push("/nomina/liquidations/create")
  }

  // Función para confirmar pagos
  const handleConfirmPayment = async (payrollId: string, paymentType: 'hand' | 'bank' | 'total') => {
    try {
      console.log(`Iniciando confirmación de pago - ID: ${payrollId}, Tipo: ${paymentType}`)

      const requestBody = {
        payrollId,
        paymentType
      }

      console.log("Enviando datos:", requestBody)

      const response = await fetch("/api/payroll/confirm-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      })

      console.log("Respuesta del servidor:", response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Error en respuesta del servidor:", errorData)
        throw new Error(`Error del servidor: ${response.status} - ${errorData}`)
      }

      const data = await response.json()
      console.log("Datos de respuesta:", data)

      if (data.success) {
        toast({
          title: "Éxito",
          description: `Pago confirmado correctamente`,
        })

        // Recargar datos para reflejar los cambios
        await loadPayrolls(currentPage)

        // También recargar estadísticas globales
        await loadGlobalStats()
      } else {
        throw new Error(data.error || "Error al confirmar pago")
      }
    } catch (error: any) {
      console.error("Error confirmando pago:", error)
      toast({
        title: "Error",
        description: error.message || "Error al confirmar pago",
        variant: "destructive",
      })
    }
  }

  // Filtrar nóminas según la pestaña activa
  const getFilteredPayrolls = () => {
    let filtered = payrolls.filter((payroll) => {
      const monthMatch = monthFilter === "all" || payroll.month.toString() === monthFilter
      const yearMatch = yearFilter === "all" || payroll.year.toString() === yearFilter
      const statusMatch = statusFilter === "all" || 
        (statusFilter === "paid" && payroll.is_paid) ||
        (statusFilter === "pending" && !payroll.is_paid)

      return monthMatch && yearMatch && statusMatch
    })

    // Filtrar según la pestaña activa
    switch (activeTab) {
      case "pending":
        return filtered.filter(p => !p.is_paid)
      case "paid":
        return filtered.filter(p => p.is_paid)
      case "analysis":
        return filtered // Para análisis mostramos todos
      case "overview":
      default:
        return filtered
    }
  }

  const filteredPayrolls = getFilteredPayrolls()

  // Calcular estadísticas usando datos globales o locales como fallback
  const stats = allPayrollsStats || {
    total: payrolls.length,
    pending: payrolls.filter(p => !p.is_paid).length,
    paid: payrolls.filter(p => p.is_paid).length,
    totalToPay: payrolls.filter(p => !p.is_paid).reduce((sum, p) => sum + (p.total_salary || 0), 0),
    totalPaid: payrolls.filter(p => p.is_paid).reduce((sum, p) => sum + (p.total_salary || 0), 0)
  }

  const exportPayrollToPDF = (payroll: any) => {
    // Crear contenido HTML para el PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recibo de Sueldo - ${payroll.employees?.first_name} ${payroll.employees?.last_name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .employee-info { margin-bottom: 20px; }
          .salary-details { margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .payment-info { margin-top: 20px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RECIBO DE SUELDO</h1>
          <p>Período: ${getMonthName(payroll.month)} ${payroll.year}</p>
        </div>

        <div class="employee-info">
          <h3>Datos del Empleado</h3>
          <p><strong>Nombre:</strong> ${payroll.employees?.first_name} ${payroll.employees?.last_name}</p>
          <p><strong>Cargo:</strong> ${payroll.employees?.position || 'No especificado'}</p>
          <p><strong>Sucursal:</strong> ${payroll.employee?.local || 'No especificado'}</p>
        </div>

        <div class="salary-details">
          <h3>Detalle de Liquidación</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Salario Base</td>
                <td>$${payroll.employees?.base_salary?.toLocaleString() || '0'}</td>
              </tr>
              ${payroll.hand_salary > 0 ? `
              <tr>
                <td>Salario en Mano</td>
                <td>$${payroll.hand_salary.toLocaleString()}</td>
              </tr>` : ''}
              ${payroll.bank_salary > 0 ? `
              <tr>
                <td>Salario Bancario</td>
                <td>$${payroll.bank_salary.toLocaleString()}</td>
              </tr>` : ''}
              
              <tr class="total-row">
                <td><strong>TOTAL NETO</strong></td>
                <td><strong>$${payroll.total_salary?.toLocaleString() || '0'}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="payment-info">
          <h3>Información de Pago</h3>
          ${payroll.is_paid_hand ? `<p><strong>Pago en Mano:</strong> ${format(new Date(payroll.created_at), "dd/MM/yyyy")}</p>` : ''}
          ${payroll.is_paid_bank ? `<p><strong>Pago Bancario:</strong> ${format(new Date(payroll.updated_at), "dd/MM/yyyy")}</p>` : ''}
        </div>

        <div class="footer">
          <p>Recibo generado el ${format(new Date(), "dd/MM/yyyy")} | Sistema de Gestión de Nóminas</p>
        </div>
      </body>
      </html>
    `;

    // Crear ventana para imprimir
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Esperar a que cargue y luego imprimir
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  const getMonthName = (month: number) => {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    return monthNames[month - 1] || "Mes Inválido"
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    })
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Nóminas</h1>
            <p className="text-muted-foreground">
              Administra los pagos de empleados y liquidaciones
            </p>
          </div>
        </div>

        {/* Panel de acciones principales */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Acciones de Nómina</CardTitle>
            <CardDescription>
              Generar nóminas y liquidaciones para períodos específicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Mes</label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {format(new Date(2024, i, 1), "MMMM", { locale: es })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Año</label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleGeneratePayroll}
                disabled={generatingPayroll}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {generatingPayroll ? "Generando..." : "Generar Nóminas"}
              </Button>

              <Button
                onClick={handleRegeneratePayroll}
                disabled={generatingPayroll}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {generatingPayroll ? "Regenerando..." : "Regenerar Nóminas"}
              </Button>

              <Button
                onClick={handleGenerateLiquidations}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Generar Liquidaciones
              </Button>

              <Button
                onClick={() => router.push("/nomina/liquidations")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Ver Liquidaciones
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Panel de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${stats.totalToPay.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.totalPaid.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Mes</label>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los meses</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {format(new Date(2024, i, 1), "MMMM", { locale: es })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Año</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los años" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los años</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="paid">Pagados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={() => loadPayrolls(1)} disabled={loadingPayrolls}>
                  {loadingPayrolls ? "Cargando..." : "Aplicar Filtros"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de paginación */}
        {totalRecords > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, totalRecords)} de {totalRecords} registros
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadPayrolls(currentPage - 1)}
                    disabled={!hasPrev || loadingPayrolls}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadPayrolls(currentPage + 1)}
                    disabled={!hasNext || loadingPayrolls}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mostrar error si existe */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-700">{error}</span>
                <Button 
                  onClick={() => loadPayrolls(currentPage)} 
                  variant="outline" 
                  size="sm" 
                  className="ml-4"
                >
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs de nóminas */}
        <Card>
          <CardHeader>
            <CardTitle>Nóminas</CardTitle>
            <CardDescription>
              Gestiona los pagos por categoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="pending">Pendientes ({stats.pending})</TabsTrigger>
                <TabsTrigger value="paid">Pagados ({stats.paid})</TabsTrigger>
                <TabsTrigger value="analysis">Análisis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {loadingPayrolls ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Cargando nóminas...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPayrolls.map((payroll) => (
                      <div
                        key={payroll.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          // Mostrar detalles del payroll
                          console.log("Ver detalles de:", payroll)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div>
                                <h3 className="font-semibold">
                                  {payroll.employees.first_name} {payroll.employees.last_name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {payroll.employees.position}
                                </p>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>{format(new Date(payroll.year, payroll.month - 1), "MMMM yyyy", { locale: es })}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">${(payroll.total_salary || 0).toLocaleString()}</p>
                                <p className="text-xs text-gray-500">Total</p>
                                <div className="text-xs mt-1">
                                  <span className="text-blue-600">Mano: ${(payroll.hand_salary || 0).toLocaleString()}</span>
                                  {" | "}
                                  <span className="text-green-600">Banco: ${(payroll.bank_salary || 0).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex flex-col space-y-1">
                              {!payroll.is_paid_hand && payroll.hand_salary > 0 && (
                                <Badge variant="secondary" className="text-xs">Mano Pendiente</Badge>
                              )}
                              {!payroll.is_paid_bank && payroll.bank_salary > 0 && (
                                <Badge variant="secondary" className="text-xs">Banco Pendiente</Badge>
                              )}
                              {payroll.is_paid && (
                                <Badge variant="default" className="text-xs">Pagado Completo</Badge>
                              )}
                            </div>
                            <Button size="sm" variant="outline" onClick={(e) => {
                              e.stopPropagation()
                              console.log("Ver detalles específicos")
                            }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Paginación al final de los resultados */}
                    {totalRecords > recordsPerPage && (
                      <Card className="mt-4">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              Mostrando {((currentPage - 1) * recordsPerPage) + 1} - {Math.min(currentPage * recordsPerPage, totalRecords)} de {totalRecords} registros
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadPayrolls(currentPage - 1)}
                                disabled={!hasPrev || loadingPayrolls}
                              >
                                Anterior
                              </Button>
                              <span className="text-sm">
                                Página {currentPage} de {totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadPayrolls(currentPage + 1)}
                                disabled={!hasNext || loadingPayrolls}
                              >
                                Siguiente
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                <div className="space-y-4">
                  {filteredPayrolls.map((payroll) => (
                    <div
                      key={payroll.id}
                      className="border rounded-lg p-4 bg-orange-50 border-orange-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-semibold">
                                {payroll.employees.first_name} {payroll.employees.last_name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {payroll.employees.position}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(payroll.year, payroll.month - 1), "MMMM yyyy", { locale: es })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-orange-700">${(payroll.total_salary || 0).toLocaleString()}</p>
                              <div className="text-xs text-gray-600 mt-1">
                                {!payroll.is_paid_hand && payroll.hand_salary > 0 && (
                                  <div>Mano: ${(payroll.hand_salary || 0).toLocaleString()}</div>
                                )}
                                {!payroll.is_paid_bank && payroll.bank_salary > 0 && (
                                  <div>Banco: ${(payroll.bank_salary || 0).toLocaleString()}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!payroll.is_paid_hand && payroll.hand_salary > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleConfirmPayment(payroll.id, 'hand')}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              Pagar Mano
                            </Button>
                          )}
                          {!payroll.is_paid_bank && payroll.bank_salary > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleConfirmPayment(payroll.id, 'bank')}
                              className="text-green-600 hover:bg-green-50"
                            >
                              Pagar Banco
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            onClick={() => handleConfirmPayment(payroll.id, 'total')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Pagar Todo
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Paginación en pendientes */}
                  {totalRecords > recordsPerPage && (
                    <Card className="mt-4">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Mostrando {((currentPage - 1) * recordsPerPage) + 1} - {Math.min(currentPage * recordsPerPage, totalRecords)} de {totalRecords} registros
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadPayrolls(currentPage - 1)}
                              disabled={!hasPrev || loadingPayrolls}
                            >
                              Anterior
                            </Button>
                            <span className="text-sm">
                              Página {currentPage} de {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadPayrolls(currentPage + 1)}
                              disabled={!hasNext || loadingPayrolls}
                            >
                              Siguiente
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="paid" className="space-y-4">
                <div className="space-y-4">
                  {filteredPayrolls.map((payroll) => (
                    <div
                      key={payroll.id}
                      className="border rounded-lg p-4 bg-green-50 border-green-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-semibold">
                                {payroll.employees.first_name} {payroll.employees.last_name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {payroll.employees.position}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(payroll.year, payroll.month - 1), "MMMM yyyy", { locale: es })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-700">${(payroll.total_salary || 0).toLocaleString()}</p>
                              <div className="text-xs text-gray-600 mt-1">
                                <div className="flex space-x-2">
                                  {payroll.is_paid_hand && payroll.hand_salary > 0 && (
                                    <Badge variant="default" className="text-xs bg-blue-600">
                                      Mano: ${(payroll.hand_salary || 0).toLocaleString()}
                                    </Badge>
                                  )}
                                  {payroll.is_paid_bank && payroll.bank_salary > 0 && (
                                    <Badge variant="default" className="text-xs bg-green-600">
                                      Banco: ${(payroll.bank_salary || 0).toLocaleString()}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pagado Completo
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => {
                            console.log("Ver detalles de pago:", payroll)
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Paginación en pagados */}
                  {totalRecords > recordsPerPage && (
                    <Card className="mt-4">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Mostrando {((currentPage - 1) * recordsPerPage) + 1} - {Math.min(currentPage * recordsPerPage, totalRecords)} de {totalRecords} registros
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadPayrolls(currentPage - 1)}
                              disabled={!hasPrev || loadingPayrolls}
                            >
                              Anterior
                            </Button>
                            <span className="text-sm">
                              Página {currentPage} de {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadPayrolls(currentPage + 1)}
                              disabled={!hasNext || loadingPayrolls}
                            >
                              Siguiente
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Análisis por Mes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Enero:</span>
                          <span>${payrolls.filter(p => p.month === 1).reduce((sum, p) => sum + p.total_salary, 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Febrero:</span>
                          <span>${payrolls.filter(p => p.month === 2).reduce((sum, p) => sum + p.total_salary, 0).toLocaleString()}</span>
                        </div>
                        {/* Agregar más meses según sea necesario */}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Por Estado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Pagados:</span>
                          <span className="text-green-600">{stats.paid}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pendientes:</span>
                          <span className="text-orange-600">{stats.pending}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>{stats.total}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Montos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Pagado:</span>
                          <span className="text-green-600">${stats.totalPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Pendiente:</span>
                          <span className="text-orange-600">${stats.totalToPay.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total General:</span>
                          <span>${(stats.totalPaid + stats.totalToPay).toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}