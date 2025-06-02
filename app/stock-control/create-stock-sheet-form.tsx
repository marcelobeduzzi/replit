"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

type Location = {
  id: number
  name: string
}

type Manager = {
  id: number
  name: string
}

type ProductConfig = {
  id: number
  product_name: string
  unit_value: number
  category: string
  has_internal_consumption: boolean
}

type ProductFormData = {
  opening_quantity: string
  incoming_quantity: string
  mercado_pago_sales: string
  pedidos_ya_sales: string
  rappi_sales: string
  counter_sales: string // Nuevo campo para Ventas Mostrador
  discarded_quantity: string
  internal_consumption?: string
}

type FormData = {
  date: Date
  location_id: string
  manager_id: string
  products: Record<string, ProductFormData>
}

export function CreateStockSheetForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [productConfigs, setProductConfigs] = useState<ProductConfig[]>([])
  const [activeTab, setActiveTab] = useState("empanadas")

  const [formData, setFormData] = useState<FormData>({
    date: new Date(),
    location_id: "",
    manager_id: "",
    products: {},
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        // Fetch locations
        const { data: locationsData, error: locationsError } = await supabase
          .from("locations")
          .select("id, name")
          .eq("active", true)
          .order("name")

        if (locationsError) throw locationsError
        setLocations(locationsData || [])

        // Fetch managers
        const { data: managersData, error: managersError } = await supabase
          .from("managers")
          .select("id, name")
          .eq("active", true)
          .order("name")

        if (managersError) throw managersError
        setManagers(managersData || [])

        // Fetch product configs
        const { data: productConfigsData, error: productConfigsError } = await supabase
          .from("product_config")
          .select("id, product_name, unit_value, category, has_internal_consumption")
          .eq("active", true)
          .order("id", { ascending: true })

        if (productConfigsError) throw productConfigsError
        setProductConfigs(productConfigsData || [])

        // Initialize form data for all products
        const initialProducts: Record<string, ProductFormData> = {}
        productConfigsData?.forEach((product) => {
          const productKey = product.product_name.replace(/\s+/g, "_").toLowerCase()
          initialProducts[productKey] = {
            opening_quantity: "",
            incoming_quantity: "",
            mercado_pago_sales: "",
            pedidos_ya_sales: "",
            rappi_sales: "",
            counter_sales: "", // Inicializar Ventas Mostrador
            discarded_quantity: "",
            ...(product.has_internal_consumption ? { internal_consumption: "" } : {}),
          }
        })

        setFormData((prev) => ({
          ...prev,
          products: initialProducts,
        }))
      } catch (error: any) {
        console.error("Error fetching data:", error.message)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos necesarios",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, productKey: string, field: string) => {
    const { value } = e.target

    setFormData((prev) => ({
      ...prev,
      products: {
        ...prev.products,
        [productKey]: {
          ...prev.products[productKey],
          [field]: value,
        },
      },
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, date }))
    }
  }

  // Cálculos para productos
  const calculateClosingQuantity = (productKey: string, hasInternalConsumption: boolean) => {
    const productData = formData.products[productKey]
    if (!productData) return 0

    const opening = Number.parseInt(productData.opening_quantity) || 0
    const incoming = Number.parseInt(productData.incoming_quantity) || 0
    const mercadoPago = Number.parseInt(productData.mercado_pago_sales) || 0
    const pedidosYa = Number.parseInt(productData.pedidos_ya_sales) || 0
    const rappi = Number.parseInt(productData.rappi_sales) || 0
    const counterSales = Number.parseInt(productData.counter_sales) || 0 // Agregar Ventas Mostrador
    const discarded = Number.parseInt(productData.discarded_quantity) || 0
    const internalConsumption = hasInternalConsumption
      ? Number.parseInt(productData.internal_consumption || "0") || 0
      : 0

    return opening + incoming - mercadoPago - pedidosYa - rappi - counterSales - discarded - internalConsumption
  }

  const calculateTotalSoldUnits = (productKey: string, hasInternalConsumption: boolean) => {
    const productData = formData.products[productKey]
    if (!productData) return 0

    const opening = Number.parseInt(productData.opening_quantity) || 0
    const incoming = Number.parseInt(productData.incoming_quantity) || 0
    const closing = calculateClosingQuantity(productKey, hasInternalConsumption)
    const discarded = Number.parseInt(productData.discarded_quantity) || 0
    const internalConsumption = hasInternalConsumption
      ? Number.parseInt(productData.internal_consumption || "0") || 0
      : 0

    return opening + incoming - closing - discarded - (hasInternalConsumption ? internalConsumption : 0)
  }

  const calculateSalesAmount = (productKey: string, hasInternalConsumption: boolean) => {
    const totalSold = calculateTotalSoldUnits(productKey, hasInternalConsumption)
    const productName = productKey
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    const productConfig = productConfigs.find((p) => p.product_name === productName)
    const unitValue = productConfig?.unit_value || 0

    return totalSold * unitValue
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar datos
      if (!formData.location_id || !formData.manager_id) {
        throw new Error("Por favor complete todos los campos requeridos")
      }

      const supabase = createClient()
      // Insertar la planilla principal
      const { data: sheetData, error: sheetError } = await supabase
        .from("stock_sheets")
        .insert([
          {
            date: formData.date.toISOString().split("T")[0],
            location_id: Number.parseInt(formData.location_id),
            manager_id: Number.parseInt(formData.manager_id),
          },
        ])
        .select()

      if (sheetError) throw sheetError

      if (!sheetData || sheetData.length === 0) {
        throw new Error("No se pudo crear la planilla")
      }

      const stockSheetId = sheetData[0].id

      // Insertar los detalles de cada producto
      for (const productConfig of productConfigs) {
        const productKey = productConfig.product_name.replace(/\s+/g, "_").toLowerCase()
        const productData = formData.products[productKey]

        if (!productData || !productData.opening_quantity) {
          continue // Skip products without opening quantity
        }

        const { error: detailsError } = await supabase.from("stock_sheet_details").insert([
          {
            stock_sheet_id: stockSheetId,
            category: productConfig.category,
            product_name: productConfig.product_name,
            opening_quantity: Number.parseInt(productData.opening_quantity) || 0,
            incoming_quantity: Number.parseInt(productData.incoming_quantity) || 0,
            mercado_pago_sales: Number.parseInt(productData.mercado_pago_sales) || 0,
            pedidos_ya_sales: Number.parseInt(productData.pedidos_ya_sales) || 0,
            rappi_sales: Number.parseInt(productData.rappi_sales) || 0,
            counter_sales: Number.parseInt(productData.counter_sales) || 0, // Agregar Ventas Mostrador
            discarded_quantity: Number.parseInt(productData.discarded_quantity) || 0,
            internal_consumption: productConfig.has_internal_consumption
              ? Number.parseInt(productData.internal_consumption || "0") || 0
              : 0,
            has_internal_consumption: productConfig.has_internal_consumption,
            unit_value: productConfig.unit_value,
          },
        ])

        if (detailsError) throw detailsError
      }

      toast({
        title: "Éxito",
        description: "Planilla de stock creada correctamente",
      })

      router.push("/stock-check")
      router.refresh()
    } catch (error: any) {
      console.error("Error creating stock sheet:", error.message)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la planilla de stock",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Agrupar productos por categoría
  const productsByCategory = productConfigs.reduce(
    (acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = []
      }
      acc[product.category].push(product)
      return acc
    },
    {} as Record<string, ProductConfig[]>,
  )

  // Obtener categorías únicas para las pestañas
  const categories = Object.keys(productsByCategory)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <DatePicker date={formData.date} setDate={handleDateChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location_id">Local</Label>
          <Select value={formData.location_id} onValueChange={(value) => handleSelectChange("location_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar local" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="manager_id">Encargado</Label>
          <Select value={formData.manager_id} onValueChange={(value) => handleSelectChange("manager_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar encargado" />
            </SelectTrigger>
            <SelectContent>
              {managers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id.toString()}>
                  {manager.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category.toLowerCase().replace(/\s+/g, "_")}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category.toLowerCase().replace(/\s+/g, "_")}>
            {productsByCategory[category].map((product) => {
              const productKey = product.product_name.replace(/\s+/g, "_").toLowerCase()
              return (
                <Card key={product.id} className="mb-6">
                  <CardHeader>
                    <CardTitle>{product.product_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor={`${productKey}.opening_quantity`}>Apertura (1)</Label>
                        <Input
                          id={`${productKey}.opening_quantity`}
                          type="number"
                          min="0"
                          value={formData.products[productKey]?.opening_quantity || ""}
                          onChange={(e) => handleChange(e, productKey, "opening_quantity")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${productKey}.incoming_quantity`}>Ingreso de Mercadería (2)</Label>
                        <Input
                          id={`${productKey}.incoming_quantity`}
                          type="number"
                          min="0"
                          value={formData.products[productKey]?.incoming_quantity || ""}
                          onChange={(e) => handleChange(e, productKey, "incoming_quantity")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${productKey}.mercado_pago_sales`}>Ventas Mercado Pago Delivery (3)</Label>
                        <Input
                          id={`${productKey}.mercado_pago_sales`}
                          type="number"
                          min="0"
                          value={formData.products[productKey]?.mercado_pago_sales || ""}
                          onChange={(e) => handleChange(e, productKey, "mercado_pago_sales")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${productKey}.pedidos_ya_sales`}>Ventas PedidosYa (4)</Label>
                        <Input
                          id={`${productKey}.pedidos_ya_sales`}
                          type="number"
                          min="0"
                          value={formData.products[productKey]?.pedidos_ya_sales || ""}
                          onChange={(e) => handleChange(e, productKey, "pedidos_ya_sales")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${productKey}.rappi_sales`}>Ventas Rappi (5)</Label>
                        <Input
                          id={`${productKey}.rappi_sales`}
                          type="number"
                          min="0"
                          value={formData.products[productKey]?.rappi_sales || ""}
                          onChange={(e) => handleChange(e, productKey, "rappi_sales")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${productKey}.counter_sales`}>Ventas Mostrador (8)</Label>
                        <Input
                          id={`${productKey}.counter_sales`}
                          type="number"
                          min="0"
                          value={formData.products[productKey]?.counter_sales || ""}
                          onChange={(e) => handleChange(e, productKey, "counter_sales")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${productKey}.discarded_quantity`}>Decomisos (6)</Label>
                        <Input
                          id={`${productKey}.discarded_quantity`}
                          type="number"
                          min="0"
                          value={formData.products[productKey]?.discarded_quantity || ""}
                          onChange={(e) => handleChange(e, productKey, "discarded_quantity")}
                        />
                      </div>

                      {product.has_internal_consumption && (
                        <div className="space-y-2">
                          <Label htmlFor={`${productKey}.internal_consumption`}>Consumos Internos (7)</Label>
                          <Input
                            id={`${productKey}.internal_consumption`}
                            type="number"
                            min="0"
                            value={formData.products[productKey]?.internal_consumption || ""}
                            onChange={(e) => handleChange(e, productKey, "internal_consumption")}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label>
                          Resultado de Cierre{" "}
                          {product.has_internal_consumption
                            ? "(1 + 2 - 3 - 4 - 5 - 8 - 6 - 7)"
                            : "(1 + 2 - 3 - 4 - 5 - 8 - 6)"}
                        </Label>
                        <div className="p-2 border rounded-md bg-gray-50">
                          {calculateClosingQuantity(productKey, product.has_internal_consumption)} unidades
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Total de Unidades Vendidas (3 + 4 + 5 + 8)</Label>
                        <div className="p-2 border rounded-md bg-gray-50">
                          {calculateTotalSoldUnits(productKey, product.has_internal_consumption)} unidades
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Venta de {product.product_name} $</Label>
                        <div className="p-2 border rounded-md bg-gray-50">
                          ${calculateSalesAmount(productKey, product.has_internal_consumption).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>
        ))}
      </Tabs>

      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar Planilla"}
      </Button>
    </form>
  )
}
