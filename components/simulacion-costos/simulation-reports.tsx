"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, BarChart, PieChart, LineChart } from "lucide-react"

export default function SimulationReports() {
  const [reportType, setReportType] = useState<"profitability" | "suppliers" | "trends">("profitability")
  const [timeframe, setTimeframe] = useState<"week" | "month" | "quarter" | "year">("month")
  const [brand, setBrand] = useState<"brozziano" | "dean_dennys" | "all">("all")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reportes y Análisis</CardTitle>
          <CardDescription>Visualice y exporte reportes de rentabilidad, proveedores y tendencias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Reporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profitability">Rentabilidad</SelectItem>
                  <SelectItem value="suppliers">Proveedores</SelectItem>
                  <SelectItem value="trends">Tendencias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mes</SelectItem>
                  <SelectItem value="quarter">Último Trimestre</SelectItem>
                  <SelectItem value="year">Último Año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={brand} onValueChange={(v) => setBrand(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Marcas</SelectItem>
                  <SelectItem value="brozziano">Brozziano</SelectItem>
                  <SelectItem value="dean_dennys">Dean & Dennys</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button>
              <Download className="mr-2 h-4 w-4" /> Exportar Reporte
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="chart">Gráfico</TabsTrigger>
          <TabsTrigger value="table">Tabla</TabsTrigger>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType === "profitability" && "Análisis de Rentabilidad"}
                {reportType === "suppliers" && "Análisis de Proveedores"}
                {reportType === "trends" && "Análisis de Tendencias"}
              </CardTitle>
              <CardDescription>
                {reportType === "profitability" && "Visualización de la rentabilidad por producto y categoría"}
                {reportType === "suppliers" && "Comparativa de precios y descuentos por proveedor"}
                {reportType === "trends" && "Evolución de precios y rentabilidad en el tiempo"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full flex items-center justify-center bg-gray-100 rounded-md">
                {reportType === "profitability" && (
                  <div className="text-center">
                    <BarChart className="h-16 w-16 mx-auto text-gray-400" />
                    <p className="mt-4 text-gray-500">Gráfico de Rentabilidad por Producto</p>
                    <p className="text-sm text-gray-400">
                      Los datos se mostrarán aquí cuando haya simulaciones guardadas
                    </p>
                  </div>
                )}

                {reportType === "suppliers" && (
                  <div className="text-center">
                    <PieChart className="h-16 w-16 mx-auto text-gray-400" />
                    <p className="mt-4 text-gray-500">Gráfico de Distribución por Proveedor</p>
                    <p className="text-sm text-gray-400">
                      Los datos se mostrarán aquí cuando haya proveedores con precios registrados
                    </p>
                  </div>
                )}

                {reportType === "trends" && (
                  <div className="text-center">
                    <LineChart className="h-16 w-16 mx-auto text-gray-400" />
                    <p className="mt-4 text-gray-500">Gráfico de Tendencias de Precios</p>
                    <p className="text-sm text-gray-400">
                      Los datos se mostrarán aquí cuando haya un historial de precios
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Datos Detallados</CardTitle>
              <CardDescription>Vista tabular de los datos del reporte</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      {reportType === "profitability" && (
                        <>
                          <th className="text-left py-3 px-2">Producto</th>
                          <th className="text-left py-3 px-2">Categoría</th>
                          <th className="text-right py-3 px-2">Precio Compra</th>
                          <th className="text-right py-3 px-2">Precio Venta</th>
                          <th className="text-right py-3 px-2">Rentabilidad</th>
                          <th className="text-right py-3 px-2">% Rentabilidad</th>
                        </>
                      )}

                      {reportType === "suppliers" && (
                        <>
                          <th className="text-left py-3 px-2">Proveedor</th>
                          <th className="text-left py-3 px-2">Producto</th>
                          <th className="text-right py-3 px-2">Precio Base</th>
                          <th className="text-right py-3 px-2">Descuento</th>
                          <th className="text-right py-3 px-2">Precio Final</th>
                          <th className="text-center py-3 px-2">Última Actualización</th>
                        </>
                      )}

                      {reportType === "trends" && (
                        <>
                          <th className="text-left py-3 px-2">Fecha</th>
                          <th className="text-left py-3 px-2">Producto</th>
                          <th className="text-right py-3 px-2">Precio Compra</th>
                          <th className="text-right py-3 px-2">Precio Venta</th>
                          <th className="text-right py-3 px-2">Variación</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-2 text-center" colSpan={6}>
                        No hay datos disponibles para mostrar
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Resumen Ejecutivo</CardTitle>
              <CardDescription>Resumen de los principales indicadores y métricas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Rentabilidad Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">--</p>
                    <p className="text-sm text-gray-500">Sin datos disponibles</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Mejor Proveedor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">--</p>
                    <p className="text-sm text-gray-500">Sin datos disponibles</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Producto Más Rentable</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">--</p>
                    <p className="text-sm text-gray-500">Sin datos disponibles</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Recomendaciones</h3>
                <p className="text-gray-500">
                  Las recomendaciones se generarán automáticamente cuando haya datos suficientes para analizar.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

