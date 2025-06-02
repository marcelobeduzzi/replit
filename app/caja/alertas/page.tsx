"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Search, ArrowUpDown, CheckCircle, XCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Lista de locales para filtrar
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

export default function AlertasPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [alertas, setAlertas] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLocal, setFilterLocal] = useState("all")
  const [filterFecha, setFilterFecha] = useState("")
  const [filterEstado, setFilterEstado] = useState("all")
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  }>({ key: "created_at", direction: "descending" })

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Consulta sin filtro de estado para ver todas las alertas
        const { data, error } = await supabase
          .from("cash_register_alerts")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error

        console.log("Alertas cargadas:", data) // Para depuración
        setAlertas(data || [])
      } catch (error) {
        console.error("Error al cargar alertas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  // Función para ordenar
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Filtrar y ordenar alertas
  const filteredAlertas = alertas
    .filter((alerta) => {
      const matchesSearch =
        alerta.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alerta.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alerta.local_name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesLocal = filterLocal === "all" || alerta.local_id === filterLocal

      const matchesFecha = !filterFecha || (alerta.date && alerta.date.startsWith(filterFecha))

      const matchesEstado = filterEstado === "all" || alerta.status === filterEstado

      return matchesSearch && matchesLocal && matchesFecha && matchesEstado
    })
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })

  // Formatear fecha
  const formatFecha = (fechaStr: string) => {
    if (!fechaStr) return "N/A"
    try {
      const fecha = new Date(fechaStr)
      return format(fecha, "dd/MM/yyyy HH:mm", { locale: es })
    } catch (error) {
      return fechaStr
    }
  }

  // Renderizar badge de estado
  const renderEstadoBadge = (estado: string) => {
    switch (estado) {
      case "activa":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Activa
          </Badge>
        )
      case "resuelta":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Resuelta
          </Badge>
        )
      case "rechazada":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rechazada
          </Badge>
        )
      default:
        return <Badge variant="outline">{estado || "Desconocido"}</Badge>
    }
  }

  // Renderizar badge de prioridad
  const renderPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Alta
          </Badge>
        )
      case "media":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Media
          </Badge>
        )
      case "baja":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Baja
          </Badge>
        )
      default:
        return <Badge variant="outline">{prioridad || "Normal"}</Badge>
    }
  }

  // Manejar resolución de alerta
  const handleResolveAlert = async (id: string) => {
    try {
      const { error } = await supabase.from("cash_register_alerts").update({ status: "resuelta" }).eq("id", id)

      if (error) throw error

      // Actualizar la lista de alertas
      setAlertas(
        alertas.map((alerta) => {
          if (alerta.id === id) {
            return { ...alerta, status: "resuelta" }
          }
          return alerta
        }),
      )
    } catch (error) {
      console.error("Error al resolver la alerta:", error)
    }
  }

  // Manejar rechazo de alerta
  const handleRejectAlert = async (id: string) => {
    try {
      const { error } = await supabase.from("cash_register_alerts").update({ status: "rechazada" }).eq("id", id)

      if (error) throw error

      // Actualizar la lista de alertas
      setAlertas(
        alertas.map((alerta) => {
          if (alerta.id === id) {
            return { ...alerta, status: "rechazada" }
          }
          return alerta
        }),
      )
    } catch (error) {
      console.error("Error al rechazar la alerta:", error)
    }
  }

  return (
    <DashboardLayout isLoading={isLoading}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Alertas del Sistema de Caja</h1>
        </div>

        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título, descripción o local..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterLocal} onValueChange={setFilterLocal}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filtrar por local" />
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
                <div className="w-full md:w-[200px]">
                  <Input
                    type="date"
                    value={filterFecha}
                    onChange={(e) => setFilterFecha(e.target.value)}
                    placeholder="Filtrar por fecha"
                  />
                </div>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="activa">Activas</SelectItem>
                    <SelectItem value="resuelta">Resueltas</SelectItem>
                    <SelectItem value="rechazada">Rechazadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de alertas */}
          <Card>
            <CardHeader>
              <CardTitle>Listado de Alertas</CardTitle>
              <CardDescription>Gestión de alertas del sistema de caja</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("created_at")}>
                        Fecha
                        {sortConfig.key === "created_at" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("local_name")}>
                        Local
                        {sortConfig.key === "local_name" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("title")}>
                        Título
                        {sortConfig.key === "title" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                      </TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlertas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No se encontraron alertas
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAlertas.map((alerta) => (
                        <TableRow key={alerta.id}>
                          <TableCell>{formatFecha(alerta.created_at)}</TableCell>
                          <TableCell className="font-medium">{alerta.local_name}</TableCell>
                          <TableCell>{alerta.title}</TableCell>
                          <TableCell className="max-w-xs truncate">{alerta.description}</TableCell>
                          <TableCell>{renderPrioridadBadge(alerta.priority)}</TableCell>
                          <TableCell>{renderEstadoBadge(alerta.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Ver detalles"
                                onClick={() => router.push(`/caja/alertas/${alerta.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {alerta.status === "activa" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Resolver alerta"
                                    onClick={() => handleResolveAlert(alerta.id)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Rechazar alerta"
                                    onClick={() => handleRejectAlert(alerta.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
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
      </div>
    </DashboardLayout>
  )
}





