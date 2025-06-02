"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

type StockSheetDetail = {
  id: number
  category: string
  product_name: string
  opening_quantity: number
  incoming_quantity: number
  mercado_pago_sales: number
  pedidos_ya_sales: number
  rappi_sales: number
  discarded_quantity: number
  internal_consumption: number
  has_internal_consumption: boolean
  closing_quantity: number
  unit_value: number
}

type StockSheet = {
  id: number
  date: string
  location_name: string
  manager_name: string
  details: StockSheetDetail[]
}

interface StockSheetDetailsProps {
  id: string
}

export function StockSheetDetails({ id }: StockSheetDetailsProps) {
  const [stockSheet, setStockSheet] = useState<StockSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("")

  useEffect(() => {
    async function fetchStockSheet() {
      try {
        const supabase = createClient()
        // Fetch stock sheet
        const { data: sheetData, error: sheetError } = await supabase
          .from("stock_sheets")
          .select(`
            id,
            date,
            locations(name),
            managers(name)
          `)
          .eq("id", id)
          .single()

        if (sheetError) throw sheetError

        // Fetch stock sheet details
        const { data: detailsData, error: detailsError } = await supabase
          .from("stock_sheet_details")
          .select("*")
          .eq("stock_sheet_id", id)
          .order("category", { ascending: true })
          .order("product_name", { ascending: true })

        if (detailsError) throw detailsError

        setStockSheet({
          id: sheetData.id,
          date: sheetData.date,
          location_name: sheetData.locations?.name || "Desconocido",
          manager_name: sheetData.managers?.name || "Desconocido",
          details: detailsData || [],
        })

        // Set default active tab if details exist
        if (detailsData && detailsData.length > 0) {
          setActiveTab(detailsData[0].category.toLowerCase().replace(/\s+/g, "_"))
        }
      } catch (error: any) {
        console.error("Error fetching stock sheet:", error.message)
        toast({
          title: "Error",
          description: "No se pudo cargar la planilla de stock",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStockSheet()
  }, [id])

  if (loading) {
    return <div>Cargando detalles...</div>
  }

  if (!stockSheet) {
    return <div>No se encontró la planilla de stock</div>
  }

  // Función para calcular el total de unidades vendidas
  const calculateTotalSoldUnits = (detail: StockSheetDetail) => {
    return (
      detail.opening_quantity +
      detail.incoming_quantity -
      detail.closing_quantity -
      detail.discarded_quantity -
      (detail.has_internal_consumption ? detail.internal_consumption : 0)
    )
  }

  // Función para calcular el monto de ventas
  const calculateSalesAmount = (detail: StockSheetDetail) => {
    const totalSold = calculateTotalSoldUnits(detail)
    return totalSold * detail.unit_value
  }

  // Agrupar detalles por categoría
  const detailsByCategory = stockSheet.details.reduce(
    (acc, detail) => {
      if (!acc[detail.category]) {
        acc[detail.category] = []
      }
      acc[detail.category].push(detail)
      return acc
    },
    {} as Record<string, StockSheetDetail[]>,
  )

  // Obtener categorías únicas para las pestañas
  const categories = Object.keys(detailsByCategory)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-md">
          <div className="text-sm text-muted-foreground">Fecha</div>
          <div className="text-lg font-medium">{format(new Date(stockSheet.date), "dd/MM/yyyy", { locale: es })}</div>
        </div>

        <div className="p-4 border rounded-md">
          <div className="text-sm text-muted-foreground">Local</div>
          <div className="text-lg font-medium">{stockSheet.location_name}</div>
        </div>

        <div className="p-4 border rounded-md">
          <div className="text-sm text-muted-foreground">Encargado</div>
          <div className="text-lg font-medium">{stockSheet.manager_name}</div>
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
            {detailsByCategory[category].map((detail) => (
              <Card key={detail.id} className="mb-6">
                <CardHeader>
                  <CardTitle>{detail.product_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Apertura (1)</div>
                      <div className="p-2 border rounded-md bg-gray-50">{detail.opening_quantity} unidades</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Ingreso de Mercadería (2)</div>
                      <div className="p-2 border rounded-md bg-gray-50">{detail.incoming_quantity} unidades</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Ventas Mercado Pago Delivery (3)</div>
                      <div className="p-2 border rounded-md bg-gray-50">{detail.mercado_pago_sales} unidades</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Ventas PedidosYa (4)</div>
                      <div className="p-2 border rounded-md bg-gray-50">{detail.pedidos_ya_sales} unidades</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Ventas Rappi (5)</div>
                      <div className="p-2 border rounded-md bg-gray-50">{detail.rappi_sales} unidades</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Decomisos (6)</div>
                      <div className="p-2 border rounded-md bg-gray-50">{detail.discarded_quantity} unidades</div>
                    </div>

                    {detail.has_internal_consumption && (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Consumos Internos (7)</div>
                        <div className="p-2 border rounded-md bg-gray-50">{detail.internal_consumption} unidades</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Resultado de Cierre{" "}
                        {detail.has_internal_consumption ? "(1 + 2 - 3 - 4 - 5 - 6 - 7)" : "(1 + 2 - 3 - 4 - 5 - 6)"}
                      </div>
                      <div className="p-2 border rounded-md bg-gray-50">{detail.closing_quantity} unidades</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Total de Unidades Vendidas</div>
                      <div className="p-2 border rounded-md bg-gray-50">{calculateTotalSoldUnits(detail)} unidades</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Venta de {detail.product_name} $</div>
                      <div className="p-2 border rounded-md bg-gray-50">${calculateSalesAmount(detail).toFixed(2)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
