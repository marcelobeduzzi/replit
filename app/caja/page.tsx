"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, AlertTriangle, DollarSign, PlusCircle, History } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"

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

export default function CajaPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("home")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLocal, setFilterLocal] = useState("all")
  const [filterFecha, setFilterFecha] = useState("")
  const [aperturas, setAperturas] = useState<any[]>([])
  const [cierres, setCierres] = useState<any[]>([])
  const [alertas, setAlertas] = useState<any[]>([])
  const [summaryData, setSummaryData] = useState({
    pendingOpenings: 0,
    pendingClosings: 0,
    activeAlerts: 0,
    todaySales: 0,
  })
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  }>({ key: "fecha", direction: "descending" })

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Obtener fecha actual para filtrar datos de hoy
        const today = format(new Date(), "yyyy-MM-dd")

        // Consultas en paralelo
        const [aperturasResult, cierresResult, alertasResult, ventasHoyResult] = await Promise.all([
          // Aperturas
          supabase
            .from("cash_register_openings")
            .select("*")
            .order("date", { ascending: false }),

          // Cierres
          supabase
            .from("cash_register_closings")
            .select("*")
            .order("date", { ascending: false }),

          // Alertas - Sin filtrar por estado para obtener todas
          supabase
            .from("cash_register_alerts")
            .select("*"),

          // Ventas de hoy
          supabase
            .from("cash_register_closings")
            .select("total_sales")
            .eq("date", today),
        ])

        if (aperturasResult.error) throw aperturasResult.error
        if (cierresResult.error) throw cierresResult.error
        if (alertasResult.error) throw alertasResult.error
        if (ventasHoyResult.error) throw ventasHoyResult.error

        // Procesar datos
        const aperturasData = aperturasResult.data || []
        const cierresData = cierresResult.data || []
        const alertasData = alertasResult.data || []

        // Calcular ventas de hoy
        const ventasHoy = ventasHoyResult.data?.reduce((sum, item) => sum + (item.total_sales || 0), 0) || 0

        // Contar aperturas pendientes (sin cierre)
        const aperturasPendientes = aperturasData.filter((a) => !a.has_closing && a.status === "aprobado").length

        // Contar cierres pendientes (no aprobados)
        const cierresPendientes = cierresData.filter((c) => c.status === "pendiente").length

        // Contar alertas activas
        const alertasActivas = alertasData.filter((a) => a.status === "activa").length

        // Actualizar estados
        setAperturas(aperturasData)
        setCierres(cierresData)
        setAlertas(alertasData)

        // Actualizar datos de resumen
        setSummaryData({
          pendingOpenings: aperturasPendientes,
          pendingClosings: cierresPendientes,
          activeAlerts: alertasActivas,
          todaySales: ventasHoy,
        })
      } catch (error) {
        console.error("Error al cargar datos:", error)
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

  // Filtrar y ordenar aperturas
  const filteredAperturas = aperturas
    .filter((apertura) => {
      const matchesSearch =
        apertura.local_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apertura.responsible?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesLocal = filterLocal === "all" || apertura.local_id === filterLocal

      const matchesFecha = !filterFecha || apertura.date === filterFecha

      return matchesSearch && matchesLocal && matchesFecha
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

  // Filtrar y ordenar cierres
  const filteredCierres = cierres
    .filter((cierre) => {
      const matchesSearch =
        cierre.local_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cierre.responsible?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesLocal = filterLocal === "all" || cierre.local_id === filterLocal

      const matchesFecha = !filterFecha || cierre.date === filterFecha

      return matchesSearch && matchesLocal && matchesFecha
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
    try {
      const fecha = new Date(fechaStr)
      return format(fecha, "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return fechaStr
    }
  }

  // Renderizar badge de estado
  const renderEstadoBadge = (estado: string) => {
    switch (estado) {
      case "aprobado":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Aprobado
          </Badge>
        )
      case "pendiente":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pendiente
          </Badge>
        )
      case "rechazado":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rechazado
          </Badge>
        )
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  // Componente para la página de inicio
  const HomePage = () => {
    return (
      <div className="space-y-6">
        {/* Panel de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aperturas Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.pendingOpenings}</div>
              <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cierres Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.pendingClosings}</div>
              <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Alertas Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold">{summaryData.activeAlerts}</div>
                {summaryData.activeAlerts > 0 && <AlertTriangle className="ml-2 h-5 w-5 text-yellow-500" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Requieren revisión</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ventas de Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(summaryData.todaySales)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total en todos los locales</p>
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Operaciones comunes del sistema de caja</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push("/caja/apertura")}
              >
                <PlusCircle className="h-6 w-6" />
                <span>Nueva Apertura</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push("/caja/cierre")}
              >
                <DollarSign className="h-6 w-6" />
                <span>Nuevo Cierre</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push("/caja/alertas")}
              >
                <AlertTriangle className="h-6 w-6" />
                <span>Ver Alertas</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push("/caja/historial")}
              >
                <History className="h-6 w-6" />
                <span>Ver Historial</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Operaciones recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Operaciones Recientes</CardTitle>
            <CardDescription>Últimas actividades en el sistema de caja</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mostrar las últimas 5 operaciones (aperturas o cierres) */}
              {[...aperturas, ...cierres]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((operacion) => {
                  const esApertura = "initial_amount" in operacion
                  return (
                    <div key={operacion.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={esApertura ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}
                          >
                            {esApertura ? "Apertura" : "Cierre"}
                          </Badge>
                          <span className="font-medium">{operacion.local_name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {formatFecha(operacion.date)} - {operacion.shift === "mañana" ? "Mañana" : "Tarde"} -{" "}
                          {operacion.responsible}
                        </div>
                      </div>
                      {esApertura ? (
                        <Button variant="outline" asChild>
                          <Link href={`/caja/apertura/${operacion.id}`}>Ver Detalles</Link>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/caja/${esApertura ? "apertura" : "cierre"}/${operacion.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}

              {[...aperturas, ...cierres].length === 0 && (
                <p className="text-muted-foreground text-center py-4">No hay operaciones recientes para mostrar</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Caja</h2>
            <p className="text-muted-foreground">Administración de aperturas y cierres de caja</p>
          </div>
        </div>
        <HomePage />
      </div>
    </DashboardLayout>
  )
}
