"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { dbService } from "@/lib/db-service"
import { exportToCSV } from "@/lib/export-utils"
import type { Report } from "@/types"
import { Download, BarChartIcon, PieChartIcon, LineChartIcon, Calendar, FileText } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, PieChart } from "@/components/charts"

export default function ReportesPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Obtener reportes
        const reportData = await dbService.generateReports()
        setReports(reportData)
      } catch (error) {
        console.error("Error al cargar reportes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedYear])

  const handleExportCSV = (report: Report) => {
    // Preparar datos para exportar
    const data = []

    // Extraer datos del reporte según su estructura
    if (report.data && report.data.labels && report.data.datasets) {
      const { labels, datasets } = report.data

      // Para cada etiqueta, crear una fila con los valores de cada dataset
      labels.forEach((label: string, index: number) => {
        const row: Record<string, any> = { Etiqueta: label }

        // Agregar valores de cada dataset
        datasets.forEach((dataset: any, datasetIndex: number) => {
          const datasetName = dataset.label || `Dataset ${datasetIndex + 1}`
          row[datasetName] = dataset.data[index]
        })

        data.push(row)
      })
    }

    exportToCSV(data, `reporte_${report.name.replace(/\s+/g, "_").toLowerCase()}`)
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
            <p className="text-muted-foreground">Visualiza y exporta reportes del sistema</p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
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
        </div>

        <Tabs defaultValue="facturacion">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="facturacion">Facturación</TabsTrigger>
            <TabsTrigger value="nomina">Nómina</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
          </TabsList>

          <TabsContent value="facturacion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Facturación por Local</CardTitle>
                <CardDescription>Comparativa de facturación mensual por local</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {reports.find((r) => r.name === "Facturación por Local") ? (
                  <BarChart data={reports.find((r) => r.name === "Facturación por Local")?.data || {}} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-muted-foreground">Cargando datos...</p>
                  </div>
                )}
              </CardContent>
              <div className="px-6 pb-6">
                <Button
                  variant="outline"
                  onClick={() => handleExportCSV(reports.find((r) => r.name === "Facturación por Local") as Report)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Datos
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="nomina" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Facturación vs Gastos de Nómina</CardTitle>
                <CardDescription>Comparativa entre facturación total y gastos de nómina</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {reports.find((r) => r.name === "Facturación vs Gastos de Nómina") ? (
                  <BarChart data={reports.find((r) => r.name === "Facturación vs Gastos de Nómina")?.data || {}} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-muted-foreground">Cargando datos...</p>
                  </div>
                )}
              </CardContent>
              <div className="px-6 pb-6">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportCSV(reports.find((r) => r.name === "Facturación vs Gastos de Nómina") as Report)
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Datos
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Pedidos por Plataforma</CardTitle>
                <CardDescription>Evolución semanal de pedidos por plataforma de delivery</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {reports.find((r) => r.name === "Evolución de Pedidos por Plataforma") ? (
                  <LineChart data={reports.find((r) => r.name === "Evolución de Pedidos por Plataforma")?.data || {}} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-muted-foreground">Cargando datos...</p>
                  </div>
                )}
              </CardContent>
              <div className="px-6 pb-6">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportCSV(reports.find((r) => r.name === "Evolución de Pedidos por Plataforma") as Report)
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Datos
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="ingresos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Ingresos por Local</CardTitle>
                <CardDescription>Distribución porcentual de ingresos por local</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {reports.find((r) => r.name === "Distribución de Ingresos por Local") ? (
                  <PieChart data={reports.find((r) => r.name === "Distribución de Ingresos por Local")?.data || {}} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-muted-foreground">Cargando datos...</p>
                  </div>
                )}
              </CardContent>
              <div className="px-6 pb-6">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportCSV(reports.find((r) => r.name === "Distribución de Ingresos por Local") as Report)
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Datos
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reportes Disponibles</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
              <div className="text-xs text-muted-foreground">Reportes generados automáticamente</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipos de Gráficos</CardTitle>
              <div className="flex space-x-1">
                <BarChartIcon className="h-4 w-4 text-muted-foreground" />
                <LineChartIcon className="h-4 w-4 text-muted-foreground" />
                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <div className="text-xs text-muted-foreground">Barras, líneas y torta</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Actualización</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Date().toLocaleDateString()}</div>
              <div className="text-xs text-muted-foreground">{new Date().toLocaleTimeString()}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

