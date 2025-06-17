
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, FileText, Calendar, DollarSign, Users, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { createBrowserClient } from '@supabase/ssr'

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Tipos de datos para payroll
interface Employee {
  id: string
  first_name: string
  last_name: string
  position: string
  department: string
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

  // Estados principales
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [loadingPayrolls, setLoadingPayrolls] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [monthFilter, setMonthFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Verificar autenticación usando Supabase directamente
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Verificando autenticación...")
        
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          console.log("No hay usuario autenticado, redirigiendo a login...")
          router.replace("/login")
          return
        }

        console.log("Usuario autenticado:", user.email)
        setUser(user)
        setLoading(false)
        
        // Cargar datos inmediatamente después de autenticar
        loadPayrolls()
        
      } catch (error) {
        console.error("Error verificando autenticación:", error)
        router.replace("/login")
      }
    }

    checkAuth()
  }, [router])

  const loadPayrolls = async () => {
    try {
      setLoadingPayrolls(true)
      setError(null)

      console.log("Cargando datos de payroll desde Supabase...")

      // Obtener datos directamente de Supabase
      let query = supabase
        .from("payroll")
        .select(`
          *,
          employees!inner(
            id,
            first_name,
            last_name,
            position,
            department,
            hand_salary,
            bank_salary,
            base_salary
          )
        `)
        .order("created_at", { ascending: false })

      // Aplicar filtros si existen
      if (monthFilter) {
        query = query.eq("month", parseInt(monthFilter))
      }
      if (yearFilter) {
        query = query.eq("year", parseInt(yearFilter))
      }
      if (statusFilter === "paid") {
        query = query.eq("is_paid", true)
      } else if (statusFilter === "pending") {
        query = query.eq("is_paid", false)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error cargando payrolls:", error)
        throw new Error(`Error de base de datos: ${error.message}`)
      }

      console.log(`Payrolls cargados: ${data?.length || 0}`)
      setPayrolls(data || [])

    } catch (error: any) {
      console.error("Error cargando nóminas:", error)
      setError(error.message || "Error al cargar las nóminas")
    } finally {
      setLoadingPayrolls(false)
    }
  }

  // Filtrar nóminas
  const filteredPayrolls = payrolls.filter((payroll) => {
    const monthMatch = !monthFilter || payroll.month.toString() === monthFilter
    const yearMatch = !yearFilter || payroll.year.toString() === yearFilter
    const statusMatch = statusFilter === "all" || 
      (statusFilter === "paid" && payroll.is_paid) ||
      (statusFilter === "pending" && !payroll.is_paid)

    return monthMatch && yearMatch && statusMatch
  })

  // Mostrar loading mientras se verifica autenticación
  if (loading) {
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

  // Si no hay usuario, el useEffect ya manejó la redirección
  if (!user) {
    return null
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
              <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredPayrolls.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {filteredPayrolls.filter(p => p.is_paid).length}
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
                {filteredPayrolls.filter(p => !p.is_paid).length}
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
                ${filteredPayrolls.filter(p => !p.is_paid)
                  .reduce((sum, p) => sum + (p.total_salary || 0), 0).toLocaleString()}
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
                <Button onClick={loadPayrolls} disabled={loadingPayrolls}>
                  {loadingPayrolls ? "Cargando..." : "Actualizar"}
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
              Lista de nóminas registradas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPayrolls ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2">Cargando nóminas...</p>
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay nóminas para mostrar</p>
                <Button onClick={loadPayrolls} className="mt-4">
                  Cargar Nóminas
                </Button>
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
                              {payroll.employees.first_name} {payroll.employees.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {payroll.employees.position} - {payroll.employees.department}
                            </p>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>{format(new Date(payroll.year, payroll.month - 1), "MMMM yyyy", { locale: es })}</p>
                            <p>ID: {payroll.id}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${(payroll.total_salary || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Total</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={payroll.is_paid ? "default" : "secondary"}>
                          {payroll.is_paid ? "Pagado" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 grid grid-cols-3 gap-4">
                      <div>Mano: ${(payroll.final_hand_salary || 0).toLocaleString()}</div>
                      <div>Banco: ${(payroll.bank_salary || 0).toLocaleString()}</div>
                      <div>
                        Creado: {format(new Date(payroll.created_at), "dd/MM/yyyy", { locale: es })}
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
