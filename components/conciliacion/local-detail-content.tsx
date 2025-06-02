"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, RefreshCcw } from "lucide-react"
import { StockDiscrepancyTable } from "@/components/conciliacion/stock-discrepancy-table"
import { CashDiscrepancyTable } from "@/components/conciliacion/cash-discrepancy-table"
import { GenerateDiscrepanciesButton } from "@/components/conciliacion/generate-discrepancies-button"
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

interface LocalDetailContentProps {
  localId: number
  initialLocalName: string
}

export function LocalDetailContent({ localId, initialLocalName }: LocalDetailContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedShift, setSelectedShift] = useState<string>("todos")
  const [localInfo, setLocalInfo] = useState<any>({ id: localId, name: initialLocalName })
  const [stockDiscrepancies, setStockDiscrepancies] = useState<any[]>([])
  const [cashDiscrepancies, setCashDiscrepancies] = useState<any[]>([])
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false)
  const [activeTab, setActiveTab] = useState("stock")

  // Cargar parámetros de la URL si existen
  useEffect(() => {
    const dateParam = searchParams.get("date")
    const shiftParam = searchParams.get("shift")
    const tabParam = searchParams.get("tab")

    if (dateParam) {
      setSelectedDate(new Date(dateParam))
    }

    if (shiftParam) {
      setSelectedShift(shiftParam)
    }

    if (tabParam && ["stock", "caja", "historial", "analisis"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Cargar información del local
  useEffect(() => {
    const local = locales.find((l) => l.id === localId)
    if (local) {
      setLocalInfo(local)
    }
  }, [localId])

  // Cargar datos iniciales o buscar la última fecha con discrepancias
  useEffect(() => {
    if (!hasLoadedInitialData && localInfo) {
      loadLastDiscrepancyDate()
    }
  }, [localInfo, hasLoadedInitialData])

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    if (localInfo && hasLoadedInitialData) {
      loadLocalData()
    }
  }, [selectedDate, selectedShift, localInfo, hasLoadedInitialData])

  // Buscar la última fecha con discrepancias
  const loadLastDiscrepancyDate = async () => {
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

  const loadLocalData = async () => {
    try {
      setIsLoading(true)

      if (!localInfo || !localInfo.id) {
        console.error("Información del local no disponible")
        toast({
          title: "Error",
          description: "No se pudo cargar la información del local",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const formattedDate = selectedDate.toISOString().split("T")[0]

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

  // Formatear los datos para el componente de análisis
  const getFormattedStockDiscrepancies = () => {
    return stockDiscrepancies.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      expectedQuantity: item.expectedQuantity,
      actualQuantity: item.actualQuantity,
      quantityDifference: item.difference,
      unitPrice: item.unitPrice,
      totalValue: item.totalValue || item.difference * item.unitPrice,
    }))
  }

  const getFormattedCashDiscrepancies = () => {
    return cashDiscrepancies.map((item) => ({
      id: item.id,
      category: item.category || item.paymentMethod,
      expectedAmount: item.expectedAmount,
      actualAmount: item.actualAmount,
      difference: item.difference,
    }))
  }

  return (
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

          <Button variant="outline" size="icon" onClick={loadLocalData} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>

          <GenerateDiscrepanciesButton localId={localId} />
        </div>
      </div>

      {/* Resumen del local */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Discrepancias Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockDiscrepancies.length}</div>
            <p className="text-xs text-muted-foreground">
              Valor: ${stockDiscrepancies.reduce((sum, item) => sum + (item.totalValue || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Discrepancias Caja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cashDiscrepancies.length}</div>
            <p className="text-xs text-muted-foreground">
              Valor: $
              {cashDiscrepancies.reduce((sum, item) => sum + Math.abs(item.difference || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Producto Más Afectado</CardTitle>
          </CardHeader>
          <CardContent>
            {stockDiscrepancies.length > 0 ? (
              (() => {
                // Ordenar discrepancias por diferencia absoluta (de mayor a menor)
                const sortedDiscrepancies = [...stockDiscrepancies].sort(
                  (a, b) => Math.abs(b.difference || 0) - Math.abs(a.difference || 0),
                )
                const mostAffectedProduct = sortedDiscrepancies[0]

                return (
                  <>
                    <div className="text-2xl font-bold">{mostAffectedProduct?.productName || "No disponible"}</div>
                    <p className="text-xs text-muted-foreground">
                      Diferencia: {mostAffectedProduct?.difference || 0} unidades
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
            </CardHeader>
            <CardContent>
              <StockDiscrepancyTable discrepancies={stockDiscrepancies} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Discrepancias de Caja */}
        <TabsContent value="caja">
          <Card>
            <CardHeader>
              <CardTitle>Discrepancias de Caja</CardTitle>
            </CardHeader>
            <CardContent>
              <CashDiscrepancyTable discrepancies={cashDiscrepancies} isLoading={isLoading} />
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
              <DiscrepancyHistory localId={localId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Análisis */}
        <TabsContent value="analisis">
          <div className="mt-4">
            {stockDiscrepancies.length > 0 || cashDiscrepancies.length > 0 ? (
              <AnalisisConciliacion
                stockDiscrepancies={getFormattedStockDiscrepancies()}
                cashDiscrepancies={getFormattedCashDiscrepancies()}
                fecha={selectedDate.toISOString().split("T")[0]}
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
  )
}
