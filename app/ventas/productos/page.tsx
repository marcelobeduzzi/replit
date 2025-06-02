'use client'

import { useEffect, useState } from 'react'
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
import { Plus } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const supabase = createClientComponentClient()
        
        // Obtener productos principales (no variantes)
        const { data: mainProducts, error: productsError } = await supabase
          .from("sales_products")
          .select("*, category:sales_categories(*)")
          .is("is_variant", false)
          .order("name")
        
        if (productsError) {
          throw productsError
        }
        
        // Procesar productos y obtener variantes
        const productsWithVariants = []
        
        for (const product of mainProducts || []) {
          // Convertir a camelCase
          const productData = objectToCamelCase(product)
          
          // Obtener variantes para este producto
          const { data: variants, error: variantsError } = await supabase
            .from("sales_products")
            .select("*")
            .eq("parent_id", product.id)
            .eq("is_variant", true)
          
          if (!variantsError) {
            productData.variants = (variants || []).map(variant => objectToCamelCase(variant))
          } else {
            console.error(`Error al obtener variantes para producto ${product.id}:`, variantsError)
            productData.variants = []
          }
          
          // Obtener precio local
          const { data: priceData } = await supabase
            .from("sales_product_prices")
            .select("*")
            .eq("product_id", product.id)
            .eq("channel", "local")
            .maybeSingle()
          
          if (priceData) {
            productData.localPrice = objectToCamelCase(priceData)
          }
          
          productsWithVariants.push(productData)
        }
        
        setProducts(productsWithVariants)
      } catch (err) {
        console.error("Error al cargar productos:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Productos</h1>
        <Link href="/ventas/productos/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando productos...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error al cargar productos: {error}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Precio Local</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay productos registrados. Crea tu primer producto haciendo clic en "Nuevo Producto".
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <Link href={`/ventas/productos/${product.id}`} className="hover:underline">
                          {product.name}
                        </Link>
                        {product.variants && product.variants.length > 0 && (
                          <Badge variant="outline" className="ml-2">
                            {product.variants.length} variante(s)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{product.category?.name || "-"}</TableCell>
                      <TableCell>
                        {product.isActive ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.localPrice ? `$${product.localPrice.price.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/ventas/productos/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            Ver detalles
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
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