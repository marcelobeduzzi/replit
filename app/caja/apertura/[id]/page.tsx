"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Printer, AlertTriangle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function DetalleAperturaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [apertura, setApertura] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchApertura = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (!id) {
          setError("ID de apertura no proporcionado")
          return
        }

        const { data, error } = await supabase.from("cash_register_openings").select("*").eq("id", id).single()

        if (error) throw error

        if (!data) {
          setError("No se encontró la apertura de caja")
          return
        }

        console.log("Apertura cargada:", data) // Para depuración
        setApertura(data)
      } catch (error: any) {
        console.error("Error al cargar la apertura:", error)
        setError(error.message || "Error al cargar los datos de la apertura")
      } finally {
        setIsLoading(false)
      }
    }

    fetchApertura()
  }, [id, supabase])

  // Formatear fecha
  const formatFecha = (fechaStr: string) => {
    if (!fechaStr) return "N/A"
    try {
      const fecha = new Date(fechaStr)
      return format(fecha, "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return fechaStr
    }
  }

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount || 0)
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

  // Manejar impresión
  const handlePrint = () => {
    window.print()
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold">Error</h1>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error al cargar la apertura de caja</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => router.push("/caja")} className="mt-6">
                  Volver a la lista de aperturas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout isLoading={isLoading}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold">Detalle de Apertura de Caja</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {apertura && (
          <div className="space-y-6">
            {/* Información general */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Información General</CardTitle>
                  {renderEstadoBadge(apertura.status)}
                </div>
                <CardDescription>Datos generales de la apertura de caja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Local</h3>
                    <p className="font-medium">{apertura.local_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Fecha</h3>
                    <p className="font-medium">{formatFecha(apertura.date)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Turno</h3>
                    <p className="font-medium">{apertura.shift === "mañana" ? "Mañana" : "Tarde"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Responsable</h3>
                    <p className="font-medium">{apertura.responsible}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Creado</h3>
                    <p className="font-medium">{formatFecha(apertura.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumen financiero */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Efectivo Inicial</CardTitle>
                <CardDescription>Detalle del efectivo inicial en caja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Monto Inicial</h3>
                      <p className="text-xl font-bold">{formatCurrency(apertura.initial_amount)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalles adicionales */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles Adicionales</CardTitle>
                <CardDescription>Información adicional de la apertura de caja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Observaciones</h3>
                    <p className="p-3 bg-muted rounded-md">
                      {apertura.observations || "No se registraron observaciones"}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-muted-foreground">ID: {apertura.id}</p>
                <p className="text-sm text-muted-foreground">Creado: {formatFecha(apertura.created_at)}</p>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

