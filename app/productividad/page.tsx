"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { addDays } from "date-fns"
import { Download, RefreshCw } from "lucide-react"
import { EmployeeProductivityTable } from "@/components/productivity/employee-productivity-table"
import { ProductivityScorecard } from "@/components/productivity/productivity-scorecard"
import { ProductivityChart } from "@/components/productivity/productivity-chart"
import { ProductivityFactors } from "@/components/productivity/productivity-factors"
import { ProductivityTrends } from "@/components/productivity/productivity-trends"
import { mockEmployeeProductivityData } from "@/lib/mock-productivity-data"

export default function ProductivityPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [isLoading, setIsLoading] = useState(false)

  // Función para refrescar los datos
  const refreshData = () => {
    setIsLoading(true)
    // Simular carga de datos
    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Productividad de Empleados</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar local" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los locales</SelectItem>
              <SelectItem value="local-1">BR Cabildo</SelectItem>
              <SelectItem value="local-2">BR Carranza</SelectItem>
              <SelectItem value="local-3">BR Pacífico</SelectItem>
              <SelectItem value="local-4">BR Local 4</SelectItem>
              <SelectItem value="local-5">BR Local 5</SelectItem>
            </SelectContent>
          </Select>

          <DatePickerWithRange date={dateRange} setDate={setDateRange} />

          <Button variant="outline" onClick={refreshData} disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Actualizar</span>
          </Button>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="factors">Factores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ProductivityScorecard
              title="Productividad Promedio"
              value={78}
              change={2.5}
              trend="up"
              description="Puntos de productividad"
            />
            <ProductivityScorecard
              title="Empleado Más Productivo"
              value="Juan Pérez"
              score={92}
              description="92 puntos"
            />
            <ProductivityScorecard
              title="Empleado Menos Productivo"
              value="María López"
              score={65}
              description="65 puntos"
              trend="down"
            />
            <ProductivityScorecard
              title="Local Más Productivo"
              value="BR Cabildo"
              score={85}
              description="85 puntos promedio"
              trend="up"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Tendencia de Productividad</CardTitle>
                <CardDescription>Evolución de la productividad en el período seleccionado</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductivityChart data={mockEmployeeProductivityData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Factores de Impacto</CardTitle>
                <CardDescription>Factores que afectan la productividad</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductivityFactors />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Empleados</CardTitle>
              <CardDescription>Los empleados con mejor desempeño</CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeeProductivityTable data={mockEmployeeProductivityData.slice(0, 5)} showPagination={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Productividad Detallada</CardTitle>
              <CardDescription>Desglose completo de productividad por empleado</CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeeProductivityTable data={mockEmployeeProductivityData} showPagination={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Productividad</CardTitle>
              <CardDescription>Análisis de tendencias a lo largo del tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductivityTrends />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors">
          <Card>
            <CardHeader>
              <CardTitle>Factores que Afectan la Productividad</CardTitle>
              <CardDescription>Análisis detallado de los factores externos e internos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Factores Externos</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Clima</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          Los días de lluvia reducen las ventas esperadas en aproximadamente un 25%.
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-muted p-2 rounded-md">
                            <span className="font-medium">Días de lluvia:</span> 7
                          </div>
                          <div className="bg-muted p-2 rounded-md">
                            <span className="font-medium">Impacto:</span> -8.5%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Días Festivos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          La noche anterior a un día festivo se vende como fin de semana, mientras que el día festivo
                          mismo se comporta como un día de baja afluencia.
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-muted p-2 rounded-md">
                            <span className="font-medium">Días festivos:</span> 2
                          </div>
                          <div className="bg-muted p-2 rounded-md">
                            <span className="font-medium">Impacto:</span> +3.2%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Factores Internos</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Asistencia</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          Las llegadas tardías y ausencias afectan significativamente la productividad.
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="bg-muted p-2 rounded-md">
                            <span className="font-medium">Llegadas tardías:</span> 12
                          </div>
                          <div className="bg-muted p-2 rounded-md">
                            <span className="font-medium">Ausencias:</span> 3
                          </div>
                          <div className="bg-muted p-2 rounded-md">
                            <span className="font-medium">Impacto:</span> -15.3%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Diferencias en Caja/Stock</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          Las diferencias superiores a los umbrales establecidos generan penalizaciones.
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="bg-muted p-2 rounded-md">
                            <span className="font-medium">Diferencias caja &gt;1.5%:</span> 2
                          </div>
                          <div className="bg-muted p-2 rounded-md">
                            <span className="font-medium">Diferencias stock &gt;1%:</span> 4
                          </div>
                          <div className="bg-muted p-2 rounded-md">
                            <span className="font-medium">Impacto:</span> -10.8%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Decomisos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          Los decomisos superiores al 2% generan penalizaciones en la productividad.
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="bg-muted p-2 rounded-md">
                            <span className="font-medium">Decomisos &gt;2%:</span> 3
                          </div>
                          <div className="bg-muted p-2 rounded-md">
                            <span className="font-medium">Productos afectados:</span> 5
                          </div>
                          <div className="bg-muted p-2 rounded-md">
                            <span className="font-medium">Impacto:</span> -7.5%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

