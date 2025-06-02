"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, RefreshCcw, Plus } from "lucide-react"
import { StockDiscrepancyTable } from "@/components/conciliacion/stock-discrepancy-table"
import { CashDiscrepancyTable } from "@/components/conciliacion/cash-discrepancy-table"
import { DiscrepancyHistory } from "@/components/conciliacion/discrepancy-history"
import { AnalisisConciliacion } from "@/components/conciliacion/analisis-conciliacion"
import { ReconciliationService } from "@/lib/reconciliation-service"
import { toast } from "@/components/ui/use-toast"

// Lista fija de locales con IDs numéricos
const locales = [
  { id: 1, name: "BR Cabildo", hasTwoCashRegisters: false },
  { id: 2, name: "BR Carranza", hasTwoCashRegisters: false },
  { id: 3, name: "BR Pacífico", hasTwoCashRegisters: true },
  { id: 4, name: "BR Lavalle", hasTwoCashRegisters: true },
  { id: 5, name: "BR Rivadavia", hasTwoCashRegisters: false },
  { id: 6, name: "BR Aguero", hasTwoCashRegisters: true },
  { id: 7, name: "BR Dorrego", hasTwoCashRegisters: false },
  { id: 8, name: "Dean & Dennys", hasTwoCashRegisters: false },
]

// Opciones de turno
const turnos = [
  { value: "todos", label: "Todos los turnos" },
  { value: "mañana", label: "Mañana" },
  { value: "tarde", label: "Tarde" },
]

// Función auxiliar para normalizar fechas
const normalizeDate = (date: Date | string | null): string => {
  if (!date) {
    return format(new Date(), "yyyy-MM-dd")
  }

  if (typeof date === "string") {
    // Si ya tiene formato YYYY-MM-DD, devolverlo directamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }

    try {
      // Intentar parsear la fecha
      return format(new Date(date), "yyyy-MM-dd")
    } catch (error) {
      console.error("Error al parsear fecha:", error)
      return format(new Date(), "yyyy-MM-dd")
    }
  }

  // Si es un objeto Date
  return format(date, "yyyy-MM-dd")
}

// Función para eliminar duplicados en las discrepancias de caja
function removeDuplicateCashDiscrepancies(cashDiscrepancies: any[]) {
  const uniqueMap = new Map()

  cashDiscrepancies.forEach((item) => {
    const key = `${item.category || item.payment_method || ""}-${item.expectedAmount || item.expected_amount || 0}-${
      item.actualAmount || item.actual_amount || 0
    }`
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item)
    }
  })

  return Array.from(uniqueMap.values())
}

// Función para eliminar duplicados en las discrepancias de stock
function removeDuplicateStockDiscrepancies(stockDiscrepancies: any[]) {
  const uniqueMap = new Map()

  stockDiscrepancies.forEach((item) => {
    const key = `${item.productName || item.product_name || ""}-${item.expectedQuantity || item.expected_quantity || 0}-${
      item.actualQuantity || item.actual_quantity || 0
    }`
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item)
    }
  })

  return Array.from(uniqueMap.values())
}

// Función para corregir el signo del valor total en las discrepancias de stock
function correctStockTotalValue(stockDiscrepancies: any[]) {
  return stockDiscrepancies.map((item) => {
    const difference = item.difference || item.quantity_difference || 0
    const unitPrice = item.unitPrice || item.unit_price || 0

    // Si no hay un valor total explícito, calcularlo basado en la diferencia y el precio unitario
    let totalValue = item.totalValue || item.total_value

    if (totalValue === undefined) {
      totalValue = difference * unitPrice
    } else {
      // Si hay un valor total pero el signo no coincide con la diferencia, corregirlo
      if ((difference < 0 && totalValue > 0) || (difference > 0 && totalValue < 0)) {
        totalValue = -totalValue
      }
    }

    return {
      ...item,
      totalValue,
    }
  })
}

