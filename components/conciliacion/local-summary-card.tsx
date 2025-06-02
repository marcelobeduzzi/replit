"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react"
import { format } from "date-fns"

interface LocalSummaryCardProps {
  local: {
    id: number
    name: string
    code?: string // Añadido para almacenar el código de texto del local
    hasTwoCashRegisters?: boolean
    stockDiscrepancies: number
    cashDiscrepancies: number
    stockValue: number
    cashValue: number
    totalDiscrepancies: number
    totalValue: number
    trend: "up" | "down"
    percentChange: number
    lastDiscrepancyDate?: Date | null
    hasData: boolean
  }
  onClick: () => void
}

export function LocalSummaryCard({ local, onClick }: LocalSummaryCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle>{local.name}</CardTitle>
          {local.hasTwoCashRegisters && <Badge variant="outline">2 cajas</Badge>}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Discrepancias Stock</p>
            <p className="text-xl font-semibold">{local.stockDiscrepancies}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Discrepancias Caja</p>
            <p className="text-xl font-semibold">{local.cashDiscrepancies}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-xl font-semibold">${local.totalValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tendencia</p>
            <div className="flex items-center">
              {local.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              )}
              <span className={local.trend === "up" ? "text-red-500" : "text-green-500"}>{local.percentChange}%</span>
            </div>
          </div>
        </div>

        {local.lastDiscrepancyDate && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">
              Última discrepancia: {format(new Date(local.lastDiscrepancyDate), "dd/MM/yyyy")}
            </p>
          </div>
        )}

        {!local.hasData && (
          <div className="mt-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
              Sin discrepancias recientes
            </Badge>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" className="w-full" onClick={onClick}>
          Ver Detalle
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
