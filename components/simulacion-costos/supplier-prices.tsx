"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Edit, Save, X } from "lucide-react"

// Tipo para un precio de producto
type ProductPrice = {
  id: string
  supplierId: string
  product: string
  category: string
  brand: string
  basePrice: number
  discount: number
  effectivePrice: number
  lastUpdated: string
}

export default function SupplierPrices() {
  // Simulación de datos de proveedores que vendrían del sistema principal
  const suppliers = [
    { id: "1", name: "Distribuidor Bebidas SA" },
    { id: "2", name: "Empanadas Mayorista" },
    { id: "3", name: "Insumos Gastronómicos" },
  ]

  const [productPrices, setProductPrices] = useState<ProductPrice[]>([
    {
      id: "1",
      supplierId: "1",
      product: "Gaseosa 500ml",
      category: "Bebidas",
      brand: "brozziano",
      basePrice: 250,
      discount: 5,
      effectivePrice: 237.5,
      lastUpdated: "2023-04-01",
    },
    {
      id: "2",
      supplierId: "1",
      product: "Agua 500ml",
      category: "Bebidas",
      brand: "brozziano",
      basePrice: 200,
      discount: 5,
      effectivePrice: 190,
      lastUpdated: "2023-04-01",
    },
    {
      id: "3",
      supplierId: "2",
      product: "Empanada de Carne",
      category: "Empanadas",
      brand: "brozziano",
      basePrice: 120,
      discount: 10,
      effectivePrice: 108,
      lastUpdated: "2023-04-02",
    },
  ])

  // Estado para el formulario de precio de producto
  const [newProductPrice, setNewProductPrice] = useState<Omit<ProductPrice, "id" | "effectivePrice" | "lastUpdated">>({
    supplierId: "",
    product: "",
    category: "",
    brand: "brozziano",
    basePrice: 0,
    discount: 0,
  })

  // Estado para edición
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [editPriceData, setEditPriceData] = useState<ProductPrice | null>(null)

  // Agregar un nuevo precio de producto
  const addProductPrice = () => {
    if (!newProductPrice.supplierId || !newProductPrice.product) return

    const effectivePrice = newProductPrice.basePrice * (1 - newProductPrice.discount / 100)

    const productPrice: ProductPrice = {
      ...newProductPrice,
      id: Math.random().toString(36).substring(2, 9),
      effectivePrice,
      lastUpdated: new Date().toISOString().split("T")[0],
    }

    setProductPrices([...productPrices, productPrice])

    // Resetear el formulario
    setNewProductPrice({
      supplierId: "",
      product: "",
      category: "",
      brand: "brozziano",
      basePrice: 0,
      discount: 0,
    })
  }

  // Eliminar un precio de producto
  const removeProductPrice = (id: string) => {
    setProductPrices(productPrices.filter((price) => price.id !== id))
  }

  // Iniciar edición de precio
  const startEditPrice = (price: ProductPrice) => {
    setEditingPrice(price.id)
    setEditPriceData({ ...price })
  }

  // Guardar edición de precio
  const saveEditPrice = () => {
    if (!editPriceData) return

    const effectivePrice = editPriceData.basePrice * (1 - editPriceData.discount / 100)

    setProductPrices(
      productPrices.map((price) =>
        price.id === editingPrice
          ? { ...editPriceData, effectivePrice, lastUpdated: new Date().toISOString().split("T")[0] }
          : price,
      ),
    )

    setEditingPrice(null)
    setEditPriceData(null)
  }

  // Cancelar edición de precio
  const cancelEditPrice = () => {
    setEditingPrice(null)
    setEditPriceData(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agregar Precio de Producto</CardTitle>
          <CardDescription>Registre los precios de los productos por proveedor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="supplierId">Proveedor</Label>
              <Select
                value={newProductPrice.supplierId}
                onValueChange={(value) => setNewProductPrice({ ...newProductPrice, supplierId: value })}
              >
                <SelectTrigger id="supplierId">
                  <SelectValue placeholder="Seleccione un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="brand">Marca</Label>
              <Select
                value={newProductPrice.brand}
                onValueChange={(value) => setNewProductPrice({ ...newProductPrice, brand: value })}
              >
                <SelectTrigger id="brand">
                  <SelectValue placeholder="Seleccione una marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brozziano">Brozziano</SelectItem>
                  <SelectItem value="dean_dennys">Dean & Dennys</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                value={newProductPrice.category}
                onChange={(e) => setNewProductPrice({ ...newProductPrice, category: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="product">Producto</Label>
              <Input
                id="product"
                value={newProductPrice.product}
                onChange={(e) => setNewProductPrice({ ...newProductPrice, product: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="basePrice">Precio Base</Label>
              <Input
                id="basePrice"
                type="number"
                min="0"
                step="0.01"
                value={newProductPrice.basePrice}
                onChange={(e) => setNewProductPrice({ ...newProductPrice, basePrice: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="discount">Descuento (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={newProductPrice.discount}
                onChange={(e) => setNewProductPrice({ ...newProductPrice, discount: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={addProductPrice} disabled={!newProductPrice.supplierId || !newProductPrice.product}>
              <Plus className="mr-2 h-4 w-4" /> Agregar Precio
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Precios</CardTitle>
          <CardDescription>Precios de productos por proveedor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Proveedor</th>
                  <th className="text-left py-3 px-2">Marca</th>
                  <th className="text-left py-3 px-2">Categoría</th>
                  <th className="text-left py-3 px-2">Producto</th>
                  <th className="text-right py-3 px-2">Precio Base</th>
                  <th className="text-right py-3 px-2">Descuento</th>
                  <th className="text-right py-3 px-2">Precio Efectivo</th>
                  <th className="text-center py-3 px-2">Última Actualización</th>
                  <th className="text-center py-3 px-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productPrices.map((price) => {
                  const supplier = suppliers.find((s) => s.id === price.supplierId)

                  return (
                    <tr key={price.id} className="border-b">
                      {editingPrice === price.id ? (
                        <>
                          <td className="py-3 px-2">
                            <Select
                              value={editPriceData?.supplierId || ""}
                              onValueChange={(value) => setEditPriceData({ ...editPriceData!, supplierId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {suppliers.map((supplier) => (
                                  <SelectItem key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-2">
                            <Select
                              value={editPriceData?.brand || ""}
                              onValueChange={(value) => setEditPriceData({ ...editPriceData!, brand: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="brozziano">Brozziano</SelectItem>
                                <SelectItem value="dean_dennys">Dean & Dennys</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-2">
                            <Input
                              value={editPriceData?.category || ""}
                              onChange={(e) => setEditPriceData({ ...editPriceData!, category: e.target.value })}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <Input
                              value={editPriceData?.product || ""}
                              onChange={(e) => setEditPriceData({ ...editPriceData!, product: e.target.value })}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editPriceData?.basePrice || 0}
                              onChange={(e) =>
                                setEditPriceData({ ...editPriceData!, basePrice: Number(e.target.value) })
                              }
                            />
                          </td>
                          <td className="py-3 px-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={editPriceData?.discount || 0}
                              onChange={(e) =>
                                setEditPriceData({ ...editPriceData!, discount: Number(e.target.value) })
                              }
                            />
                          </td>
                          <td className="text-right py-3 px-2">
                            ${(editPriceData?.basePrice || 0) * (1 - (editPriceData?.discount || 0) / 100)}
                          </td>
                          <td className="text-center py-3 px-2">{editPriceData?.lastUpdated}</td>
                          <td className="text-center py-3 px-2">
                            <div className="flex justify-center space-x-2">
                              <Button variant="ghost" size="icon" onClick={saveEditPrice}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={cancelEditPrice}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-2">{supplier?.name}</td>
                          <td className="py-3 px-2">{price.brand === "brozziano" ? "Brozziano" : "Dean & Dennys"}</td>
                          <td className="py-3 px-2">{price.category}</td>
                          <td className="py-3 px-2">{price.product}</td>
                          <td className="text-right py-3 px-2">${price.basePrice.toFixed(2)}</td>
                          <td className="text-right py-3 px-2">{price.discount}%</td>
                          <td className="text-right py-3 px-2">${price.effectivePrice.toFixed(2)}</td>
                          <td className="text-center py-3 px-2">{price.lastUpdated}</td>
                          <td className="text-center py-3 px-2">
                            <div className="flex justify-center space-x-2">
                              <Button variant="ghost" size="icon" onClick={() => startEditPrice(price)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => removeProductPrice(price.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

