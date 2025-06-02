"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Download, RefreshCcw, Search } from "lucide-react"
import { ConciliacionSummary } from "./conciliacion-summary"
import { StockDiscrepancyTable } from "./stock-discrepancy-table"
import { CashDiscrepancyTable } from "./cash-discrepancy-table"
import { AutoReconcilePanel } from "./auto-reconcile-panel"
import { ReconciliationService } from "../../lib/reconciliation-service"

// Lista fija de locales con IDs numéricos
const locales = [
  { id: 1, name: "BR Cabildo" },
  { id: 2, name: "BR Carranza" },
  { id: 3, name: "BR Pacífico" },
  { id: 4, name: "BR Lavalle" },
  { id: 5, name: "BR Rivadavia" },
  { id: 6, name: "BR Aguero" },
  { id: 7, name: "BR Dorrego" },
  { id: 8, name: "Dean & Dennys" },
]

// Opciones de turno
const turnos = [
  { value: "", label: "Todos los turnos" },
  { value: "mañana", label: "Mañana" },
  { value: "tarde", label: "Tarde" },
]

// Interfaces para los datos
interface StockDiscrepancy {
  id: string
  date: string
  localId: number
  shift: string
  productId: string
  productName: string
  expectedQuantity: number
  actualQuantity: number
  difference: number
  unitCost: number
  totalValue: number
  status: "pending" | "reconciled" | "unreconciled"
  reconciliationId?: string
}

interface CashDiscrepancy {
  id: string
  date: string
  localId: number
  shift: string
  paymentMethod: "cash" | "bank" | "card" | "other"
  expectedAmount: number
  actualAmount: number
  difference: number
  status: "pending" | "reconciled" | "unreconciled"
  reconciliationId?: string
}

interface Reconciliation {
  id: string
  date: string
  localId: number
  shift: string
  totalStockValue: number
  totalCashValue: number
  difference: number
  status: "draft" | "pending_approval" | "approved" | "rejected"
  notes: string
  createdBy: string
  createdAt: string
  details: ReconciliationDetail[]
}

interface ReconciliationDetail {
  id: string
  reconciliationId: string
  stockDiscrepancyId?: string
  cashDiscrepancyId?: string
  matchedValue: number
  notes: string
}

