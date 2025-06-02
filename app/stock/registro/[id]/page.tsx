"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, AlertTriangle, FileText, DollarSign } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { compareStockAndCash } from "@/app/stock/utils/stock-cash-comparator"

export default function StockRecordDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isComparing, setIsComparing] = useState(false)
  const [stockRecord, setStockRecord] = useState<any>(null)
  const [stockAlerts, setStockAlerts] = useState<any[]>([])
  const [cashRegister, setCashRegister] = useState<any>(null)
  const [stockCashAlert, setStockCashAlert] = useState<any>(null)

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Obtener registro de stock
        const { data: record, error: recordError } = await supabase
          .from("stock_records")
          .select("*")
          .eq("id", params.id)
          .single()

        if (recordError) throw recordError
        setStockRecord(record)

        // Obtener alertas de stock asociadas
        const { data: alerts, error: alertsError } = await supabase
          .from("stock_alerts")
          .select("*")
          .eq("stock_record_id", params.id)
          .order("date", { ascending: false })

        if (alertsError) throw alertsError
        setStockAlerts(alerts || [])

        // Buscar cierre de caja correspondiente
        const { data: cashData, error: cashError } = await supabase
          .from("cash_register_closings")
          .select("*")
          .eq("local_id", record.local_id)
          .eq("date", record.date)
          .eq("shift", record.shift)
          .limit(1)

        if (!cashError && cashData && cashData.length > 0) {
          setCashRegister(cashData[0])

          // Verificar si ya existe una alerta stock-caja
          const { data: stockCashData, error: stockCashError } = await supabase
            .from("stock_cash_alerts")
            .select("*")
            .eq("stock_record_id", params.id)
            .eq("cash_register_id", cashData[0].id)
            .limit(1)

          if (!stockCashError && stockCashData && stockCashData.length > 0) {
            setStockCashAlert(stockCashData[0])
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del registro",
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

  // Calcular diferencia y renderizar con color
  const renderDifference = (real: number, datalive: number) => {
    const diff = real - datalive
    const className = diff < 0 ? "text-red-600" : diff > 0 ? "text-amber-600" : "text-green-600"

    return (
      <span className={className}>
        {diff > 0 ? "+" : ""}
        {diff}
      </span>
    )
  }

  // Ejecutar comparación stock-caja
  const handleCompareStockAndCash = async () => {
    if (!stockRecord || !cashRegister) return

    try {
      setIsComparing(true)

      const result = await compareStockAndCash(stockRecord.id, cashRegister.id)

      if (result) {
        setStockCashAlert(result)
        toast({
          title: "Comparación completada",
          description: "Se ha generado una alerta por diferencia entre stock y caja",
        })
      } else {
        toast({
          title: "Comparación completada",
          description: "No se encontraron diferencias significativas",
        })
      }
    } catch (error) {
      console.error("Error al comparar stock y caja:", error)
      toast({
        title: "Error",
        description: "No se pudo completar la comparación",
        variant: "destructive",
      })
    } finally {
      setIsComparing(false)
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

  if (!stockRecord) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold">Registro no encontrado</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p>El registro de stock solicitado no existe o ha sido eliminado.</p>
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
          <h1 className="text-3xl font-bold">Detalle de Registro de Stock</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información general */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Información General</CardTitle>
                  <CardDescription>Datos generales del registro</CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={
                    stockRecord.shift === "mañana" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                  }
                >
                  {stockRecord.shift === "mañana" ? "Turno Mañana" : "Turno Tarde"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Local</h3>
                  <p className="text-lg font-medium mt-1">{stockRecord.local_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Fecha</h3>
                  <p className="text-lg font-medium mt-1">{formatFecha(stockRecord.date)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Responsable</h3>
                  <p className="text-lg font-medium mt-1">{stockRecord.responsible}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de stock */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resumen de Stock</CardTitle>
              <CardDescription>Comparación entre stock real y Datalive</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium mb-2">Empanadas</h3>
                  <div className="grid grid-cols-3 gap-4 border p-3 rounded-md">
                    <div>
                      <p className="text-sm text-muted-foreground">Real</p>
                      <p className="text-lg font-medium">{stockRecord.empanadas_real}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Datalive</p>
                      <p className="text-lg font-medium">{stockRecord.empanadas_datalive}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Diferencia</p>
                      <p className="text-lg font-medium">
                        {renderDifference(stockRecord.empanadas_real, stockRecord.empanadas_datalive)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium mb-2">Medialunas</h3>
                  <div className="grid grid-cols-3 gap-4 border p-3 rounded-md">
                    <div>
                      <p className="text-sm text-muted-foreground">Real</p>
                      <p className="text-lg font-medium">{stockRecord.medialunas_real}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Datalive</p>
                      <p className="text-lg font-medium">{stockRecord.medialunas_datalive}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Diferencia</p>
                      <p className="text-lg font-medium">
                        {renderDifference(stockRecord.medialunas_real, stockRecord.medialunas_datalive)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium mb-2">Pizzas</h3>
                  <div className="grid grid-cols-3 gap-4 border p-3 rounded-md">
                    <div>
                      <p className="text-sm text-muted-foreground">Real</p>
                      <p className="text-lg font-medium">{stockRecord.pizzas_real}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Datalive</p>
                      <p className="text-lg font-medium">{stockRecord.pizzas_datalive}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Diferencia</p>
                      <p className="text-lg font-medium">
                        {renderDifference(stockRecord.pizzas_real, stockRecord.pizzas_datalive)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium mb-2">Bebidas</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 border p-3 rounded-md">
                      <div>
                        <p className="text-sm text-muted-foreground">Gaseosa Grande (Real)</p>
                        <p className="text-lg font-medium">{stockRecord.gaseosa_grande_real}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Datalive</p>
                        <p className="text-lg font-medium">{stockRecord.gaseosa_grande_datalive}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Diferencia</p>
                        <p className="text-lg font-medium">
                          {renderDifference(stockRecord.gaseosa_grande_real, stockRecord.gaseosa_grande_datalive)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border p-3 rounded-md">
                      <div>
                        <p className="text-sm text-muted-foreground">Gaseosa Chica (Real)</p>
                        <p className="text-lg font-medium">{stockRecord.gaseosa_chica_real}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Datalive</p>
                        <p className="text-lg font-medium">{stockRecord.gaseosa_chica_datalive}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Diferencia</p>
                        <p className="text-lg font-medium">
                          {renderDifference(stockRecord.gaseosa_chica_real, stockRecord.gaseosa_chica_datalive)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border p-3 rounded-md">
                      <div>
                        <p className="text-sm text-muted-foreground">Agua Chica (Real)</p>
                        <p className="text-lg font-medium">{stockRecord.agua_chica_real}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Datalive</p>
                        <p className="text-lg font-medium">{stockRecord.agua_chica_datalive}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Diferencia</p>
                        <p className="text-lg font-medium">
                          {renderDifference(stockRecord.agua_chica_real, stockRecord.agua_chica_datalive)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border p-3 rounded-md">
                      <div>
                        <p className="text-sm text-muted-foreground">Cerveza (Real)</p>
                        <p className="text-lg font-medium">{stockRecord.cerveza_real}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Datalive</p>
                        <p className="text-lg font-medium">{stockRecord.cerveza_datalive}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Diferencia</p>
                        <p className="text-lg font-medium">
                          {renderDifference(stockRecord.cerveza_real, stockRecord.cerveza_datalive)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium mb-2">Almíbar</h3>
                  <div className="grid grid-cols-1 gap-4 border p-3 rounded-md">
                    <div>
                      <p className="text-sm text-muted-foreground">Real</p>
                      <p className="text-lg font-medium">{stockRecord.almibar_real}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertas y acciones */}
          <div className="space-y-6">
            {/* Alertas de stock */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
                  Alertas de Stock
                </CardTitle>
                <CardDescription>Diferencias detectadas en el inventario</CardDescription>
              </CardHeader>
              <CardContent>
                {stockAlerts.length === 0 ? (
                  <p className="text-muted-foreground">No hay alertas para este registro</p>
                ) : (
                  <div className="space-y-3">
                    {stockAlerts.map((alert) => (
                      <div key={alert.id} className="border p-3 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{alert.product}</h4>
                            <p className="text-sm text-muted-foreground">
                              Diferencia:{" "}
                              <span className={alert.difference < 0 ? "text-red-600" : "text-amber-600"}>
                                {alert.difference > 0 ? "+" : ""}
                                {alert.difference}
                              </span>
                            </p>
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparación con caja */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-green-500" />
                  Comparación Stock-Caja
                </CardTitle>
                <CardDescription>Relación entre stock y cierre de caja</CardDescription>
              </CardHeader>
              <CardContent>
                {!cashRegister ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-2">No se encontró un cierre de caja para este registro</p>
                    <Button variant="outline" onClick={() => router.push("/caja/cierre")}>
                      Ver Cierres de Caja
                    </Button>
                  </div>
                ) : stockCashAlert ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 border p-3 rounded-md">
                      <div>
                        <p className="text-sm text-muted-foreground">Monto Esperado</p>
                        <p className="text-lg font-medium">${stockCashAlert.expected_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monto Real</p>
                        <p className="text-lg font-medium">${stockCashAlert.actual_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Diferencia</p>
                        <p
                          className={`text-lg font-medium ${stockCashAlert.difference < 0 ? "text-red-600" : "text-green-600"}`}
                        >
                          ${stockCashAlert.difference.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <Badge
                        variant="outline"
                        className={
                          stockCashAlert.status === "activa"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : stockCashAlert.status === "resuelta"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {stockCashAlert.status}
                      </Badge>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/stock/alertas-caja/${stockCashAlert.id}`)}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      No se ha realizado la comparación con el cierre de caja
                    </p>
                    <Button onClick={handleCompareStockAndCash} disabled={isComparing}>
                      {isComparing ? (
                        <span className="flex items-center">
                          <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                          Comparando...
                        </span>
                      ) : (
                        <span>Ejecutar Comparación</span>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Observaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Observaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stockRecord.observations ? (
                  <p>{stockRecord.observations}</p>
                ) : (
                  <p className="text-muted-foreground">No hay observaciones registradas</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