export default function LocalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedShift, setSelectedShift] = useState<string>("todos")
  const [localInfo, setLocalInfo] = useState<any>(null)
  const [stockDiscrepancies, setStockDiscrepancies] = useState<any[]>([])
  const [uniqueStockDiscrepancies, setUniqueStockDiscrepancies] = useState<any[]>([])
  const [cashDiscrepancies, setCashDiscrepancies] = useState<any[]>([])
  const [uniqueCashDiscrepancies, setUniqueCashDiscrepancies] = useState<any[]>([])
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false)
  const [activeTab, setActiveTab] = useState("stock")

  // Cargar información del local cuando cambian los parámetros
  useEffect(() => {
    if (params.id) {
      const localId = Number(params.id)
      const local = locales.find((l) => l.id === localId)

      if (local) {
        setLocalInfo(local)
        if (!hasLoadedInitialData) {
          loadLastDiscrepancyDate(localId)
        }
      } else {
        // Si no se encuentra el local, usar un nombre genérico
        setLocalInfo({ id: localId, name: `Local ${localId}` })
        if (!hasLoadedInitialData) {
          loadLastDiscrepancyDate(localId)
        }
      }
    }
  }, [params.id, hasLoadedInitialData])

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    if (localInfo && hasLoadedInitialData) {
      loadLocalData(localInfo.id)
    }
  }, [selectedDate, selectedShift, localInfo, hasLoadedInitialData])

  // Procesar discrepancias de caja para eliminar duplicados
  useEffect(() => {
    const uniqueDiscrepancies = removeDuplicateCashDiscrepancies(cashDiscrepancies)
    setUniqueCashDiscrepancies(uniqueDiscrepancies)

    // Log para depuración
    if (cashDiscrepancies.length > 0 && uniqueDiscrepancies.length < cashDiscrepancies.length) {
      console.log(
        `Se eliminaron ${cashDiscrepancies.length - uniqueDiscrepancies.length} discrepancias de caja duplicadas`,
      )
    }
  }, [cashDiscrepancies])

  // Procesar discrepancias de stock para eliminar duplicados y corregir valores
  useEffect(() => {
    const uniqueDiscrepancies = removeDuplicateStockDiscrepancies(stockDiscrepancies)
    const correctedDiscrepancies = correctStockTotalValue(uniqueDiscrepancies)
    setUniqueStockDiscrepancies(correctedDiscrepancies)

    // Log para depuración
    if (stockDiscrepancies.length > 0 && uniqueDiscrepancies.length < stockDiscrepancies.length) {
      console.log(
        `Se eliminaron ${stockDiscrepancies.length - uniqueDiscrepancies.length} discrepancias de stock duplicadas`,
      )
    }
  }, [stockDiscrepancies])

  // Buscar la última fecha con discrepancias
  const loadLastDiscrepancyDate = async (localId: number) => {
    try {
      setIsLoading(true)

      // Buscar la última fecha con discrepanciasias para este local
      const { data, error } = await ReconciliationService.getLastDiscrepancyDate(localId)

      if (error) {
        console.error("Error al buscar la última fecha con discrepancias:", error)
        // Si hay error, usar la fecha actual
        setSelectedDate(new Date())
      } else if (data && data.length > 0) {
        // Usar la última fecha con discrepancias
        setSelectedDate(new Date(data[0].date))

        // Si hay un turno específico, usarlo también
        if (data[0].shift) {
          setSelectedShift(data[0].shift)
        }
      } else {
        // Si no hay discrepancias previas, usar el día anterior
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        setSelectedDate(yesterday)
      }

      setHasLoadedInitialData(true)
    } catch (error) {
      console.error("Error al cargar la última fecha con discrepancias:", error)
      setHasLoadedInitialData(true)
    } finally {
      setIsLoading(false)
    }
  }

  const loadLocalData = async (localId: number) => {
    try {
      setIsLoading(true)

      if (!localId) {
        console.error("ID de local no disponible")
        toast({
          title: "Error",
          description: "No se pudo cargar la información del local",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Normalizar la fecha para la consulta
      const formattedDate = normalizeDate(selectedDate)
      console.log(`Fecha normalizada para consulta: ${formattedDate}`)

      // Cargar discrepancias de stock
      const stockData = await ReconciliationService.getStockDiscrepancies(
        formattedDate,
        localId,
        selectedShift === "todos" ? undefined : selectedShift,
      )
      setStockDiscrepancies(stockData || [])

      // Cargar discrepancias de caja
      const cashData = await ReconciliationService.getCashDiscrepancies(
        formattedDate,
        localId,
        selectedShift === "todos" ? undefined : selectedShift,
      )
      setCashDiscrepancies(cashData || [])

      if ((stockData?.length || 0) === 0 && (cashData?.length || 0) === 0) {
        toast({
          title: "Sin datos",
          description: `No se encontraron discrepancias para ${localInfo?.name || `Local ${localId}`} en la fecha y turno seleccionados`,
          variant: "warning",
        })
      }
    } catch (error) {
      console.error("Error al cargar datos del local:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del local",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push("/conciliacion")
  }

  const handleExport = () => {
    toast({
      title: "Exportando",
      description: "Función de exportación en desarrollo",
    })
  }

  const handleGenerateDiscrepancies = () => {
    if (localInfo && localInfo.id) {
      router.push(`/conciliacion/generar?localId=${localInfo.id}`)
    } else {
      router.push("/conciliacion/generar")
    }
  }

  // Formatear los datos para el componente de análisis
  const getFormattedStockDiscrepancies = () => {
    return uniqueStockDiscrepancies.map((item) => ({
      id: item.id,
      productId: item.productId || item.product_id,
      productName: item.productName || item.product_name,
      expectedQuantity: item.expectedQuantity || item.expected_quantity,
      actualQuantity: item.actualQuantity || item.actual_quantity,
      quantityDifference: item.quantityDifference || item.quantity_difference || item.difference,
      unitPrice: item.unitPrice || item.unit_price,
      totalValue: item.totalValue, // Ya está corregido
    }))
  }

  const getFormattedCashDiscrepancies = () => {
    return uniqueCashDiscrepancies.map((item) => ({
      id: item.id,
      category: item.category || item.paymentMethod || item.payment_method,
      expectedAmount: item.expectedAmount || item.expected_amount,
      actualAmount: item.actualAmount || item.actual_amount,
      difference: item.difference,
    }))
  }

  // Calcular totales con los datos únicos
  const calculateTotalStockDiscrepancy = () => {
    return uniqueStockDiscrepancies.reduce((sum, item) => sum + (item.totalValue || 0), 0)
  }

  const calculateTotalCashDiscrepancy = () => {
    return uniqueCashDiscrepancies.reduce((sum, item) => sum + (item.difference || 0), 0)
  }

  if (!localInfo) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <p>Cargando...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Encabezado y controles */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{localInfo.name}</h1>
              <p className="text-muted-foreground">
                Detalle de discrepancias
                {localInfo.hasTwoCashRegisters && " (Local con 2 cajas)"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DatePicker
              date={selectedDate}
              onDateChange={setSelectedDate}
              placeholder="Seleccionar fecha"
              format="dd/MM/yyyy"
            />

            <div className="w-[180px]">
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turno" />
                </SelectTrigger>
                <SelectContent>
                  {turnos.map((turno) => (
                    <SelectItem key={turno.value} value={turno.value}>
                      {turno.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="icon" onClick={() => loadLocalData(localInfo.id)} disabled={isLoading}>
              <RefreshCcw className="h-4 w-4" />
            </Button>

            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>

            {/* Botón destacado para generar discrepancias */}
            <Button onClick={handleGenerateDiscrepancies}>
              <Plus className="mr-2 h-4 w-4" />
              Generar Discrepancias
            </Button>
          </div>
        </div>

        {/* Resumen del local */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Discrepancias Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueStockDiscrepancies.length}</div>
              <p className="text-xs text-muted-foreground">
                Valor: ${Math.abs(calculateTotalStockDiscrepancy()).toLocaleString()}
                {calculateTotalStockDiscrepancy() < 0 ? " (faltante)" : " (sobrante)"}
                {stockDiscrepancies.length !== uniqueStockDiscrepancies.length && (
                  <span className="ml-1 text-xs text-amber-600">
                    (Se eliminaron {stockDiscrepancies.length - uniqueStockDiscrepancies.length} duplicados)
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Discrepancias Caja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueCashDiscrepancies.length}</div>
              <p className="text-xs text-muted-foreground">
                Valor: ${Math.abs(calculateTotalCashDiscrepancy()).toLocaleString()}
                {calculateTotalCashDiscrepancy() < 0 ? " (faltante)" : " (sobrante)"}
                {cashDiscrepancies.length !== uniqueCashDiscrepancies.length && (
                  <span className="ml-1 text-xs text-amber-600">
                    (Se eliminaron {cashDiscrepancies.length - uniqueCashDiscrepancies.length} duplicados)
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Producto Más Afectado</CardTitle>
            </CardHeader>
            <CardContent>
              {uniqueStockDiscrepancies.length > 0 ? (
                (() => {
                  // Ordenar discrepancias por diferencia absoluta (de mayor a menor)
                  const sortedDiscrepancies = [...uniqueStockDiscrepancies].sort(
                    (a, b) =>
                      Math.abs(b.difference || b.quantity_difference || 0) -
                      Math.abs(a.difference || a.quantity_difference || 0),
                  )
                  const mostAffectedProduct = sortedDiscrepancies[0]

                  return (
                    <>
                      <div className="text-2xl font-bold">
                        {mostAffectedProduct?.productName || mostAffectedProduct?.product_name || "No disponible"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Diferencia: {mostAffectedProduct?.difference || mostAffectedProduct?.quantity_difference || 0}{" "}
                        unidades
                      </p>
                    </>
                  )
                })()
              ) : (
                <div className="text-sm text-muted-foreground">No hay datos disponibles</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="stock">Discrepancias de Stock</TabsTrigger>
            <TabsTrigger value="caja">Discrepancias de Caja</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
            <TabsTrigger value="analisis">Análisis</TabsTrigger>
          </TabsList>

          {/* Pestaña de Discrepancias de Stock */}
          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <CardTitle>Discrepancias de Stock</CardTitle>
                {stockDiscrepancies.length !== uniqueStockDiscrepancies.length && (
                  <p className="text-sm text-amber-600 mt-1">
                    Se detectaron y eliminaron {stockDiscrepancies.length - uniqueStockDiscrepancies.length} registros
                    duplicados.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <StockDiscrepancyTable discrepancies={uniqueStockDiscrepancies} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Discrepancias de Caja */}
          <TabsContent value="caja">
            <Card>
              <CardHeader>
                <CardTitle>Discrepancias de Caja</CardTitle>
                {cashDiscrepancies.length !== uniqueCashDiscrepancies.length && (
                  <p className="text-sm text-amber-600 mt-1">
                    Se detectaron y eliminaron {cashDiscrepancies.length - uniqueCashDiscrepancies.length} registros
                    duplicados.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <CashDiscrepancyTable
                  discrepancies={uniqueCashDiscrepancies}
                  isLoading={isLoading}
                  localId={localInfo.id}
                  date={normalizeDate(selectedDate)}
                  shift={selectedShift === "todos" ? undefined : selectedShift}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Historial */}
          <TabsContent value="historial">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Discrepancias</CardTitle>
              </CardHeader>
              <CardContent>
                <DiscrepancyHistory localId={localInfo.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Análisis */}
          <TabsContent value="analisis">
            <div className="mt-4">
              {uniqueStockDiscrepancies.length > 0 || uniqueCashDiscrepancies.length > 0 ? (
                <AnalisisConciliacion
                  stockDiscrepancies={getFormattedStockDiscrepancies()}
                  cashDiscrepancies={getFormattedCashDiscrepancies()}
                  fecha={normalizeDate(selectedDate)}
                  local={localInfo.name}
                  turno={selectedShift}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis de Conciliación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center py-4 text-muted-foreground">
                      No hay datos de discrepancias para analizar en la fecha y turno seleccionados.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
