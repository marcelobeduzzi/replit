"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Wand2, Save, AlertTriangle } from "lucide-react"

interface StockDiscrepancy {
  id: string
  productName: string
  difference: number
  totalValue: number
  status: string
}

interface CashDiscrepancy {
  id: string
  paymentMethod: string
  difference: number
  status: string
}

interface ReconciliationMatch {
  id: string
  stockDiscrepancyId: string
  cashDiscrepancyId: string
  stockValue: number
  cashValue: number
  confidence: number
  selected: boolean
}

interface AutoReconcilePanelProps {
  stockDiscrepancies: StockDiscrepancy[]
  cashDiscrepancies: CashDiscrepancy[]
  reconciliationResults: any
  onRunReconciliation: () => void
  onSaveReconciliations: () => void
  isLoading: boolean
}

export function AutoReconcilePanel({
  stockDiscrepancies,
  cashDiscrepancies,
  reconciliationResults,
  onRunReconciliation,
  onSaveReconciliations,
  isLoading,
}: AutoReconcilePanelProps) {
  const [selectedMatches, setSelectedMatches] = useState<string[]>([])

  // Inicializar selectedMatches con las coincidencias preseleccionadas
  useState(() => {
    if (reconciliationResults && reconciliationResults.matches) {
      setSelectedMatches(
        reconciliationResults.matches
          .filter((match: ReconciliationMatch) => match.selected)
          .map((match: ReconciliationMatch) => match.id),
      )
    }
  })

  // Manejar selección de coincidencias
  const handleToggleMatch = (matchId: string) => {
    setSelectedMatches((prev) => {
      if (prev.includes(matchId)) {
        return prev.filter((id) => id !== matchId)
      } else {
        return [...prev, matchId]
      }
    })
  }

  // Seleccionar todas las coincidencias
  const handleSelectAll = () => {
    if (!reconciliationResults || !reconciliationResults.matches) return

    if (selectedMatches.length === reconciliationResults.matches.length) {
      setSelectedMatches([])
    } else {
      setSelectedMatches(reconciliationResults.matches.map((match: any) => match.id))
    }
  }

  // Obtener el nombre del método de pago
  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "cash":
        return "Efectivo"
      case "bank":
        return "Banco"
      case "card":
        return "Tarjeta"
      case "other":
        return "Otro"
      default:
        return method
    }
  }

  // Verificar si hay datos para conciliar
  const hasDataToReconcile = stockDiscrepancies.length > 0 && cashDiscrepancies.length > 0

  // Verificar si hay resultados de conciliación
  const hasReconciliationResults =
    reconciliationResults && reconciliationResults.matches && reconciliationResults.matches.length > 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conciliación Automática</CardTitle>
          <CardDescription>El sistema analizará las discrepancias y sugerirá posibles conciliaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Datos disponibles para conciliación</h3>
                <p className="text-sm text-muted-foreground">
                  {stockDiscrepancies.length} discrepancias de stock y {cashDiscrepancies.length} discrepancias de caja
                </p>
              </div>
              <Button onClick={onRunReconciliation} disabled={isLoading || !hasDataToReconcile}>
                <Wand2 className="mr-2 h-4 w-4" />
                Ejecutar Conciliación Automática
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !hasDataToReconcile ? (
              <div className="text-center py-8 border rounded-md">
                <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                <p className="text-muted-foreground">
                  No hay suficientes datos para realizar la conciliación automática
                </p>
              </div>
            ) : !hasReconciliationResults ? (
              <div className="text-center py-8 border rounded-md">
                <p className="text-muted-foreground">Ejecute la conciliación automática para ver los resultados</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedMatches.length === reconciliationResults.matches.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Valor Stock</TableHead>
                      <TableHead>Método de Pago</TableHead>
                      <TableHead>Valor Caja</TableHead>
                      <TableHead>Confianza</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliationResults.matches.map((match: any) => {
                      const stockItem = stockDiscrepancies.find((item) => item.id === match.stockDiscrepancyId)
                      const cashItem = cashDiscrepancies.find((item) => item.id === match.cashDiscrepancyId)

                      return (
                        <TableRow key={match.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedMatches.includes(match.id)}
                              onCheckedChange={() => handleToggleMatch(match.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {stockItem ? stockItem.productName : "Producto desconocido"}
                          </TableCell>
                          <TableCell className={match.stockValue < 0 ? "text-red-500" : "text-green-500"}>
                            ${Math.abs(match.stockValue).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {cashItem ? getPaymentMethodName(cashItem.paymentMethod) : "Desconocido"}
                          </TableCell>
                          <TableCell className={match.cashValue < 0 ? "text-red-500" : "text-green-500"}>
                            ${Math.abs(match.cashValue).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                match.confidence > 90 ? "success" : match.confidence > 70 ? "default" : "outline"
                              }
                            >
                              {match.confidence}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
        {hasReconciliationResults && (
          <CardFooter className="flex justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedMatches.length} de {reconciliationResults.matches.length} coincidencias seleccionadas
              </p>
            </div>
            <Button onClick={onSaveReconciliations} disabled={isLoading || selectedMatches.length === 0}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Conciliaciones
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conciliación Manual</CardTitle>
          <CardDescription>
            Concilie manualmente las discrepancias que no pudieron ser conciliadas automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 border rounded-md">
            <p className="text-muted-foreground">Funcionalidad de conciliación manual (implementación pendiente)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
