import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ArrowUpDown } from 'lucide-react'
import { salesService } from "@/lib/sales-service"
import { ResolveAlertButton } from "./resolve-alert-button"

export const metadata = {
  title: "Alertas de Stock Bajo - Sistema de Ventas",
}

export default async function StockAlertsPage() {
  let alerts = []
  
  try {
    alerts = await salesService.getActiveStockAlerts()
  } catch (error) {
    console.error("Error al cargar alertas de stock:", error)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Alertas de Stock Bajo</h1>
          <Badge variant="destructive" className="text-sm">
            {alerts.length}
          </Badge>
        </div>
        <Link href="/ventas/inventario/ajuste">
          <Button>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Ajustar Inventario
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos con Stock Bajo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Stock Actual</TableHead>
                <TableHead className="text-right">Stock Mínimo</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay alertas de stock bajo activas. ¡Todo está en orden!
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">
                      {alert.product?.name || "Producto desconocido"}
                    </TableCell>
                    <TableCell>
                      {alert.product?.category?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {alert.currentQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {alert.minQuantity}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive" className="flex items-center justify-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Stock Bajo
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/ventas/inventario/ajuste?productId=${alert.productId}`}>
                          <Button variant="outline" size="sm">
                            Ajustar
                          </Button>
                        </Link>
                        <ResolveAlertButton alertId={alert.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}