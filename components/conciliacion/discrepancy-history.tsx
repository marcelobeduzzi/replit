"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface DiscrepancyHistoryProps {
  localId?: number
}

export function DiscrepancyHistory({ localId }: DiscrepancyHistoryProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [historyData, setHistoryData] = useState<any[]>([])

  useEffect(() => {
    loadHistoryData()
  }, [localId])

  const loadHistoryData = async () => {
    try {
      setIsLoading(true)

      let query = supabase
        .from("stock_discrepancies")
        .select("date, location_id, shift, count(*)")
        .group("date, location_id, shift")
        .order("date", { ascending: false })
        .limit(20)

      // Si hay un ID de local específico, filtrar por ese local
      if (localId) {
        query = query.eq("location_id", localId)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error al cargar historial:", error)
        setHistoryData([])
        setIsLoading(false)
        return
      }

      // Obtener información de los locales para mostrar nombres en lugar de IDs
      const { data: localesData } = await supabase.from("locals").select("id, name")

      // Mapear los datos para incluir el nombre del local
      const mappedData = (data || []).map((item) => {
        const local = localesData?.find((l) => l.id === item.location_id)
        return {
          ...item,
          localName: local ? local.name : `Local ${item.location_id}`,
        }
      })

      setHistoryData(mappedData)
    } catch (error) {
      console.error("Error al cargar historial:", error)
      setHistoryData([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetail = (date: string, locationId: number, shift: string) => {
    router.push(`/conciliacion/local/${locationId}?date=${date}&shift=${shift}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (historyData.length === 0) {
    return <p className="text-center py-4 text-muted-foreground">No hay historial de discrepancias para mostrar</p>
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            {!localId && <TableHead>Local</TableHead>}
            <TableHead>Turno</TableHead>
            <TableHead className="text-right">Discrepancias</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historyData.map((item, index) => (
            <TableRow key={`${item.date}-${item.location_id}-${item.shift}-${index}`}>
              <TableCell>{format(new Date(item.date), "dd/MM/yyyy")}</TableCell>
              {!localId && <TableCell>{item.localName}</TableCell>}
              <TableCell>
                <Badge variant="outline">
                  {item.shift === "mañana" ? "Mañana" : item.shift === "tarde" ? "Tarde" : item.shift}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{item.count}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewDetail(item.date, item.location_id, item.shift)}
                >
                  Ver
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
