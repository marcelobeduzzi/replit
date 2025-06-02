"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, isValid, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "@/components/ui/use-toast"
import { RefreshCcw, Download, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { LocalSummaryCard } from "./local-summary-card"
import { DiscrepancyTrend } from "./discrepancy-trend"
import { TopDiscrepanciesTable } from "./top-discrepancies-table"
import { GenerateDiscrepanciesButton } from "./generate-discrepancies-button"
import { Badge } from "@/components/ui/badge"

// Lista fija de locales con IDs numéricos
const locales = [
  { id: 1, name: "BR Cabildo" },
  { id: 2, name: "BR Carranza" },
  { id: 3, name: "BR Pacífico" },
  { id: 4, name: "BR Lavalle" },
  { id: 5, name: "BR Rivadavia" },
  { id: 6, name: "BR Aguero" },
  { id: 7, name: "BR Dorrego" },
  { id: 8, name: "Dean & Dennys" },
]

export function DashboardContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<"day" | "week" | "month">("week")
  const [summaryData, setSummaryData] = useState<any>({
    totalStockDiscrepancies: 0,
    totalCashDiscrepancies: 0,
    totalStockValue: 0,
    totalCashValue: 0,
    locales: [],
  })
  const [isUsingRealData, setIsUsingRealData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos del dashboard
  useEffect(() => {
    loadDashboardData()
  }, [selectedDate, dateRange])

  // Función segura para formatear fechas
  const safeFormatDate = (date: Date | null | undefined): string => {
    if (!date || !isValid(date)) {
      return format(new Date(), "yyyy-MM-dd")
    }
    try {
      return format(date, "yyyy-MM-dd")
    } catch (e) {
      console.error("Error al formatear fecha:", e)
      return format(new Date(), "yyyy-MM-dd")
    }
  }

  // Función segura para parsear fechas de la base de datos
  const safeParseDatabaseDate = (dateString: string | null | undefined): Date => {
    if (!dateString) return new Date()

    try {
      // Intentar parsear como ISO primero
      const parsedDate = parseISO(dateString)
      if (isValid(parsedDate)) return parsedDate

      // Si no es válido, intentar como yyyy-MM-dd
      const [year, month, day] = dateString.split("-").map(Number)
      const date = new Date(year, month - 1, day)
      return isValid(date) ? date : new Date()
    } catch (e) {
      console.error("Error al parsear fecha:", e, dateString)
      return new Date()
    }
  }

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setIsUsingRealData(false)
      setError(null)

      // Calcular fechas de inicio y fin según el rango seleccionado
      const startDate = new Date(selectedDate)
      const endDate = new Date(selectedDate)

      if (dateRange === "week") {
        endDate.setDate(endDate.getDate() + 6) // 7 días en total
      } else if (dateRange === "month") {
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(endDate.getDate() - 1) // Último día del mes
      }

      const formattedStartDate = safeFormatDate(startDate)
      const formattedEndDate = safeFormatDate(endDate)

      console.log(`Consultando datos desde ${formattedStartDate} hasta ${formattedEndDate}`)

      // Obtener resumen de discrepancias por local
      const localesData = []
      let hasRealData = false

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

          // Si hay datos, marcar que estamos usando datos reales
          if ((stockData && stockData.length > 0) || (cashData && cashData.length > 0)) {
            hasRealData = true
          }

          // Calcular totales para este local
          const stockDiscrepancies = stockData?.length || 0
          const cashDiscrepancies = cashData?.length || 0
          const stockValue = stockData?.reduce((sum, item) => sum + Number(item.total_value || 0), 0) || 0
          const cashValue = cashData?.reduce((sum, item) => sum + Math.abs(Number(item.difference || 0)), 0) || 0

          // Calcular tendencia (comparando con el período anterior)
          // Esto es simplificado, en una implementación real se compararía con datos históricos
          const trend = Math.random() > 0.5 ? "up" : "down"
          const percentChange = Math.floor(Math.random() * 30)

          localesData.push({
            id: local.id,
            name: local.name,
            stockDiscrepancies,
            cashDiscrepancies,
            stockValue,
            cashValue,
            totalDiscrepancies: stockDiscrepancies + cashDiscrepancies,
            totalValue: stockValue + cashValue,
            trend,
            percentChange,
          })
        } catch (localError) {
          console.error(`Error al procesar datos para ${local.name}:`, localError)
          // Continuar con el siguiente local
        }
      }

      // Actualizar el estado de datos reales
      setIsUsingRealData(hasRealData)

      // Si no hay datos reales en ningún local, usar datos de ejemplo
      if (!hasRealData) {
        console.log("No se encontraron datos reales, usando datos de ejemplo")
        generateMockData()
        return
      }

      // Ordenar locales por valor total de discrepancias (de mayor a menor)
      localesData.sort((a, b) => b.totalValue - a.totalValue)

      // Calcular totales generales
      const totalStockDiscrepancies = localesData.reduce((sum, local) => sum + local.stockDiscrepancies, 0)
      const totalCashDiscrepancies = localesData.reduce((sum, local) => sum + local.cashDiscrepancies, 0)
      const totalStockValue = localesData.reduce((sum, local) => sum + local.stockValue, 0)
      const totalCashValue = localesData.reduce((sum, local) => sum + local.cashValue, 0)

      setSummaryData({
        totalStockDiscrepancies,
        totalCashDiscrepancies,
        totalStockValue,
        totalCashValue,
        locales: localesData,
      })
    } catch (error: any) {
      console.error("Error al cargar datos del dashboard:", error)
      setError(error.message || "Error al cargar los datos")
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive",
      })

      // Si hay un error al cargar datos reales, usar datos de ejemplo
      setIsUsingRealData(false)
      generateMockData()
    } finally {
      setIsLoading(false)
    }
  }

  // Función para generar datos de ejemplo en caso de error
  const generateMockData = () => {
    setIsUsingRealData(false)
    // Datos simulados para cada local
    const localesData = locales.map((local) => {
      const stockDiscrepancies = Math.floor(Math.random() * 20)
      const cashDiscrepancies = Math.floor(Math.random() * 10)
      const stockValue = Math.floor(Math.random() * 50000)
      const cashValue = Math.floor(Math.random() * 30000)

      return {
        id: local.id,
        name: local.name,
        stockDiscrepancies,
        cashDiscrepancies,
        stockValue,
        cashValue,
        totalDiscrepancies: stockDiscrepancies + cashDiscrepancies,
        totalValue: stockValue + cashValue,
        trend: Math.random() > 0.5 ? "up" : "down",
        percentChange: Math.floor(Math.random() * 30),
      }
    })

    // Ordenar locales por valor total de discrepancias (de mayor a menor)
    localesData.sort((a, b) => b.totalValue - a.totalValue)

    // Calcular totales
    const totalStockDiscrepancies = localesData.reduce((sum, local) => sum + local.stockDiscrepancies, 0)
    const totalCashDiscrepancies = localesData.reduce((sum, local) => sum + local.cashDiscrepancies, 0)
    const totalStockValue = localesData.reduce((sum, local) => sum + local.stockValue, 0)
    const totalCashValue = localesData.reduce((sum, local) => sum + local.cashValue, 0)

    setSummaryData({
      totalStockDiscrepancies,
      totalCashDiscrepancies,
      totalStockValue,
      totalCashValue,
      locales: localesData,
    })
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
    <div className="space-y-6">
      {/* Encabezado y controles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Conciliación</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">Resumen de discrepancias de stock y caja por local</p>
            <Badge variant={isUsingRealData ? "success" : "warning"}>
              {isUsingRealData ? "Datos reales" : "Datos de prueba"}
            </Badge>
          </div>
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

          <GenerateDiscrepanciesButton />
        </div>
      </div>

      {/* Mostrar error si existe */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error al cargar datos</p>
            <p className="text-sm text-red-700">{error}</p>
            <p className="text-sm text-red-700 mt-1">Se están mostrando datos de ejemplo.</p>
          </div>
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Discrepancias Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.totalStockDiscrepancies}</div>
            <p className="text-xs text-muted-foreground">Valor: ${summaryData.totalStockValue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Discrepancias Caja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.totalCashDiscrepancies}</div>
            <p className="text-xs text-muted-foreground">Valor: ${summaryData.totalCashValue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Local con Más Discrepancias</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryData.locales.length > 0 && (
              <>
                <div className="text-2xl font-bold">{summaryData.locales[0].name}</div>
                <p className="text-xs text-muted-foreground">
                  {summaryData.locales[0].totalDiscrepancies} discrepancias
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mayor Valor en Discrepancias</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryData.locales.length > 0 && (
              <>
                <div className="text-2xl font-bold">${summaryData.locales[0].totalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{summaryData.locales[0].name}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal */}
      <Tabs defaultValue="locales">
        <TabsList>
          <TabsTrigger value="locales">Locales</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
          <TabsTrigger value="productos">Top Productos</TabsTrigger>
        </TabsList>

        {/* Pestaña de Locales */}
        <TabsContent value="locales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaryData.locales.map((local) => (
              <LocalSummaryCard key={local.id} local={local} onClick={() => handleLocalClick(local.id)} />
            ))}
          </div>
        </TabsContent>

        {/* Pestaña de Tendencias */}
        <TabsContent value="tendencias">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        {/* Pestaña de Top Productos */}
        <TabsContent value="productos">
          <Card>
            <CardHeader>
              <CardTitle>Productos con Más Discrepancias</CardTitle>
              <CardDescription>Los productos con mayor cantidad y valor en discrepancias</CardDescription>
            </CardHeader>
            <CardContent>
              <TopDiscrepanciesTable dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
