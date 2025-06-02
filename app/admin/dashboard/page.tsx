"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { AlertTriangle, DollarSign, Package, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react"
import { mockAlerts } from "@/lib/mock-data"
import { dbService } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

export default function AdminDashboardPage() {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("week")

  // Cargar alertas al montar el componente
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        // Intentar cargar desde la base de datos
        try {
          const { data, error } = await dbService.supabase
            .from("alerts")
            .select("*")
            .order("created_at", { ascending: false })

          if (error) throw error

          if (data && data.length > 0) {
            setAlerts(
              data.map((alert) => ({
                ...alert,
                // Asegurar que las fechas sean strings
                date: alert.date ? new Date(alert.date).toISOString() : new Date().toISOString(),
                createdAt: alert.created_at ? new Date(alert.created_at).toISOString() : new Date().toISOString(),
                updatedAt: alert.updated_at ? new Date(alert.updated_at).toISOString() : new Date().toISOString(),
                resolvedAt: alert.resolved_at ? new Date(alert.resolved_at).toISOString() : null,
              })),
            )
          } else {
            // Si no hay datos en la base de datos, intentar cargar desde localStorage
            const localAlerts = localStorage.getItem("localAlerts")
            if (localAlerts) {
              setAlerts(JSON.parse(localAlerts))
            } else {
              // Si no hay datos en localStorage, usar los datos de mock
              setAlerts(mockAlerts)
            }
          }
        } catch (dbError) {
          console.error("Error al cargar alertas desde la base de datos:", dbError)
          // Intentar cargar desde localStorage
          const localAlerts = localStorage.getItem("localAlerts")
          if (localAlerts) {
            setAlerts(JSON.parse(localAlerts))
          } else {
            // Usar datos de mock como fallback
            setAlerts(mockAlerts)
          }
        }
      } catch (error) {
        console.error("Error al cargar alertas:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las alertas. Se están usando datos de ejemplo.",
          variant: "destructive",
        })
        setAlerts(mockAlerts)
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
  }, [toast])

  // Calcular estadísticas
  const stats = {
    totalAlerts: alerts.length,
    pendingAlerts: alerts.filter((a) => a.status === "pendiente").length,
    resolvedAlerts: alerts.filter((a) => a.status === "resuelta").length,
    highSeverity: alerts.filter((a) => a.severity === "alta").length,
    stockAlerts: alerts.filter((a) => a.type === "stock").length,
    cashAlerts: alerts.filter((a) => a.type === "caja").length,
    decomisoAlerts: alerts.filter((a) => a.type === "decomiso").length,
    totalImpact: alerts.reduce((sum, alert) => sum + (alert.monetary_value || 0), 0),
  }

  // Datos para gráficos
  const alertsByType = [
    { name: "Stock", value: stats.stockAlerts },
    { name: "Caja", value: stats.cashAlerts },
    { name: "Decomiso", value: stats.decomisoAlerts },
  ]

  const alertsBySeverity = [
    { name: "Alta", value: alerts.filter((a) => a.severity === "alta").length },
    { name: "Media", value: alerts.filter((a) => a.severity === "media").length },
    { name: "Baja", value: alerts.filter((a) => a.severity === "baja").length },
  ]

  const alertsByStatus = [
    { name: "Pendientes", value: stats.pendingAlerts },
    { name: "Revisadas", value: alerts.filter((a) => a.status === "revisada").length },
    { name: "Resueltas", value: stats.resolvedAlerts },
  ]

  const alertsByLocal = [
    { name: "BR Cabildo", value: alerts.filter((a) => a.localName === "BR Cabildo").length },
    { name: "BR Carranza", value: alerts.filter((a) => a.localName === "BR Carranza").length },
    { name: "BR Pacifico", value: alerts.filter((a) => a.localName === "BR Pacifico").length },
    {
      name: "Otros",
      value: alerts.filter((a) => !["BR Cabildo", "BR Carranza", "BR Pacifico"].includes(a.localName)).length,
    },
  ]

  // Colores para los gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]
  const SEVERITY_COLORS = {
    Alta: "#ef4444",
    Media: "#f97316",
    Baja: "#22c55e",
  }
  const STATUS_COLORS = {
    Pendientes: "#ef4444",
    Revisadas: "#f97316",
    Resueltas: "#22c55e",
  }

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p>Cargando datos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTimeRange("week")}
            className={timeRange === "week" ? "bg-muted" : ""}
          >
            Semana
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTimeRange("month")}
            className={timeRange === "month" ? "bg-muted" : ""}
          >
            Mes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTimeRange("year")}
            className={timeRange === "year" ? "bg-muted" : ""}
          >
            Año
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="financial">Impacto Financiero</TabsTrigger>
          <TabsTrigger value="locations">Locales</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertas Totales</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAlerts}</div>
                <p className="text-xs text-muted-foreground">{stats.pendingAlerts} pendientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impacto Financiero</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalImpact)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-500 flex items-center">
                    <ArrowUpRight className="h-4 w-4 mr-1" />+{formatCurrency(stats.totalImpact * 0.1)} vs. mes anterior
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertas de Stock</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.stockAlerts}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500 flex items-center">
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                    -5% vs. mes anterior
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo de Resolución</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24h</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500 flex items-center">
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                    -2h vs. mes anterior
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Alertas por Tipo</CardTitle>
                <CardDescription>Distribución de alertas según su categoría</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={alertsByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {alertsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} alertas`, "Cantidad"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Alertas por Severidad</CardTitle>
                <CardDescription>Distribución de alertas según su nivel de severidad</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={alertsBySeverity}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {alertsBySeverity.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={SEVERITY_COLORS[entry.name]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} alertas`, "Cantidad"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Alertas Recientes</CardTitle>
                <CardDescription>Últimas alertas generadas en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.slice(0, 5).map((alert, index) => (
                    <div key={index} className="flex items-start justify-between border-b pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              alert.severity === "alta"
                                ? "destructive"
                                : alert.severity === "media"
                                  ? "warning"
                                  : "secondary"
                            }
                          >
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{alert.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(alert.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                      </div>
                      <Badge
                        variant={
                          alert.status === "pendiente"
                            ? "destructive"
                            : alert.status === "revisada"
                              ? "warning"
                              : "success"
                        }
                      >
                        {alert.status === "pendiente"
                          ? "Pendiente"
                          : alert.status === "revisada"
                            ? "Revisada"
                            : "Resuelta"}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={() => (window.location.href = "/admin/alerts")}>
                    Ver todas las alertas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Estado de Alertas</CardTitle>
                <CardDescription>Distribución de alertas según su estado actual</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={alertsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {alertsByStatus.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={STATUS_COLORS[entry.name]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} alertas`, "Cantidad"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Tiempo de Resolución</CardTitle>
                <CardDescription>Tiempo promedio para resolver alertas por tipo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Stock", value: 36 },
                        { name: "Caja", value: 24 },
                        { name: "Decomiso", value: 12 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: "Horas", angle: -90, position: "insideLeft" }} />
                      <Tooltip formatter={(value) => [`${value} horas`, "Tiempo promedio"]} />
                      <Bar dataKey="value" fill="#8884d8">
                        {[
                          { name: "Stock", value: 36 },
                          { name: "Caja", value: 24 },
                          { name: "Decomiso", value: 12 },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Eficiencia de Resolución</CardTitle>
                <CardDescription>Porcentaje de alertas resueltas dentro del tiempo objetivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Semana 1", stock: 85, caja: 90, decomiso: 95 },
                        { name: "Semana 2", stock: 80, caja: 85, decomiso: 90 },
                        { name: "Semana 3", stock: 90, caja: 95, decomiso: 100 },
                        { name: "Semana 4", stock: 95, caja: 90, decomiso: 95 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: "Porcentaje (%)", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="stock" name="Stock" fill="#0088FE" />
                      <Bar dataKey="caja" name="Caja" fill="#00C49F" />
                      <Bar dataKey="decomiso" name="Decomiso" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impacto Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalImpact)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-500 flex items-center">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    +10% vs. mes anterior
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impacto Stock</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    alerts.filter((a) => a.type === "stock").reduce((sum, a) => sum + (a.monetary_value || 0), 0),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-500 flex items-center">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    +5% vs. mes anterior
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impacto Caja</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    alerts.filter((a) => a.type === "caja").reduce((sum, a) => sum + (a.monetary_value || 0), 0),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500 flex items-center">
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                    -3% vs. mes anterior
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impacto Decomiso</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    alerts.filter((a) => a.type === "decomiso").reduce((sum, a) => sum + (a.monetary_value || 0), 0),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-500 flex items-center">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    +8% vs. mes anterior
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Impacto Financiero por Mes</CardTitle>
                <CardDescription>Evolución del impacto financiero de las alertas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Ene", stock: 15000, caja: 25000, decomiso: 10000 },
                        { name: "Feb", stock: 12000, caja: 18000, decomiso: 8000 },
                        { name: "Mar", stock: 18000, caja: 22000, decomiso: 12000 },
                        { name: "Abr", stock: 14000, caja: 20000, decomiso: 9000 },
                        { name: "May", stock: 16000, caja: 24000, decomiso: 11000 },
                        { name: "Jun", stock: 19000, caja: 26000, decomiso: 13000 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(value), "Impacto"]} />
                      <Legend />
                      <Bar dataKey="stock" name="Stock" fill="#0088FE" />
                      <Bar dataKey="caja" name="Caja" fill="#00C49F" />
                      <Bar dataKey="decomiso" name="Decomiso" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Alertas de Alto Impacto</CardTitle>
                <CardDescription>Alertas con mayor impacto financiero</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts
                    .sort((a, b) => (b.monetary_value || 0) - (a.monetary_value || 0))
                    .slice(0, 5)
                    .map((alert, index) => (
                      <div key={index} className="flex items-start justify-between border-b pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                alert.severity === "alta"
                                  ? "destructive"
                                  : alert.severity === "media"
                                    ? "warning"
                                    : "secondary"
                              }
                            >
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{alert.type}</Badge>
                          </div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {alert.localName} - {new Date(alert.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-500">{formatCurrency(alert.monetary_value || 0)}</p>
                          <Badge
                            variant={
                              alert.status === "pendiente"
                                ? "destructive"
                                : alert.status === "revisada"
                                  ? "warning"
                                  : "success"
                            }
                          >
                            {alert.status === "pendiente"
                              ? "Pendiente"
                              : alert.status === "revisada"
                                ? "Revisada"
                                : "Resuelta"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recuperación de Pérdidas</CardTitle>
                <CardDescription>Porcentaje de pérdidas recuperadas mediante acciones correctivas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Recuperado", value: 65 },
                          { name: "No Recuperado", value: 35 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, "Porcentaje"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Se ha recuperado aproximadamente {formatCurrency(stats.totalImpact * 0.65)} del total de{" "}
                    {formatCurrency(stats.totalImpact)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="locations">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Alertas por Local</CardTitle>
                <CardDescription>Distribución de alertas por local</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={alertsByLocal}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {alertsByLocal.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} alertas`, "Cantidad"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Impacto Financiero por Local</CardTitle>
                <CardDescription>Impacto financiero de alertas por local</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "BR Cabildo", value: 25000 },
                        { name: "BR Carranza", value: 18000 },
                        { name: "BR Pacifico", value: 22000 },
                        { name: "Otros", value: 5000 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(value), "Impacto"]} />
                      <Bar dataKey="value" fill="#8884d8">
                        {[
                          { name: "BR Cabildo", value: 25000 },
                          { name: "BR Carranza", value: 18000 },
                          { name: "BR Pacifico", value: 22000 },
                          { name: "Otros", value: 5000 },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Local</CardTitle>
                <CardDescription>Comparativa de alertas y resolución por local</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "BR Cabildo", alertas: 15, resueltas: 10, pendientes: 5 },
                        { name: "BR Carranza", alertas: 12, resueltas: 9, pendientes: 3 },
                        { name: "BR Pacifico", alertas: 18, resueltas: 12, pendientes: 6 },
                        { name: "Otros", alertas: 5, resueltas: 3, pendientes: 2 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="alertas" name="Total Alertas" fill="#8884d8" />
                      <Bar dataKey="resueltas" name="Resueltas" fill="#82ca9d" />
                      <Bar dataKey="pendientes" name="Pendientes" fill="#ff8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}



