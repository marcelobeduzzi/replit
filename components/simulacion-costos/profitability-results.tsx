"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, Save } from "lucide-react"
import { useRef } from "react"

type ProfitabilityResult = {
  id: string
  product: string
  purchasePrice: number
  salePrice: number
  discount: number
  quantity: number
  additionalCosts: number
  currentProfitability: number
  newPurchasePrice: number
  newProfitability: number
  profitabilityDifference: number
  profitabilityPercentage: number
  newProfitabilityPercentage: number
}

type ProfitabilityResultsProps = {
  results: ProfitabilityResult[]
}

export function ProfitabilityResults({ results }: ProfitabilityResultsProps) {
  const tableRef = useRef<HTMLDivElement>(null)

  // Calcular totales
  const totalCurrentProfitability = results.reduce((sum, item) => sum + item.currentProfitability, 0)
  const totalNewProfitability = results.reduce((sum, item) => sum + item.newProfitability, 0)
  const totalDifference = totalNewProfitability - totalCurrentProfitability

  // Calcular porcentaje de mejora total
  const totalImprovementPercentage =
    totalCurrentProfitability !== 0 ? (totalDifference / totalCurrentProfitability) * 100 : 0

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = [
      "Producto",
      "Precio Compra",
      "Precio Venta",
      "Descuento",
      "Cantidad",
      "Costos Adicionales",
      "Rentabilidad Actual",
      "Nuevo Precio Compra",
      "Nueva Rentabilidad",
      "Diferencia",
      "% Rentabilidad Actual",
      "% Rentabilidad Nueva",
    ]

    const rows = results.map((item) => [
      item.product,
      item.purchasePrice.toFixed(2),
      item.salePrice.toFixed(2),
      `${item.discount}%`,
      item.quantity.toString(),
      item.additionalCosts.toFixed(2),
      item.currentProfitability.toFixed(2),
      item.newPurchasePrice.toFixed(2),
      item.newProfitability.toFixed(2),
      item.profitabilityDifference.toFixed(2),
      `${item.profitabilityPercentage.toFixed(2)}%`,
      `${item.newProfitabilityPercentage.toFixed(2)}%`,
    ])

    // Agregar fila de totales
    rows.push([
      "TOTAL",
      "",
      "",
      "",
      "",
      "",
      totalCurrentProfitability.toFixed(2),
      "",
      totalNewProfitability.toFixed(2),
      totalDifference.toFixed(2),
      "",
      "",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `simulacion_rentabilidad_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Guardar simulación
  const saveSimulation = () => {
    // Aquí se implementaría la lógica para guardar la simulación en la base de datos
    alert("Funcionalidad de guardado será implementada en una próxima versión")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Resultados de la Simulación</CardTitle>
            <CardDescription>Análisis de rentabilidad con los precios y descuentos aplicados</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" /> Exportar CSV
            </Button>
            <Button onClick={saveSimulation}>
              <Save className="mr-2 h-4 w-4" /> Guardar Simulación
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="table">
          <TabsList className="mb-6">
            <TabsTrigger value="table">Tabla</TabsTrigger>
            <TabsTrigger value="summary">Resumen</TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <div className="overflow-x-auto" ref={tableRef}>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Producto</th>
                    <th className="text-right py-3 px-2">Precio Compra</th>
                    <th className="text-right py-3 px-2">Precio Venta</th>
                    <th className="text-right py-3 px-2">Descuento</th>
                    <th className="text-right py-3 px-2">Cantidad</th>
                    <th className="text-right py-3 px-2">Rentabilidad Actual</th>
                    <th className="text-right py-3 px-2">Nuevo Precio Compra</th>
                    <th className="text-right py-3 px-2">Nueva Rentabilidad</th>
                    <th className="text-right py-3 px-2">Diferencia</th>
                    <th className="text-right py-3 px-2">% Mejora</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3 px-2">{item.product}</td>
                      <td className="text-right py-3 px-2">${item.purchasePrice.toFixed(2)}</td>
                      <td className="text-right py-3 px-2">${item.salePrice.toFixed(2)}</td>
                      <td className="text-right py-3 px-2">{item.discount}%</td>
                      <td className="text-right py-3 px-2">{item.quantity}</td>
                      <td className="text-right py-3 px-2">${item.currentProfitability.toFixed(2)}</td>
                      <td className="text-right py-3 px-2">${item.newPurchasePrice.toFixed(2)}</td>
                      <td className="text-right py-3 px-2">${item.newProfitability.toFixed(2)}</td>
                      <td
                        className={`text-right py-3 px-2 ${item.profitabilityDifference > 0 ? "text-green-600" : item.profitabilityDifference < 0 ? "text-red-600" : ""}`}
                      >
                        ${item.profitabilityDifference.toFixed(2)}
                      </td>
                      <td
                        className={`text-right py-3 px-2 ${item.profitabilityDifference > 0 ? "text-green-600" : item.profitabilityDifference < 0 ? "text-red-600" : ""}`}
                      >
                        {item.profitabilityDifference !== 0
                          ? `${((item.profitabilityDifference / item.currentProfitability) * 100).toFixed(2)}%`
                          : "0.00%"}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-50">
                    <td className="py-3 px-2">TOTAL</td>
                    <td className="text-right py-3 px-2"></td>
                    <td className="text-right py-3 px-2"></td>
                    <td className="text-right py-3 px-2"></td>
                    <td className="text-right py-3 px-2"></td>
                    <td className="text-right py-3 px-2">${totalCurrentProfitability.toFixed(2)}</td>
                    <td className="text-right py-3 px-2"></td>
                    <td className="text-right py-3 px-2">${totalNewProfitability.toFixed(2)}</td>
                    <td
                      className={`text-right py-3 px-2 ${totalDifference > 0 ? "text-green-600" : totalDifference < 0 ? "text-red-600" : ""}`}
                    >
                      ${totalDifference.toFixed(2)}
                    </td>
                    <td
                      className={`text-right py-3 px-2 ${totalDifference > 0 ? "text-green-600" : totalDifference < 0 ? "text-red-600" : ""}`}
                    >
                      {totalImprovementPercentage.toFixed(2)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Rentabilidad Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${totalCurrentProfitability.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Rentabilidad con Descuentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${totalNewProfitability.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Mejora en Rentabilidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-3xl font-bold ${totalDifference > 0 ? "text-green-600" : totalDifference < 0 ? "text-red-600" : ""}`}
                  >
                    ${totalDifference.toFixed(2)} ({totalImprovementPercentage.toFixed(2)}%)
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Productos con Mayor Impacto</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Producto</th>
                      <th className="text-right py-3 px-2">Diferencia</th>
                      <th className="text-right py-3 px-2">% Mejora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...results]
                      .sort((a, b) => Math.abs(b.profitabilityDifference) - Math.abs(a.profitabilityDifference))
                      .slice(0, 5)
                      .map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-3 px-2">{item.product}</td>
                          <td
                            className={`text-right py-3 px-2 ${item.profitabilityDifference > 0 ? "text-green-600" : item.profitabilityDifference < 0 ? "text-red-600" : ""}`}
                          >
                            ${item.profitabilityDifference.toFixed(2)}
                          </td>
                          <td
                            className={`text-right py-3 px-2 ${item.profitabilityDifference > 0 ? "text-green-600" : item.profitabilityDifference < 0 ? "text-red-600" : ""}`}
                          >
                            {item.profitabilityDifference !== 0
                              ? `${((item.profitabilityDifference / item.currentProfitability) * 100).toFixed(2)}%`
                              : "0.00%"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

