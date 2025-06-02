import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InitialStockForm } from "../initial-stock-form"
import { salesService } from "@/lib/sales-service"

export const metadata = {
  title: "Registrar Stock Inicial - Sistema de Ventas",
}

export default async function InitialStockPage() {
  // Obtener productos sin inventario registrado
  const products = await salesService.getProductsWithoutInventory()

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Registrar Stock Inicial</CardTitle>
        </CardHeader>
        <CardContent>
          <InitialStockForm products={products} />
        </CardContent>
      </Card>
    </div>
  )
}