export function ConciliacionContent() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("resumen")

  // Estado para los filtros
  const [filters, setFilters] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    localId: null as number | null,
    localName: "",
    shift: "" as string, // Valor vacío significa "todos los turnos"
  })

  // Estado para los datos
  const [stockDiscrepancies, setStockDiscrepancies] = useState<StockDiscrepancy[]>([])
  const [cashDiscrepancies, setCashDiscrepancies] = useState<CashDiscrepancy[]>([])
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([])
  const [autoReconcileResults, setAutoReconcileResults] = useState<any>(null)

  // Estadísticas
  const [stats, setStats] = useState({
    totalStockDiscrepancies: 0,
    totalCashDiscrepancies: 0,
    totalStockValue: 0,
    totalCashValue: 0,
    netDifference: 0,
    reconciliationPercentage: 0,
  })

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    if (filters.date) {
      loadData()
    }
  }, [filters.localId, filters.date, filters.shift])

  // Modificar la función handleFilterChange para validar la fecha
  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }

      if (name === "localId") {
        // Convertir a número si es localId
        newFilters.localId = value ? Number(value) : null
        const selectedLocal = locales.find((local) => local.id === Number(value))
        if (selectedLocal) {
          newFilters.localName = selectedLocal.name
        }
      } else if (name === "date") {
        // Asegurarse de que la fecha no esté vacía
        newFilters.date = value || format(new Date(), "yyyy-MM-dd")
      } else if (name === "shift") {
        // Actualizar el turno
        newFilters.shift = value
      } else {
        // Para otros campos, usar el valor tal cual
        newFilters[name] = value
      }

      return newFilters
    })
  }

  // Cargar datos - Añadir validaciones para evitar consultas con parámetros vacíos
  const loadData = async () => {
    try {
      setIsLoading(true)

      // Validar que tenemos fecha antes de hacer las consultas
      if (!filters.date) {
        toast({
          title: "Error",
          description: "Debe seleccionar una fecha para cargar los datos",
          variant: "destructive",
        })
        return
      }

      // Si no hay localId seleccionado, cargar datos para todos los locales
      if (filters.localId === null) {
        // Cargar discrepancias de stock para todos los locales
        const stockData = await ReconciliationService.getStockDiscrepanciesAllLocations(
          filters.date,
          filters.shift || undefined,
        )
        setStockDiscrepancies(stockData)

        // Cargar discrepancias de caja para todos los locales
        const cashData = await ReconciliationService.getCashDiscrepanciesAllLocations(
          filters.date,
          filters.shift || undefined,
        )
        setCashDiscrepancies(cashData)
      } else {
        // Cargar discrepancias de stock para el local seleccionado
        const stockData = await ReconciliationService.getStockDiscrepancies(
          filters.date,
          filters.localId,
          filters.shift || undefined,
        )
        setStockDiscrepancies(stockData)

        // Cargar discrepancias de caja para el local seleccionado
        const cashData = await ReconciliationService.getCashDiscrepancies(
          filters.date,
          filters.localId,
          filters.shift || undefined,
        )
        setCashDiscrepancies(cashData)
      }

      // Cargar conciliaciones existentes
      const reconciliationData = await ReconciliationService.getReconciliations(
        filters.date,
        filters.localId,
        filters.shift || undefined,
      )
      setReconciliations(reconciliationData)

      // Calcular estadísticas
      calculateStats(stockDiscrepancies, cashDiscrepancies, reconciliationData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de conciliación",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calcular estadísticas
  const calculateStats = (
    stockData: StockDiscrepancy[],
    cashData: CashDiscrepancy[],
    reconciliationData: Reconciliation[],
  ) => {
    const totalStockValue = stockData.reduce((sum, item) => sum + Math.abs(item.totalValue), 0)
    const totalCashValue = cashData.reduce((sum, item) => sum + Math.abs(item.difference), 0)

    const reconciledStock = stockData.filter((item) => item.status === "reconciled").length
    const reconciledCash = cashData.filter((item) => item.status === "reconciled").length

    const totalItems = stockData.length + cashData.length
    const reconciledItems = reconciledStock + reconciledCash

    const reconciliationPercentage = totalItems > 0 ? (reconciledItems / totalItems) * 100 : 0

    setStats({
      totalStockDiscrepancies: stockData.length,
      totalCashDiscrepancies: cashData.length,
      totalStockValue,
      totalCashValue,
      netDifference: totalStockValue - totalCashValue,
      reconciliationPercentage,
    })
  }

  // Ejecutar conciliación automática
  const runAutoReconciliation = async () => {
    try {
      setIsLoading(true)

      const results = await ReconciliationService.autoReconcile(stockDiscrepancies, cashDiscrepancies)

      setAutoReconcileResults(results)

      toast({
        title: "Conciliación automática completada",
        description: `Se encontraron ${results.matches.length} coincidencias potenciales`,
      })
    } catch (error) {
      console.error("Error en conciliación automática:", error)
      toast({
        title: "Error",
        description: "No se pudo completar la conciliación automática",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Guardar conciliaciones
  const saveReconciliations = async () => {
    try {
      setIsLoading(true)

      if (!autoReconcileResults || !autoReconcileResults.matches) {
        toast({
          title: "Error",
          description: "No hay conciliaciones para guardar",
          variant: "destructive",
        })
        return
      }

      await ReconciliationService.saveReconciliations(
        autoReconcileResults.matches,
        filters.date,
        filters.localId,
        filters.localName,
        filters.shift,
      )

      toast({
        title: "Conciliaciones guardadas",
        description: "Las conciliaciones se han guardado correctamente",
      })

      // Recargar datos
      loadData()
    } catch (error) {
      console.error("Error al guardar conciliaciones:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las conciliaciones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Conciliación General</h1>
          <p className="text-muted-foreground">Sistema de conciliación entre stock y caja</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button variant="outline" onClick={() => loadData()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button variant="outline" onClick={() => {}}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Seleccione fecha, local y turno para la conciliación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="local">Local</Label>
              <Select
                value={filters.localId?.toString() || ""}
                onValueChange={(value) => handleFilterChange("localId", value)}
              >
                <SelectTrigger id="local">
                  <SelectValue placeholder="Seleccionar local" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">Todos los locales</SelectItem>
                  {locales.map((local) => (
                    <SelectItem key={local.id} value={local.id.toString()}>
                      {local.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift">Turno</Label>
              <Select value={filters.shift} onValueChange={(value) => handleFilterChange("shift", value)}>
                <SelectTrigger id="shift">
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

            <div className="flex items-end">
              <Button onClick={loadData} disabled={!filters.date || isLoading} className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="stock">Discrepancias de Stock</TabsTrigger>
          <TabsTrigger value="caja">Discrepancias de Caja</TabsTrigger>
          <TabsTrigger value="conciliacion">Conciliación</TabsTrigger>
        </TabsList>

        {/* Pestaña de Resumen */}
        <TabsContent value="resumen">
          <ConciliacionSummary stats={stats} date={filters.date} localName={filters.localName} isLoading={isLoading} />
        </TabsContent>

        {/* Pestaña de Discrepancias de Stock */}
        <TabsContent value="stock">
          <StockDiscrepancyTable discrepancies={stockDiscrepancies} isLoading={isLoading} />
        </TabsContent>

        {/* Pestaña de Discrepancias de Caja */}
        <TabsContent value="caja">
          <CashDiscrepancyTable discrepancies={cashDiscrepancies} isLoading={isLoading} />
        </TabsContent>

        {/* Pestaña de Conciliación */}
        <TabsContent value="conciliacion">
          <AutoReconcilePanel
            stockDiscrepancies={stockDiscrepancies}
            cashDiscrepancies={cashDiscrepancies}
            reconciliationResults={autoReconcileResults}
            onRunReconciliation={runAutoReconciliation}
            onSaveReconciliations={saveReconciliations}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
