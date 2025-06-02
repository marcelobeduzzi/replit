"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Search, Eye, AlertTriangle, BarChart2, ArrowUpDown } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Lista de locales para filtrar
const locales = [
  { id: "cabildo", name: "BR Cabildo" },
  { id: "carranza", name: "BR Carranza" },
  { id: "pacifico", name: "BR Pacífico" },
  { id: "lavalle", name: "BR Lavalle" },
  { id: "rivadavia", name: "BR Rivadavia" },
  { id: "aguero", name: "BR Aguero" },
  { id: "dorrego", name: "BR Dorrego" },
  { id: "dean_dennys", name: "Dean & Dennys" },
]

export default function StockPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("home")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLocal, setFilterLocal] = useState("all")
  const [filterFecha, setFilterFecha] = useState("")
  const [stockRecords, setStockRecords] = useState<any[]>([])
  const [stockAlerts, setStockAlerts] = useState<any[]>([])
  const [stockCashAlerts, setStockCashAlerts] = useState<any[]>([])
  const [summaryData, setSummaryData] = useState({
    totalRecords: 0,
    activeStockAlerts: 0,
    activeCashAlerts: 0,
    lastUpdate: "",
  })
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  }>({ key: "date", direction: "descending" })

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Consultas en paralelo
        const [stockRecordsResult, stockAlertsResult, stockCashAlertsResult] = await Promise.all([
          // Registros de stock
          supabase
            .from("stock_records")
            .select("*")
            .order("date", { ascending: false }),

          // Alertas de stock
          supabase
            .from("stock_alerts")
            .select("*")
            .order("date", { ascending: false }),

          // Alertas de cruce stock-caja
          supabase
            .from("stock_cash_alerts")
            .select("*")
            .order("date", { ascending: false }),
        ])

        if (stockRecordsResult.error) throw stockRecordsResult.error
        if (stockAlertsResult.error) throw stockAlertsResult.error
        if (stockCashAlertsResult.error) throw stockCashAlertsResult.error

        // Procesar datos
        const stockRecordsData = stockRecordsResult.data || []
        const stockAlertsData = stockAlertsResult.data || []
        const stockCashAlertsData = stockCashAlertsResult.data || []

        // Contar alertas activas
        const activeStockAlerts = stockAlertsData.filter((a) => a.status === "activa").length
        const activeCashAlerts = stockCashAlertsData.filter((a) => a.status === "activa").length

        // Obtener fecha de última actualización
        let lastUpdate = "N/A"
        if (stockRecordsData.length > 0) {
          const latestDate = new Date(stockRecordsData[0].created_at)
          lastUpdate = format(latestDate, "dd/MM/yyyy HH:mm", { locale: es })
        }

        // Actualizar estados
        setStockRecords(stockRecordsData)
        setStockAlerts(stockAlertsData)
        setStockCashAlerts(stockCashAlertsData)

        // Actualizar datos de resumen
        setSummaryData({
          totalRecords: stockRecordsData.length,
          activeStockAlerts,
          activeCashAlerts,
          lastUpdate,
        })
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  // Función para ordenar
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Filtrar y ordenar registros de stock
  const filteredStockRecords = stockRecords
    .filter((record) => {
      const matchesSearch =
        record.local_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.responsible?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesLocal = filterLocal === "all" || record.local_id === filterLocal

      const matchesFecha = !filterFecha || record.date === filterFecha

      return matchesSearch && matchesLocal && matchesFecha
    })
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })

  // Formatear fecha
  const formatFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr)
      return format(fecha, "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return fechaStr
    }
  }

  // Calcular diferencia y renderizar con color
  const renderDifference = (real: number, datalive: number) => {
    const diff = real - datalive
    const className = diff < 0 ? "text-red-600" : diff > 0 ? "text-amber-600" : "text-green-600"

    return (
      <span className={className}>
        {diff > 0 ? "+" : ""}
        {diff}
      </span>
    )
  }

  // Componente para la página de inicio
  const HomePage = () => {
    return (
      <div className="space-y-6">
        {/* Panel de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Registros Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.totalRecords}</div>
              <p className="text-xs text-muted-foreground mt-1">Registros de stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Alertas de Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold">{summaryData.activeStockAlerts}</div>
                {summaryData.activeStockAlerts > 0 && <AlertTriangle className="ml-2 h-5 w-5 text-yellow-500" />}
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
                <div className="text-2xl font-bold">{summaryData.activeCashAlerts}</div>
                {summaryData.activeCashAlerts > 0 && <AlertTriangle className="ml-2 h-5 w-5 text-yellow-500" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Diferencias entre ventas y caja</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Última Actualización</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.lastUpdate}</div>
              <p className="text-xs text-muted-foreground mt-1">Último registro de stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Operaciones comunes del sistema de stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push("/stock/registro")}
              >
                <PlusCircle className="h-6 w-6" />
                <span>Nuevo Registro</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push("/stock/alertas")}
              >
                <AlertTriangle className="h-6 w-6" />
                <span>Ver Alertas</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push("/stock/reportes")}
              >
                <BarChart2 className="h-6 w-6" />
                <span>Reportes</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Registros recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Registros Recientes</CardTitle>
            <CardDescription>Últimos registros de stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stockRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          record.shift === "mañana" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                        }
                      >
                        {record.shift === "mañana" ? "Mañana" : "Tarde"}
                      </Badge>
                      <span className="font-medium">{record.local_name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatFecha(record.date)} - {record.responsible}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => router.push(`/stock/registro/${record.id}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {stockRecords.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No hay registros recientes para mostrar</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <DashboardLayout isLoading={isLoading}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Control de Stock</h1>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/stock/registro")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Registro
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por local o responsable..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterLocal} onValueChange={setFilterLocal}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filtrar por local" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los locales</SelectItem>
                    {locales.map((local) => (
                      <SelectItem key={local.id} value={local.id}>
                        {local.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="w-full md:w-[200px]">
                  <Input
                    type="date"
                    value={filterFecha}
                    onChange={(e) => setFilterFecha(e.target.value)}
                    placeholder="Filtrar por fecha"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="home">Inicio</TabsTrigger>
              <TabsTrigger value="registros">Registros de Stock</TabsTrigger>
              <TabsTrigger value="alertas">Alertas</TabsTrigger>
            </TabsList>

            {/* Tab de Inicio */}
            <TabsContent value="home" className="space-y-4">
              <HomePage />
            </TabsContent>

            {/* Tab de Registros */}
            <TabsContent value="registros" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Registros de Stock</CardTitle>
                  <CardDescription>Listado de registros de stock</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="cursor-pointer" onClick={() => requestSort("date")}>
                            Fecha
                            {sortConfig.key === "date" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => requestSort("local_name")}>
                            Local
                            {sortConfig.key === "local_name" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                          </TableHead>
                          <TableHead>Turno</TableHead>
                          <TableHead>Responsable</TableHead>
                          <TableHead className="text-center">Empanadas</TableHead>
                          <TableHead className="text-center">Medialunas</TableHead>
                          <TableHead className="text-center">Pizzas</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStockRecords.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                              No se encontraron registros
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredStockRecords.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>{formatFecha(record.date)}</TableCell>
                              <TableCell className="font-medium">{record.local_name}</TableCell>
                              <TableCell>{record.shift === "mañana" ? "Mañana" : "Tarde"}</TableCell>
                              <TableCell>{record.responsible}</TableCell>
                              <TableCell className="text-center">
                                {record.empanadas_real} / {record.empanadas_datalive} (
                                {renderDifference(record.empanadas_real, record.empanadas_datalive)})
                              </TableCell>
                              <TableCell className="text-center">
                                {record.medialunas_real} / {record.medialunas_datalive} (
                                {renderDifference(record.medialunas_real, record.medialunas_datalive)})
                              </TableCell>
                              <TableCell className="text-center">
                                {record.pizzas_real} / {record.pizzas_datalive} (
                                {renderDifference(record.pizzas_real, record.pizzas_datalive)})
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Ver detalles"
                                    onClick={() => router.push(`/stock/registro/${record.id}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab de Alertas */}
            <TabsContent value="alertas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Alertas de Stock</CardTitle>
                  <CardDescription>Diferencias detectadas en el inventario</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Local</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Diferencia</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockAlerts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              No se encontraron alertas
                            </TableCell>
                          </TableRow>
                        ) : (
                          stockAlerts.slice(0, 10).map((alert) => (
                            <TableRow key={alert.id}>
                              <TableCell>{formatFecha(alert.date)}</TableCell>
                              <TableCell>{alert.local_name}</TableCell>
                              <TableCell>{alert.product}</TableCell>
                              <TableCell className={alert.difference < 0 ? "text-red-600" : "text-amber-600"}>
                                {alert.difference > 0 ? "+" : ""}
                                {alert.difference} ({Math.abs(alert.percentage || 0).toFixed(2)}%)
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    alert.status === "activa"
                                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                      : alert.status === "resuelta"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                  }
                                >
                                  {alert.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => router.push(`/stock/alertas/${alert.id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    {stockAlerts.length > 10 && (
                      <div className="p-4 text-center">
                        <Button variant="outline" onClick={() => router.push("/stock/alertas")}>
                          Ver todas las alertas
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alertas Stock-Caja</CardTitle>
                  <CardDescription>Diferencias entre ventas y caja</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Local</TableHead>
                          <TableHead>Esperado</TableHead>
                          <TableHead>Real</TableHead>
                          <TableHead>Diferencia</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockCashAlerts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              No se encontraron alertas
                            </TableCell>
                          </TableRow>
                        ) : (
                          stockCashAlerts.slice(0, 10).map((alert) => (
                            <TableRow key={alert.id}>
                              <TableCell>{formatFecha(alert.date)}</TableCell>
                              <TableCell>{alert.local_name}</TableCell>
                              <TableCell>${alert.expected_amount.toLocaleString()}</TableCell>
                              <TableCell>${alert.actual_amount.toLocaleString()}</TableCell>
                              <TableCell className={alert.difference < 0 ? "text-red-600" : "text-green-600"}>
                                ${alert.difference.toLocaleString()} ({Math.abs(alert.percentage || 0).toFixed(2)}%)
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    alert.status === "activa"
                                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                      : alert.status === "resuelta"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                  }
                                >
                                  {alert.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => router.push(`/stock/alertas-caja/${alert.id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    {stockCashAlerts.length > 10 && (
                      <div className="p-4 text-center">
                        <Button variant="outline" onClick={() => router.push("/stock/alertas-caja")}>
                          Ver todas las alertas
                        </Button>
                      </div>
                    )}
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

