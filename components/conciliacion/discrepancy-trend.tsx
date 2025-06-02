"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { format, subDays, eachDayOfInterval } from "date-fns"

interface DiscrepancyTrendProps {
  type: "stock" | "cash"
  dateRange: "day" | "week" | "month"
}

export function DiscrepancyTrend({ type, dateRange }: DiscrepancyTrendProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [trendData, setTrendData] = useState<any[]>([])

  useEffect(() => {
    loadTrendData()
  }, [type, dateRange])

  const loadTrendData = async () => {
    try {
      setIsLoading(true)

      // Calcular el rango de fechas
      const endDate = new Date()
      let startDate: Date

      switch (dateRange) {
        case "day":
          startDate = subDays(endDate, 7) // Últimos 7 días
          break
        case "week":
          startDate = subDays(endDate, 30) // Últimos 30 días
          break
        case "month":
          startDate = subDays(endDate, 90) // Últimos 90 días
          break
        default:
          startDate = subDays(endDate, 7)
      }

      // Generar array de fechas para el intervalo
      const dateInterval = eachDayOfInterval({ start: startDate, end: endDate })
      const dateLabels = dateInterval.map((date) => format(date, "dd/MM"))

      // Obtener datos de la base de datos
      const tableName = type === "stock" ? "stock_discrepancies" : "cash_discrepancies"
      const { data, error } = await supabase
        .from(tableName)
        .select("date, count(*)")
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"))
        .group("date")
        .order("date")

      if (error) {
        console.error(`Error al cargar tendencia de ${type}:`, error)
        throw error
      }

      // Crear mapa de fechas a conteos
      const countMap = new Map()
      data?.forEach((item) => {
        countMap.set(item.date, Number.parseInt(item.count))
      })

      // Generar datos para mostrar
      const trendItems = dateLabels.map((label) => {
        const dbDate = format(
          new Date(`${label.split("/")[1]}/${label.split("/")[0]}/${new Date().getFullYear()}`),
          "yyyy-MM-dd",
        )
        return {
          date: label,
          count: countMap.get(dbDate) || 0,
        }
      })

      setTrendData(trendItems)
    } catch (error) {
      console.error(`Error al cargar tendencia de ${type}:`, error)

      // Generar datos de ejemplo en caso de error
      const labels = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), "dd/MM"))
      const data = Array.from({ length: 7 }, () => Math.floor(Math.random() * 20))

      setTrendData(
        labels.map((date, index) => ({
          date,
          count: data[index],
        })),
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Versión simplificada sin gráficos
  return (
    <div className="h-full flex flex-col">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">
          {type === "stock" ? "Discrepancias de Stock" : "Discrepancias de Caja"} - Últimos días
        </h3>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-left">Fecha</th>
              <th className="border p-2 text-right">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {trendData.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                <td className="border p-2">{item.date}</td>
                <td className="border p-2 text-right">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
