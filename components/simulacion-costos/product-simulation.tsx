"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateProfitability } from "@/lib/simulacion-costos/calculations"
import { ProfitabilityResults } from "./profitability-results"
import { Plus, Trash2 } from "lucide-react"

// Tipos de productos para cada marca
const BROZZIANO_PRODUCTS = {
  Empanadas: ["Empanada de Carne", "Empanada de Jamón y Queso", "Empanada de Pollo"],
  Bebidas: ["Gaseosa 500ml", "Agua 500ml", "Gaseosa 1.5L", "Cerveza"],
  Medialunas: ["Medialuna Simple", "Medialuna Rellena"],
  Pizzas: ["Pizza Muzzarella", "Pizza Doble Muzzarella"],
  Componentes: [
    "Sobre Chico",
    "Sobre Mediano",
    "Sobre Grande",
    "Caja de Pizza",
    "Caja de Empanadas",
    "Bolsa de Delivery",
    "Almíbar para Medialunas",
  ],
  Cafetería: ["Bolsa de Café", "Leche en Polvo", "Chocolate", "Vaso de Café"],
  Administrativo: ["Rollo de Posnet", "Rollo de Comanda"],
}

const DEAN_DENNYS_PRODUCTS = {
  Desayunos: ["Desayuno Americano", "Desayuno Continental"],
  "Platos Principales": ["Hamburguesa Clásica", "Hamburguesa Especial", "Ensalada César"],
  Bebidas: ["Gaseosa 500ml", "Agua 500ml", "Cerveza", "Café"],
  Postres: ["Brownie con Helado", "Cheesecake"],
}

// Tipo para un ítem de simulación
type SimulationItem = {
  id: string
  product: string
  purchasePrice: number
  salePrice: number
  discount: number
  quantity: number
  additionalCosts: number
}

export default function ProductSimulation() {
  const [brand, setBrand] = useState<"brozziano" | "dean_dennys">("brozziano")
  const [category, setCategory] = useState<string>("")
  const [simulationItems, setSimulationItems] = useState<SimulationItem[]>([])
  const [results, setResults] = useState<any | null>(null)

  // Estado para el formulario actual
  const [currentItem, setCurrentItem] = useState<Omit<SimulationItem, "id">>({
    product: "",
    purchasePrice: 0,
    salePrice: 0,
    discount: 0,
    quantity: 1,
    additionalCosts: 0,
  })

  // Obtener categorías según la marca
  const getCategories = () => {
    return brand === "brozziano" ? Object.keys(BROZZIANO_PRODUCTS) : Object.keys(DEAN_DENNYS_PRODUCTS)
  }

  // Obtener productos según la categoría y marca
  const getProducts = () => {
    if (!category) return []

    return brand === "brozziano"
      ? BROZZIANO_PRODUCTS[category as keyof typeof BROZZIANO_PRODUCTS] || []
      : DEAN_DENNYS_PRODUCTS[category as keyof typeof DEAN_DENNYS_PRODUCTS] || []
  }

  // Agregar un ítem a la simulación
  const addItem = () => {
    if (!currentItem.product) return

    const newItem: SimulationItem = {
      ...currentItem,
      id: Math.random().toString(36).substring(2, 9),
    }

    setSimulationItems([...simulationItems, newItem])

    // Resetear el formulario
    setCurrentItem({
      product: "",
      purchasePrice: 0,
      salePrice: 0,
      discount: 0,
      quantity: 1,
      additionalCosts: 0,
    })
  }

  // Eliminar un ítem de la simulación
  const removeItem = (id: string) => {
    setSimulationItems(simulationItems.filter((item) => item.id !== id))
  }

  // Calcular la rentabilidad
  const calculateResults = () => {
    if (simulationItems.length === 0) return

    const calculatedResults = simulationItems.map((item) => {
      return {
        ...item,
        ...calculateProfitability(
          item.purchasePrice,
          item.salePrice,
          item.discount,
          item.quantity,
          item.additionalCosts,
        ),
      }
    })

    setResults(calculatedResults)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          variant={brand === "brozziano" ? "default" : "outline"}
          onClick={() => setBrand("brozziano")}
          className="w-full"
        >
          Brozziano
        </Button>
        <Button
          variant={brand === "dean_dennys" ? "default" : "outline"}
          onClick={() => setBrand("dean_dennys")}
          className="w-full"
        >
          Dean & Dennys
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar Producto a la Simulación</CardTitle>
          <CardDescription>
            Complete los datos del producto para agregar a la simulación de rentabilidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Seleccione una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategories().map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="product">Producto</Label>
                <Select
                  value={currentItem.product}
                  onValueChange={(value) => setCurrentItem({ ...currentItem, product: value })}
                  disabled={!category}
                >
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Seleccione un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {getProducts().map((product) => (
                      <SelectItem key={product} value={product}>
                        {product}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="purchasePrice">Precio de Compra ($)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentItem.purchasePrice}
                  onChange={(e) => setCurrentItem({ ...currentItem, purchasePrice: Number(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="salePrice">Precio de Venta ($)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentItem.salePrice}
                  onChange={(e) => setCurrentItem({ ...currentItem, salePrice: Number(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount">Descuento (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={currentItem.discount}
                    onChange={(e) => setCurrentItem({ ...currentItem, discount: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="additionalCosts">Costos Adicionales ($)</Label>
                  <Input
                    id="additionalCosts"
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentItem.additionalCosts}
                    onChange={(e) => setCurrentItem({ ...currentItem, additionalCosts: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={addItem} disabled={!currentItem.product}>
              <Plus className="mr-2 h-4 w-4" /> Agregar a la Simulación
            </Button>
          </div>
        </CardContent>
      </Card>

      {simulationItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Productos en Simulación</CardTitle>
            <CardDescription>Lista de productos agregados para la simulación de rentabilidad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Producto</th>
                    <th className="text-right py-3 px-2">Precio Compra</th>
                    <th className="text-right py-3 px-2">Precio Venta</th>
                    <th className="text-right py-3 px-2">Descuento</th>
                    <th className="text-right py-3 px-2">Cantidad</th>
                    <th className="text-right py-3 px-2">Costos Adicionales</th>
                    <th className="text-center py-3 px-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3 px-2">{item.product}</td>
                      <td className="text-right py-3 px-2">${item.purchasePrice.toFixed(2)}</td>
                      <td className="text-right py-3 px-2">${item.salePrice.toFixed(2)}</td>
                      <td className="text-right py-3 px-2">{item.discount}%</td>
                      <td className="text-right py-3 px-2">{item.quantity}</td>
                      <td className="text-right py-3 px-2">${item.additionalCosts.toFixed(2)}</td>
                      <td className="text-center py-3 px-2">
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={calculateResults}>Calcular Rentabilidad</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {results && <ProfitabilityResults results={results} />}
    </div>
  )
}

