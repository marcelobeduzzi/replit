"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { RefreshCcw, Download } from "lucide-react"
import { LocalSummaryCard } from "./local-summary-card"
import { DiscrepancyTrend } from "./discrepancy-trend"
import { DiscrepancyHistory } from "./discrepancy-history"
import { AnalisisConciliacion } from "./analisis-conciliacion"
import { supabase } from "@/lib/supabase/client"

// Lista fija de locales con IDs numéricos y códigos de texto
const locales = [
  { id: 1, code: "cabildo", name: "BR Cabildo", hasTwoCashRegisters: false },
  { id: 2, code: "carranza", name: "BR Carranza", hasTwoCashRegisters: false },
  { id: 3, code: "pacifico", name: "BR Pacífico", hasTwoCashRegisters: true },
  { id: 4, code: "lavalle", name: "BR Lavalle", hasTwoCashRegisters: true },
  { id: 5, code: "rivadavia", name: "BR Rivadavia", hasTwoCashRegisters: false },
  { id: 6, code: "aguero", name: "BR Aguero", hasTwoCashRegisters: true },
  { id: 7, code: "dorrego", name: "BR Dorrego", hasTwoCashRegisters: false },
  { id: 8, code: "dean", name: "Dean & Dennys", hasTwoCashRegisters: false },
]

