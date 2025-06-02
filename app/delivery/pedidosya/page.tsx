"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { dbService } from "@/lib/db-service"
import { exportToCSV, formatCurrency } from "@/lib/export-utils"
import type { DeliveryStats } from "@/types"
import type { ColumnDef } from "@tanstack/react-table"
import { Download, Plus, Calendar, TrendingUp, Star, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BarChart, LineChart } from "@/components/charts"

export default function PedidosYaPage() {
  const [stats, setStats] = useState<DeliveryStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedLocal, setSelectedLocal] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [chartData, setChartData] = useState<any>(null)
  const [revenueChartData, setRevenueChartData] = useState<any>(null)

  // Estado para el formulario de nueva estadística
  const [newStat, setNewStat] = useState<Omit<DeliveryStats, "id">>({
    platform: "PedidosYa",
    week: Math.ceil(new Date().getDate() / 7),
    year: new Date().getFullYear(),
    orderCount: 0,
    revenue: 0,
    complaints: 0,
    rating: 4.5,
    local: "BR Cabildo",
  })

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Obtener estadísticas de PedidosYa
        const statsData = await dbService.getDeliveryStats({
          platform: "PedidosYa",
          year: selectedYear,
          ...(selectedLocal ? { local: selectedLocal } : {}),
        })
        setStats(statsData)

        // Preparar datos para gráficos
        if (statsData.length > 0) {
          // Agrupar por semana
          const weeklyData: Record<number, { orders: number; revenue: number }> = {}

          statsData.forEach((stat) => {
            if (!weeklyData[stat.week]) {
              weeklyData[stat.week] = { orders: 0, revenue: 0 }
            }
            weeklyData[stat.week].orders += stat.orderCount
            weeklyData[stat.week].revenue += stat.revenue
          })

          // Ordenar semanas
          const sortedWeeks = Object.keys(weeklyData)
            .map(Number)
            .sort((a, b) => a - b)

          // Crear datos para gráfico de pedidos
          setChartData({
            labels: sortedWeeks.map((week) => `Semana ${week}`),
            datasets: [
              {
                label: "Pedidos",
                data: sortedWeeks.map((week) => weeklyData[week].orders),
                backgroundColor: "rgba(59, 130, 246, 0.5)",
                borderColor: "rgb(59, 130, 246)",
                borderWidth: 1,
              },
            ],
          })

          // Crear datos para gráfico de ingresos
          setRevenueChartData({
            labels: sortedWeeks.map((week) => `Semana ${week}`),
            datasets: [
              {
                label: "Ingresos",
                data: sortedWeeks.map((week) => weeklyData[week].revenue),
                backgroundColor: "rgba(16, 185, 129, 0.5)",
                borderColor: "rgb(16, 185, 129)",
                borderWidth: 1,
              },
            ],
          })
        }
      } catch (error) {
        console.error("Error al cargar datos de PedidosYa:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedYear, selectedLocal])

  const handleExportCSV = () => {
    // Preparar datos para exportar
    const data = stats.map((stat) => ({
      Plataforma: stat.platform,
      Local: stat.local,
      Semana: stat.week,
      Año: stat.year,
      Pedidos: stat.orderCount,
      Facturación: stat.revenue,
      Reclamos: stat.complaints,
      Valoración: stat.rating,
    }))

    exportToCSV(data, `pedidosya_${selectedYear}`)
  }

  const handleSubmit = async () => {
    try {
      // Crear nueva estadística
      const createdStat = await dbService.createDeliveryStat(newStat)

      // Actualizar la lista de estadísticas
      setStats((prev) => [...prev, createdStat])

      // Cerrar el diálogo y resetear el formulario
      setIsDialogOpen(false)
      setNewStat({
        platform: "PedidosYa",
        week: Math.ceil(new Date().getDate() / 7),
        year: new Date().getFullYear(),
        orderCount: 0,
        revenue: 0,
        complaints: 0,
        rating: 4.5,
        local: "BR Cabildo",
      })
    } catch (error) {
      console.error("Error al crear estadística:", error)
      alert("Error al registrar la estadística. Por favor, intente nuevamente.")
    }
  }

  const columns: ColumnDef<DeliveryStats>[] = [
    {
      accessorKey: "local",
      header: "Local",
    },
    {
      accessorKey: "week",
      header: "Semana",
      cell: ({ row }) => `Semana ${row.original.week}`,
    },
    {
      accessorKey: "orderCount",
      header: "Pedidos",
    },
    {
      accessorKey: "revenue",
      header: "Facturación",
      cell: ({ row }) => formatCurrency(row.original.revenue),
    },
    {
      accessorKey: "complaints",
      header: "Reclamos",
    },
    {
      accessorKey: "rating",
      header: "Valoración",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Star className="mr-1 h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span>{row.original.rating.toFixed(1)}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Aquí podría ir la lógica para editar una estadística
            alert(`Editar estadística de la semana ${row.original.week}`)
          }}
        >
          Editar
        </Button>
      ),
    },
  ]

  // Calcular estadísticas generales
  const totalOrders = stats.reduce((sum, stat) => sum + stat.orderCount, 0)
  const totalRevenue = stats.reduce((sum, stat) => sum + stat.revenue, 0)
  const totalComplaints = stats.reduce((sum, stat) => sum + stat.complaints, 0)
  const averageRating = stats.length > 0 ? stats.reduce((sum, stat) => sum + stat.rating, 0) / stats.length : 0

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">PedidosYa</h2>
            <p className="text-muted-foreground">Estadísticas de pedidos a través de PedidosYa</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Cargar Estadísticas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cargar Estadísticas de PedidosYa</DialogTitle>
                <DialogDescription>Ingresa los datos de la semana para PedidosYa</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="local">Local</Label>
                    <Select
                      value={newStat.local}
                      onValueChange={(value) => setNewStat((prev) => ({ ...prev, local: value }))}
                    >
                      <SelectTrigger id="local">
                        <SelectValue placeholder="Seleccionar local" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BR Cabildo">BR Cabildo</SelectItem>
                        <SelectItem value="BR Carranza">BR Carranza</SelectItem>
                        <SelectItem value="BR Pacifico">BR Pacifico</SelectItem>
                        <SelectItem value="BR Lavalle">BR Lavalle</SelectItem>
                        <SelectItem value="BR Rivadavia">BR Rivadavia</SelectItem>
                        <SelectItem value="BR Aguero">BR Aguero</SelectItem>
                        <SelectItem value="BR Dorrego">BR Dorrego</SelectItem>
                        <SelectItem value="Dean & Dennys">Dean & Dennys</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="week">Semana</Label>
                    <Select
                      value={newStat.week.toString()}
                      onValueChange={(value) => setNewStat((prev) => ({ ...prev, week: Number.parseInt(value) }))}
                    >
                      <SelectTrigger id="week">
                        <SelectValue placeholder="Seleccionar semana" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                          <SelectItem key={week} value={week.toString()}>
                            Semana {week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderCount">Cantidad de Pedidos</Label>
                    <Input
                      id="orderCount"
                      type="number"
                      value={newStat.orderCount}
                      onChange={(e) =>
                        setNewStat((prev) => ({ ...prev, orderCount: Number.parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="revenue">Facturación</Label>
                    <Input
                      id="revenue"
                      type="number"
                      value={newStat.revenue}
                      onChange={(e) =>
                        setNewStat((prev) => ({ ...prev, revenue: Number.parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complaints">Reclamos</Label>
                    <Input
                      id="complaints"
                      type="number"
                      value={newStat.complaints}
                      onChange={(e) =>
                        setNewStat((prev) => ({ ...prev, complaints: Number.parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rating">Valoración</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={newStat.rating}
                      onChange={(e) =>
                        setNewStat((prev) => ({ ...prev, rating: Number.parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" onClick={handleSubmit}>
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <div className="text-xs text-muted-foreground">En {stats.length} semanas</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturación Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <div className="text-xs text-muted-foreground">
                Ticket promedio: {totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : formatCurrency(0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reclamos</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalComplaints}</div>
              <div className="text-xs text-muted-foreground">
                {totalOrders > 0 ? ((totalComplaints / totalOrders) * 100).toFixed(2) : 0}% de los pedidos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valoración Promedio</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Star className="mr-1 h-3 w-3 text-yellow-500 fill-yellow-500" />
                <Star className="mr-1 h-3 w-3 text-yellow-500 fill-yellow-500" />
                <Star className="mr-1 h-3 w-3 text-yellow-500 fill-yellow-500" />
                <Star className="mr-1 h-3 w-3 text-yellow-500 fill-yellow-500" />
                <Star className="mr-1 h-3 w-3 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Pedidos</CardTitle>
              <CardDescription>Pedidos por semana</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {chartData ? (
                <BarChart data={chartData} />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Facturación</CardTitle>
              <CardDescription>Facturación por semana</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {revenueChartData ? (
                <LineChart data={revenueChartData} />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Estadísticas por Semana</CardTitle>
            <CardDescription>Selecciona el año y local para filtrar las estadísticas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4 space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={(new Date().getFullYear() - 1).toString()}>
                      {new Date().getFullYear() - 1}
                    </SelectItem>
                    <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                    <SelectItem value={(new Date().getFullYear() + 1).toString()}>
                      {new Date().getFullYear() + 1}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 max-w-sm">
                <Select value={selectedLocal} onValueChange={setSelectedLocal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los locales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los locales</SelectItem>
                    <SelectItem value="BR Cabildo">BR Cabildo</SelectItem>
                    <SelectItem value="BR Carranza">BR Carranza</SelectItem>
                    <SelectItem value="BR Pacifico">BR Pacifico</SelectItem>
                    <SelectItem value="BR Lavalle">BR Lavalle</SelectItem>
                    <SelectItem value="BR Rivadavia">BR Rivadavia</SelectItem>
                    <SelectItem value="BR Aguero">BR Aguero</SelectItem>
                    <SelectItem value="BR Dorrego">BR Dorrego</SelectItem>
                    <SelectItem value="Dean & Dennys">Dean & Dennys</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </div>

            <DataTable columns={columns} data={stats} searchColumn="local" searchPlaceholder="Buscar por local..." />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

