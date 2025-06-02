"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, BarChart2, PieChart, TrendingUp, Calendar } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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

// Períodos de tiempo
const timePeriods = [
  { id: "7days", name: "Últimos 7 días" },
  { id: "30days", name: "Últimos 30 días" },
  { id: "month", name: "Este mes" },
  { id: "prevMonth", name: "Mes anterior" },
]

export default function ReportesStockPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("diferencias")
  const [selectedLocal, setSelectedLocal] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("30days")
  const [stockAlerts, setStockAlerts] = useState<any[]>([])
  const [stockCashAlerts, setStockCashAlerts] = useState<any[]>([])
  const [stockRecords, setStockRecords] = useState<any[]>([])

  // Estadísticas calculadas
  const [stats, setStats] = useState({
    totalStockAlerts: 0,
    activeStockAlerts: 0,
    totalStockCashAlerts: 0,
    activeStockCashAlerts: 0,
    totalRecords: 0,
    totalDifference: 0,
    averageDifference: 0,
    productStats: {} as Record<string, { total: number; positive: number; negative: number }>,
    localStats: {} as Record<string, { alerts: number; difference: number }>,
  })

  // Calcular fechas según el período seleccionado
  const getDateRange = () => {
    const today = new Date()
    let startDate, endDate

    switch (selectedPeriod) {
      case "7days":
        startDate = subDays(today, 7)
        endDate = today
        break
      case "30days":
        startDate = subDays(today, 30)
        endDate = today
        break
      case "month":
        startDate = startOfMonth(today)
        endDate = endOfMonth(today)
        break
      case "prevMonth":
        const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        startDate = startOfMonth(prevMonth)
        endDate = endOfMonth(prevMonth)
        break
      default:
        startDate = subDays(today, 30)
        endDate = today
    }

    return {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    }
  }

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        const { startDate, endDate } = getDateRange()

        // Consultas en paralelo
        const [stockAlertsResult, stockCashAlertsResult, stockRecordsResult] = await Promise.all([
          // Alertas de stock
          supabase
            .from("stock_alerts")
            .select("*")
            .gte("date", startDate)
            .lte("date", endDate)
            .order("date", { ascending: false }),

          // Alertas de cruce stock-caja
          supabase
            .from("stock_cash_alerts")
            .select("*")
            .gte("date", startDate)
            .lte("date", endDate)
            .order("date", { ascending: false }),

          // Registros de stock
          supabase
            .from("stock_records")
            .select("*")
            .gte("date", startDate)
            .lte("date", endDate)
            .order("date", { ascending: false }),
        ])

        if (stockAlertsResult.error) throw stockAlertsResult.error
        if (stockCashAlertsResult.error) throw stockCashAlertsResult.error
        if (stockRecordsResult.error) throw stockRecordsResult.error

        // Filtrar por local si es necesario
        let filteredStockAlerts = stockAlertsResult.data || []
        let filteredStockCashAlerts = stockCashAlertsResult.data || []
        let filteredStockRecords = stockRecordsResult.data || []

        if (selectedLocal !== "all") {
          filteredStockAlerts = filteredStockAlerts.filter((alert) => alert.local_id === selectedLocal)
          filteredStockCashAlerts = filteredStockCashAlerts.filter((alert) => alert.local_id === selectedLocal)
          filteredStockRecords = filteredStockRecords.filter((record) => record.local_id === selectedLocal)
        }

        // Actualizar estados
        setStockAlerts(filteredStockAlerts)
        setStockCashAlerts(filteredStockCashAlerts)
        setStockRecords(filteredStockRecords)

        // Calcular estadísticas
        calculateStats(filteredStockAlerts, filteredStockCashAlerts, filteredStockRecords)
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase, selectedLocal, selectedPeriod])

  // Calcular estadísticas
  const calculateStats = (stockAlerts: any[], stockCashAlerts: any[], stockRecords: any[]) => {
    // Estadísticas básicas
    const activeStockAlerts = stockAlerts.filter((a) => a.status === "activa").length
    const activeStockCashAlerts = stockCashAlerts.filter((a) => a.status === "activa").length

    // Estadísticas de diferencia en alertas stock-caja
    let totalDifference = 0
    stockCashAlerts.forEach((alert) => {
      totalDifference += Math.abs(alert.difference)
    })
    const averageDifference = stockCashAlerts.length > 0 ? totalDifference / stockCashAlerts.length : 0

    // Estadísticas por producto
    const productStats: Record<string, { total: number; positive: number; negative: number }> = {}
    stockAlerts.forEach((alert) => {
      if (!productStats[alert.product]) {
        productStats[alert.product] = { total: 0, positive: 0, negative: 0 }
      }

      productStats[alert.product].total++

      if (alert.difference > 0) {
        productStats[alert.product].positive++
      } else if (alert.difference < 0) {
        productStats[alert.product].negative++
      }
    })

    // Estadísticas por local
    const localStats: Record<string, { alerts: number; difference: number }> = {}

    // Inicializar todos los locales
    locales.forEach((local) => {
      if (local.id !== "all") {
        localStats[local.id] = { alerts: 0, difference: 0 }
      }
    })

    // Contar alertas por local
    stockAlerts.forEach((alert) => {
      if (localStats[alert.local_id]) {
        localStats[alert.local_id].alerts++
      }
    })

    // Sumar diferencias por local
    stockCashAlerts.forEach((alert) => {
      if (localStats[alert.local_id]) {
        localStats[alert.local_id].difference += Math.abs(alert.difference)
      }
    })

    // Actualizar estadísticas
    setStats({
      totalStockAlerts: stockAlerts.length,
      activeStockAlerts,
      totalStockCashAlerts: stockCashAlerts.length,
      activeStockCashAlerts,
      totalRecords: stockRecords.length,
      totalDifference,
      averageDifference,
      productStats,
      localStats,
    })
  }

  // Formatear fecha
  const formatFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr)
      return format(fecha, "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return fechaStr
    }
  }

  // Formatear monto
  const formatMonto = (monto: number) => {
    return monto.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  return (
    <DashboardLayout isLoading={isLoading}>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/stock")} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Reportes de Stock</h1>
        </div>

        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Select value={selectedLocal} onValueChange={setSelectedLocal}>
                    <SelectTrigger>
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
                <div className="flex-1">
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      {timePeriods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Registros de Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRecords}</div>
                <p className="text-xs text-muted-foreground mt-1">Total de registros en el período</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Alertas de Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-2xl font-bold">{stats.totalStockAlerts}</div>
                  <span className="text-sm ml-2 text-muted-foreground">({stats.activeStockAlerts} activas)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Diferencias de inventario</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Alertas Stock-Caja</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-2xl font-bold">{stats.totalStockCashAlerts}</div>
                  <span className="text-sm ml-2 text-muted-foreground">({stats.activeStockCashAlerts} activas)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Diferencias entre ventas y caja</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Diferencia Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMonto(stats.averageDifference)}</div>
                <p className="text-xs text-muted-foreground mt-1">Promedio de diferencias stock-caja</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diferencias">
                <BarChart2 className="mr-2 h-4 w-4" />
                Diferencias
              </TabsTrigger>
              <TabsTrigger value="productos">
                <PieChart className="mr-2 h-4 w-4" />
                Por Producto
              </TabsTrigger>
              <TabsTrigger value="locales">
                <TrendingUp className="mr-2 h-4 w-4" />
                Por Local
              </TabsTrigger>
            </TabsList>

            {/* Tab de Diferencias */}
            <TabsContent value="diferencias" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Diferencias de Stock</CardTitle>
                  <CardDescription>Análisis de diferencias entre stock real y esperado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Gráfico de diferencias (simulado con barras) */}
                    <div className="h-64 border rounded-md p-4 flex items-end justify-between">
                      {stockAlerts.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No hay datos suficientes para mostrar el gráfico
                        </div>
                      ) : (
                        <>
                          {/* Simulación de gráfico de barras */}
                          {Object.entries(stats.productStats).map(([product, data], index) => (
                            <div key={product} className="flex flex-col items-center">
                              <div className="flex flex-col items-center gap-1">
                                <div
                                  className="w-12 bg-red-500 rounded-t-sm"
                                  style={{ height: `${Math.min(data.negative * 10, 150)}px` }}
                                  title={`Faltantes: ${data.negative}`}
                                ></div>
                                <div
                                  className="w-12 bg-green-500 rounded-t-sm"
                                  style={{ height: `${Math.min(data.positive * 10, 150)}px` }}
                                  title={`Sobrantes: ${data.positive}`}
                                ></div>
                              </div>
                              <span className="text-xs mt-2 text-center">{product}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-md p-4">
                        <h3 className="text-base font-medium mb-3">Resumen de Diferencias</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total de alertas:</span>
                            <span className="font-medium">{stats.totalStockAlerts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Alertas activas:</span>
                            <span className="font-medium">{stats.activeStockAlerts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Alertas resueltas:</span>
                            <span className="font-medium">{stats.totalStockAlerts - stats.activeStockAlerts}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-md p-4">
                        <h3 className="text-base font-medium mb-3">Diferencias Stock-Caja</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total de alertas:</span>
                            <span className="font-medium">{stats.totalStockCashAlerts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Diferencia total:</span>
                            <span className="font-medium">{formatMonto(stats.totalDifference)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Diferencia promedio:</span>
                            <span className="font-medium">{formatMonto(stats.averageDifference)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab de Productos */}
            <TabsContent value="productos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis por Producto</CardTitle>
                  <CardDescription>Estadísticas de diferencias por tipo de producto</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.productStats).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay datos suficientes para mostrar estadísticas por producto
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Tabla de productos */}
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="py-3 px-4 text-left font-medium">Producto</th>
                              <th className="py-3 px-4 text-center font-medium">Total Alertas</th>
                              <th className="py-3 px-4 text-center font-medium">Faltantes</th>
                              <th className="py-3 px-4 text-center font-medium">Sobrantes</th>
                              <th className="py-3 px-4 text-center font-medium">% Faltantes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(stats.productStats).map(([product, data]) => (
                              <tr key={product} className="border-b">
                                <td className="py-3 px-4 font-medium">{product}</td>
                                <td className="py-3 px-4 text-center">{data.total}</td>
                                <td className="py-3 px-4 text-center text-red-600">{data.negative}</td>
                                <td className="py-3 px-4 text-center text-green-600">{data.positive}</td>
                                <td className="py-3 px-4 text-center">
                                  {data.total > 0 ? `${((data.negative / data.total) * 100).toFixed(1)}%` : "0%"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Gráfico circular (simulado) */}
                      <div className="h-64 border rounded-md p-4 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Calendar className="h-16 w-16 mx-auto mb-2 text-muted-foreground/50" />
                          <p>Gráfico circular de distribución por producto</p>
                          <p className="text-sm">(En un entorno de producción, aquí se mostraría un gráfico real)</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab de Locales */}
            <TabsContent value="locales" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis por Local</CardTitle>
                  <CardDescription>Estadísticas de diferencias por local</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.localStats).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay datos suficientes para mostrar estadísticas por local
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Tabla de locales */}
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="py-3 px-4 text-left font-medium">Local</th>
                              <th className="py-3 px-4 text-center font-medium">Alertas de Stock</th>
                              <th className="py-3 px-4 text-center font-medium">Diferencia Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(stats.localStats).map(([localId, data]) => {
                              const localName = locales.find((l) => l.id === localId)?.name || localId
                              return (
                                <tr key={localId} className="border-b">
                                  <td className="py-3 px-4 font-medium">{localName}</td>
                                  <td className="py-3 px-4 text-center">{data.alerts}</td>
                                  <td className="py-3 px-4 text-center">{formatMonto(data.difference)}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Gráfico de barras (simulado) */}
                      <div className="h-64 border rounded-md p-4 flex items-end justify-between">
                        {Object.entries(stats.localStats).length === 0 ? (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No hay datos suficientes para mostrar el gráfico
                          </div>
                        ) : (
                          <>
                            {/* Simulación de gráfico de barras */}
                            {Object.entries(stats.localStats).map(([localId, data], index) => {
                              const localName = locales.find((l) => l.id === localId)?.name?.split(" ")[1] || localId
                              const maxAlerts = Math.max(...Object.values(stats.localStats).map((d) => d.alerts))
                              const height = maxAlerts > 0 ? (data.alerts / maxAlerts) * 150 : 0

                              return (
                                <div key={localId} className="flex flex-col items-center">
                                  <div
                                    className="w-12 bg-blue-500 rounded-t-sm"
                                    style={{ height: `${Math.max(height, 10)}px` }}
                                    title={`Alertas: ${data.alerts}`}
                                  ></div>
                                  <span className="text-xs mt-2 text-center">{localName}</span>
                                </div>
                              )
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}

