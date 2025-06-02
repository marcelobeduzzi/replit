"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface StockDiscrepancyTableProps {
  discrepancies: any[]
  isLoading: boolean
}

export function StockDiscrepancyTable({ discrepancies, isLoading }: StockDiscrepancyTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (discrepancies.length === 0) {
    return <p className="text-center py-4 text-muted-foreground">No hay discrepancias de stock para mostrar</p>
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Esperado</TableHead>
            <TableHead className="text-right">Real</TableHead>
            <TableHead className="text-right">Diferencia</TableHead>
            <TableHead className="text-right">Valor Unitario</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
            <TableHead className="text-right">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {discrepancies.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.productName}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell className="text-right">{item.expectedQuantity}</TableCell>
              <TableCell className="text-right">{item.actualQuantity}</TableCell>
              <TableCell className="text-right font-medium">
                <span
                  className={
                    item.difference === 0 ? "text-green-600" : item.difference > 0 ? "text-amber-600" : "text-red-600"
                  }
                >
                  {item.difference}
                </span>
              </TableCell>
              <TableCell className="text-right">${item.unitCost?.toLocaleString()}</TableCell>
              <TableCell className="text-right">${item.totalValue?.toLocaleString()}</TableCell>
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
