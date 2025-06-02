"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConciliationSummaryCard } from "./conciliation-summary-card"

interface ConciliationDashboardCardProps {
  stockDiscrepancies: any[]
  cashDiscrepancies: any[]
  date?: string
  localName?: string
}

export function ConciliationDashboardCard({
  stockDiscrepancies,
  cashDiscrepancies,
  date,
  localName,
}: ConciliationDashboardCardProps) {
  // Calcular totales
  const totalStockValue = stockDiscrepancies.reduce((sum, item) => sum + (item.totalValue || 0), 0)
  const totalCashValue = cashDiscrepancies.reduce((sum, item) => sum + (item.difference || 0), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conciliación Stock-Caja</CardTitle>
      </CardHeader>
      <CardContent>
        <ConciliationSummaryCard
          stockValue={totalStockValue}
          cashValue={totalCashValue}
          date={date}
          localName={localName}
        />
      </CardContent>
    </Card>
  )
}