"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Edit, Save, X, Download } from "lucide-react"
import {
  getSuppliers,
  getSupplierPrices,
  createSupplierPrice,
  updateSupplierPrice,
  deleteSupplierPrice,
} from "@/lib/supabase/simulacion-costos"

export default function ListaPrecios() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [supplierPrices, setSupplierPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado para filtros
  const [selectedSupplier, setSelectedSupplier] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Estado para el formulario de nuevo precio
  const [newPrice, setNewPrice] = useState({
    supplier_id: "",
    product_id: "",
    product_name: "",
    category: "",
    brand: "brozziano",
    base_price: 0,
    discount_percentage: 0,
  })

  // Estado para edición
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [editPriceData, setEditPriceData] = useState<any | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Cargar proveedores
        const suppliersData = await getSuppliers()
        setSuppliers(suppliersData)

        // Cargar precios de proveedores
        const pricesData = await getSupplierPrices()
        setSupplierPrices(pricesData)

        setLoading(false)
      } catch (err) {
        console.error("Error loading data:", err)
        setError("Error al cargar los datos. Por favor, intente nuevamente.")
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filtrar precios según los filtros seleccionados
  const filteredPrices = supplierPrices.filter((price) => {
    const matchesSupplier = selectedSupplier ? price.supplier_id === selectedSupplier : true
    const matchesSearch = searchTerm
      ? price.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        price.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      : true

    return matchesSupplier && matchesSearch
  })

  // Agregar un nuevo precio
  const handleAddPrice = async () => {
    try {
      if (!newPrice.supplier_id || !newPrice.product_id) {
        setError("Por favor, seleccione un proveedor y un producto.")
        return
      }

      // Crear el nuevo precio en la base de datos
      const priceData = {
        supplier_id: newPrice.supplier_id,
        product_id: newPrice.product_id,
        base_price: newPrice.base_price,
        discount_percentage: newPrice.discount_percentage,
      }

      await createSupplierPrice(priceData)

      // Recargar los precios
      const updatedPrices = await getSupplierPrices()
      setSupplierPrices(updatedPrices)

      // Resetear el formulario
      setNewPrice({
        supplier_id: "",
        product_id: "",
        product_name: "",
        category: "",
        brand: "brozziano",
        base_price: 0,
        discount_percentage: 0,
      })

      setError(null)
    } catch (err) {
      console.error("Error adding price:", err)
      setError("Error al agregar el precio. Por favor, intente nuevamente.")
    }
  }

  // Iniciar edición de un precio
  const handleEditPrice = (price: any) => {
    setEditingPrice(price.id)
    setEditPriceData({
      ...price,
      base_price: price.base_price,
      discount_percentage: price.discount_percentage,
    })
  }

  // Guardar cambios de un precio
  const handleSavePrice = async () => {
    try {
      if (!editPriceData) return

      const priceData = {
        base_price: editPriceData.base_price,
        discount_percentage: editPriceData.discount_percentage,
      }

      await updateSupplierPrice(editingPrice!, priceData)

      // Recargar los precios
      const updatedPrices = await getSupplierPrices()
      setSupplierPrices(updatedPrices)

      setEditingPrice(null)
      setEditPriceData(null)
      setError(null)
    } catch (err) {
      console.error("Error updating price:", err)
      setError("Error al actualizar el precio. Por favor, intente nuevamente.")
    }
  }

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingPrice(null)
    setEditPriceData(null)
  }

  // Eliminar un precio
  const handleDeletePrice = async (id: string) => {
    try {
      await deleteSupplierPrice(id)

      // Recargar los precios
      const updatedPrices = await getSupplierPrices()
      setSupplierPrices(updatedPrices)

      setError(null)
    } catch (err) {
      console.error("Error deleting price:", err)
      setError("Error al eliminar el precio. Por favor, intente nuevamente.")
    }
  }

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = [
      "Proveedor",
      "Producto",
      "Categoría",
      "Marca",
      "Precio Base",
      "Descuento (%)",
      "Precio Efectivo",
      "Última Actualización",
    ]

    const rows = filteredPrices.map((price) => [
      price.suppliers?.name || "",
      price.products?.name || "",
      price.products?.category_id || "",
      price.products?.brand || "",
      price.base_price.toFixed(2),
      price.discount_percentage.toFixed(2),
      price.effective_price.toFixed(2),
      new Date(price.last_updated).toLocaleDateString(),
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `lista_precios_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Precios de Proveedores</CardTitle>
              <CardDescription>Gestione los precios y descuentos de productos por proveedor</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="supplier-filter">Filtrar por Proveedor</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger id="supplier-filter">
                  <SelectValue placeholder="Todos los proveedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proveedores</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por producto o proveedor"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">{error}</div>}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Proveedor</th>
                  <th className="text-left py-3 px-2">Producto</th>
                  <th className="text-left py-3 px-2">Marca</th>
                  <th className="text-right py-3 px-2">Precio Base</th>
                  <th className="text-right py-3 px-2">Descuento (%)</th>
                  <th className="text-right py-3 px-2">Precio Efectivo</th>
                  <th className="text-center py-3 px-2">Última Actualización</th>
                  <th className="text-center py-3 px-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      No se encontraron precios con los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  filteredPrices.map((price) => (
                    <tr key={price.id} className="border-b">
                      {editingPrice === price.id ? (
                        <>
                          <td className="py-3 px-2">{price.suppliers?.name}</td>
                          <td className="py-3 px-2">{price.products?.name}</td>
                          <td className="py-3 px-2">{price.products?.brand}</td>
                          <td className="py-3 px-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editPriceData.base_price}
                              onChange={(e) =>
                                setEditPriceData({
                                  ...editPriceData,
                                  base_price: Number(e.target.value),
                                })
                              }
                              className="w-24"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={editPriceData.discount_percentage}
                              onChange={(e) =>
                                setEditPriceData({
                                  ...editPriceData,
                                  discount_percentage: Number(e.target.value),
                                })
                              }
                              className="w-24"
                            />
                          </td>
                          <td className="text-right py-3 px-2">
                            ${(editPriceData.base_price * (1 - editPriceData.discount_percentage / 100)).toFixed(2)}
                          </td>
                          <td className="text-center py-3 px-2">{new Date(price.last_updated).toLocaleDateString()}</td>
                          <td className="text-center py-3 px-2">
                            <div className="flex justify-center space-x-2">
                              <Button variant="ghost" size="icon" onClick={handleSavePrice}>
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
                          <td className="py-3 px-2">{price.suppliers?.name}</td>
                          <td className="py-3 px-2">{price.products?.name}</td>
                          <td className="py-3 px-2">{price.products?.brand}</td>
                          <td className="text-right py-3 px-2">${price.base_price.toFixed(2)}</td>
                          <td className="text-right py-3 px-2">{price.discount_percentage.toFixed(2)}%</td>
                          <td className="text-right py-3 px-2">${price.effective_price.toFixed(2)}</td>
                          <td className="text-center py-3 px-2">{new Date(price.last_updated).toLocaleDateString()}</td>
                          <td className="text-center py-3 px-2">
                            <div className="flex justify-center space-x-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditPrice(price)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeletePrice(price.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

