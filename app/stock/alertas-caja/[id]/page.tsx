"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, BarChart2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function StockCashAlertDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [alert, setAlert] = useState<any>(null)
  const [stockRecord, setStockRecord] = useState<any>(null)
  const [cashRegister, setCashRegister] = useState<any>(null)

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Obtener alerta
        const { data: alertData, error: alertError } = await supabase
          .from("stock_cash_alerts")
          .select("*")
          .eq("id", params.id)
          .single()

        if (alertError) throw alertError
        setAlert(alertData)

        // Obtener registro de stock
        if (alertData.stock_record_id) {
          const { data: stockData, error: stockError } = await supabase
            .from("stock_records")
            .select("*")
            .eq("id", alertData.stock_record_id)
            .single()

          if (!stockError && stockData) {
            setStockRecord(stockData)
          }
        }

        // Obtener cierre de caja
        if (alertData.cash_register_id) {
          const { data: cashData, error: cashError } = await supabase
            .from("cash_register_closings")
            .select("*")
            .eq("id", alertData.cash_register_id)
            .single()

          if (!cashError && cashData) {
            setCashRegister(cashData)
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de la alerta",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase, params.id])

  // Formatear fecha
  const formatFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr)
      return format(fecha, "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return fechaStr
    }
  }

  // Actualizar estado de la alerta
  const updateAlertStatus = async (newStatus: string) => {
    try {
      setIsUpdating(true)

      // Actualizar estado en la base de datos
      const { error } = await supabase
        .from("stock_cash_alerts")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", params.id)

      if (error) throw error

      // Actualizar estado en la interfaz
      setAlert({ ...alert, status: newStatus })

      // Actualizar alerta en el sistema general
      await updateSystemAlert(newStatus)

      toast({
        title: "Estado actualizado",
        description: `La alerta ha sido marcada como ${newStatus}`,
      })
    } catch (error) {
      console.error("Error al actualizar estado:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la alerta",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Actualizar alerta en el sistema general
  const updateSystemAlert = async (newStatus: string) => {
    try {
      // Buscar alerta en el sistema
      const { data, error } = await supabase
        .from("alerts")
        .select("id")
        .eq("reference_id", params.id)
        .eq("reference_type", "stock_cash_alert")
        .limit(1)

      if (error) throw error

      // Si existe, actualizar estado
      if (data && data.length > 0) {
        await supabase
          .from("alerts")
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data[0].id)
      }
    } catch (error) {
      console.error("Error al actualizar alerta del sistema:", error)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout isLoading={true}>
        <div className="container mx-auto py-6">
          <p>Cargando...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!alert) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold">Alerta no encontrada</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p>La alerta solicitada no existe o ha sido eliminada.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Detalle de Alerta Stock-Caja</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información de la alerta */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Información de la Alerta</CardTitle>
                  <CardDescription>Detalles de la diferencia detectada</CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={
                    alert.status === "activa"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : alert.status === "resuelta"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                  }
                >
                  {alert.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Local</h3>
                  <p className="text-lg font-medium mt-1">{alert.local_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Fecha</h3>
                  <p className="text-lg font-medium mt-1">{formatFecha(alert.date)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Diferencia</h3>
                  <p className={`text-lg font-medium mt-1 ${alert.difference < 0 ? "text-red-600" : "text-green-600"}`}>
                    ${alert.difference.toLocaleString()} ({Math.abs(alert.percentage || 0).toFixed(2)}%)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles de la comparación */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Detalles de la Comparación</CardTitle>
              <CardDescription>Comparación entre ventas esperadas y caja real</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border p-4 rounded-md">
                    <h3 className="text-base font-medium mb-2">Monto Esperado</h3>
                    <p className="text-2xl font-bold">${alert.expected_amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-1">Calculado según ventas registradas</p>
                  </div>

                  <div className="border p-4 rounded-md">
                    <h3 className="text-base font-medium mb-2">Monto Real</h3>
                    <p className="text-2xl font-bold">${alert.actual_amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-1">Registrado en cierre de caja</p>
                  </div>
                </div>

                <div className="border p-4 rounded-md">
                  <h3 className="text-base font-medium mb-2">Diferencia</h3>
                  <div className="flex items-center">
                    <p className={`text-2xl font-bold ${alert.difference < 0 ? "text-red-600" : "text-green-600"}`}>
                      ${alert.difference.toLocaleString()}
                    </p>
                    <Badge
                      variant="outline"
                      className={`ml-3 ${alert.difference < 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
                    >
                      {alert.difference < 0 ? "Faltante" : "Sobrante"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {Math.abs(alert.percentage || 0).toFixed(2)}% de diferencia respecto al monto esperado
                  </p>
                </div>

                {stockRecord && (
                  <div>
                    <h3 className="text-base font-medium mb-2">Registro de Stock Asociado</h3>
                    <div className="border p-4 rounded-md">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Fecha</p>
                          <p className="font-medium">{formatFecha(stockRecord.date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Turno</p>
                          <p className="font-medium">{stockRecord.shift === "mañana" ? "Mañana" : "Tarde"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Responsable</p>
                          <p className="font-medium">{stockRecord.responsible}</p>
                        </div>
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1"
                            onClick={() => router.push(`/stock/registro/${stockRecord.id}`)}
                          >
                            Ver Registro
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {cashRegister && (
                  <div>
                    <h3 className="text-base font-medium mb-2">Cierre de Caja Asociado</h3>
                    <div className="border p-4 rounded-md">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Fecha</p>
                          <p className="font-medium">{formatFecha(cashRegister.date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Turno</p>
                          <p className="font-medium">{cashRegister.shift === "mañana" ? "Mañana" : "Tarde"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Responsable</p>
                          <p className="font-medium">{cashRegister.responsible}</p>
                        </div>
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1"
                            onClick={() => router.push(`/caja/cierre/${cashRegister.id}`)}
                          >
                            Ver Cierre
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
              <CardDescription>Gestionar esta alerta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Estado Actual</h3>
                <Badge
                  className={
                    alert.status === "activa"
                      ? "bg-yellow-100 text-yellow-800"
                      : alert.status === "resuelta"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {alert.status}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Cambiar Estado</h3>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="justify-start"
                    disabled={alert.status === "resuelta" || isUpdating}
                    onClick={() => updateAlertStatus("resuelta")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Marcar como Resuelta
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start"
                    disabled={alert.status === "rechazada" || isUpdating}
                    onClick={() => updateAlertStatus("rechazada")}
                  >
                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                    Rechazar Alerta
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start"
                    disabled={alert.status === "activa" || isUpdating}
                    onClick={() => updateAlertStatus("activa")}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                    Reactivar Alerta
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="pt-2">
                <Button variant="default" className="w-full" onClick={() => router.push("/stock/reportes")}>
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Ver Reportes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

