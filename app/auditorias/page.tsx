"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuditList } from "@/components/auditorias/audit-list"
import { db } from "@/lib/db"
import { exportToCSV } from "@/lib/export-utils"
import { formatDisplayDate } from "@/lib/date-utils" // Importamos la función correcta
import type { Audit, AuditItem } from "@/types"
import type { ColumnDef } from "@tanstack/react-table"
import { Download, Plus, Calendar, FileText, List, Eye, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import jsPDF from "jspdf"
import "jspdf-autotable"

// Función para formatear fechas usando nuestra utilidad
const formatDate = (dateString) => {
  return formatDisplayDate(dateString)
}

// Función para generar el reporte de auditoría en PDF
const generateAuditReport = (audit) => {
  try {
    if (!audit) {
      console.error("No se proporcionó una auditoría para generar el reporte")
      return
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Título
    doc.setFontSize(18)
    doc.text("Reporte de Auditoría", pageWidth / 2, 15, { align: "center" })

    // Información general
    doc.setFontSize(12)
    doc.text(`Local: ${audit.localName || audit.local || "No especificado"}`, 14, 30)
    doc.text(`Fecha: ${formatDate(audit.date)}`, 14, 37)

    const turnoText =
      audit.shift === "morning"
        ? "Mañana"
        : audit.shift === "afternoon"
          ? "Tarde"
          : audit.shift === "night"
            ? "Noche"
            : "No especificado"

    doc.text(`Turno: ${turnoText}`, 14, 44)
    doc.text(`Auditor: ${audit.auditorName || audit.auditor || "No especificado"}`, 14, 51)
    doc.text(`Tipo: ${audit.type === "rapida" ? "Auditoría Rápida" : "Auditoría Detallada"}`, 14, 58)

    // Puntaje total
    doc.setFontSize(14)
    doc.text("Puntaje Total", pageWidth / 2, 70, { align: "center" })
    doc.setFontSize(12)
    doc.text(
      `${audit.totalScore} / ${audit.maxScore} (${Math.round((audit.totalScore / audit.maxScore) * 100)}%)`,
      pageWidth / 2,
      77,
      { align: "center" },
    )

    // Línea separadora
    doc.line(14, 85, pageWidth - 14, 85)

    // Categorías y puntajes
    if (audit.categories && audit.categories.length > 0) {
      doc.setFontSize(14)
      doc.text("Detalle por Categorías", pageWidth / 2, 95, { align: "center" })

      let yPos = 105

      for (const category of audit.categories) {
        // Verificar si hay espacio suficiente en la página actual
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }

        doc.setFontSize(12)
        doc.text(
          `${category.name}: ${category.score} / ${category.maxScore} (${Math.round((category.score / category.maxScore) * 100)}%)`,
          14,
          yPos,
        )
        yPos += 10

        // Tabla de items
        if (category.items && category.items.length > 0) {
          const tableData = category.items.map((item) => [
            item.name,
            `${item.score} / ${item.maxScore}`,
            item.observations || "",
          ])

          doc.autoTable({
            startY: yPos,
            head: [["Ítem", "Puntaje", "Observaciones"]],
            body: tableData,
            margin: { left: 14, right: 14 },
            headStyles: { fillColor: [100, 100, 100] },
            styles: { fontSize: 10 },
          })

          yPos = doc.lastAutoTable.finalY + 15
        } else {
          yPos += 5
        }
      }
    }

    // Observaciones generales
    if (audit.generalObservations) {
      // Verificar si hay espacio suficiente en la página actual
      if (yPos > 240) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.text("Observaciones Generales", 14, yPos)
      yPos += 10

      doc.setFontSize(10)
      const splitText = doc.splitTextToSize(audit.generalObservations, pageWidth - 28)
      doc.text(splitText, 14, yPos)
    }

    // Guardar el PDF
    const fileName = `auditoria_${audit.localName || audit.local || "local"}_${formatDate(audit.date).replace(/\//g, "-")}.pdf`
    doc.save(fileName)

    return fileName
  } catch (error) {
    console.error("Error al generar reporte de auditoría:", error)
    throw error
  }
}

export default function AuditoriasPage() {
  const [audits, setAudits] = useState<Audit[]>([])
  const [recentAudits, setRecentAudits] = useState<Audit[]>([])
  const [auditItems, setAuditItems] = useState<AuditItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRecentLoading, setIsRecentLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedLocal, setSelectedLocal] = useState<string>("")
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("recent")
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null)
  const { toast } = useToast()

  // Cargar auditorías recientes
  useEffect(() => {
    const fetchRecentAudits = async () => {
      if (activeTab !== "recent") return

      setIsRecentLoading(true)
      try {
        const recentData = await db.audits.findMany()
        setRecentAudits(recentData.slice(0, 50)) // Mostrar las 50 más recientes
      } catch (error) {
        console.error("Error al cargar auditorías recientes:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las auditorías recientes. Intente nuevamente.",
          variant: "destructive",
        })
      } finally {
        setIsRecentLoading(false)
      }
    }

    fetchRecentAudits()
  }, [activeTab, toast])

  // Cargar auditorías filtradas y items
  useEffect(() => {
    const fetchData = async () => {
      if (activeTab !== "date") return

      setIsLoading(true)
      try {
        // Obtener auditorías
        const auditData = await db.audits.findMany()

        // Filtrar por fecha y local si es necesario
        const filteredData = auditData.filter((audit) => {
          const auditDate = new Date(audit.date)
          const matchesDate =
            !selectedDate ||
            (auditDate.getFullYear() === selectedDate.getFullYear() &&
              auditDate.getMonth() === selectedDate.getMonth() &&
              auditDate.getDate() === selectedDate.getDate())

          const matchesLocal = !selectedLocal || selectedLocal === "todos" || audit.local === selectedLocal

          return matchesDate && matchesLocal
        })

        setAudits(filteredData)
      } catch (error) {
        console.error("Error al cargar datos de auditorías:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las auditorías. Intente nuevamente.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedDate, selectedLocal, activeTab, toast])

  const handleExportCSV = () => {
    // Preparar datos para exportar
    const dataToExport = activeTab === "recent" ? recentAudits : audits
    const data = dataToExport.map((audit) => ({
      Local: audit.localName || audit.local,
      Fecha: formatDate(audit.date),
      Turno: audit.shift === "morning" ? "Mañana" : audit.shift === "afternoon" ? "Tarde" : "Noche",
      Tipo: audit.type === "rapida" ? "Auditoría Rápida" : "Auditoría Detallada",
      Auditor: audit.auditorName || audit.auditor,
      "Puntaje Total": audit.totalScore,
      "Puntaje Máximo": audit.maxScore,
      Porcentaje: `${Math.round((audit.totalScore / audit.maxScore) * 100)}%`,
    }))

    exportToCSV(
      data,
      `auditorias_${activeTab === "recent" ? "recientes" : selectedDate ? selectedDate.toISOString().split("T")[0] : "todas"}`,
    )
  }

  const handleViewAuditDetails = async (audit: Audit) => {
    try {
      // Si la auditoría ya tiene los items detallados, usarla directamente
      if (audit.items && audit.items.length > 0) {
        setSelectedAudit(audit)
        setIsDetailsDialogOpen(true)
        return
      }

      // Si no, obtener los detalles de la auditoría
      const auditDetails = await db.audits.findUnique({
        where: { id: audit.id },
      })

      if (auditDetails) {
        setSelectedAudit(auditDetails)
        setIsDetailsDialogOpen(true)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los detalles de la auditoría.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al obtener detalles de la auditoría:", error)
      toast({
        title: "Error",
        description: "Error al cargar los detalles de la auditoría.",
        variant: "destructive",
      })
    }
  }

  // Función para obtener el color de la barra de progreso según el puntaje
  const getProgressColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 81) return "bg-green-700" // Verde oscuro
    if (percentage >= 61) return "bg-green-500" // Verde claro
    if (percentage >= 41) return "bg-yellow-500" // Amarillo
    if (percentage >= 21) return "bg-orange-500" // Naranja
    return "bg-red-500" // Rojo
  }

  // Función para obtener el color del badge según el puntaje
  const getBadgeColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 81) return "bg-green-700 hover:bg-green-800"
    if (percentage >= 61) return "bg-green-500 hover:bg-green-600"
    if (percentage >= 41) return "bg-yellow-500 hover:bg-yellow-600"
    if (percentage >= 21) return "bg-orange-500 hover:bg-orange-600"
    return "bg-red-500 hover:bg-red-600"
  }

  // Función para renderizar el badge de tipo
  const renderTypeBadge = (type: string) => {
    if (type === "rapida") {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Rápida</Badge>
    } else {
      return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Detallada</Badge>
    }
  }

  const columns: ColumnDef<Audit>[] = [
    {
      accessorKey: "local",
      header: "Local",
      cell: ({ row }) => row.original.localName || row.original.local,
    },
    {
      accessorKey: "date",
      header: "Fecha",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "shift",
      header: "Turno",
      cell: ({ row }) => {
        const shift = row.original.shift?.toLowerCase() || ""
        if (shift === "morning") return "Mañana"
        if (shift === "afternoon") return "Tarde"
        if (shift === "night") return "Noche"
        return row.original.shift || "No especificado"
      },
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => renderTypeBadge(row.original.type || "detallada"),
    },
    {
      accessorKey: "auditor",
      header: "Auditor",
      cell: ({ row }) => row.original.auditorName || row.original.auditor,
    },
    {
      accessorKey: "totalScore",
      header: "Puntaje",
      cell: ({ row }) => {
        const maxScore = row.original.maxScore || 150
        const percentage = Math.round((row.original.totalScore / maxScore) * 100)
        return (
          <div className="flex items-center space-x-2">
            <Badge className={getBadgeColor(row.original.totalScore, maxScore)}>{percentage}%</Badge>
            <div className="w-24 bg-white border rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${getProgressColor(row.original.totalScore, maxScore)}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              try {
                // Exportar auditoría
                generateAuditReport(row.original)
                toast({
                  title: "Reporte generado",
                  description: "El reporte de auditoría ha sido generado correctamente.",
                })
              } catch (error) {
                console.error("Error al generar reporte:", error)
                toast({
                  title: "Error",
                  description: "No se pudo generar el reporte. Intente nuevamente.",
                  variant: "destructive",
                })
              }
            }}
          >
            <FileText className="mr-1 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleViewAuditDetails(row.original)}>
            <Eye className="mr-1 h-4 w-4" />
            Ver
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Auditorías</h2>
            <p className="text-muted-foreground">Gestiona las auditorías de los locales</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/auditorias/configuracion">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Link>
            </Button>
            <Button asChild>
              <Link href="/auditorias/nueva-rapida">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Auditoría Rápida
              </Link>
            </Button>
            <Button asChild>
              <Link href="/auditorias/nueva">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Auditoría Detallada
              </Link>
            </Button>
          </div>
        </div>

        {/* Diálogo de detalles de auditoría */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalles de Auditoría</DialogTitle>
              <DialogDescription>
                {selectedAudit && (
                  <>
                    {selectedAudit.localName || selectedAudit.local} - {formatDate(selectedAudit.date)} -
                    {selectedAudit.shift === "morning"
                      ? " Turno Mañana"
                      : selectedAudit.shift === "afternoon"
                        ? " Turno Tarde"
                        : " Turno Noche"}
                    {" - "}
                    {selectedAudit.type === "rapida" ? "Auditoría Rápida" : "Auditoría Detallada"}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedAudit && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Información General</h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Local:</span> {selectedAudit.localName || selectedAudit.local}
                      </p>
                      <p>
                        <span className="font-medium">Fecha:</span> {formatDate(selectedAudit.date)}
                      </p>
                      <p>
                        <span className="font-medium">Turno:</span>{" "}
                        {selectedAudit.shift === "morning"
                          ? "Mañana"
                          : selectedAudit.shift === "afternoon"
                            ? "Tarde"
                            : "Noche"}
                      </p>
                      <p>
                        <span className="font-medium">Tipo:</span>{" "}
                        {selectedAudit.type === "rapida" ? "Auditoría Rápida" : "Auditoría Detallada"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium">Responsables</h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Auditor:</span>{" "}
                        {selectedAudit.auditorName || selectedAudit.auditor}
                      </p>
                      {selectedAudit.managerName && (
                        <p>
                          <span className="font-medium">Encargado:</span> {selectedAudit.managerName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Puntaje</h3>
                    <div className="flex items-center space-x-2">
                      <Badge className={getBadgeColor(selectedAudit.totalScore, selectedAudit.maxScore || 150)}>
                        {Math.round((selectedAudit.totalScore / (selectedAudit.maxScore || 150)) * 100)}%
                      </Badge>
                      <span className="text-sm">
                        {selectedAudit.totalScore}/{selectedAudit.maxScore || 150} puntos
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 bg-white border rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${getProgressColor(selectedAudit.totalScore, selectedAudit.maxScore || 150)}`}
                      style={{ width: `${(selectedAudit.totalScore / (selectedAudit.maxScore || 150)) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Items Evaluados</h3>
                  {selectedAudit.categories && selectedAudit.categories.length > 0 ? (
                    <Tabs defaultValue={selectedAudit.categories[0].id}>
                      <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full">
                        {selectedAudit.categories.map((category) => (
                          <TabsTrigger key={category.id} value={category.id}>
                            {category.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {selectedAudit.categories.map((category) => (
                        <TabsContent key={category.id} value={category.id} className="border rounded-md p-4">
                          <div className="space-y-4">
                            {category.items.map((item) => (
                              <div key={item.id} className="space-y-2 border-b pb-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-sm">
                                    {item.score} / {item.maxScore}
                                  </span>
                                </div>
                                <div className="w-full bg-white border rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      (item.score / item.maxScore) * 100 >= 80
                                        ? "bg-green-700"
                                        : (item.score / item.maxScore) * 100 >= 60
                                          ? "bg-green-500"
                                          : (item.score / item.maxScore) * 100 >= 40
                                            ? "bg-yellow-500"
                                            : (item.score / item.maxScore) * 100 >= 20
                                              ? "bg-orange-500"
                                              : "bg-red-500"
                                    }`}
                                    style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                                  ></div>
                                </div>
                                {item.observations && (
                                  <div className="mt-2">
                                    <p className="text-xs text-muted-foreground mb-1">Observaciones:</p>
                                    <p className="text-sm">{item.observations}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay items disponibles para mostrar.</p>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      try {
                        generateAuditReport(selectedAudit)
                        toast({
                          title: "Reporte generado",
                          description: "El reporte de auditoría ha sido generado correctamente.",
                        })
                      } catch (error) {
                        console.error("Error al generar reporte:", error)
                        toast({
                          title: "Error",
                          description: "No se pudo generar el reporte. Intente nuevamente.",
                          variant: "destructive",
                        })
                      }
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Exportar Reporte
                  </Button>
                  <Button onClick={() => setIsDetailsDialogOpen(false)}>Cerrar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Historial de Auditorías</CardTitle>
            <CardDescription>Consulta y gestiona las auditorías realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="recent" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="recent">
                  <List className="mr-2 h-4 w-4" />
                  Auditorías Recientes
                </TabsTrigger>
                <TabsTrigger value="date">
                  <Calendar className="mr-2 h-4 w-4" />
                  Filtrar por Fecha
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recent">
                <div className="flex items-center mb-4 justify-end">
                  <Button variant="outline" onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>

                <AuditList audits={recentAudits} />
              </TabsContent>

              <TabsContent value="date">
                <div className="flex items-center mb-4 space-x-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <DatePicker date={selectedDate || new Date()} setDate={(date) => setSelectedDate(date)} />
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(undefined)}>
                      Todas las fechas
                    </Button>
                  </div>

                  <div className="flex-1 max-w-sm">
                    <Select value={selectedLocal} onValueChange={setSelectedLocal}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los locales" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los locales</SelectItem>
                        <SelectItem value="BR Cabildo">BR Cabildo</SelectItem>
                        <SelectItem value="BR Carranza">BR Carranza</SelectItem>
                        <SelectItem value="BR Pacifico">BR Pacifico</SelectItem>
                        <SelectItem value="BR Lavalle">BR Lavalle</SelectItem>
                        <SelectItem value="BR Rivadavia">BR Rivadavia</SelectItem>
                        <SelectItem value="BR Aguero">BR Aguero</SelectItem>
                        <SelectItem value="BR Dorrego">BR Dorrego</SelectItem>
                        <SelectItem value="Dean & Dennys">Dean & Dennys</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" onClick={handleExportCSV}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </Button>
                  </div>
                </div>

                <AuditList audits={audits} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}








