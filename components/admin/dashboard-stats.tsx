"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, DollarSign, Package, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react"

interface DashboardStatsProps {
  stats?: {
    totalAlerts: number
    pendingAlerts: number
    resolvedAlerts: number
    highSeverity: number
    stockAlerts: number
    cashAlerts: number
    decomisoAlerts: number
    totalImpact: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  // Valores por defecto si no se proporcionan estadísticas
  const defaultStats = {
    totalAlerts: 0,
    pendingAlerts: 0,
    resolvedAlerts: 0,
    highSeverity: 0,
    stockAlerts: 0,
    cashAlerts: 0,
    decomisoAlerts: 0,
    totalImpact: 0,
  }

  const displayStats = stats || defaultStats

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas Totales</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{displayStats.totalAlerts}</div>
          <p className="text-xs text-muted-foreground">{displayStats.pendingAlerts} pendientes</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Impacto Financiero</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(displayStats.totalImpact)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-red-500 flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-1" />+{formatCurrency(displayStats.totalImpact * 0.1)} vs. mes
              anterior
            </span>
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas de Stock</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{displayStats.stockAlerts}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500 flex items-center">
              <ArrowDownRight className="h-4 w-4 mr-1" />
              -5% vs. mes anterior
            </span>
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tiempo de Resolución</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">24h</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500 flex items-center">
              <ArrowDownRight className="h-4 w-4 mr-1" />
              -2h vs. mes anterior
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

