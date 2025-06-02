"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Search, FileDown, Eye } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Badge } from "@/components/ui/badge"

// Lista de locales para seleccionar
const locales = [
  { id: "cabildo", name: "BR Cabildo" },
  { id: "carranza", name: "BR Carranza" },
  { id: "pacifico", name: "BR Pacífico" },
  { id: "lavalle", name: "BR Lavalle" },
  { id: "rivadavia", name: "BR Rivadavia" },
  { id: "aguero", name: "BR Aguero" },
  { id: "dorrego", name: "BR Dorrego" },
  { id: "dean_dennys", name: "Dean & Dennys" },
]

// Interfaz para las aperturas de caja
interface AperturaCaja {
  id: string
  local_id: string
  local_name: string
  date: string
  shift: string
  responsible: string
  supervisor: string | null
  initial_amount: number
  status: string
  has_closing: boolean
  created_at: string
}

export default function HistorialAperturasPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [aperturas, setAperturas] = useState<AperturaCaja[]>([])
  const [filtros, setFiltros] = useState({
    local_id: "",
    fecha_desde: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
    fecha_hasta: format(new Date(), "yyyy-MM-dd"),
    turno: "",
    estado: "",
    has_closing: "",
  })

  // Cargar aperturas de caja
  useEffect(() => {
    const fetchAperturas = async () => {
      try {
        setIsLoading(true)

        let query = supabase
          .from("cash_register_openings")
          .select("*")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })

        // Aplicar filtros
        if (filtros.local_id) {
          query = query.eq("local_id", filtros.local_id)
        }

        if (filtros.fecha_desde) {
          query = query.gte("date", filtros.fecha_desde)
        }

        if (filtros.fecha_hasta) {
          query = query.lte("date", filtros.fecha_hasta)
        }

        if (filtros.turno) {
          query = query.eq("shift", filtros.turno)
        }

        if (filtros.estado) {
          query = query.eq("status", filtros.estado)
        }

        if (filtros.has_closing) {
          query = query.eq("has_closing", filtros.has_closing === "true")
        }

        const { data, error } = await query

        if (error) throw error

        setAperturas(data || [])
      } catch (error) {
        console.error("Error al cargar aperturas de caja:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAperturas()
  }, [supabase, filtros])

  // Manejar cambios en los filtros
  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Manejar cambios en selects
  const handleSelectChange = (name: string, value: string) => {
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Aplicar filtros
  const aplicarFiltros = () => {
    // Los filtros se aplican automáticamente en el useEffect
  }

  // Resetear filtros
  const resetearFiltros = () => {
    setFiltros({
      local_id: "",
      fecha_desde: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
      fecha_hasta: format(new Date(), "yyyy-MM-dd"),
      turno: "",
      estado: "",
      has_closing: "",
    })
  }

  // Ver detalle de una apertura
  const verDetalle = (id: string) => {
    router.push(`/caja/apertura/${id}`)
  }

  // Exportar a Excel (simulado)
  const exportarExcel = () => {
    alert("Funcionalidad de exportación a Excel en desarrollo")
  }

  // Obtener color de badge según estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprobado":
        return "bg-green-100 text-green-800"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      case "rechazado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout isLoading={isLoading}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Historial de Aperturas de Caja</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/caja/historial")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Historial Completo
            </Button>
            <Button variant="outline" onClick={() => router.push("/caja")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label htmlFor="local_id">Local</Label>
                <Select value={filtros.local_id} onValueChange={(value) => handleSelectChange("local_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los locales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los locales</SelectItem>
                    {locales.map((local) => (
                      <SelectItem key={local.id} value={local.id}>
                        {local.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_desde">Desde</Label>
                <Input
                  id="fecha_desde"
                  name="fecha_desde"
                  type="date"
                  value={filtros.fecha_desde}
                  onChange={handleFiltroChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_hasta">Hasta</Label>
                <Input
                  id="fecha_hasta"
                  name="fecha_hasta"
                  type="date"
                  value={filtros.fecha_hasta}
                  onChange={handleFiltroChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="turno">Turno</Label>
                <Select value={filtros.turno} onValueChange={(value) => handleSelectChange("turno", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los turnos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los turnos</SelectItem>
                    <SelectItem value="mañana">Mañana</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select value={filtros.estado} onValueChange={(value) => handleSelectChange("estado", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="has_closing">Con cierre</Label>
                <Select value={filtros.has_closing} onValueChange={(value) => handleSelectChange("has_closing", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Con cierre</SelectItem>
                    <SelectItem value="false">Sin cierre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={resetearFiltros}>
                Resetear
              </Button>
              <Button onClick={aplicarFiltros}>
                <Search className="mr-2 h-4 w-4" />
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Resultados</CardTitle>
            <Button variant="outline" onClick={exportarExcel}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar a Excel
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead className="text-right">Monto Inicial</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cierre</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aperturas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No se encontraron registros
                      </TableCell>
                    </TableRow>
                  ) : (
                    aperturas.map((apertura) => (
                      <TableRow key={apertura.id}>
                        <TableCell>{apertura.date}</TableCell>
                        <TableCell>{apertura.local_name}</TableCell>
                        <TableCell>
                          {apertura.shift === "mañana"
                            ? "Mañana"
                            : apertura.shift === "tarde"
                              ? "Tarde"
                              : apertura.shift}
                        </TableCell>
                        <TableCell>{apertura.responsible}</TableCell>
                        <TableCell className="text-right">${apertura.initial_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(apertura.status)}>
                            {apertura.status === "aprobado"
                              ? "Aprobado"
                              : apertura.status === "pendiente"
                                ? "Pendiente"
                                : apertura.status === "rechazado"
                                  ? "Rechazado"
                                  : apertura.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              apertura.has_closing ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                            }
                          >
                            {apertura.has_closing ? "Cerrado" : "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => verDetalle(apertura.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
