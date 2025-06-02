"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { dbService } from "@/lib/db-service"
import { CalendarIcon, Copy, Save } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

// Tipos para los pedidos
type ProductType = "empanada" | "pizza" | "medialuna" | "caja" | "sobre" | "almibar"

interface Product {
  id: string
  name: string
  type: ProductType
}

interface Local {
  id: string
  name: string
  orderDays: {
    day: number // 0 = domingo, 1 = lunes, etc.
    products: ProductType[]
  }[]
}

// Productos disponibles
const products: Product[] = [
  // Empanadas
  { id: "emp_bondiola", name: "Bondiola", type: "empanada" },
  { id: "emp_humita", name: "Humita", type: "empanada" },
  { id: "emp_verdura", name: "Verdura", type: "empanada" },
  { id: "emp_carne_suave", name: "Carne Suave", type: "empanada" },
  { id: "emp_pollo", name: "Pollo", type: "empanada" },
  { id: "emp_carne_picante", name: "Carne Picante", type: "empanada" },
  { id: "emp_queso_cebolla", name: "Queso y Cebolla", type: "empanada" },
  { id: "emp_jamon_queso", name: "Jamón y Queso", type: "empanada" },
  { id: "emp_roquefort", name: "Roquefort", type: "empanada" },
  { id: "emp_capresse", name: "Capresse", type: "empanada" },
  { id: "emp_cheeseburger", name: "Cheeseburger", type: "empanada" },

  // Pizzas
  { id: "pizza_muzzarella", name: "Muzzarella", type: "pizza" },
  { id: "pizza_doble_muzzarella", name: "Doble Muzzarella", type: "pizza" },

  // Medialunas
  { id: "med_grasa", name: "Medialuna de Grasa", type: "medialuna" },
  { id: "med_manteca", name: "Medialuna de Manteca", type: "medialuna" },

  // Cajas
  { id: "caja_pizza", name: "Caja de Pizza", type: "caja" },
  { id: "caja_empanada", name: "Caja de Empanada", type: "caja" },

  // Sobres
  { id: "sobre_chico", name: "Sobre Chico", type: "sobre" },
  { id: "sobre_mediano", name: "Sobre Mediano", type: "sobre" },
  { id: "sobre_grande", name: "Sobre Grande", type: "sobre" },

  // Almibar
  { id: "almibar", name: "Almíbar", type: "almibar" },
]

// Locales y sus días de pedido
const locales: Local[] = [
  {
    id: "br_cabildo",
    name: "BR Cabildo",
    orderDays: [
      { day: 2, products: ["empanada", "medialuna", "caja", "sobre"] }, // Martes
      { day: 4, products: ["empanada", "medialuna", "caja", "sobre"] }, // Jueves
      { day: 0, products: ["empanada", "medialuna", "caja", "sobre"] }, // Domingo
    ],
  },
  {
    id: "br_pacifico",
    name: "BR Pacifico",
    orderDays: [
      { day: 2, products: ["empanada", "medialuna", "caja", "sobre"] }, // Martes
      { day: 4, products: ["empanada", "medialuna", "caja", "sobre"] }, // Jueves
      { day: 0, products: ["empanada", "medialuna", "caja", "sobre"] }, // Domingo
    ],
  },
  {
    id: "br_carranza",
    name: "BR Carranza",
    orderDays: [
      { day: 2, products: ["empanada", "medialuna", "caja", "sobre"] }, // Martes
      { day: 4, products: ["empanada", "medialuna", "caja", "sobre"] }, // Jueves
      { day: 0, products: ["empanada", "medialuna", "caja", "sobre"] }, // Domingo
    ],
  },
  {
    id: "br_lavalle",
    name: "BR Lavalle",
    orderDays: [
      { day: 1, products: ["empanada", "medialuna", "caja", "sobre"] }, // Lunes
      { day: 3, products: ["empanada", "medialuna", "caja", "sobre"] }, // Miércoles
      { day: 5, products: ["empanada", "medialuna", "caja", "sobre"] }, // Viernes
    ],
  },
  {
    id: "br_rivadavia",
    name: "BR Rivadavia",
    orderDays: [
      { day: 1, products: ["medialuna", "almibar"] }, // Lunes
      { day: 2, products: ["empanada", "caja", "sobre"] }, // Martes
      { day: 3, products: ["medialuna", "almibar"] }, // Miércoles
      { day: 4, products: ["empanada", "caja", "sobre"] }, // Jueves
      { day: 5, products: ["medialuna", "almibar"] }, // Viernes
      { day: 0, products: ["empanada", "caja", "sobre"] }, // Domingo
    ],
  },
  {
    id: "br_aguero",
    name: "BR Aguero",
    orderDays: [],
  },
  {
    id: "br_dorrego",
    name: "BR Dorrego",
    orderDays: [],
  },
  {
    id: "central",
    name: "CENTRAL",
    orderDays: [],
  },
]

