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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Search, FileDown, Eye, Filter } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

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

// Interfaces para los tipos de operaciones
interface CierreCaja {
  id: string
  local_id: string
  local_name: string
  date: string
  shift: string
  responsible: string
  supervisor: string | null
  total_sales: number
  cash_sales: number
  credit_card_sales: number
  debit_card_sales: number
  transfer_sales: number
  mercado_pago_sales: number
  other_sales: number
  initial_balance: number
  total_expenses: number
  total_withdrawals: number
  expected_balance: number
  actual_balance: number
  difference: number
  difference_percentage: number
  status: string
  has_alert: boolean
  created_at: string
}

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

// Tipo unión para operaciones
type Operacion = (CierreCaja | AperturaCaja) & {
  tipo: "apertura" | "cierre"
}

export default function HistorialCompletoPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("todos")
  const [operaciones, setOperaciones] = useState<Operacion[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  const [filtros, setFiltros] = useState({
    local_id: "",
    fecha_desde: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
    fecha_hasta: format(new Date(), "yyyy-MM-dd"),
    turno: "",
    estado: "",
    tipo: "",
  })

  // Cargar operaciones
  useEffect(() => {
    const fetchOperaciones = async () => {
      try {
        setIsLoading(true)

        // Consulta para aperturas
        let aperturasQuery = supabase.from("cash_register_openings").select("*")

        // Consulta para cierres
        let cierresQuery = supabase.from("cash_register_closings").select("*")

        // Aplicar filtros comunes a ambas consultas
        if (filtros.local_id) {
          aperturasQuery = aperturasQuery.eq("local_id", filtros.local_id)
          cierresQuery = cierresQuery.eq("local_id", filtros.local_id)
        }

        if (filtros.fecha_desde) {
          aperturasQuery = aperturasQuery.gte("date", filtros.fecha_desde)
          cierresQuery = cierresQuery.gte("date", filtros.fecha_desde)
        }

        if (filtros.fecha_hasta) {
          aperturasQuery = aperturasQuery.lte("date", filtros.fecha_hasta)
          cierresQuery = cierresQuery.lte("date", filtros.fecha_hasta)
        }

        if (filtros.turno) {
          aperturasQuery = aperturasQuery.eq("shift", filtros.turno)
          cierresQuery = cierresQuery.eq("shift", filtros.turno)
        }

        if (filtros.estado) {
          aperturasQuery = aperturasQuery.eq("status", filtros.estado)
          cierresQuery = cierresQuery.eq("status", filtros.estado)
        }

        // Ejecutar consultas según el tipo seleccionado
        let aperturas: AperturaCaja[] = []
        let cierres: CierreCaja[] = []

        if (filtros.tipo !== "cierre") {
          const { data: aperturasData, error: aperturasError } = await aperturasQuery
          if (aperturasError) throw aperturasError
          aperturas = aperturasData || []
        }

        if (filtros.tipo !== "apertura") {
          const { data: cierresData, error: cierresError } = await cierresQuery
          if (cierresError) throw cierresError
          cierres = cierresData || []
        }

        // Transformar y combinar resultados
        const aperturasFormateadas: Operacion[] = aperturas.map((a) => ({
          ...a,
          tipo: "apertura",
        }))

        const cierresFormateados: Operacion[] = cierres.map((c) => ({
          ...c,
          tipo: "cierre",
        }))

        // Combinar y ordenar por fecha y hora
        const todasOperaciones = [...aperturasFormateadas, ...cierresFormateados].sort((a, b) => {
          // Ordenar primero por fecha
          const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime()
          if (dateComparison !== 0) return dateComparison

          // Si la fecha es la misma, ordenar por created_at
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        // Calcular paginación
        const totalItems = todasOperaciones.length
        setTotalPages(Math.ceil(totalItems / itemsPerPage))

        // Filtrar por página actual
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const operacionesPaginadas = todasOperaciones.slice(startIndex, endIndex)

        setOperaciones(operacionesPaginadas)
      } catch (error) {
        console.error("Error al cargar operaciones:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOperaciones()
  }, [supabase, filtros, currentPage])

  // Manejar cambios en los filtros
  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }))
    setCurrentPage(1) // Resetear a la primera página al cambiar filtros
  }

  // Manejar cambios en selects
  const handleSelectChange = (name: string, value: string) => {
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }))
    setCurrentPage(1) // Resetear a la primera página al cambiar filtros
  }

  // Cambiar tipo de operación según la pestaña
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    let tipoFiltro = ""
    if (value === "aperturas") tipoFiltro = "apertura"
    else if (value === "cierres") tipoFiltro = "cierre"

    setFiltros((prev) => ({
      ...prev,
      tipo: tipoFiltro,
    }))

    setCurrentPage(1) // Resetear a la primera página al cambiar de pestaña
  }

  // Resetear filtros
  const resetearFiltros = () => {
    setFiltros({
      local_id: "",
      fecha_desde: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
      fecha_hasta: format(new Date(), "yyyy-MM-dd"),
      turno: "",
      estado: "",
      tipo: activeTab === "todos" ? "" : activeTab === "aperturas" ? "apertura" : "cierre",
    })
    setCurrentPage(1)
  }

  // Ver detalle de una operación
  const verDetalle = (id: string, tipo: "apertura" | "cierre") => {
    router.push(`/caja/${tipo}/${id}`)
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

  // Renderizar badge de tipo de operación
  const renderTipoBadge = (tipo: "apertura" | "cierre") => {
    switch (tipo) {
      case "apertura":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Apertura
          </Badge>
        )
      case "cierre":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Cierre
          </Badge>
        )
    }
  }

  // Renderizar monto según tipo de operación
  const renderMonto = (operacion: Operacion) => {
    if (operacion.tipo === "apertura") {
      const apertura = operacion as AperturaCaja & { tipo: "apertura" }
      return `$${apertura.initial_amount.toLocaleString()}`
    } else {
      const cierre = operacion as CierreCaja & { tipo: "cierre" }
      return `$${cierre.total_sales.toLocaleString()}`
    }
  }

  // Renderizar información adicional según tipo
  const renderInfoAdicional = (operacion: Operacion) => {
    if (operacion.tipo === "apertura") {
      const apertura = operacion as AperturaCaja & { tipo: "apertura" }
      return (
        <Badge
          variant="outline"
          className={apertura.has_closing ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}
        >
          {apertura.has_closing ? "Cerrado" : "Pendiente"}
        </Badge>
      )
    } else {
      const cierre = operacion as CierreCaja & { tipo: "cierre" }
      return (
        <span className={cierre.difference !== 0 ? (cierre.difference > 0 ? "text-green-600" : "text-red-600") : ""}>
          ${cierre.difference.toLocaleString()}
        </span>
      )
    }
  }

  return (
    <DashboardLayout isLoading={isLoading}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Historial de Operaciones de Caja</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/caja/historial/aperturas")}>
              Ver Aperturas
            </Button>
            <Button variant="outline" onClick={() => router.push("/caja/historial")}>
              Ver Cierres
            </Button>
            <Button variant="outline" onClick={() => router.push("/caja")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todos">Todas las Operaciones</TabsTrigger>
            <TabsTrigger value="aperturas">Aperturas</TabsTrigger>
            <TabsTrigger value="cierres">Cierres</TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="space-y-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={resetearFiltros}>
                    Resetear
                  </Button>
                  <Button onClick={() => setCurrentPage(1)}>
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
                        <TableHead>Tipo</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Info</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operaciones.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-4">
                            No se encontraron registros
                          </TableCell>
                        </TableRow>
                      ) : (
                        operaciones.map((operacion) => (
                          <TableRow key={`${operacion.tipo}-${operacion.id}`}>
                            <TableCell>{operacion.date}</TableCell>
                            <TableCell>{operacion.local_name}</TableCell>
                            <TableCell>
                              {operacion.shift === "mañana"
                                ? "Mañana"
                                : operacion.shift === "tarde"
                                  ? "Tarde"
                                  : operacion.shift}
                            </TableCell>
                            <TableCell>{renderTipoBadge(operacion.tipo)}</TableCell>
                            <TableCell>{operacion.responsible}</TableCell>
                            <TableCell className="text-right">{renderMonto(operacion)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(operacion.status)}>
                                {operacion.status === "aprobado"
                                  ? "Aprobado"
                                  : operacion.status === "pendiente"
                                    ? "Pendiente"
                                    : operacion.status === "rechazado"
                                      ? "Rechazado"
                                      : operacion.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{renderInfoAdicional(operacion)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => verDetalle(operacion.id, operacion.tipo)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page}>
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aperturas" className="space-y-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={resetearFiltros}>
                    Resetear
                  </Button>
                  <Button onClick={() => setCurrentPage(1)}>
                    <Search className="mr-2 h-4 w-4" />
                    Aplicar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Aperturas de Caja</CardTitle>
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
                      {operaciones.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-4">
                            No se encontraron registros
                          </TableCell>
                        </TableRow>
                      ) : (
                        operaciones
                          .filter((op) => op.tipo === "apertura")
                          .map((operacion) => {
                            const apertura = operacion as AperturaCaja & { tipo: "apertura" }
                            return (
                              <TableRow key={`${operacion.tipo}-${operacion.id}`}>
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
                                <TableCell className="text-right">
                                  ${apertura.initial_amount.toLocaleString()}
                                </TableCell>
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
                                      apertura.has_closing
                                        ? "bg-green-50 text-green-700"
                                        : "bg-yellow-50 text-yellow-700"
                                    }
                                  >
                                    {apertura.has_closing ? "Cerrado" : "Pendiente"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => verDetalle(apertura.id, "apertura")}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page}>
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cierres" className="space-y-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={resetearFiltros}>
                    Resetear
                  </Button>
                  <Button onClick={() => setCurrentPage(1)}>
                    <Search className="mr-2 h-4 w-4" />
                    Aplicar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Cierres de Caja</CardTitle>
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
                        <TableHead className="text-right">Ventas Totales</TableHead>
                        <TableHead className="text-right">Diferencia</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operaciones.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-4">
                            No se encontraron registros
                          </TableCell>
                        </TableRow>
                      ) : (
                        operaciones
                          .filter((op) => op.tipo === "cierre")
                          .map((operacion) => {
                            const cierre = operacion as CierreCaja & { tipo: "cierre" }
                            return (
                              <TableRow key={`${operacion.tipo}-${operacion.id}`}>
                                <TableCell>{cierre.date}</TableCell>
                                <TableCell>{cierre.local_name}</TableCell>
                                <TableCell>
                                  {cierre.shift === "mañana"
                                    ? "Mañana"
                                    : cierre.shift === "tarde"
                                      ? "Tarde"
                                      : cierre.shift}
                                </TableCell>
                                <TableCell>{cierre.responsible}</TableCell>
                                <TableCell className="text-right">${cierre.total_sales.toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                  <span
                                    className={
                                      cierre.difference !== 0
                                        ? cierre.difference > 0
                                          ? "text-green-600"
                                          : "text-red-600"
                                        : ""
                                    }
                                  >
                                    ${cierre.difference.toLocaleString()}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(cierre.status)}>
                                    {cierre.status === "aprobado"
                                      ? "Aprobado"
                                      : cierre.status === "pendiente"
                                        ? "Pendiente"
                                        : cierre.status === "rechazado"
                                          ? "Rechazado"
                                          : cierre.status}
                                  </Badge>
                                  {cierre.has_alert && <Badge className="ml-2 bg-red-100 text-red-800">Alerta</Badge>}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => verDetalle(cierre.id, "cierre")}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page}>
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
