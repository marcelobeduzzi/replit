"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { addDays } from "date-fns"
import { Download, RefreshCw, Search } from "lucide-react"

// Datos simulados de locales
const mockLocations = [
  { id: "local-1", name: "BR Cabildo" },
  { id: "local-2", name: "BR Carranza" },
  { id: "local-3", name: "BR Pacífico" },
  { id: "local-4", name: "BR Local 4" },
  { id: "local-5", name: "BR Local 5" },
]

// Datos simulados de registros de fichaje
const mockClockRecords = [
  {
    id: "record-1",
    employeeId: "emp-1",
    employeeName: "Juan Pérez",
    location: "BR Cabildo",
    timestamp: "2023-11-01T08:02:15",
    type: "entrada",
    coordinates: { latitude: -34.5638, longitude: -58.4655 },
    verified: true,
  },
  {
    id: "record-2",
    employeeId: "emp-1",
    employeeName: "Juan Pérez",
    location: "BR Cabildo",
    timestamp: "2023-11-01T17:05:22",
    type: "salida",
    coordinates: { latitude: -34.5638, longitude: -58.4655 },
    verified: true,
  },
  {
    id: "record-3",
    employeeId: "emp-2",
    employeeName: "María López",
    location: "BR Carranza",
    timestamp: "2023-11-01T09:10:05",
    type: "entrada",
    coordinates: { latitude: -34.573, longitude: -58.4498 },
    verified: true,
  },
  {
    id: "record-4",
    employeeId: "emp-2",
    employeeName: "María López",
    location: "BR Carranza",
    timestamp: "2023-11-01T18:15:30",
    type: "salida",
    coordinates: { latitude: -34.573, longitude: -58.4498 },
    verified: true,
  },
  {
    id: "record-5",
    employeeId: "emp-3",
    employeeName: "Carlos Rodríguez",
    location: "BR Pacífico",
    timestamp: "2023-11-01T08:30:45",
    type: "entrada",
    coordinates: { latitude: -34.582, longitude: -58.435 },
    verified: false,
  },
  {
    id: "record-6",
    employeeId: "emp-3",
    employeeName: "Carlos Rodríguez",
    location: "BR Pacífico",
    timestamp: "2023-11-01T17:45:10",
    type: "salida",
    coordinates: { latitude: -34.612, longitude: -58.415 }, // Ubicación diferente (no verificada)
    verified: false,
  },
]

export function ClockHistory() {
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -7),
    to: new Date(),
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [records, setRecords] = useState<any[]>([])

  // Cargar registros al montar el componente o cuando cambian los filtros
  useEffect(() => {
    loadRecords()
  }, [selectedLocation, dateRange])

  const loadRecords = () => {
    setLoading(true)

    // Simular carga de datos
    setTimeout(() => {
      // Filtrar por local
      let filteredRecords = [...mockClockRecords]

      if (selectedLocation !== "all") {
        const locationName = mockLocations.find((loc) => loc.id === selectedLocation)?.name
        filteredRecords = filteredRecords.filter((record) => record.location === locationName)
      }

      // Filtrar por rango de fechas
      if (dateRange.from && dateRange.to) {
        filteredRecords = filteredRecords.filter((record) => {
          const recordDate = new Date(record.timestamp)
          return recordDate >= dateRange.from && recordDate <= dateRange.to
        })
      }

      // Filtrar por término de búsqueda
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filteredRecords = filteredRecords.filter(
          (record) =>
            record.employeeName.toLowerCase().includes(term) || record.employeeId.toLowerCase().includes(term),
        )
      }

      // Ordenar por fecha (más reciente primero)
      filteredRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setRecords(filteredRecords)
      setLoading(false)
    }, 500)
  }

  const handleSearch = () => {
    loadRecords()
  }

  const handleExport = () => {
    // Crear CSV
    const headers = ["Empleado", "Local", "Fecha", "Hora", "Tipo", "Verificado"]
    const csvRows = [headers]

    records.forEach((record) => {
      const date = new Date(record.timestamp)
      csvRows.push([
        record.employeeName,
        record.location,
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        record.type === "entrada" ? "Entrada" : "Salida",
        record.verified ? "Sí" : "No",
      ])
    })

    // Convertir a string CSV
    const csvContent = csvRows.map((row) => row.join(",")).join("\n")

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `fichajes-qr-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="location-select">Local</Label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger id="location-select">
              <SelectValue placeholder="Todos los locales" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los locales</SelectItem>
              {mockLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Rango de fechas</Label>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>

        <div>
          <Label htmlFor="search-input">Buscar empleado</Label>
          <div className="flex gap-2">
            <Input
              id="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre o ID"
            />
            <Button variant="outline" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Registros de fichaje</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadRecords} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Actualizar</span>
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={records.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Verificado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    {loading ? "Cargando registros..." : "No se encontraron registros"}
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => {
                  const date = new Date(record.timestamp)
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">{record.employeeName}</div>
                        <div className="text-xs text-muted-foreground">{record.employeeId}</div>
                      </TableCell>
                      <TableCell>{record.location}</TableCell>
                      <TableCell>{date.toLocaleDateString()}</TableCell>
                      <TableCell>{date.toLocaleTimeString()}</TableCell>
                      <TableCell>
                        <Badge variant={record.type === "entrada" ? "default" : "secondary"}>
                          {record.type === "entrada" ? "Entrada" : "Salida"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.verified ? "success" : "destructive"}>
                          {record.verified ? "Verificado" : "No verificado"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Los registros marcados como "No verificados" indican que la geolocalización no coincidía con la ubicación
            esperada del local al momento del fichaje.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

