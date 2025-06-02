import { salesService } from "@/lib/sales-service"
import { SaleForm } from "./sale-form"

export const metadata = {
  title: "Nueva Venta - Sistema de Ventas",
}

export default async function NuevaVentaPage() {
  // Obtener productos para el formulario
  const products = await salesService.getProducts()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Registrar Nueva Venta</h1>
      <p className="text-muted-foreground">
        Completa el formulario para registrar una nueva venta en el sistema
      </p>
      <SaleForm products={products} />
    </div>
  )
}