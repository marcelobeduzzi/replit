"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, BarChart3, PieChart, Calendar, Eye, History } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Lista de locales para filtrar
const locales = [
  { id: "all", name: "Todos los locales" },
  { id: "cabildo", name: "BR Cabildo" },
  { id: "carranza", name: "BR Carranza" },
  { id: "pacifico", name: "BR Pacífico" },
  { id: "lavalle", name: "BR Lavalle" },
  { id: "rivadavia", name: "BR Rivadavia" },
  { id: "aguero", name: "BR Aguero" },
  { id: "dorrego", name: "BR Dorrego" },
  { id: "dean_dennys", name: "Dean & Dennys" },
]

export default function DashboardCajaPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [periodo, setPeriodo] = useState("mes")
  const [localId, setLocalId] = useState("all")
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [operacionesRecientes, setOperacionesRecientes] = useState<any[]>([])

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Determinar fechas para el período seleccionado
        const today = new Date()
        let startDate = new Date()
        
        switch (periodo) {
          case "dia":
            startDate = new Date(today.setHours(0, 0, 0, 0))
            break
          case "semana":
            startDate = new Date(today.setDate(today.getDate() - 7))
            break
          case "mes":
            startDate = new Date(today.setMonth(today.getMonth() - 1))
            break
          case "trimestre":
            startDate = new Date(today.setMonth(today.getMonth() - 3))
            break
          case "anio":
            startDate = new Date(today.setFullYear(today.getFullYear() - 1))
            break
        }
        
        const formattedStartDate = format(startDate, "yyyy-MM-dd")
        const formattedEndDate = format(new Date(), "yyyy-MM-dd")
        
        // Consultas para obtener datos de ventas
        let ventasQuery = supabase
          .from('cash_register_closings')
          .select('*')
          .gte('date', formattedStartDate)
          .lte('date', formattedEndDate)
        
        if (localId !== "all") {
          ventasQuery = ventasQuery.eq('local_id', localId)
        }
        
        // Consulta para obtener alertas
        let alertasQuery = supabase
          .from('cash_register_alerts')
          .select('*')
          .eq('status', 'pending')
        
        if (localId !== "all") {
          alertasQuery = alertasQuery.eq('local_id', localId)
        }
        
        // Ejecutar consultas en paralelo
        const [ventasResult, alertasResult, aperturasResult, cierresResult] = await Promise.all([
          ventasQuery,
          alertasQuery,
          supabase
            .from('cash_register_openings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('cash_register_closings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)
        ])
        
        if (ventasResult.error) throw ventasResult.error
        if (alertasResult.error) throw alertasResult.error
        if (aperturasResult.error) throw aperturasResult.error
        if (cierresResult.error) throw cierresResult.error
        
        const ventas = ventasResult.data || []
        const alertas = alertasResult.data || []
        
        // Calcular totales
        const ventasTotales = ventas.reduce((sum, item) => sum + (item.total_sales || 0), 0)
        const ventasEfectivo = ventas.reduce((sum, item) => sum + (item.cash_sales || 0), 0)
        const ventasTarjeta = ventas.reduce((sum, item) => sum + ((item.credit_card_sales || 0) + (item.debit_card_sales || 0)), 0)
        const ventasDigitales = ventas.reduce((sum, item) => sum + ((item.transfer_sales || 0) + (item.mercado_pago_sales || 0)), 0)
        const diferencias = ventas.reduce((sum, item) => sum + Math.abs(item.difference || 0), 0)
        
        // Calcular porcentaje de diferencia
        const porcentajeDiferencia = ventasEfectivo > 0 ? (diferencias / ventasEfectivo) * 100 : 0
        
        // Contar alertas críticas
        const alertasCriticas = alertas.filter(a => a.alert_level === 'high').length
        
        // Procesar operaciones recientes
        const aperturas = (aperturasResult.data || []).map(item => ({
          ...item,
          tipo: 'apertura',
          monto: item.initial_amount,
          responsable: item.responsible,
          fecha_completa: item.date
        }))
        
        const cierres = (cierresResult.data || []).map(item => ({
          ...item,
          tipo: 'cierre',
          monto: item.total_sales,
          responsable: item.responsible,
          fecha_completa: item.date
        }))
        
        // Combinar y ordenar por fecha
        const todasOperaciones = [...aperturas, ...cierres]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5) // Mostrar solo las 5 más recientes
        
        setOperacionesRecientes(todasOperaciones)
        
        // Preparar datos para gráficos
        // Ventas por local
        const ventasPorLocal = locales
          .filter(local => local.id !== "all")
          .map(local => {
            const ventasLocal = ventas.filter(v => v.local_id === local.id)
            const totalLocal = ventasLocal.reduce((sum, item) => sum + (item.total_sales || 0), 0)
            return {
              local: local.name,
              ventas: totalLocal
            }
          })
          .sort((a, b) => b.ventas - a.ventas)
        
        // Ventas por método de pago
        const totalMetodos = ventasTotales > 0 ? ventasTotales : 1 // Evitar división por cero
        const ventasPorMetodo = [
          { metodo: "Efectivo", porcentaje: (ventasEfectivo / totalMetodos) * 100 },
          { metodo: "Tarjeta Crédito", porcentaje: (ventas.reduce((sum, item) => sum + (item.credit_card_sales || 0), 0) / totalMetodos) * 100 },
          { metodo: "Tarjeta Débito", porcentaje: (ventas.reduce((sum, item) => sum + (item.debit_card_sales || 0), 0) / totalMetodos) * 100 },
          { metodo: "MercadoPago", porcentaje: (ventas.reduce((sum, item) => sum + (item.mercado_pago_sales || 0), 0) / totalMetodos) * 100 },
          { metodo: "Transferencia", porcentaje: (ventas.reduce((sum, item) => sum + (item.transfer_sales || 0), 0) / totalMetodos) * 100 },
          { metodo: "Otros", porcentaje: (ventas.reduce((sum, item) => sum + (item.other_sales || 0), 0) / totalMetodos) * 100 }
        ]
        
        // Actualizar el estado con datos reales
        setDashboardData({
          ventasTotales: {
            valor: ventasTotales,
            cambio: 0, // Esto requeriría comparación con período anterior
            periodo: periodo
          },
          ventasEfectivo: {
            valor: ventasEfectivo,
            cambio: 0,
            periodo: periodo
          },
          ventasTarjeta: {
            valor: ventasTarjeta,
            cambio: 0,
            periodo: periodo
          },
          ventasDigitales: {
            valor: ventasDigitales,
            cambio: 0,
            periodo: periodo
          },
          diferencias: {
            valor: diferencias,
            cambio: 0,
            periodo: periodo,
            porcentaje: porcentajeDiferencia
          },
          alertas: {
            total: alertas.length,
            criticas: alertasCriticas,
            pendientes: alertas.length,
            cambio: 0,
            periodo: periodo
          },
          graficoVentasPorLocal: {
            labels: ventasPorLocal.map(item => item.local),
            datasets: [
              {
                label: "Ventas",
                data: ventasPorLocal.map(item => item.ventas),
              },
            ],
          },
          graficoVentasPorMetodo: {
            labels: ventasPorMetodo.map(item => item.metodo),
            datasets: [
              {
                label: "Porcentaje",
                data: ventasPorMetodo.map(item => item.porcentaje),
              },
            ],
          }
        })
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error)
        // Usar datos de ejemplo en caso de error
        setDashboardData({
          ventasTotales: {
            valor: 0,
            cambio: 0,
            periodo: periodo
          },
          ventasEfectivo: {
            valor: 0,
            cambio: 0,
            periodo: periodo
          },
          ventasTarjeta: {
            valor: 0,
            cambio: 0,
            periodo: periodo
          },
          ventasDigitales: {
            valor: 0,
            cambio: 0,
            periodo: periodo
          },
          diferencias: {
            valor: 0,
            cambio: 0,
            periodo: periodo,
            porcentaje: 0
          },
          alertas: {
            total: 0,
            criticas: 0,
            pendientes: 0,
            cambio: 0,
            periodo: periodo
          },
          graficoVentasPorLocal: {
            labels: [],
            datasets: [{ label: "Ventas", data: [] }]
          },
          graficoVentasPorMetodo: {
            labels: [],
            datasets: [{ label: "Porcentaje", data: [] }]
          }
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [periodo, localId, supabase])

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Formatear fecha
  const formatFecha = (fechaStr: string) => {
    try {
      const fecha = parseISO(fechaStr)
      return format(fecha, "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return fechaStr
    }
  }

  // Renderizar badge de tipo de operación
  const renderTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "apertura":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Apertura
          </Badge>
        )
      case "cierre":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Cierre
          </Badge>
        )
      default:
        return <Badge variant="outline">{tipo}</Badge>
    }
  }

  if (!dashboardData) {
    return (
      <DashboardLayout isLoading={true}>
        <div className="container mx-auto py-6">
          <p>Cargando datos del dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout isLoading={isLoading}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Dashboard de Caja</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/caja")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Gestión de Caja
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dia">Hoy</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
              <SelectItem value="trimestre">Este trimestre</SelectItem>
              <SelectItem value="anio">Este año</SelectItem>
            </SelectContent>
          </Select>

          <Select value={localId} onValueChange={setLocalId}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Seleccionar local" />
            </SelectTrigger>
            <SelectContent>
              {locales.map((local) => (
                <SelectItem key={local.id} value={local.id}>
                  {local.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Ventas Totales */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.ventasTotales.valor)}</div>
                <div
                  className={`flex items-center ${dashboardData.ventasTotales.cambio >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {dashboardData.ventasTotales.cambio >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  <span>{Math.abs(dashboardData.ventasTotales.cambio)}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Comparado con el {dashboardData.ventasTotales.periodo} anterior
              </p>
            </CardContent>
          </Card>

          {/* Ventas en Efectivo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ventas en Efectivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.ventasEfectivo.valor)}</div>
                <div
                  className={`flex items-center ${dashboardData.ventasEfectivo.cambio >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {dashboardData.ventasEfectivo.cambio >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  <span>{Math.abs(dashboardData.ventasEfectivo.cambio)}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((dashboardData.ventasEfectivo.valor / dashboardData.ventasTotales.valor) * 100) || 0}% del total
                de ventas
              </p>
            </CardContent>
          </Card>

          {/* Diferencias de Caja */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Diferencias de Caja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.diferencias.valor)}</div>
                <div
                  className={`flex items-center ${dashboardData.diferencias.cambio >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {dashboardData.diferencias.cambio >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  <span>{Math.abs(dashboardData.diferencias.cambio)}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardData.diferencias.porcentaje.toFixed(2)}% de las ventas en efectivo
              </p>
            </CardContent>
          </Card>

          {/* Alertas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Alertas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{dashboardData.alertas.total}</div>
                <div
                  className={`flex items-center ${dashboardData.alertas.cambio <= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {dashboardData.alertas.cambio <= 0 ? (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  )}
                  <span>{Math.abs(dashboardData.alertas.cambio)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{dashboardData.alertas.pendientes} pendientes</span>
                {dashboardData.alertas.criticas > 0 && (
                  <span className="flex items-center text-xs text-red-600">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {dashboardData.alertas.criticas} críticas
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operaciones Recientes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Operaciones Recientes</CardTitle>
            <CardDescription>Últimas aperturas y cierres de caja</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operacionesRecientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No hay operaciones recientes
                      </TableCell>
                    </TableRow>
                  ) : (
                    operacionesRecientes.map((operacion) => (
                      <TableRow key={`${operacion.tipo}-${operacion.id}`}>
                        <TableCell>{formatFecha(operacion.fecha_completa || operacion.created_at)}</TableCell>
                        <TableCell>
                          {operacion.local_name}
                        </TableCell>
                        <TableCell className="capitalize">{operacion.shift}</TableCell>
                        <TableCell>{renderTipoBadge(operacion.tipo)}</TableCell>
                        <TableCell>{operacion.responsible}</TableCell>
                        <TableCell className="text-right">
                          ${operacion.monto?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Ver detalles"
                            onClick={() => router.push(`/caja/${operacion.tipo === 'apertura' ? 'apertura' : 'cierre'}/${operacion.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={() => router.push('/caja/historial')}>
              <History className="mr-2 h-4 w-4" />
              Ver historial completo
            </Button>
          </CardFooter>
        </Card>

        {/* Gráficos */}
        <div className="space-y-6">
          <Tabs defaultValue="ventas" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ventas">
                <BarChart3 className="mr-2 h-4 w-4" />
                Ventas por Local
              </TabsTrigger>
              <TabsTrigger value="metodos">
                <PieChart className="mr-2 h-4 w-4" />
                Métodos de Pago
              </TabsTrigger>
              <TabsTrigger value="turnos">
                <Calendar className="mr-2 h-4 w-4" />
                Ventas por Turno
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ventas">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Local</CardTitle>
                  <CardDescription>Distribución de ventas por local durante el período seleccionado</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {/* Aquí iría el componente de gráfico de barras */}
                  <div className="h-full flex items-center justify-center bg-muted/20 rounded-md">
                    <p className="text-muted-foreground">Gráfico de barras: Ventas por Local</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="metodos">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Método de Pago</CardTitle>
                  <CardDescription>Porcentaje de ventas por cada método de pago</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {/* Aquí iría el componente de gráfico circular */}
                  <div className="h-full flex items-center justify-center bg-muted/20 rounded-md">
                    <p className="text-muted-foreground">Gráfico circular: Métodos de Pago</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="turnos">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Turno</CardTitle>
                  <CardDescription>Comparativa de ventas entre turnos de mañana y tarde</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {/* Aquí iría el componente de gráfico de líneas */}
                  <div className="h-full flex items-center justify-center bg-muted/20 rounded-md">
                    <p className="text-muted-foreground">Gráfico de líneas: Ventas por Turno</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}

