"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import DashboardLayout from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Search, Eye, ArrowUpDown } from "lucide-react"
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

export default function AlertasStockPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("stock")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLocal, setFilterLocal] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [stockAlerts, setStockAlerts] = useState<any[]>([])
  const [stockCashAlerts, setStockCashAlerts] = useState<any[]>([])
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
        const [stockAlertsResult, stockCashAlertsResult] = await Promise.all([
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

        if (stockAlertsResult.error) throw stockAlertsResult.error
        if (stockCashAlertsResult.error) throw stockCashAlertsResult.error

        // Actualizar estados
        setStockAlerts(stockAlertsResult.data || [])
        setStockCashAlerts(stockCashAlertsResult.data || [])
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

  // Filtrar y ordenar alertas de stock
  const filteredStockAlerts = stockAlerts
    .filter((alert) => {
      const matchesSearch =
        alert.local_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.product?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesLocal = filterLocal === "all" || alert.local_id === filterLocal
      const matchesStatus = filterStatus === "all" || alert.status === filterStatus

      return matchesSearch && matchesLocal && matchesStatus
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

  // Filtrar y ordenar alertas de stock-caja
  const filteredStockCashAlerts = stockCashAlerts
    .filter((alert) => {
      const matchesSearch = alert.local_name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLocal = filterLocal === "all" || alert.local_id === filterLocal
      const matchesStatus = filterStatus === "all" || alert.status === filterStatus

      return matchesSearch && matchesLocal && matchesStatus
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

  return (
    <DashboardLayout isLoading={isLoading}>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/stock")} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Alertas de Stock</h1>
        </div>

        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por local o producto..."
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
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="activa">Activa</SelectItem>
                    <SelectItem value="resuelta">Resuelta</SelectItem>
                    <SelectItem value="rechazada">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stock">Alertas de Stock</TabsTrigger>
              <TabsTrigger value="cash">Alertas Stock-Caja</TabsTrigger>
            </TabsList>

            {/* Tab de Alertas de Stock */}
            <TabsContent value="stock" className="space-y-4">
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
                          <TableHead className="cursor-pointer" onClick={() => requestSort("date")}>
                            Fecha
                            {sortConfig.key === "date" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => requestSort("local_name")}>
                            Local
                            {sortConfig.key === "local_name" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                          </TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Diferencia</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStockAlerts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              No se encontraron alertas
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredStockAlerts.map((alert) => (
                            <TableRow key={alert.id}>
                              <TableCell>{formatFecha(alert.date)}</TableCell>
                              <TableCell>{alert.local_name}</TableCell>
                              <TableCell>{alert.product}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    alert.type === "faltante"
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }
                                >
                                  {alert.type}
                                </Badge>
                              </TableCell>
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
                                  onClick={() => router.push(`/stock/registro/${alert.stock_record_id}`)}
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
              </Card>
            </TabsContent>

            {/* Tab de Alertas Stock-Caja */}
            <TabsContent value="cash" className="space-y-4">
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
                          <TableHead className="cursor-pointer" onClick={() => requestSort("date")}>
                            Fecha
                            {sortConfig.key === "date" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => requestSort("local_name")}>
                            Local
                            {sortConfig.key === "local_name" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                          </TableHead>
                          <TableHead>Esperado</TableHead>
                          <TableHead>Real</TableHead>
                          <TableHead>Diferencia</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStockCashAlerts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              No se encontraron alertas
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredStockCashAlerts.map((alert) => (
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

