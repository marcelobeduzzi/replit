import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ProductForm from "../product-form"

export const metadata = {
  title: "Nuevo Producto - Sistema de Ventas",
}

export default function NewProductPage() {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm />
        </CardContent>
      </Card>
    </div>
  )
}