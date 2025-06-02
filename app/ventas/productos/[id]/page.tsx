'use client'

import { useEffect, useState } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Plus, ArrowLeft, Trash } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProductDetails() {
      try {
        setLoading(true)
        const supabase = createClientComponentClient()
        
        // Obtener el producto
        const { data: productData, error: productError } = await supabase
          .from("sales_products")
          .select("*")
          .eq("id", params.id)
          .single()
        
        if (productError) {
          throw productError
        }
        
        if (!productData) {
          setError("Producto no encontrado")
          return
        }
        
        // Si es una variante, no mostrar esta página
        if (productData.is_variant && productData.parent_id) {
          setError("Este producto es una variante")
          return
        }
        
        // Convertir a camelCase
        const productObj = objectToCamelCase(productData)
        
        // Obtener precios
        const { data: pricesData } = await supabase
          .from("sales_product_prices")
          .select("*")
          .eq("product_id", params.id)
        
        productObj.prices = pricesData ? pricesData.map(price => objectToCamelCase(price)) : []
        
        // Obtener categoría si existe
        if (productData.category_id) {
          const { data: categoryData } = await supabase
            .from("sales_categories")
            .select("*")
            .eq("id", productData.category_id)
            .single()
          
          if (categoryData) {
            setCategory(objectToCamelCase(categoryData))
          }
        }
        
        // Obtener variantes
        const { data: variantsData } = await supabase
          .from("sales_products")
          .select("*")
          .eq("parent_id", params.id)
          .eq("is_variant", true)
        
        // Para cada variante, obtener sus precios
        const variantsWithPrices = []
        
        for (const variant of variantsData || []) {
          const variantObj = objectToCamelCase(variant)
          
          const { data: variantPrices } = await supabase
            .from("sales_product_prices")
            .select("*")
            .eq("product_id", variant.id)
          
          variantObj.prices = variantPrices ? variantPrices.map(price => objectToCamelCase(price)) : []
          variantsWithPrices.push(variantObj)
        }
        
        setProduct(productObj)
        setVariants(variantsWithPrices)
      } catch (err) {
        console.error("Error al cargar detalles del producto:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProductDetails()
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto py-6 text-center">
        <p>Cargando detalles del producto...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/ventas/productos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Error</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-red-500">{error}</p>
            <div className="mt-4 text-center">
              <Link href="/ventas/productos">
                <Button>Volver a la lista de productos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/ventas/productos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Producto no encontrado</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center">El producto solicitado no existe o ha sido eliminado.</p>
            <div className="mt-4 text-center">
              <Link href="/ventas/productos">
                <Button>Volver a la lista de productos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/ventas/productos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          {!product.isActive && <Badge variant="secondary">Inactivo</Badge>}
        </div>
        <Link href={`/ventas/productos/${product.id}/editar`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Editar Producto
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                <dd className="mt-1 text-lg">{product.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Categoría</dt>
                <dd className="mt-1 text-lg">{category?.name || "-"}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                <dd className="mt-1">{product.description || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Estado</dt>
                <dd className="mt-1">
                  {product.isActive ? (
                    <Badge variant="success">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Creación</dt>
                <dd className="mt-1">
                  {new Date(product.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precios</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="local">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="local">Local</TabsTrigger>
                <TabsTrigger value="delivery">Delivery</TabsTrigger>
              </TabsList>
              <TabsContent value="local">
                <div className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Precio Local</dt>
                    <dd className="mt-1 text-2xl font-bold">
                      ${product.prices?.find(p => p.channel === "local")?.price.toFixed(2) || "-"}
                    </dd>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="delivery">
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">PedidosYa</dt>
                    <dd className="mt-1 text-lg">
                      ${product.prices?.find(p => p.channel === "pedidosya")?.price.toFixed(2) || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Rappi</dt>
                    <dd className="mt-1 text-lg">
                      ${product.prices?.find(p => p.channel === "rappi")?.price.toFixed(2) || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">MercadoPago</dt>
                    <dd className="mt-1 text-lg">
                      ${product.prices?.find(p => p.channel === "mercadopago")?.price.toFixed(2) || "-"}
                    </dd>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Sección de variantes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Variantes del Producto</CardTitle>
          <Link href={`/ventas/productos/${product.id}/variantes/nueva`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Variante
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Variante</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Precio Local</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay variantes registradas para este producto.
                  </TableCell>
                </TableRow>
              ) : (
                variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{variant.variantName}</TableCell>
                    <TableCell>
                      {variant.isActive ? (
                        <Badge variant="success">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {variant.prices?.find(p => p.channel === "local")?.price.toFixed(2) || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/ventas/productos/${product.id}/variantes/${variant.id}/editar`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                        </Link>
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

// Función auxiliar para convertir snake_case a camelCase
function objectToCamelCase(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => objectToCamelCase(item))
  }

  const newObj = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelCaseKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
      newObj[camelCaseKey] = objectToCamelCase(obj[key])
    }
  }
  return newObj
}