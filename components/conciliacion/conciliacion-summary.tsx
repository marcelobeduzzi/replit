import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp, DollarSign, BarChart3 } from "lucide-react"

interface ConciliacionSummaryProps {
  stats: {
    totalStockDiscrepancies: number
    totalCashDiscrepancies: number
    totalStockValue: number
    totalCashValue: number
    netDifference: number
    reconciliationPercentage: number
  }
  date: string
  localName: string
  isLoading: boolean
}

export function ConciliacionSummary({ stats, date, localName, isLoading }: ConciliacionSummaryProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Conciliación</CardTitle>
          <CardDescription>
            {localName ? `${localName} - ${date}` : "Seleccione un local y fecha para ver el resumen"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-8 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Discrepancias de Stock</p>
                      <h3 className="text-2xl font-bold">{stats.totalStockDiscrepancies}</h3>
                    </div>
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Discrepancias de Caja</p>
                      <h3 className="text-2xl font-bold">{stats.totalCashDiscrepancies}</h3>
                    </div>
                    <DollarSign className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Valor Total Stock</p>
                      <h3 className="text-2xl font-bold">${stats.totalStockValue.toLocaleString()}</h3>
                    </div>
                    <TrendingDown
                      className={`h-8 w-8 ${stats.totalStockValue > 0 ? "text-red-500" : "text-green-500"}`}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Valor Total Caja</p>
                      <h3 className="text-2xl font-bold">${stats.totalCashValue.toLocaleString()}</h3>
                    </div>
                    <TrendingUp className={`h-8 w-8 ${stats.totalCashValue > 0 ? "text-green-500" : "text-red-500"}`} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Diferencia Neta</p>
                      <h3 className="text-2xl font-bold">${Math.abs(stats.netDifference).toLocaleString()}</h3>
                    </div>
                    {Math.abs(stats.netDifference) > 0 ? (
                      <AlertTriangle className="h-8 w-8 text-amber-500" />
                    ) : (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conciliación</p>
                      <h3 className="text-2xl font-bold">{stats.reconciliationPercentage.toFixed(1)}%</h3>
                    </div>
                    {stats.reconciliationPercentage >= 90 ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : stats.reconciliationPercentage >= 50 ? (
                      <AlertTriangle className="h-8 w-8 text-amber-500" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráficos y tendencias */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Tendencias</CardTitle>
          <CardDescription>Evolución de discrepancias en los últimos 30 días</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : !localName ? (
            <p className="text-muted-foreground">Seleccione un local para ver las tendencias</p>
          ) : (
            <div className="w-full h-full flex items-center justify-center border rounded-md">
              <p className="text-muted-foreground">Gráfico de tendencias (implementación pendiente)</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
