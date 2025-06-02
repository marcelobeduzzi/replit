"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

type ProductConfig = {
  id: number
  product_name: string
  unit_value: number
  category: string
  has_internal_consumption: boolean
  active: boolean
}

export function ProductConfigForm() {
  const [products, setProducts] = useState<ProductConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    product_name: "",
    unit_value: "",
    category: "",
    has_internal_consumption: false,
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("product_config")
        .select("*")
        .order("category", { ascending: true })
        .order("product_name", { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      console.error("Error fetching products:", error.message)
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, has_internal_consumption: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar datos
      if (!formData.product_name || !formData.unit_value || !formData.category) {
        throw new Error("Por favor complete todos los campos")
      }

      // Convertir unit_value a número
      const unitValue = Number.parseFloat(formData.unit_value)
      if (isNaN(unitValue)) {
        throw new Error("El valor unitario debe ser un número válido")
      }

      // Insertar en la base de datos
      const supabase = createClient()
      const { error } = await supabase.from("product_config").insert([
        {
          product_name: formData.product_name,
          unit_value: unitValue,
          category: formData.category,
          has_internal_consumption: formData.has_internal_consumption,
          active: true,
        },
      ])

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Producto agregado correctamente",
      })

      // Limpiar formulario y recargar productos
      setFormData({
        product_name: "",
        unit_value: "",
        category: "",
        has_internal_consumption: false,
      })
      fetchProducts()
    } catch (error: any) {
      console.error("Error adding product:", error.message)
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el producto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleProductStatus = async (product: ProductConfig) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("product_config").update({ active: !product.active }).eq("id", product.id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: `Producto ${product.active ? "desactivado" : "activado"} correctamente`,
      })

      fetchProducts()
    } catch (error: any) {
      console.error("Error updating product:", error.message)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el producto",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agregar Nuevo Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_name">Nombre del Producto</Label>
                <Input
                  id="product_name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_value">Valor Unitario</Label>
                <Input
                  id="unit_value"
                  name="unit_value"
                  type="number"
                  step="0.01"
                  value={formData.unit_value}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input id="category" name="category" value={formData.category} onChange={handleChange} required />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_internal_consumption"
                checked={formData.has_internal_consumption}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="has_internal_consumption">Incluir Consumos Internos</Label>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Agregar Producto"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Productos Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Cargando productos...</div>
          ) : products.length === 0 ? (
            <div className="text-center p-4">No hay productos configurados</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Valor Unitario</TableHead>
                  <TableHead>Consumos Internos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.product_name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.unit_value.toFixed(2)}</TableCell>
                    <TableCell>{product.has_internal_consumption ? "Sí" : "No"}</TableCell>
                    <TableCell>{product.active ? "Activo" : "Inactivo"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={product.active ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleProductStatus(product)}
                      >
                        {product.active ? "Desactivar" : "Activar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
