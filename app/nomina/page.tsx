"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Calendar, DollarSign, Users, FileText, Calculator, Settings, Loader2, RefreshCw, CheckCircle, XCircle, Plus } from "lucide-react"
import DashboardLayout from "@/app/dashboard-layout"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

interface Payroll {
  id: string
  employeeId: string
  employeeName: string
  month: number
  year: number
  baseSalary: number
  bankSalary: number
  handSalary: number
  totalSalary: number
  isPaid: boolean
  isPaidHand: boolean
  isPaidBank: boolean
  createdAt: string
}

interface Liquidation {
  id: string
  employeeId: string
  employeeName: string
  amount: number
  reason: string
  isPaid: boolean
  createdAt: string
}

export default function NominaPage() {
  const { user, sessionStatus } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [liquidations, setLiquidations] = useState<Liquidation[]>([])
  const [isLoading, setIsLoading] = useState(false) // Cambiar a false inicialmente
  const [activeTab, setActiveTab] = useState("pendientes")
  const [hasSearched, setHasSearched] = useState(false) // Nuevo estado para controlar si se ha hecho búsqueda

  // Estados para generación de nóminas
  const [generatePeriod, setGeneratePeriod] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false)

  // Estados para liquidaciones
  const [liquidationDialogOpen, setLiquidationDialogOpen] = useState(false)
  const [regenerateLiquidationDialogOpen, setRegenerateLiquidationDialogOpen] = useState(false)
  const [isGeneratingLiquidations, setIsGeneratingLiquidations] = useState(false)

  // Estados para confirmación de pagos
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentType, setPaymentType] = useState("")
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)

  // Filtros - inicializar con valores específicos para requerir selección
  const [monthFilter, setMonthFilter] = useState("") // Vacío inicialmente
  const [yearFilter, setYearFilter] = useState("") // Vacío inicialmente  
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    console.log("Nóminas - sessionStatus:", sessionStatus, "user:", user ? user.email : null)

    // Esperar a que termine la carga antes de tomar decisiones
    if (sessionStatus === "loading") {
      return
    }

    // Solo redirigir si estamos seguros de que no hay sesión válida
    if (sessionStatus === "invalid") {
      console.log("Redirigiendo a login desde nóminas")
      router.push("/login")
      return
    }

    // NO cargar datos automáticamente - solo verificar sesión
    if (sessionStatus === "valid" && user) {
      console.log("Sesión válida en nóminas - esperando selección de filtros")
    }
  }, [sessionStatus, user?.id])

  // Solo cargar datos cuando se seleccionen filtros específicos
  useEffect(() => {
    // Solo cargar si hay sesión válida, usuario, y se han seleccionado mes y año específicos
    if (sessionStatus === "valid" && user && monthFilter && yearFilter && monthFilter !== "all" && yearFilter !== "all") {
      console.log("Filtros específicos seleccionados, cargando datos:", { monthFilter, yearFilter, statusFilter })
      loadData()
    }
  }, [monthFilter, yearFilter, statusFilter, sessionStatus])

  const loadData = async () => {
    // Prevenir múltiples llamadas simultáneas
    if (isLoading) {
      console.log("Ya hay una carga en progreso, saltando...")
      return
    }

    // Verificar que se hayan seleccionado filtros específicos
    if (!monthFilter || !yearFilter || monthFilter === "all" || yearFilter === "all") {
      console.log("No se han seleccionado filtros específicos, no cargando datos")
      return
    }

    try {
      setIsLoading(true)
      setHasSearched(true) // Marcar que se ha realizado una búsqueda

      // Construir parámetros de consulta basados en los filtros
      const params = new URLSearchParams()

      // Siempre agregar mes y año ya que se requieren
      params.append("month", monthFilter)
      params.append("year", yearFilter)

      console.log("Cargando nóminas con filtros específicos:", { monthFilter, yearFilter })

      // Cargar nóminas con filtros aplicados
      const payrollUrl = `/api/payroll?${params.toString()}`
      console.log("URL de consulta:", payrollUrl)

      const payrollResponse = await fetch(payrollUrl, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (payrollResponse.ok) {
        const payrollData = await payrollResponse.json()
        console.log("Nóminas cargadas:", payrollData.length)
        setPayrolls(payrollData)
      } else {
        let errorDetails = ""
        try {
          const errorData = await payrollResponse.json()
          errorDetails = errorData.error || "Error desconocido"
        } catch {
          errorDetails = await payrollResponse.text()
        }
        
        console.error("Error en respuesta de nóminas:", payrollResponse.status, errorDetails)

        if (payrollResponse.status === 401) {
          console.log("Error de autenticación detectado - Intentando refrescar sesión...")
          
          // Intentar refrescar la sesión antes de mostrar error
          try {
            const refreshResponse = await fetch('/api/auth/validate-session', {
              method: 'POST',
              headers: {
                'Cache-Control': 'no-cache'
              }
            })
            
            if (refreshResponse.ok) {
              console.log("Sesión refrescada, reintentando carga de nóminas...")
              // Reintentar la carga después de un breve delay
              setTimeout(() => loadData(), 1000)
              return
            }
          } catch (refreshError) {
            console.error("Error al refrescar sesión:", refreshError)
          }
          
          toast({
            title: "Error de Autenticación",
            description: "No se pudo verificar tu sesión. Por favor, actualiza la página.",
            variant: "destructive",
            duration: 8000
          })

          setPayrolls([])
          setLiquidations([])
          return
        } else {
          toast({
            title: "Error",
            description: `Error al cargar las nóminas (${payrollResponse.status}): ${errorDetails}`,
            variant: "destructive"
          })
        }
      }

      // Cargar liquidaciones solo si las nóminas se cargaron correctamente
      if (payrollResponse.ok) {
        const liquidationResponse = await fetch("/api/payroll/liquidation", {
          headers: {
            'Cache-Control': 'no-cache'
          }
        })

        if (liquidationResponse.ok) {
          const liquidationData = await liquidationResponse.json()
          console.log("Liquidaciones cargadas:", liquidationData.length)
          setLiquidations(liquidationData)
        }
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Error de conexión al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePayroll = async () => {
    if (!generatePeriod) {
      toast({
        title: "Error",
        description: "Por favor selecciona un período",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/payroll/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ period: generatePeriod, regenerate: false }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Nóminas generadas correctamente",
        })
        setGenerateDialogOpen(false)
        await loadData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al generar las nóminas",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Error interno del servidor",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegeneratePayroll = async () => {
    if (!generatePeriod) {
      toast({
        title: "Error",
        description: "Por favor selecciona un período",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/payroll/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ period: generatePeriod, regenerate: true }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Nóminas regeneradas correctamente",
        })
        setRegenerateDialogOpen(false)
        await loadData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al regenerar las nóminas",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Error interno del servidor",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateLiquidations = async () => {
    setIsGeneratingLiquidations(true)
    try {
      // Aquí iría la llamada a la API para generar liquidaciones
      // Por ahora simularemos la funcionalidad
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast({
        title: "Éxito",
        description: "Liquidaciones generadas correctamente",
      })
      setLiquidationDialogOpen(false)
      await loadData()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Error al generar las liquidaciones",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingLiquidations(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!selectedPayroll || !paymentMethod || !paymentType) {
      toast({
        title: "Error",
        description: "Complete todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsConfirmingPayment(true)
    try {
      const response = await fetch("/api/payroll/confirm-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payrollId: selectedPayroll.id,
          paymentMethod,
          paymentType,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Pago confirmado correctamente",
        })
        setPaymentDialogOpen(false)
        setSelectedPayroll(null)
        setPaymentMethod("")
        setPaymentType("")
        await loadData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al confirmar el pago",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Error interno del servidor",
        variant: "destructive",
      })
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const getMonthName = (month: number) => {
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    return months[month - 1] || "Mes desconocido"
  }

  // Filtrar datos
  const filteredPayrolls = payrolls.filter(payroll => {
    // Verificar que el payroll tenga las propiedades necesarias
    if (!payroll) return false

    const payrollMonth = payroll.month || (payroll.period ? parseInt(payroll.period.split('-')[1]) : null)
    const payrollYear = payroll.year || (payroll.period ? parseInt(payroll.period.split('-')[0]) : null)

    const monthMatch = monthFilter === "all" || (payrollMonth && payrollMonth.toString() === monthFilter)
    const yearMatch = yearFilter === "all" || (payrollYear && payrollYear.toString() === yearFilter)
    const statusMatch = statusFilter === "all" ||
      (statusFilter === "paid" && (payroll.isPaid || payroll.is_paid)) ||
      (statusFilter === "pending" && !(payroll.isPaid || payroll.is_paid)) ||
      (statusFilter === "partial" && ((payroll.isPaidHand || payroll.is_paid_hand) || (payroll.isPaidBank || payroll.is_paid_bank)) && !(payroll.isPaid || payroll.is_paid))

    return monthMatch && yearMatch && statusMatch
  })

  const filteredLiquidations = liquidations.filter(liquidation => {
    const statusMatch = statusFilter === "all" ||
      (statusFilter === "paid" && liquidation.isPaid) ||
      (statusFilter === "pending" && !liquidation.isPaid)

    return statusMatch
  })

  if (sessionStatus === "loading") {
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

  // Solo mostrar acceso denegado si estamos seguros de que no hay sesión
  if (sessionStatus === "invalid") {
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Nóminas</h2>
            <p className="text-muted-foreground">
              Administra los pagos de nóminas y liquidaciones del personal
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <Link href="/nomina/probar-calculos">
                <Calculator className="mr-2 h-4 w-4" />
                Probar Cálculos
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/diagnostico">
                <Settings className="mr-2 h-4 w-4" />
                Diagnóstico
              </Link>
            </Button>
          </div>
        </div>

        {/* Botones principales de acción */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Generar Nóminas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generar Nóminas</DialogTitle>
                <DialogDescription>
                  Genera las nóminas para un período específico
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="period">Período (YYYY-MM)</Label>
                  <Input
                    id="period"
                    type="month"
                    value={generatePeriod}
                    onChange={(e) => setGeneratePeriod(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleGeneratePayroll} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    "Generar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerar Nóminas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Regenerar Nóminas</DialogTitle>
                <DialogDescription>
                  Regenera las nóminas existentes para un período específico. 
                  Esto eliminará las nóminas actuales y creará nuevas.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="regenerate-period">Período (YYYY-MM)</Label>
                  <Input
                    id="regenerate-period"
                    type="month"
                    value={generatePeriod}
                    onChange={(e) => setGeneratePeriod(e.target.value)}
                  />
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Advertencia</AlertTitle>
                  <AlertDescription>
                    Esta acción eliminará las nóminas existentes del período seleccionado.
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRegenerateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleRegeneratePayroll} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerando...
                    </>
                  ) : (
                    "Regenerar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={liquidationDialogOpen} onOpenChange={setLiquidationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-green-50 hover:bg-green-100">
                <FileText className="mr-2 h-4 w-4" />
                Generar Liquidaciones
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generar Liquidaciones</DialogTitle>
                <DialogDescription>
                  Genera liquidaciones automáticamente para empleados dados de baja
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLiquidationDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleGenerateLiquidations} disabled={isGeneratingLiquidations}>
                  {isGeneratingLiquidations ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    "Generar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={regenerateLiquidationDialogOpen} onOpenChange={setRegenerateLiquidationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-orange-50 hover:bg-orange-100">
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerar Liquidaciones
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Regenerar Liquidaciones</DialogTitle>
                <DialogDescription>
                  Regenera todas las liquidaciones existentes con datos actualizados
                </DialogDescription>
              </DialogHeader>
              <Alert className="my-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Advertencia</AlertTitle>
                <AlertDescription>
                  Esta acción actualizará todas las liquidaciones existentes.
                </AlertDescription>
              </Alert>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRegenerateLiquidationDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleGenerateLiquidations} disabled={isGeneratingLiquidations}>
                  {isGeneratingLiquidations ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerando...
                    </>
                  ) : (
                    "Regenerar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Mes</Label>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {getMonthName(i + 1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Año</Label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="partial">Parciales</SelectItem>
                    <SelectItem value="paid">Pagados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={loadData} 
                  disabled={isLoading || !monthFilter || !yearFilter}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {!monthFilter || !yearFilter ? "Seleccionar Período" : "Buscar Nóminas"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nóminas Pendientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredPayrolls.filter(p => !p.isPaid).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Liquidaciones Pendientes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredLiquidations.filter(l => !l.isPaid).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  filteredPayrolls.filter(p => !p.isPaid).reduce((sum, p) => sum + p.totalSalary, 0) +
                  filteredLiquidations.filter(l => !l.isPaid).reduce((sum, l) => sum + l.amount, 0)
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes Actual</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getMonthName(new Date().getMonth() + 1)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pestañas principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="pendientes">Pagos Pendientes</TabsTrigger>
            <TabsTrigger value="liquidaciones">Liquidaciones</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="pendientes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Nóminas {statusFilter === "pending" ? "Pendientes" : "Filtradas"}</CardTitle>
                <CardDescription>
                  {statusFilter === "pending" 
                    ? "Lista de nóminas que requieren confirmación de pago"
                    : "Lista de nóminas según los filtros aplicados"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Buscando nóminas para {getMonthName(parseInt(monthFilter))} {yearFilter}...</p>
                  </div>
                ) : !hasSearched ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Selecciona un mes y año específico para consultar las nóminas</p>
                    <p className="text-sm text-muted-foreground mt-2">Los filtros de mes y año son obligatorios para realizar la búsqueda</p>
                  </div>
                ) : filteredPayrolls.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No se encontraron nóminas para {getMonthName(parseInt(monthFilter))} {yearFilter}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Puedes generar las nóminas para este período usando el botón "Generar Nóminas"
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>En Mano</TableHead>
                        <TableHead>En Banco</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayrolls.map((payroll) => (
                        <TableRow key={payroll.id}>
                          <TableCell className="font-medium">
                            {payroll.employeeName}
                          </TableCell>
                          <TableCell>
                            {getMonthName(payroll.month)} {payroll.year}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(payroll.handSalary)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(payroll.bankSalary)}
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatCurrency(payroll.totalSalary)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Badge variant={payroll.isPaidHand ? "default" : "secondary"}>
                                {payroll.isPaidHand ? "Mano ✓" : "Mano ✗"}
                              </Badge>
                              <Badge variant={payroll.isPaidBank ? "default" : "secondary"}>
                                {payroll.isPaidBank ? "Banco ✓" : "Banco ✗"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedPayroll(payroll)
                                setPaymentDialogOpen(true)
                              }}
                              disabled={payroll.isPaid}
                            >
                              {payroll.isPaid ? "Pagado" : "Confirmar Pago"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="liquidaciones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Liquidaciones {statusFilter === "pending" ? "Pendientes" : "Filtradas"}</CardTitle>
                <CardDescription>
                  Liquidaciones especiales y ajustes salariales según filtros
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Cargando liquidaciones...</p>
                  </div>
                ) : !hasSearched ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Selecciona un período específico para consultar las liquidaciones</p>
                  </div>
                ) : filteredLiquidations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay liquidaciones para el período seleccionado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLiquidations.map((liquidation) => (
                        <TableRow key={liquidation.id}>
                          <TableCell className="font-medium">
                            {liquidation.employeeName}
                          </TableCell>
                          <TableCell>{liquidation.reason}</TableCell>
                          <TableCell className="font-bold">
                            {formatCurrency(liquidation.amount)}
                          </TableCell>
                          <TableCell>
                            {new Date(liquidation.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={liquidation.isPaid ? "default" : "secondary"}>
                              {liquidation.isPaid ? "Pagado" : "Pendiente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" disabled={liquidation.isPaid}>
                              {liquidation.isPaid ? "Pagado" : "Confirmar Pago"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
                <CardDescription>
                  Registro completo de pagos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Funcionalidad de historial en desarrollo
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Diálogo de confirmación de pago */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Pago de Nómina</DialogTitle>
              <DialogDescription>
                {selectedPayroll && `Confirmando pago para ${selectedPayroll.employeeName} - ${getMonthName(selectedPayroll.month)} ${selectedPayroll.year}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Pago</Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mano">Solo En Mano</SelectItem>
                    <SelectItem value="banco">Solo Banco</SelectItem>
                    <SelectItem value="completo">Pago Completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmPayment} disabled={isConfirmingPayment}>
                {isConfirmingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  "Confirmar Pago"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}