"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { Save, Play, BarChart3, Calendar, Clock, AlertTriangle, CheckCircle, Download } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { dbService } from "@/lib/db-service-extensions"

export default function AutomatedOrderingPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState({
    enabled: false,
    considerMorningDepletion: true,
    morningDepletionFactor: 15, // 15% para reflejar las 4-6 horas
    minStockPercentage: 30,
    maxStockPercentage: 150,
    considerSeasonality: true,
    requireApproval: true,
    notifyOnCreation: true,
    generateSpreadsheet: true,
  })

  const [orders, setOrders] = useState([])
  const [spreadsheets, setSpreadsheets] = useState([])

  // Cargar configuración y datos
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Cargar configuración
        const savedConfig = await dbService.getAutoOrderConfig()
        if (savedConfig) {
          setConfig({
            ...config,
            ...savedConfig,
            morningDepletionFactor: Math.round(savedConfig.morningDepletionFactor * 100),
          })
        }

        // Cargar pedidos recientes
        const recentOrders = await dbService.getRecentAutoOrders()
        setOrders(recentOrders || [])

        // Cargar planillas recientes
        const recentSpreadsheets = await dbService.getRecentSpreadsheets()
        setSpreadsheets(recentSpreadsheets || [])
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Guardar configuración
  const handleSaveConfig = async () => {
    setIsLoading(true)
    try {
      // Convertir el factor de porcentaje a decimal
      const configToSave = {
        ...config,
        morningDepletionFactor: config.morningDepletionFactor / 100,
      }

      await dbService.saveAutoOrderConfig(configToSave)

      toast({
        title: "Configuración guardada",
        description: "La configuración se ha guardado correctamente",
      })
    } catch (error) {
      console.error("Error al guardar configuración:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Ejecutar generación de pedidos manualmente
  const handleGenerateOrders = async () => {
    setIsLoading(true)
    try {
      // Llamar a la API para generar pedidos
      const response = await fetch("/api/auto-orders/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Error desconocido")
      }

      toast({
        title: "Pedidos generados",
        description: `Se han generado ${data.ordersCreated} pedidos correctamente`,
      })

      // Recargar órdenes y planillas
      const recentOrders = await dbService.getRecentAutoOrders()
      setOrders(recentOrders || [])

      const recentSpreadsheets = await dbService.getRecentSpreadsheets()
      setSpreadsheets(recentSpreadsheets || [])
    } catch (error) {
      console.error("Error al generar pedidos:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron generar los pedidos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Automatización de Pedidos</h2>
            <p className="text-muted-foreground">
              Configure y monitoree el sistema de generación automática de pedidos
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              id="auto-system-toggle"
            />
            <Label htmlFor="auto-system-toggle" className="font-medium">
              {config.enabled ? "Sistema Activado" : "Sistema Desactivado"}
            </Label>
          </div>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
            <TabsTrigger value="spreadsheets">Planillas</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pedidos Generados</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.length}</div>
                  <p className="text-xs text-muted-foreground">Último: {orders[0]?.date || "N/A"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Planillas Generadas</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{spreadsheets.length}</div>
                  <p className="text-xs text-muted-foreground">Listas para descargar</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recientes</CardTitle>
                <CardDescription>Pedidos generados automáticamente</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay pedidos generados</div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Local</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Productos</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Planilla</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.locationName}</TableCell>
                            <TableCell>{format(new Date(order.date), "dd/MM/yyyy", { locale: es })}</TableCell>
                            <TableCell>{order.totalItems}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {order.status === "pending" ? (
                                  <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                                ) : order.status === "error" ? (
                                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                )}
                                {order.status === "pending"
                                  ? "Pendiente"
                                  : order.status === "error"
                                    ? "Error"
                                    : "Completado"}
                              </div>
                            </TableCell>
                            <TableCell>
                              {spreadsheets.find((s) => s.orderId === order.id) ? (
                                <a
                                  href={spreadsheets.find((s) => s.orderId === order.id)?.fileUrl}
                                  className="flex items-center text-blue-600 hover:underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Descargar
                                </a>
                              ) : (
                                <span className="text-muted-foreground">No disponible</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Button onClick={handleGenerateOrders} disabled={isLoading}>
                    <Play className="mr-2 h-4 w-4" />
                    Generar Pedidos Ahora
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>Configure los parámetros del sistema de pedidos automáticos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Considerar Ventas Matutinas</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Considerar ventas antes de la entrega (12-14hs)
                    </span>
                    <Switch
                      checked={config.considerMorningDepletion}
                      onCheckedChange={(checked) => setConfig({ ...config, considerMorningDepletion: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Factor de Ventas Matutinas (%)</Label>
                  <div className="pt-2 px-2">
                    <Slider
                      value={[config.morningDepletionFactor]}
                      max={100}
                      step={5}
                      onValueChange={(values) => setConfig({ ...config, morningDepletionFactor: values[0] })}
                      disabled={!config.considerMorningDepletion}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0%</span>
                    <span>{config.morningDepletionFactor}%</span>
                    <span>100%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Porcentaje de ventas diarias que ocurren entre la apertura (8am) y la entrega (12-14hs)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Límites de Stock (%)</Label>
                  <div className="pt-6 px-2">
                    <Slider
                      defaultValue={[config.minStockPercentage, config.maxStockPercentage]}
                      max={200}
                      step={5}
                      onValueChange={(values) =>
                        setConfig({
                          ...config,
                          minStockPercentage: values[0],
                          maxStockPercentage: values[1],
                        })
                      }
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Mínimo: {config.minStockPercentage}%</span>
                    <span>Máximo: {config.maxStockPercentage}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Rango de stock objetivo como porcentaje de las ventas promedio
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="consider-seasonality">Considerar Estacionalidad</Label>
                      <Switch
                        id="consider-seasonality"
                        checked={config.considerSeasonality}
                        onCheckedChange={(checked) => setConfig({ ...config, considerSeasonality: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="require-approval">Requerir Aprobación</Label>
                      <Switch
                        id="require-approval"
                        checked={config.requireApproval}
                        onCheckedChange={(checked) => setConfig({ ...config, requireApproval: checked })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notify-creation">Notificar al Crear</Label>
                      <Switch
                        id="notify-creation"
                        checked={config.notifyOnCreation}
                        onCheckedChange={(checked) => setConfig({ ...config, notifyOnCreation: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="generate-spreadsheet">Generar Planilla</Label>
                      <Switch
                        id="generate-spreadsheet"
                        checked={config.generateSpreadsheet}
                        onCheckedChange={(checked) => setConfig({ ...config, generateSpreadsheet: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveConfig} disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Configuración
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spreadsheets Tab */}
          <TabsContent value="spreadsheets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Planillas Generadas</CardTitle>
                <CardDescription>Planillas de pedidos generadas automáticamente</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : spreadsheets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay planillas generadas</div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Local</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Archivo</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {spreadsheets.map((sheet) => (
                          <TableRow key={sheet.id}>
                            <TableCell>{sheet.locationName}</TableCell>
                            <TableCell>{format(new Date(sheet.createdAt), "dd/MM/yyyy", { locale: es })}</TableCell>
                            <TableCell>{sheet.fileName}</TableCell>
                            <TableCell>
                              <a
                                href={sheet.fileUrl}
                                className="flex items-center text-blue-600 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Descargar
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
