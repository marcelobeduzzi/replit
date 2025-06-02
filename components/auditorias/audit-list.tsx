"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Eye, Search } from 'lucide-react'

interface Audit {
  id: string
  localId?: string
  localName?: string
  local_name?: string
  local?: string
  auditor?: string
  auditorName?: string
  auditor_name?: string
  date: string
  totalScore: number
  maxScore: number
  percentage: number
  categories?: any[]
  type?: string // Tipo de auditoría: 'rapida' o 'detallada'
  shift?: string // Turno: 'morning', 'afternoon', 'night'
}

interface AuditListProps {
  audits: Audit[]
}

export function AuditList({ audits }: AuditListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLocal, setFilterLocal] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterMonth, setFilterMonth] = useState("all")
  const [filterYear, setFilterYear] = useState("all")

  // Verificar que audits sea un array antes de continuar
  if (!audits || !Array.isArray(audits)) {
    console.error("Error: audits no es un array", audits)
    return (
      <div className="space-y-4">
        <div className="text-center p-4">
          <p>No hay auditorías disponibles o hay un error en los datos.</p>
        </div>
      </div>
    )
  }

  // Depurar los datos recibidos
  console.log("Datos de auditorías recibidos:", audits)

  // Procesar auditorías para asegurar que tengan los campos necesarios
  const processedAudits = audits
    .map((audit) => {
      if (!audit) return null

      // Asegurar que localName esté disponible
      if (!audit.localName && audit.local_name) {
        audit.localName = audit.local_name
      }
      
      // Si no hay localName pero hay local, usar local
      if (!audit.localName && audit.local) {
        audit.localName = audit.local
      }

      // Asegurar que auditorName esté disponible
      if (!audit.auditorName && audit.auditor_name) {
        audit.auditorName = audit.auditor_name
      }

      // Si aún no hay auditorName, usar auditor
      if (!audit.auditorName && audit.auditor) {
        audit.auditorName = audit.auditor
      }

      // Si no hay tipo, asignar 'detallada' por defecto (para auditorías antiguas)
      if (!audit.type) {
        audit.type = 'detallada'
      }

      return audit
    })
    .filter(Boolean)

  // Obtener lista única de locales para el filtro
  const uniqueLocals = Array.from(
    new Set(
      processedAudits
        .filter((audit) => audit && (audit.localId || audit.localName || audit.local))
        .map((audit) => audit.localId || audit.localName || audit.local),
    ),
  ).map((localIdentifier) => {
    const audit = processedAudits.find((a) => a && (a.localId === localIdentifier || a.localName === localIdentifier || a.local === localIdentifier))
    return {
      id: localIdentifier || "",
      name: audit?.localName || audit?.local || localIdentifier || "Local sin nombre",
    }
  })

  // Obtener años y meses únicos para los filtros
  const dates = processedAudits.map(audit => new Date(audit.date))
  const years = Array.from(new Set(dates.map(date => date.getFullYear()))).sort((a, b) => b - a)
  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ]

  // Función para obtener el color de la barra según el porcentaje
  const getProgressColor = (percentage) => {
    if (percentage >= 81) return "bg-green-700" // Verde oscuro
    if (percentage >= 61) return "bg-green-500" // Verde claro
    if (percentage >= 41) return "bg-yellow-500" // Amarillo
    if (percentage >= 21) return "bg-orange-500" // Naranja
    return "bg-red-500" // Rojo
  }

  // Filtrar auditorías (lógica mejorada)
  const filteredAudits = processedAudits.filter((audit) => {
    if (!audit) return false

    const auditDate = new Date(audit.date)
    const auditMonth = auditDate.getMonth() + 1
    const auditYear = auditDate.getFullYear()

    // Mejorar la búsqueda para que sea más flexible
    const searchLower = searchTerm.toLowerCase().trim()
    
    // Verificar si coincide con el término de búsqueda
    let matchesSearch = true
    if (searchTerm !== "") {
      matchesSearch = false
      // Buscar en el nombre del local
      if (audit.localName && audit.localName.toLowerCase().includes(searchLower)) {
        matchesSearch = true
      } else if (audit.local && audit.local.toLowerCase().includes(searchLower)) {
        matchesSearch = true
      }
      // Buscar en el nombre del auditor
      else if (audit.auditorName && audit.auditorName.toLowerCase().includes(searchLower)) {
        matchesSearch = true
      } else if (audit.auditor && audit.auditor.toLowerCase().includes(searchLower)) {
        matchesSearch = true
      }
    }

    // Verificar si coincide con el local seleccionado
    const matchesLocal = filterLocal === "all" || 
                        audit.localId === filterLocal || 
                        audit.localName === filterLocal || 
                        audit.local === filterLocal
    
    const matchesType = filterType === "all" || audit.type === filterType
    const matchesMonth = filterMonth === "all" || auditMonth.toString() === filterMonth
    const matchesYear = filterYear === "all" || auditYear.toString() === filterYear

    return matchesSearch && matchesLocal && matchesType && matchesMonth && matchesYear
  })

  // Ordenar por fecha (más reciente primero)
  const sortedAudits = [...filteredAudits].sort((a, b) => {
    if (!a.date || !b.date) return 0
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  // Función para renderizar el badge de tipo
  const renderTypeBadge = (type) => {
    if (type === "rapida") {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Rápida</Badge>
    } else {
      return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Detallada</Badge>
    }
  }

  // Función para mostrar el turno (corregida)
  const getTurnoText = (shift) => {
    if (!shift) return "No especificado"
    
    // Convertir a minúsculas para hacer la comparación más robusta
    const shiftLower = shift.toLowerCase()
    
    if (shiftLower === "morning") return "Mañana"
    if (shiftLower === "afternoon") return "Tarde"
    if (shiftLower === "night") return "Noche"
    
    // Si no coincide con ninguno de los valores esperados, devolver el valor original
    return shift
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por local o auditor..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterLocal} onValueChange={setFilterLocal}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por local" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los locales</SelectItem>
            {uniqueLocals.map((local) => (
              <SelectItem key={local.id} value={local.id}>
                {local.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="rapida">Auditoría Rápida</SelectItem>
            <SelectItem value="detallada">Auditoría Detallada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por mes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los meses</SelectItem>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por año" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los años</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Local</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Auditor</TableHead>
              <TableHead className="text-right">Puntaje</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAudits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron auditorías
                </TableCell>
              </TableRow>
            ) : (
              sortedAudits.map((audit) => {
                if (!audit || !audit.id) return null

                const formattedDate = audit.date
                  ? format(new Date(audit.date), "dd/MM/yyyy", { locale: es })
                  : "Fecha desconocida"

                // Asegurarse de mostrar el nombre del local correctamente
                const localName = audit.localName || audit.local || audit.local_name || "Local sin nombre"

                // Asegurarse de mostrar el nombre del auditor correctamente
                const auditorName =
                  audit.auditorName || audit.auditor_name || audit.auditor || "Auditor no especificado"

                return (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">{localName}</TableCell>
                    <TableCell>{formattedDate}</TableCell>
                    <TableCell>{getTurnoText(audit.shift)}</TableCell>
                    <TableCell>{renderTypeBadge(audit.type)}</TableCell>
                    <TableCell>{auditorName}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm">{audit.percentage || 0}%</span>
                        <div className="w-16 bg-white rounded-full h-2.5 border">
                          <div
                            className={`h-2.5 rounded-full ${getProgressColor(audit.percentage || 0)}`}
                            style={{ width: `${audit.percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/auditorias/${audit.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver detalles</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}









