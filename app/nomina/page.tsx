
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Calendar, DollarSign, Users, FileText, Calculator, Settings } from "lucide-react"
import DashboardLayout from "@/app/dashboard-layout"
import { useAuth } from "@/hooks/useAuth"

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
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [liquidations, setLiquidations] = useState<Liquidation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pendientes")

  useEffect(() => {
    if (sessionStatus === "invalid") {
      router.push("/login")
      return
    }

    if (sessionStatus === "valid") {
      loadData()
    }
  }, [sessionStatus, router])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Cargar nóminas pendientes
      const payrollResponse = await fetch("/api/payroll")
      if (payrollResponse.ok) {
        const payrollData = await payrollResponse.json()
        setPayrolls(payrollData.filter((p: Payroll) => !p.isPaid))
      }

      // Cargar liquidaciones pendientes
      const liquidationResponse = await fetch("/api/payroll/liquidation")
      if (liquidationResponse.ok) {
        const liquidationData = await liquidationResponse.json()
        setLiquidations(liquidationData.filter((l: Liquidation) => !l.isPaid))
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
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

  if (sessionStatus === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4">Cargando...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (sessionStatus === "invalid") {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Acceso Denegado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">No tienes permisos para acceder a esta sección.</p>
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

        {/* Resumen de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nóminas Pendientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payrolls.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Liquidaciones Pendientes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{liquidations.length}</div>
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
                  payrolls.reduce((sum, p) => sum + p.totalSalary, 0) +
                  liquidations.reduce((sum, l) => sum + l.amount, 0)
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
                <CardTitle>Nóminas Pendientes de Pago</CardTitle>
                <CardDescription>
                  Lista de nóminas que requieren confirmación de pago
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Cargando nóminas...</p>
                  </div>
                ) : payrolls.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay nóminas pendientes</p>
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
                      {payrolls.map((payroll) => (
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
                            <Button size="sm" variant="outline">
                              Gestionar
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
                <CardTitle>Liquidaciones Pendientes</CardTitle>
                <CardDescription>
                  Liquidaciones especiales y ajustes salariales
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Cargando liquidaciones...</p>
                  </div>
                ) : liquidations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay liquidaciones pendientes</p>
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
                      {liquidations.map((liquidation) => (
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
                            <Button size="sm" variant="outline">
                              Gestionar
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
      </div>
    </DashboardLayout>
  )
}
