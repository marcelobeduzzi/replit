"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ReconciliationService } from "@/lib/reconciliation-service"
import { toast } from "@/components/ui/use-toast"

interface CashDiscrepancyTableProps {
  discrepancies: any[]
  isLoading: boolean
  localId?: number
  date?: string
  shift?: string
}

export function CashDiscrepancyTable({ discrepancies, isLoading, localId, date, shift }: CashDiscrepancyTableProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateDiscrepancies = async () => {
    if (!localId || !date) {
      toast({
        title: "Error",
        description: "Faltan datos necesarios para generar discrepancias",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)

      // Llamar a la función para generar discrepancias de caja
      const result = await ReconciliationService.generateCashDiscrepancies(date, localId, shift)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message || "Discrepancias de caja generadas correctamente",
        })

        // Recargar la página para mostrar las nuevas discrepancias
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudieron generar las discrepancias de caja",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error al generar discrepancias de caja:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron generar las discrepancias de caja",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGoToGenerateDiscrepancies = () => {
    if (localId) {
      const queryParams = new URLSearchParams()
      queryParams.append("localId", localId.toString())
      if (date) queryParams.append("date", date)
      if (shift) queryParams.append("shift", shift)
      queryParams.append("forceCashDiscrepancies", "true")

      router.push(`/conciliacion/generar?${queryParams.toString()}`)
    } else {
      router.push("/conciliacion/generar")
    }
  }

  if (isLoading || isGenerating) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          {isGenerating ? "Generando discrepancias..." : "Cargando..."}
        </span>
      </div>
    )
  }

  if (discrepancies.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
        <p className="text-muted-foreground mb-4">No hay discrepancias de caja para mostrar</p>
        {localId && date && (
          <div className="mt-2">
            <p className="text-sm text-amber-600 mb-4">
              Si sabes que hay cierres de caja para esta fecha y turno pero no aparecen discrepancias, puedes intentar
              generarlas manualmente.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2">
              <Button variant="outline" onClick={handleGenerateDiscrepancies} disabled={isGenerating}>
                Generar discrepancias de caja ahora
              </Button>
              <Button variant="secondary" onClick={handleGoToGenerateDiscrepancies} disabled={isGenerating}>
                Ir a la página de generación
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Método de Pago</TableHead>
            <TableHead className="text-right">Monto Esperado</TableHead>
            <TableHead className="text-right">Monto Real</TableHead>
            <TableHead className="text-right">Diferencia</TableHead>
            <TableHead className="text-right">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {discrepancies.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.paymentMethod === "cash"
                  ? "Efectivo"
                  : item.paymentMethod === "card"
                    ? "Tarjeta"
                    : item.paymentMethod === "transfer"
                      ? "Transferencia"
                      : item.paymentMethod === "other"
                        ? "Otros"
                        : item.paymentMethod}
              </TableCell>
              <TableCell className="text-right">${item.expectedAmount.toLocaleString()}</TableCell>
              <TableCell className="text-right">${item.actualAmount.toLocaleString()}</TableCell>
              <TableCell className="text-right font-medium">
                <span
                  className={
                    item.difference === 0 ? "text-green-600" : item.difference > 0 ? "text-amber-600" : "text-red-600"
                  }
                >
                  ${Math.abs(item.difference).toLocaleString()}
                  {item.difference > 0 ? " (sobrante)" : item.difference < 0 ? " (faltante)" : ""}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={
                    item.status === "reconciled"
                      ? "success"
                      : item.status === "unreconciled"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {item.status === "reconciled"
                    ? "Conciliado"
                    : item.status === "unreconciled"
                      ? "No Conciliado"
                      : "Pendiente"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
