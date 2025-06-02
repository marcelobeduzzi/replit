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
import { Plus, ArrowUpDown, AlertTriangle } from 'lucide-react'
import { salesService } from "@/lib/sales-service"

export const metadata = {
  title: "Inventario - Sistema de Ventas",
}

export default async function InventoryPage() {
  let inventory = []
  
  try {
    inventory = await salesService.getInventory()
  } catch (error) {
    console.error("Error al cargar inventario:", error)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventario</h1>
        <div className="flex gap-2">
          <Link href="/ventas/inventario/ajuste">
            <Button variant="outline">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Ajuste de Inventario
            </Button>
          </Link>
          <Link href="/ventas/inventario/inicial">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Stock Inicial
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Actual</CardTitle>
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
              {inventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay productos en el inventario. Registra el stock inicial haciendo clic en "Registrar Stock Inicial".
                  </TableCell>
                </TableRow>
              ) : (
                inventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product?.name || "Producto desconocido"}
                    </TableCell>
                    <TableCell>
                      {item.product?.category?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.minQuantity}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity <= item.minQuantity ? (
                        <Badge variant="destructive" className="flex items-center justify-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Stock Bajo
                        </Badge>
                      ) : (
                        <Badge variant="success">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/ventas/inventario/ajuste?productId=${item.productId}`}>
                        <Button variant="ghost" size="sm">
                          Ajustar
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentMovements />
        </CardContent>
      </Card>
    </div>
  )
}

async function RecentMovements() {
  let movements = []
  
  try {
    movements = await salesService.getInventoryMovements(undefined, 10)
  } catch (error) {
    console.error("Error al cargar movimientos:", error)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Cantidad</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Registrado por</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              No hay movimientos de inventario registrados.
            </TableCell>
          </TableRow>
        ) : (
          movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell>
                {new Date(movement.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="font-medium">
                {movement.product?.name || "Producto desconocido"}
              </TableCell>
              <TableCell>
                {movement.type === 'in' ? (
                  <Badge variant="success">Entrada</Badge>
                ) : (
                  <Badge variant="destructive">Salida</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {movement.quantity}
              </TableCell>
              <TableCell>
                {movement.reason}
              </TableCell>
              <TableCell>
                {movement.createdBy}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}