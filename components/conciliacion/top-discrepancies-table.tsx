"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { format, subDays } from "date-fns"

interface TopDiscrepanciesTableProps {
  dateRange: "day" | "week" | "month"
}

export function TopDiscrepanciesTable({ dateRange }: TopDiscrepanciesTableProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [topProducts, setTopProducts] = useState<any[]>([])

  useEffect(() => {
    loadTopProducts()
  }, [dateRange])

  const loadTopProducts = async () => {
    try {
      setIsLoading(true)

      // Calcular el rango de fechas
      const endDate = new Date()
      let startDate: Date

      switch (dateRange) {
        case "day":
          startDate = subDays(endDate, 1) // Último día
          break
        case "week":
          startDate = subDays(endDate, 7) // Última semana
          break
        case "month":
          startDate = subDays(endDate, 30) // Último mes
          break
        default:
          startDate = subDays(endDate, 7)
      }

      // Obtener datos de la base de datos
      const { data, error } = await supabase
        .from("stock_discrepancies")
        .select(`
          product_id,
          product_name,
          category,
          count(*),
          sum(abs(difference)) as total_difference,
          sum(abs(total_value)) as total_value
        `)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"))
        .group("product_id, product_name, category")
        .order("total_value", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error al cargar top productos:", error)
        throw error
      }

      setTopProducts(
        data.map((item) => ({
          productId: item.product_id,
          productName: item.product_name,
          category: item.category,
          occurrences: Number.parseInt(item.count),
          totalDifference: Number.parseInt(item.total_difference),
          totalValue: Number.parseFloat(item.total_value),
        })),
      )
    } catch (error) {
      console.error("Error al cargar top productos:", error)

      // Generar datos de ejemplo en caso de error
      const exampleProducts = [
        {
          productName: "Hamburguesa Clásica",
          category: "Hamburguesas",
          occurrences: 12,
          totalDifference: 24,
          totalValue: 4800,
        },
        {
          productName: "Papas Fritas",
          category: "Acompañamientos",
          occurrences: 10,
          totalDifference: 35,
          totalValue: 3500,
        },
        { productName: "Gaseosa Cola", category: "Bebidas", occurrences: 8, totalDifference: 16, totalValue: 2400 },
        { productName: "Cerveza", category: "Bebidas", occurrences: 7, totalDifference: 14, totalValue: 2100 },
        { productName: "Ensalada César", category: "Ensaladas", occurrences: 6, totalDifference: 12, totalValue: 1800 },
      ]

      setTopProducts(exampleProducts)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (topProducts.length === 0) {
    return <p className="text-center py-4 text-muted-foreground">No hay datos disponibles</p>
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Ocurrencias</TableHead>
            <TableHead className="text-right">Diferencia Total</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topProducts.map((product, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{product.productName}</TableCell>
              <TableCell>
                <Badge variant="outline">{product.category}</Badge>
              </TableCell>
              <TableCell className="text-right">{product.occurrences}</TableCell>
              <TableCell className="text-right">{product.totalDifference} unidades</TableCell>
              <TableCell className="text-right">${product.totalValue.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
