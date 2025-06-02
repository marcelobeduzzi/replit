import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ProductForm from "../../../product-form"
import { salesService } from "@/lib/sales-service"

export const metadata = {
  title: "Nueva Variante - Sistema de Ventas",
}

export default async function NewVariantPage({ params }: { params: { id: string } }) {
  const parentProduct = await salesService.getProductById(params.id)
  
  if (!parentProduct) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Nueva Variante de {parentProduct.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm parentProduct={parentProduct} />
        </CardContent>
      </Card>
    </div>
  )
}