export default function PedidosBrozzianoPage() {
  const { toast } = useToast()
  const [date, setDate] = useState<Date>(new Date())
  const [selectedLocal, setSelectedLocal] = useState<string>("")
  const [orderItems, setOrderItems] = useState<Record<string, number>>({})
  const [stockItems, setStockItems] = useState<Record<string, number>>({})
  const [salesData, setSalesData] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Determinar qué locales pueden hacer pedidos hoy
  const dayOfWeek = date.getDay() // 0 = domingo, 1 = lunes, etc.

  const localesWithOrdersToday = locales.filter((local) =>
    local.orderDays.some((orderDay) => orderDay.day === dayOfWeek),
  )

  // Productos que se pueden pedir hoy para el local seleccionado
  const getProductsForSelectedLocal = () => {
    if (!selectedLocal) return []

    const local = locales.find((l) => l.id === selectedLocal)
    if (!local) return []

    const orderDay = local.orderDays.find((od) => od.day === dayOfWeek)
    if (!orderDay) return []

    return products.filter((product) => orderDay.products.includes(product.type))
  }

  // Agrupar productos por tipo
  const groupedProducts = () => {
    const productsForLocal = getProductsForSelectedLocal()

    return {
      empanadas: productsForLocal.filter((p) => p.type === "empanada"),
      pizzas: productsForLocal.filter((p) => p.type === "pizza"),
      medialunas: productsForLocal.filter((p) => p.type === "medialuna"),
      cajas: productsForLocal.filter((p) => p.type === "caja"),
      sobres: productsForLocal.filter((p) => p.type === "sobre"),
      almibar: productsForLocal.filter((p) => p.type === "almibar"),
    }
  }

  // Cargar datos de ventas y stock al cambiar el local seleccionado
  useEffect(() => {
    if (!selectedLocal) {
      setOrderItems({})
      setStockItems({})
      setSalesData({})
      return
    }

    const loadData = async () => {
      setIsLoading(true)
      try {
        // Cargar datos de ventas promedio
        const salesData = await dbService.getAverageSales(selectedLocal)
        setSalesData(salesData)

        // Cargar stock actual
        const stockData = await dbService.getCurrentStock(selectedLocal)
        setStockItems(stockData)

        // Inicializar pedido
        const initialOrder: Record<string, number> = {}
        getProductsForSelectedLocal().forEach((product) => {
          // Calcular cantidad a pedir basada en ventas promedio menos stock actual
          const averageSale = salesData[product.id] || 0
          const currentStock = stockData[product.id] || 0
          const suggestedOrder = Math.max(0, averageSale - currentStock)

          initialOrder[product.id] = suggestedOrder
        })

        setOrderItems(initialOrder)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de ventas y stock",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [selectedLocal])

  // Manejar cambios en los inputs de pedido
  const handleOrderChange = (productId: string, value: string) => {
    const numValue = Number.parseInt(value) || 0

    setOrderItems((prev) => ({
      ...prev,
      [productId]: numValue,
    }))
  }

  // Manejar cambios en los inputs de stock
  const handleStockChange = (productId: string, value: string) => {
    const numValue = Number.parseInt(value) || 0

    setStockItems((prev) => ({
      ...prev,
      [productId]: numValue,
    }))

    // Actualizar pedido sugerido
    const averageSale = salesData[productId] || 0
    const suggestedOrder = Math.max(0, averageSale - numValue)

    setOrderItems((prev) => ({
      ...prev,
      [productId]: suggestedOrder,
    }))
  }

  // Guardar pedido
  const handleSaveOrder = async () => {
    if (!selectedLocal) {
      toast({
        title: "Error",
        description: "Debe seleccionar un local",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const orderData = {
        localId: selectedLocal,
        date: date.toISOString(),
        items: orderItems,
        stock: stockItems,
        deliveryDate: addDays(date, 1).toISOString(), // Entrega al día siguiente
        status: "pending",
      }

      await dbService.saveOrder(orderData)

      toast({
        title: "Pedido guardado",
        description: "El pedido ha sido guardado correctamente",
      })
    } catch (error) {
      console.error("Error al guardar pedido:", error)

      toast({
        title: "Error",
        description: "No se pudo guardar el pedido",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Copiar pedido al portapapeles
  const handleCopyOrder = () => {
    if (!selectedLocal) return

    const local = locales.find((l) => l.id === selectedLocal)
    if (!local) return

    let orderText = `PEDIDO ${local.name} - ${format(date, "dd/MM/yyyy")}\n\n`

    // Empanadas
    const emps = groupedProducts().empanadas
    if (emps.length > 0) {
      orderText += "EMPANADAS:\n"
      emps.forEach((emp) => {
        const quantity = orderItems[emp.id] || 0
        if (quantity > 0) {
          orderText += `${emp.name}: ${quantity}\n`
        }
      })
      orderText += "\n"
    }

    // Pizzas
    const pizzas = groupedProducts().pizzas
    if (pizzas.length > 0) {
      orderText += "PIZZAS:\n"
      pizzas.forEach((pizza) => {
        const quantity = orderItems[pizza.id] || 0
        if (quantity > 0) {
          orderText += `${pizza.name}: ${quantity}\n`
        }
      })
      orderText += "\n"
    }

    // Medialunas
    const meds = groupedProducts().medialunas
    if (meds.length > 0) {
      orderText += "MEDIALUNAS:\n"
      meds.forEach((med) => {
        const quantity = orderItems[med.id] || 0
        if (quantity > 0) {
          orderText += `${med.name}: ${quantity}\n`
        }
      })
      orderText += "\n"
    }

    // Cajas
    const cajas = groupedProducts().cajas
    if (cajas.length > 0) {
      orderText += "CAJAS:\n"
      cajas.forEach((caja) => {
        const quantity = orderItems[caja.id] || 0
        if (quantity > 0) {
          orderText += `${caja.name}: ${quantity}\n`
        }
      })
      orderText += "\n"
    }

    // Sobres
    const sobres = groupedProducts().sobres
    if (sobres.length > 0) {
      orderText += "SOBRES:\n"
      sobres.forEach((sobre) => {
        const quantity = orderItems[sobre.id] || 0
        if (quantity > 0) {
          orderText += `${sobre.name}: ${quantity}\n`
        }
      })
      orderText += "\n"
    }

    // Almíbar
    const almibar = groupedProducts().almibar
    if (almibar.length > 0) {
      orderText += "ALMÍBAR:\n"
      almibar.forEach((alm) => {
        const quantity = orderItems[alm.id] || 0
        if (quantity > 0) {
          orderText += `${alm.name}: ${quantity}\n`
        }
      })
    }

    navigator.clipboard
      .writeText(orderText)
      .then(() => {
        toast({
          title: "Pedido copiado",
          description: "El pedido ha sido copiado al portapapeles",
        })
      })
      .catch((err) => {
        console.error("Error al copiar al portapapeles:", err)
        toast({
          title: "Error",
          description: "No se pudo copiar el pedido al portapapeles",
          variant: "destructive",
        })
      })
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Pedidos Brozziano</h2>
            <p className="text-muted-foreground">Gestión de pedidos para locales Brozziano</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href="/pedidos-brozziano/historial">Historial de Pedidos</Link>
            </Button>
            <Button asChild>
              <Link href="/pedidos-brozziano/estadisticas">Estadísticas</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nuevo Pedido</CardTitle>
            <CardDescription>Genere un nuevo pedido para un local</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Fecha del Pedido</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(date, "PPP", { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => date && setDate(date)}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Local</label>
                  <Select value={selectedLocal} onValueChange={setSelectedLocal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar local" />
                    </SelectTrigger>
                    <SelectContent>
                      {localesWithOrdersToday.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No hay locales con pedidos para hoy
                        </SelectItem>
                      ) : (
                        localesWithOrdersToday.map((local) => (
                          <SelectItem key={local.id} value={local.id}>
                            {local.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedLocal && (
                <div className="pt-4">
                  <Tabs defaultValue="empanadas" className="space-y-4">
                    <TabsList className="flex flex-wrap h-auto">
                      {groupedProducts().empanadas.length > 0 && (
                        <TabsTrigger value="empanadas" className="mb-1">
                          Empanadas
                        </TabsTrigger>
                      )}
                      {groupedProducts().pizzas.length > 0 && (
                        <TabsTrigger value="pizzas" className="mb-1">
                          Pizzas
                        </TabsTrigger>
                      )}
                      {groupedProducts().medialunas.length > 0 && (
                        <TabsTrigger value="medialunas" className="mb-1">
                          Medialunas
                        </TabsTrigger>
                      )}
                      {groupedProducts().cajas.length > 0 && (
                        <TabsTrigger value="cajas" className="mb-1">
                          Cajas
                        </TabsTrigger>
                      )}
                      {groupedProducts().sobres.length > 0 && (
                        <TabsTrigger value="sobres" className="mb-1">
                          Sobres
                        </TabsTrigger>
                      )}
                      {groupedProducts().almibar.length > 0 && (
                        <TabsTrigger value="almibar" className="mb-1">
                          Almíbar
                        </TabsTrigger>
                      )}
                    </TabsList>

                    {/* Empanadas */}
                    {groupedProducts().empanadas.length > 0 && (
                      <TabsContent value="empanadas">
                        <Card>
                          <CardHeader>
                            <CardTitle>Empanadas</CardTitle>
                            <CardDescription>Gestione el pedido de empanadas</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="w-[150px]">Venta Promedio</TableHead>
                                    <TableHead className="w-[150px]">Stock Actual</TableHead>
                                    <TableHead className="w-[150px]">Pedido</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {isLoading ? (
                                    <TableRow>
                                      <TableCell colSpan={4} className="text-center py-10">
                                        <div className="flex justify-center">
                                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        </div>
                                        <div className="mt-2">Cargando datos...</div>
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    groupedProducts().empanadas.map((product) => (
                                      <TableRow key={product.id}>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>{salesData[product.id] || 0}</TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={stockItems[product.id] || 0}
                                            onChange={(e) => handleStockChange(product.id, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={orderItems[product.id] || 0}
                                            onChange={(e) => handleOrderChange(product.id, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}

                    {/* Pizzas */}
                    {groupedProducts().pizzas.length > 0 && (
                      <TabsContent value="pizzas">
                        <Card>
                          <CardHeader>
                            <CardTitle>Pizzas</CardTitle>
                            <CardDescription>Gestione el pedido de pizzas</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="w-[150px]">Venta Promedio</TableHead>
                                    <TableHead className="w-[150px]">Stock Actual</TableHead>
                                    <TableHead className="w-[150px]">Pedido</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {isLoading ? (
                                    <TableRow>
                                      <TableCell colSpan={4} className="text-center py-10">
                                        <div className="flex justify-center">
                                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        </div>
                                        <div className="mt-2">Cargando datos...</div>
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    groupedProducts().pizzas.map((product) => (
                                      <TableRow key={product.id}>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>{salesData[product.id] || 0}</TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={stockItems[product.id] || 0}
                                            onChange={(e) => handleStockChange(product.id, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={orderItems[product.id] || 0}
                                            onChange={(e) => handleOrderChange(product.id, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}

                    {/* Medialunas */}
                    {groupedProducts().medialunas.length > 0 && (
                      <TabsContent value="medialunas">
                        <Card>
                          <CardHeader>
                            <CardTitle>Medialunas</CardTitle>
                            <CardDescription>Gestione el pedido de medialunas</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="w-[150px]">Venta Promedio</TableHead>
                                    <TableHead className="w-[150px]">Stock Actual</TableHead>
                                    <TableHead className="w-[150px]">Pedido</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {isLoading ? (
                                    <TableRow>
                                      <TableCell colSpan={4} className="text-center py-10">
                                        <div className="flex justify-center">
                                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        </div>
                                        <div className="mt-2">Cargando datos...</div>
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    groupedProducts().medialunas.map((product) => (
                                      <TableRow key={product.id}>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>{salesData[product.id] || 0}</TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={stockItems[product.id] || 0}
                                            onChange={(e) => handleStockChange(product.id, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={orderItems[product.id] || 0}
                                            onChange={(e) => handleOrderChange(product.id, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}

                    {/* Cajas */}
                    {groupedProducts().cajas.length > 0 && (
                      <TabsContent value="cajas">
                        <Card>
                          <CardHeader>
                            <CardTitle>Cajas</CardTitle>
                            <CardDescription>Gestione el pedido de cajas</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="w-[150px]">Venta Promedio</TableHead>
                                    <TableHead className="w-[150px]">Stock Actual</TableHead>
                                    <TableHead className="w-[150px]">Pedido</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {isLoading ? (
                                    <TableRow>
                                      <TableCell colSpan={4} className="text-center py-10">
                                        <div className="flex justify-center">
                                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        </div>
                                        <div className="mt-2">Cargando datos...</div>
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    groupedProducts().cajas.map((product) => (
                                      <TableRow key={product.id}>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>{salesData[product.id] || 0}</TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={stockItems[product.id] || 0}
                                            onChange={(e) => handleStockChange(product.id, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={orderItems[product.id] || 0}
                                            onChange={(e) => handleOrderChange(product.id, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}

                    {/* Sobres */}
                    {groupedProducts().sobres.length > 0 && (
                      <TabsContent value="sobres">
                        <Card>
                          <CardHeader>
                            <CardTitle>Sobres</CardTitle>
                            <CardDescription>Gestione el pedido de sobres</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="w-[150px]">Venta Promedio</TableHead>
                                    <TableHead className="w-[150px]">Stock Actual</TableHead>
                                    <TableHead className="w-[150px]">Pedido</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {isLoading ? (
                                    <TableRow>
                                      <TableCell colSpan={4} className="text-center py-10">
                                        <div className="flex justify-center">
                                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        </div>
                                        <div className="mt-2">Cargando datos...</div>
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    groupedProducts().sobres.map((product) => (
                                      <TableRow key={product.id}>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>{salesData[product.id] || 0}</TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={stockItems[product.id] || 0}
                                            onChange={(e) => handleStockChange(product.id, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={orderItems[product.id] || 0}
                                            onChange={(e) => handleOrderChange(product.id, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}

                    {/* Almíbar */}
                    {groupedProducts().almibar.length > 0 && (
                      <TabsContent value="almibar">
                        <Card>
                          <CardHeader>
                            <CardTitle>Almíbar</CardTitle>
                            <CardDescription>Gestione el pedido de almíbar</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="w-[150px]">Venta Promedio</TableHead>
                                    <TableHead className="w-[150px]">Stock Actual</TableHead>
                                    <TableHead className="w-[150px]">Pedido</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {isLoading ? (
                                    <TableRow>
                                      <TableCell colSpan={4} className="text-center py-10">
                                        <div className="flex justify-center">
                                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        </div>
                                        <div className="mt-2">Cargando datos...</div>
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    groupedProducts().almibar.map((product) => (
                                      <TableRow key={product.id}>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>{salesData[product.id] || 0}</TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={stockItems[product.id] || 0}
                                            onChange={(e) => handleStockChange(product.id, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={orderItems[product.id] || 0}
                                            onChange={(e) => handleOrderChange(product.id, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}
                  </Tabs>

                  <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleCopyOrder} disabled={isLoading || !selectedLocal}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Pedido
                    </Button>
                    <Button onClick={handleSaveOrder} disabled={isLoading || isSaving || !selectedLocal}>
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? "Guardando..." : "Guardar Pedido"}
                    </Button>
                  </div>
                </div>
              )}

              {!selectedLocal && (
                <div className="py-10 text-center">
                  <p className="text-muted-foreground">
                    {localesWithOrdersToday.length === 0
                      ? "No hay locales con pedidos programados para hoy. Seleccione otra fecha."
                      : "Seleccione un local para generar un pedido."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

