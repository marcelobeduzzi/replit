"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

type StockSheet = {
  id: number
  date: string
  location_name: string
  manager_name: string
}

export function StockSheetList() {
  const [stockSheets, setStockSheets] = useState<StockSheet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStockSheets() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("stock_sheets")
          .select(`
            id,
            date,
            locations(name),
            managers(name)
          `)
          .order("date", { ascending: false })

        if (error) throw error

        const formattedData =
          data?.map((item) => ({
            id: item.id,
            date: item.date,
            location_name: item.locations?.name || "Desconocido",
            manager_name: item.managers?.name || "Desconocido",
          })) || []

        setStockSheets(formattedData)
      } catch (error: any) {
        console.error("Error fetching stock sheets:", error.message)
        toast({
          title: "Error",
          description: "No se pudieron cargar las planillas de stock",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStockSheets()
  }, [])

  if (loading) {
    return <div>Cargando planillas...</div>
  }

  return (
    <div className="rounded-lg border">
      {stockSheets.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No hay planillas de stock registradas</p>
          <Button asChild>
            <Link href="/stock-check/new">Crear Nueva Planilla</Link>
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Encargado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockSheets.map((sheet) => (
              <TableRow key={sheet.id}>
                <TableCell>{format(new Date(sheet.date), "dd/MM/yyyy", { locale: es })}</TableCell>
                <TableCell>{sheet.location_name}</TableCell>
                <TableCell>{sheet.manager_name}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/stock-check/${sheet.id}`}>Ver</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