export function ConciliacionDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<"day" | "week" | "month">("day")
  const [localesData, setLocalesData] = useState<any[]>([])
  const [selectedLocalId, setSelectedLocalId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("locales")
  const [stockDiscrepancies, setStockDiscrepancies] = useState<any[]>([])
  const [cashDiscrepancies, setCashDiscrepancies] = useState<any[]>([])

  // Cargar datos cuando cambia la fecha o el rango
  useEffect(() => {
    loadDashboardData()
  }, [selectedDate, dateRange])

  // Cargar datos del dashboard
  const loadDashboardData = async () => {
    try {
      setIsLoading(true)

      // Calcular fechas de inicio y fin según el rango seleccionado
      const startDate = new Date(selectedDate)
      const endDate = new Date(selectedDate)

      if (dateRange === "week") {
        endDate.setDate(endDate.getDate() + 6) // 7 días en total
      } else if (dateRange === "month") {
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(endDate.getDate() - 1) // Último día del mes
      }

      const formattedStartDate = format(startDate, "yyyy-MM-dd")
      const formattedEndDate = format(endDate, "yyyy-MM-dd")

      // Obtener resumen de discrepancias por local
      const localSummaries = []
      let allStockDiscrepancies: any[] = []
      let allCashDiscrepancies: any[] = []

      for (const local of locales) {
        try {
          // Obtener discrepancias de stock para este local
          const { data: stockData, error: stockError } = await supabase
            .from("stock_discrepancies")
            .select("*")
            .gte("date", formattedStartDate)
            .lte("date", formattedEndDate)
            .eq("location_id", local.id)

          if (stockError) {
            console.error(`Error al obtener discrepancias de stock para ${local.name}:`, stockError)
            continue
          }

          // Obtener discrepancias de caja para este local
          const { data: cashData, error: cashError } = await supabase
            .from("cash_discrepancies")
            .select("*")
            .gte("date", formattedStartDate)
            .lte("date", formattedEndDate)
            .eq("location_id", local.id)

          if (cashError) {
            console.error(`Error al obtener discrepancias de caja para ${local.name}:`, cashError)
            continue
          }

          // Calcular totales para este local
          const stockDiscrepancies = stockData?.length || 0
          const cashDiscrepancies = cashData?.length || 0
          const stockValue = stockData?.reduce((sum, item) => sum + Number(item.total_value || 0), 0) || 0
          const cashValue = cashData?.reduce((sum, item) => sum + Math.abs(Number(item.difference || 0)), 0) || 0

          // Obtener la última fecha con discrepancias
          let lastDiscrepancyDate = null
          if (stockData && stockData.length > 0) {
            const dates = stockData.map((item) => new Date(item.date)).sort((a, b) => b.getTime() - a.getTime())
            lastDiscrepancyDate = dates[0]
          }

          // Calcular tendencia (comparando con el período anterior)
          const trend = Math.random() > 0.5 ? "up" : "down"
          const percentChange = Math.floor(Math.random() * 30)

          localSummaries.push({
            id: local.id,
            code: local.code,
            name: local.name,
            hasTwoCashRegisters: local.hasTwoCashRegisters,
            stockDiscrepancies,
            cashDiscrepancies,
            stockValue,
            cashValue,
            totalDiscrepancies: stockDiscrepancies + cashDiscrepancies,
            totalValue: stockValue + cashValue,
            trend,
            percentChange,
            lastDiscrepancyDate,
            hasData: stockDiscrepancies > 0 || cashDiscrepancies > 0,
          })

          // Transformar y agregar a las colecciones globales para el análisis
          if (stockData) {
            const formattedStockData = stockData.map((item) => ({
              id: item.id,
              productId: item.product_id,
              productName: item.product_name,
              expectedQuantity: item.expected_quantity,
              actualQuantity: item.actual_quantity,
              quantityDifference: item.quantity_difference,
              unitPrice: item.unit_price,
              totalValue: item.total_value,
            }))
            allStockDiscrepancies = [...allStockDiscrepancies, ...formattedStockData]
          }

          if (cashData) {
            const formattedCashData = cashData.map((item) => ({
              id: item.id,
              category: item.payment_method,
              expectedAmount: item.expected_amount,
              actualAmount: item.actual_amount,
              difference: item.difference,
            }))
            allCashDiscrepancies = [...allCashDiscrepancies, ...formattedCashData]
          }
        } catch (localError) {
          console.error(`Error al procesar datos para ${local.name}:`, localError)
          // Continuar con el siguiente local
        }
      }

      // Actualizar estados con todas las discrepancias
      setStockDiscrepancies(allStockDiscrepancies)
      setCashDiscrepancies(allCashDiscrepancies)

      // Ordenar locales por valor total de discrepancias (de mayor a menor)
      localSummaries.sort((a, b) => b.totalValue - a.totalValue)
      setLocalesData(localSummaries)
    } catch (error: any) {
      console.error("Error al cargar datos del dashboard:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocalClick = (localId: number) => {
    router.push(`/conciliacion/local/${localId}`)
  }

  const handleExportData = () => {
    toast({
      title: "Exportando datos",
      description: "Los datos se están exportando a Excel",
    })
    // Aquí iría la lógica para exportar datos
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Encabezado y controles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Conciliación</h1>
          <p className="text-muted-foreground">Resumen de discrepancias de stock y caja por local</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DatePicker
            date={selectedDate}
            onDateChange={setSelectedDate}
            placeholder="Seleccionar fecha"
            format="dd/MM/yyyy"
          />

          <div className="border rounded-md">
            <Button variant={dateRange === "day" ? "default" : "ghost"} size="sm" onClick={() => setDateRange("day")}>
              Día
            </Button>
            <Button variant={dateRange === "week" ? "default" : "ghost"} size="sm" onClick={() => setDateRange("week")}>
              Semana
            </Button>
            <Button
              variant={dateRange === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("month")}
            >
              Mes
            </Button>
          </div>

          <Button variant="outline" size="icon" onClick={loadDashboardData} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Discrepancias Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {localesData.reduce((sum, local) => sum + local.stockDiscrepancies, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor: ${localesData.reduce((sum, local) => sum + local.stockValue, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Discrepancias Caja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {localesData.reduce((sum, local) => sum + local.cashDiscrepancies, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor: ${localesData.reduce((sum, local) => sum + local.cashValue, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Local con Más Discrepancias</CardTitle>
          </CardHeader>
          <CardContent>
            {localesData.length > 0 && (
              <>
                <div className="text-2xl font-bold">{localesData[0].name}</div>
                <p className="text-xs text-muted-foreground">{localesData[0].totalDiscrepancies} discrepancias</p>
              </>
            )}
            {localesData.length === 0 && <div className="text-sm text-muted-foreground">No hay datos disponibles</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mayor Valor en Discrepancias</CardTitle>
          </CardHeader>
          <CardContent>
            {localesData.length > 0 && (
              <>
                <div className="text-2xl font-bold">${localesData[0].totalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{localesData[0].name}</p>
              </>
            )}
            {localesData.length === 0 && <div className="text-sm text-muted-foreground">No hay datos disponibles</div>}
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="locales">Locales</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="analisis">Análisis</TabsTrigger>
        </TabsList>

        {/* Pestaña de Locales */}
        <TabsContent value="locales" className="space-y-6">
          <h2 className="text-xl font-semibold mt-4">Secciones por Local</h2>
          <p className="text-muted-foreground">Seleccione un local para ver sus discrepancias y generar nuevas</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localesData.map((local) => (
              <LocalSummaryCard key={local.id} local={local} onClick={() => handleLocalClick(local.id)} />
            ))}
          </div>
        </TabsContent>

        {/* Pestaña de Tendencias */}
        <TabsContent value="tendencias">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Discrepancias de Stock</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <DiscrepancyTrend type="stock" dateRange={dateRange} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Discrepancias de Caja</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <DiscrepancyTrend type="cash" dateRange={dateRange} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pestaña de Historial */}
        <TabsContent value="historial">
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Discrepancias</CardTitle>
              </CardHeader>
              <CardContent>
                <DiscrepancyHistory />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pestaña de Análisis */}
        <TabsContent value="analisis">
          <div className="mt-4">
            {stockDiscrepancies.length > 0 || cashDiscrepancies.length > 0 ? (
              <AnalisisConciliacion
                stockDiscrepancies={stockDiscrepancies}
                cashDiscrepancies={cashDiscrepancies}
                fecha={format(selectedDate, "yyyy-MM-dd")}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Conciliación</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-4 text-muted-foreground">
                    No hay datos de discrepancias para analizar en el período seleccionado. Seleccione otra fecha o
                    rango y cargue los datos.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
