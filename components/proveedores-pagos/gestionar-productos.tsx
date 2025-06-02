"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Edit, Save, X, Plus, RefreshCw } from "lucide-react"
import { getCategories, getProducts } from "@/lib/supabase/simulacion-costos"
import { createClient } from "@/lib/supabase-client"

type Product = {
  id: string
  name: string
  category_id: string
  brand: string
  default_purchase_price: number
  default_sale_price: number
}

type Category = {
  id: string
  name: string
  brand: string
}

export default function GestionarProductos() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [selectedBrand, setSelectedBrand] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Estado para el formulario de nuevo producto
  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "",
    brand: "brozziano",
    default_purchase_price: 0,
    default_sale_price: 0,
  })

  // Estado para edición
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editProductData, setEditProductData] = useState<Product | null>(null)

  // Cargar categorías y productos
  const loadData = async () => {
    try {
      setLoading(true)

      // Cargar categorías
      const categoriesData = await getCategories()
      setCategories(categoriesData)

      // Cargar productos
      const productsData = await getProducts()
      setProducts(productsData)

      setError(null)
    } catch (err: any) {
      console.error("Error loading data:", err)
      setError(`Error al cargar datos: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtrar productos
  const filteredProducts = products.filter((product) => {
    const matchesBrand = selectedBrand === "all" || product.brand === selectedBrand
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory
    const matchesSearch = searchTerm === "" || product.name.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesBrand && matchesCategory && matchesSearch
  })

  // Agregar un nuevo producto
  const handleAddProduct = async () => {
    try {
      if (!newProduct.name || !newProduct.category_id) {
        setError("El nombre y la categoría son obligatorios")
        return
      }

      const supabase = createClient()

      const { data, error: insertError } = await supabase.from("cost_simulation_products").insert([newProduct]).select()

      if (insertError) throw insertError

      // Recargar productos
      await loadData()

      // Resetear el formulario
      setNewProduct({
        name: "",
        category_id: "",
        brand: "brozziano",
        default_purchase_price: 0,
        default_sale_price: 0,
      })

      setError(null)
    } catch (err: any) {
      console.error("Error adding product:", err)
      setError(`Error al agregar producto: ${err.message}`)
    }
  }

  // Iniciar edición de producto
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product.id)
    setEditProductData({ ...product })
  }

  // Guardar cambios de producto
  const handleSaveProduct = async () => {
    try {
      if (!editProductData || !editingProduct) return

      const supabase = createClient()

      const { error: updateError } = await supabase
        .from("cost_simulation_products")
        .update({
          name: editProductData.name,
          category_id: editProductData.category_id,
          brand: editProductData.brand,
          default_purchase_price: editProductData.default_purchase_price,
          default_sale_price: editProductData.default_sale_price,
        })
        .eq("id", editingProduct)

      if (updateError) throw updateError

      // Recargar productos
      await loadData()

      setEditingProduct(null)
      setEditProductData(null)
      setError(null)
    } catch (err: any) {
      console.error("Error updating product:", err)
      setError(`Error al actualizar producto: ${err.message}`)
    }
  }

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingProduct(null)
    setEditProductData(null)
  }

  // Eliminar producto
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este producto? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase.from("cost_simulation_products").delete().eq("id", id)

      if (deleteError) throw deleteError

      // Recargar productos
      await loadData()

      setError(null)
    } catch (err: any) {
      console.error("Error deleting product:", err)
      setError(`Error al eliminar producto: ${err.message}`)
    }
  }

  // Obtener nombre de categoría
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.name : "Desconocida"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestión de Productos</CardTitle>
            <CardDescription>Administre los productos para la simulación de costos</CardDescription>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/10 p-4 rounded-md text-destructive mb-6">
            {error}
            <Button variant="ghost" size="sm" className="ml-2" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="space-y-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="brand-filter">Filtrar por Marca</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger id="brand-filter">
                  <SelectValue placeholder="Todas las marcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las marcas</SelectItem>
                  <SelectItem value="brozziano">Brozziano</SelectItem>
                  <SelectItem value="dean_dennys">Dean & Dennys</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category-filter">Filtrar por Categoría</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.brand === "brozziano" ? "Brozziano" : "Dean & Dennys"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por nombre"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Formulario para agregar nuevo producto */}
          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-medium mb-4">Agregar Nuevo Producto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Nombre del producto"
                />
              </div>

              <div>
                <Label htmlFor="brand">Marca *</Label>
                <Select
                  value={newProduct.brand}
                  onValueChange={(value) => setNewProduct({ ...newProduct, brand: value })}
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
                <Label htmlFor="category">Categoría *</Label>
                <Select
                  value={newProduct.category_id}
                  onValueChange={(value) => setNewProduct({ ...newProduct, category_id: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Seleccione una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((category) => category.brand === newProduct.brand)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="purchase-price">Precio de Compra Predeterminado</Label>
                <Input
                  id="purchase-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.default_purchase_price}
                  onChange={(e) => setNewProduct({ ...newProduct, default_purchase_price: Number(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="sale-price">Precio de Venta Predeterminado</Label>
                <Input
                  id="sale-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.default_sale_price}
                  onChange={(e) => setNewProduct({ ...newProduct, default_sale_price: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleAddProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </div>
          </div>

          {/* Lista de productos */}
          <div>
            <h3 className="text-lg font-medium mb-4">Productos Existentes</h3>
            {loading ? (
              <div className="text-center py-8">Cargando productos...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron productos con los filtros seleccionados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Nombre</th>
                      <th className="text-left py-3 px-2">Categoría</th>
                      <th className="text-left py-3 px-2">Marca</th>
                      <th className="text-right py-3 px-2">Precio Compra</th>
                      <th className="text-right py-3 px-2">Precio Venta</th>
                      <th className="text-center py-3 px-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b">
                        {editingProduct === product.id ? (
                          <>
                            <td className="py-3 px-2">
                              <Input
                                value={editProductData?.name || ""}
                                onChange={(e) => setEditProductData({ ...editProductData!, name: e.target.value })}
                              />
                            </td>
                            <td className="py-3 px-2">
                              <Select
                                value={editProductData?.category_id || ""}
                                onValueChange={(value) =>
                                  setEditProductData({ ...editProductData!, category_id: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories
                                    .filter((category) => category.brand === editProductData?.brand)
                                    .map((category) => (
                                      <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-3 px-2">
                              <Select
                                value={editProductData?.brand || ""}
                                onValueChange={(value) => setEditProductData({ ...editProductData!, brand: value })}
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
                                type="number"
                                min="0"
                                step="0.01"
                                value={editProductData?.default_purchase_price || 0}
                                onChange={(e) =>
                                  setEditProductData({
                                    ...editProductData!,
                                    default_purchase_price: Number(e.target.value),
                                  })
                                }
                              />
                            </td>
                            <td className="py-3 px-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editProductData?.default_sale_price || 0}
                                onChange={(e) =>
                                  setEditProductData({
                                    ...editProductData!,
                                    default_sale_price: Number(e.target.value),
                                  })
                                }
                              />
                            </td>
                            <td className="text-center py-3 px-2">
                              <div className="flex justify-center space-x-2">
                                <Button variant="ghost" size="icon" onClick={handleSaveProduct}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-2">{product.name}</td>
                            <td className="py-3 px-2">{getCategoryName(product.category_id)}</td>
                            <td className="py-3 px-2">
                              {product.brand === "brozziano" ? "Brozziano" : "Dean & Dennys"}
                            </td>
                            <td className="text-right py-3 px-2">${product.default_purchase_price.toFixed(2)}</td>
                            <td className="text-right py-3 px-2">${product.default_sale_price.toFixed(2)}</td>
                            <td className="text-center py-3 px-2">
                              <div className="flex justify-center space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

