"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/app/dashboard-layout"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, FileText, Calendar, DollarSign, Users, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

// Tipos de datos para payroll
interface Employee {
  id: string
  firstName: string
  lastName: string
  position: string
  local: string
  baseSalary: number
  hourlyRate: number
}

interface Payroll {
  id: string
  employeeId: string
  employee: Employee
  year: number
  month: number
  period: string
  regularHours: number
  overtimeHours: number
  baseSalary: number
  overtimePay: number
  bonuses: number
  deductions: number
  grossPay: number
  netPay: number
  isPaid: boolean
  paidAt: string | null
  paymentMethod: string | null
  paymentType: string | null
  createdAt: string
  liquidation?: {
    id: string
    isPaid: boolean
  }
}

export default function NominaPage() {
  const router = useRouter()
  const { user, sessionStatus, isInitialized } = useAuth()

  // Estados principales
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para confirmación de pagos
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentType, setPaymentType] = useState("")
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)

  // Filtros
  const [monthFilter, setMonthFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Lógica de autenticación simplificada
  useEffect(() => {
    console.log("Nóminas - sessionStatus:", sessionStatus, "user:", user ? user.email : null)

    if (sessionStatus === "invalid" && isInitialized) {
      console.log("Redirigiendo a login desde nóminas - sesión inválida")
      router.replace("/login")
      return
    }
  }, [sessionStatus, isInitialized, router])

  // Cargar datos de nóminas cuando el usuario esté autenticado
  useEffect(() => {
    if (sessionStatus === "valid" && user && !loading && !payrolls.length) {
      loadPayrolls()
    }
  }, [sessionStatus, user, loading, payrolls.length])

  const loadPayrolls = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Cargando nóminas...")

      const response = await fetch("/api/payroll", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Nóminas cargadas:", data.length)

      setPayrolls(data || [])
    } catch (error: any) {
      console.error("Error cargando nóminas:", error)
      setError(error.message || "Error al cargar las nóminas")
    } finally {
      setLoading(false)
    }
  }

  // Filtrar nóminas
  const filteredPayrolls = payrolls.filter((payroll) => {
    const monthMatch = !monthFilter || payroll.month.toString() === monthFilter
    const yearMatch = !yearFilter || payroll.year.toString() === yearFilter
    const statusMatch = statusFilter === "all" || 
      (statusFilter === "paid" && (payroll.isPaid || payroll.liquidation?.isPaid)) ||
      (statusFilter === "pending" && !payroll.isPaid && !payroll.liquidation?.isPaid)

    return monthMatch && yearMatch && statusMatch
  })

  if (sessionStatus === "loading" || !isInitialized) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4">Verificando autenticación...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (sessionStatus === "invalid" && isInitialized) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Sesión Expirada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">Tu sesión ha expirado. Por favor inicia sesión nuevamente.</p>
            <Button asChild className="mt-4">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
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

        {/* Panel de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payrolls.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {filteredPayrolls.filter(p => p.isPaid || p.liquidation?.isPaid).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {filteredPayrolls.filter(p => !p.isPaid && !p.liquidation?.isPaid).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${filteredPayrolls.filter(p => !p.isPaid && !p.liquidation?.isPaid)
                  .reduce((sum, p) => sum + p.netPay, 0).toLocaleString()}
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
                    <SelectItem value="">Todos los meses</SelectItem>
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
                    <SelectItem value="">Todos los años</SelectItem>
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
                <Button onClick={loadPayrolls} disabled={loading}>
                  {loading ? "Cargando..." : "Actualizar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mostrar error si existe */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de nóminas */}
        <Card>
          <CardHeader>
            <CardTitle>Nóminas ({filteredPayrolls.length})</CardTitle>
            <CardDescription>
              Lista de nóminas generadas para los empleados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2">Cargando nóminas...</p>
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay nóminas para mostrar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayrolls.map((payroll) => (
                  <div
                    key={payroll.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-semibold">
                              {payroll.employee.firstName} {payroll.employee.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {payroll.employee.position} - {payroll.employee.local}
                            </p>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>{format(new Date(payroll.year, payroll.month - 1), "MMMM yyyy", { locale: es })}</p>
                            <p>Período: {payroll.period}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${payroll.netPay.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Neto a pagar</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={payroll.isPaid || payroll.liquidation?.isPaid ? "default" : "secondary"}>
                          {payroll.isPaid || payroll.liquidation?.isPaid ? "Pagado" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}