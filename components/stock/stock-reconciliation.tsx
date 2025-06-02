"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { mockProducts } from "@/lib/mock-data"
import { dbService } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

export function StockReconciliation({ stockData, onComplete }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alertsGenerated, setAlertsGenerated] = useState(false)

  // Función para calcular las diferencias de stock
  const calculateDifferences = () => {
    // Obtener productos del stock inicial
    const initialProducts = stockData.inicial.products || []

    // Obtener productos del stock de cierre
    const finalProducts = stockData.cierre.products || []

    // Obtener ingresos
    const ingresos = stockData.ingresos || []

    // Obtener decomisos
    const decomisos = stockData.decomisos || []

    // Obtener ventas
    const ventas = stockData.ventas?.items || []

    // Calcular diferencias
    const differences = initialProducts.map((initialProduct) => {
      // Buscar el producto en el stock final
      const finalProduct = finalProducts.find((p) => p.id === initialProduct.id) || { quantity: 0 }

      // Buscar el producto en las ventas
      const salesProduct = ventas.find((p) => p.productId === initialProduct.id)
      const salesQuantity = salesProduct ? salesProduct.quantity : 0

      // Calcular ingresos para este producto
      const ingresosQuantity = ingresos.reduce((total, ingreso) => {
        const item = ingreso.items.find((i) => i.productId === initialProduct.id)
        return total + (item ? item.quantity : 0)
      }, 0)

      // Calcular decomisos para este producto
      const decomisosQuantity = decomisos.reduce((total, decomiso) => {
        const item = decomiso.items.find((i) => i.productId === initialProduct.id)
        return total + (item ? item.quantity : 0)
      }, 0)

      // Calcular stock esperado
      const expectedQuantity = initialProduct.quantity + ingresosQuantity - salesQuantity - decomisosQuantity

      // Calcular diferencia
      const difference = finalProduct.quantity - expectedQuantity

      // Calcular porcentaje de diferencia
      const percentageDifference = expectedQuantity !== 0 ? (difference / expectedQuantity) * 100 : 0

      // Obtener información del producto
      const productInfo = mockProducts.find((p) => p.id === initialProduct.id) || {
        name: initialProduct.name,
        price: 0,
      }

      return {
        id: initialProduct.id,
        name: productInfo.name,
        initialQuantity: initialProduct.quantity,
        ingresos: ingresosQuantity,
        ventas: salesQuantity,
        decomisos: decomisosQuantity,
        expectedQuantity,
        finalQuantity: finalProduct.quantity,
        difference,
        percentageDifference,
        monetaryValue: Math.abs(difference) * productInfo.price,
      }
    })

    return differences
  }

  const differences = calculateDifferences()

  // Filtrar diferencias significativas (más del 2% o más de 5 unidades)
  const significantDifferences = differences.filter(
    (diff) => Math.abs(diff.percentageDifference) > 2 || Math.abs(diff.difference) >= 5,
  )

  // Calcular impacto financiero total
  const totalFinancialImpact = differences.reduce((total, diff) => {
    return total + (diff.difference < 0 ? diff.monetaryValue : 0)
  }, 0)

  // Función para generar alertas
  const generateAlerts = async () => {
    setIsSubmitting(true)

    try {
      // Generar alertas para diferencias significativas
      for (const diff of significantDifferences) {
        if (diff.difference < 0) {
          // Solo alertas para faltantes
          const alertData = {
            local_id: stockData.ventas?.localId || "local-1",
            local_name: stockData.ventas?.localName || "BR Cabildo",
            date: new Date().toISOString(),
            shift: stockData.ventas?.shift || "mañana",
            user_id: stockData.cierre?.userId || "user-1",
            type: "stock",
            severity:
              Math.abs(diff.percentageDifference) > 10
                ? "alta"
                : Math.abs(diff.percentageDifference) > 5
                  ? "media"
                  : "baja",
            title: `Diferencia en ${diff.name}`,
            description: `Faltante de ${Math.abs(diff.difference)} unidades de ${diff.name} (${Math.abs(diff.percentageDifference).toFixed(1)}% del stock esperado)`,
            difference_amount: diff.difference,
            difference_percentage: diff.percentageDifference,
            monetary_value: diff.monetaryValue,
            context: `Stock inicial: ${diff.initialQuantity}, Ingresos: ${diff.ingresos}, Ventas: ${diff.ventas}, Decomisos: ${diff.decomisos}, Stock esperado: ${diff.expectedQuantity}, Stock final: ${diff.finalQuantity}`,
            status: "pendiente",
          }

          try {
            // Intentar guardar en Supabase
            const { error } = await dbService.supabase.from("alerts").insert(alertData)

            if (error) {
              console.error("Error al guardar alerta en Supabase:", error)
              // Continuar con el siguiente aunque haya error
            }
          } catch (dbError) {
            console.error("Error de conexión con Supabase:", dbError)
            // Continuar con el siguiente aunque haya error
          }

          // Guardar en localStorage para pruebas
          const localAlerts = JSON.parse(localStorage.getItem("localAlerts") || "[]")
          localAlerts.push({
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...alertData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          localStorage.setItem("localAlerts", JSON.stringify(localAlerts))
        }
      }

      // Si hay un impacto financiero significativo, generar una alerta general
      if (totalFinancialImpact > 5000) {
        const alertData = {
          local_id: stockData.ventas?.localId || "local-1",
          local_name: stockData.ventas?.localName || "BR Cabildo",
          date: new Date().toISOString(),
          shift: stockData.ventas?.shift || "mañana",
          user_id: stockData.cierre?.userId || "user-1",
          type: "stock",
          severity: totalFinancialImpact > 20000 ? "alta" : totalFinancialImpact > 10000 ? "media" : "baja",
          title: "Impacto financiero significativo",
          description: `Impacto financiero total de ${formatCurrency(totalFinancialImpact)} por faltantes de stock`,
          difference_amount: null,
          difference_percentage: null,
          monetary_value: totalFinancialImpact,
          context: `Reconciliación de stock del ${new Date().toLocaleDateString()}`,
          status: "pendiente",
        }

        try {
          // Intentar guardar en Supabase
          const { error } = await dbService.supabase.from("alerts").insert(alertData)

          if (error) {
            console.error("Error al guardar alerta en Supabase:", error)
          }
        } catch (dbError) {
          console.error("Error de conexión con Supabase:", dbError)
        }

        // Guardar en localStorage para pruebas
        const localAlerts = JSON.parse(localStorage.getItem("localAlerts") || "[]")
        localAlerts.push({
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...alertData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        localStorage.setItem("localAlerts", JSON.stringify(localAlerts))
      }

      setAlertsGenerated(true)
      toast({
        title: "Alertas generadas",
        description: `Se han generado ${significantDifferences.filter((d) => d.difference < 0).length} alertas por diferencias de stock.`,
      })

      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error("Error al generar alertas:", error)
      toast({
        title: "Error",
        description: "No se pudieron generar las alertas. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Productos con Diferencias</p>
              <p className="text-2xl font-bold">{significantDifferences.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Faltantes</p>
              <p className="text-2xl font-bold text-red-500">
                {significantDifferences.filter((d) => d.difference < 0).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Impacto Financiero</p>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(totalFinancialImpact)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Reconciliación de Stock</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Stock Inicial</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Ventas</TableHead>
              <TableHead className="text-right">Decomisos</TableHead>
              <TableHead className="text-right">Stock Esperado</TableHead>
              <TableHead className="text-right">Stock Final</TableHead>
              <TableHead className="text-right">Diferencia</TableHead>
              <TableHead className="text-right">Impacto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {differences.map((diff) => (
              <TableRow key={diff.id} className={Math.abs(diff.percentageDifference) > 2 ? "bg-muted/50" : ""}>
                <TableCell>{diff.name}</TableCell>
                <TableCell className="text-right">{diff.initialQuantity}</TableCell>
                <TableCell className="text-right">{diff.ingresos}</TableCell>
                <TableCell className="text-right">{diff.ventas}</TableCell>
                <TableCell className="text-right">{diff.decomisos}</TableCell>
                <TableCell className="text-right">{diff.expectedQuantity}</TableCell>
                <TableCell className="text-right">{diff.finalQuantity}</TableCell>
                <TableCell className="text-right">
                  <span className={diff.difference < 0 ? "text-red-500" : diff.difference > 0 ? "text-green-500" : ""}>
                    {diff.difference > 0 ? "+" : ""}
                    {diff.difference} ({diff.percentageDifference.toFixed(1)}%)
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {diff.difference !== 0 && (
                    <Badge variant={diff.difference < 0 ? "destructive" : "outline"}>
                      {formatCurrency(diff.monetaryValue)}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-medium">
              <TableCell colSpan={7} className="text-right">
                Impacto Financiero Total:
              </TableCell>
              <TableCell colSpan={2} className="text-right text-red-500">
                {formatCurrency(totalFinancialImpact)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => window.print()}>
          Imprimir Reporte
        </Button>
        <Button onClick={generateAlerts} disabled={isSubmitting || alertsGenerated}>
          {isSubmitting ? "Generando..." : alertsGenerated ? "Alertas Generadas" : "Generar Alertas"}
        </Button>
      </div>
    </div>
  )
}





