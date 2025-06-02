"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { DataTable } from "@/components/data-table"
import { balanceService } from "@/lib/balance-service"
import { exportToCSV } from "@/lib/export-utils"
import type { Balance, BalanceService } from "@/types/balance"
import type { ColumnDef } from "@tanstack/react-table"
import { Download, Plus, Calendar, FileText, TrendingUp, TrendingDown, DollarSign, Save, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { PieChart } from "@/components/charts"

// Lista de locales
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

// Nombres de los meses
const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

export default function BalancesPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [balances, setBalances] = useState<Balance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedLocal, setSelectedLocal] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [expenseChartData, setExpenseChartData] = useState<any>(null)

  // Estado para el formulario de nuevo balance
  const [newBalance, setNewBalance] = useState<
    Omit<Balance, "id" | "cmvPorcentaje" | "sueldosPorcentaje" | "retornoNeto" | "servicios">
  >({
    localId: "",
    local: "BR Cabildo",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),

    // Ingresos
    ventasRappi: 0,
    ventasPedidosYa: 0,
    ventasDebitoCreditoQR: 0,
    ventasEfectivo: 0,

    // Costos y gastos
    cmv: 0,
    desperdicio: 0,
    consumos: 0,
    contribucionMarginal: 0,

    // Otros gastos
    fee: 0,
    alquiler: 0,
    sueldos: 0,
    gastos: 0,

    // Impuestos y retenciones
    ebit: 0,
    iva: 0,
    iibb: 0,
    ccss: 0,
    tarjeta: 0,
  })

  // Estado para servicios
  const [newServices, setNewServices] = useState<Omit<BalanceService, "id" | "balanceId" | "total">>({
    prosegur: 0,
    internet: 0,
    seguro: 0,
    desinfectacion: 0,
    edenor: 0,
    metrogas: 0,
    abl: 0,
    expensas: 0,
    autonomo: 0,
    abogado: 0,
    contador: 0,
    datalive: 0,
    payway: 0,
    personal: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Obtener balances
        const balanceData = await balanceService.getBalances({
          year: selectedYear,
          month: selectedMonth || undefined,
          local: selectedLocal === "all" ? undefined : selectedLocal,
        })
        setBalances(balanceData)

        // Preparar datos para gráfico de gastos
        if (balanceData.length > 0) {
          // Calcular totales por categoría de gasto
          const totalCMV = balanceData.reduce((sum, b) => sum + b.cmv, 0)
          const totalSueldos = balanceData.reduce((sum, b) => sum + b.sueldos, 0)
          const totalAlquiler = balanceData.reduce((sum, b) => sum + b.alquiler, 0)
          const totalServicios = balanceData.reduce((sum, b) => sum + b.servicios, 0)
          const totalImpuestos = balanceData.reduce((sum, b) => sum + b.iva + b.iibb + b.ccss, 0)
          const totalOtros = balanceData.reduce((sum, b) => sum + b.gastos + b.fee, 0)

          setExpenseChartData({
            labels: ["CMV", "Sueldos", "Alquiler", "Servicios", "Impuestos", "Otros"],
            datasets: [
              {
                data: [totalCMV, totalSueldos, totalAlquiler, totalServicios, totalImpuestos, totalOtros],
                backgroundColor: [
                  "rgba(255, 99, 132, 0.5)",
                  "rgba(54, 162, 235, 0.5)",
                  "rgba(255, 206, 86, 0.5)",
                  "rgba(75, 192, 192, 0.5)",
                  "rgba(153, 102, 255, 0.5)",
                  "rgba(255, 159, 64, 0.5)",
                ],
                borderColor: [
                  "rgba(255, 99, 132, 1)",
                  "rgba(54, 162, 235, 1)",
                  "rgba(255, 206, 86, 1)",
                  "rgba(75, 192, 192, 1)",
                  "rgba(153, 102, 255, 1)",
                  "rgba(255, 159, 64, 1)",
                ],
                borderWidth: 1,
              },
            ],
          })
        }
      } catch (error) {
        console.error("Error al cargar datos de balances:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los balances",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedYear, selectedMonth, selectedLocal, toast])

  // Calcular totales
  const totalIngresos = balances.reduce(
    (sum, balance) =>
      sum + balance.ventasRappi + balance.ventasPedidosYa + balance.ventasDebitoCreditoQR + balance.ventasEfectivo,
    0,
  )

  const totalGastos = balances.reduce(
    (sum, balance) =>
      sum +
      balance.cmv +
      balance.desperdicio +
      balance.consumos +
      balance.contribucionMarginal +
      balance.servicios +
      balance.fee +
      balance.alquiler +
      balance.sueldos +
      balance.gastos +
      balance.ebit +
      balance.iva +
      balance.iibb +
      balance.ccss +
      balance.tarjeta,
    0,
  )

  const totalRetornoNeto = balances.reduce((sum, balance) => sum + balance.retornoNeto, 0)

  // Calcular totales para el nuevo balance
  const calcularTotales = () => {
    // Total de ingresos
    const totalIngresos =
      newBalance.ventasRappi + newBalance.ventasPedidosYa + newBalance.ventasDebitoCreditoQR + newBalance.ventasEfectivo

    // Total de servicios
    const totalServicios =
      newServices.prosegur +
      newServices.internet +
      newServices.seguro +
      newServices.desinfectacion +
      newServices.edenor +
      newServices.metrogas +
      newServices.abl +
      newServices.expensas +
      newServices.autonomo +
      newServices.abogado +
      newServices.contador +
      newServices.datalive +
      newServices.payway +
      newServices.personal

    // CMV porcentaje
    const cmvPorcentaje = totalIngresos > 0 ? (newBalance.cmv * 100) / totalIngresos : 0

    // Sueldos porcentaje
    const sueldosPorcentaje = totalIngresos > 0 ? (newBalance.sueldos * 100) / totalIngresos : 0

    // Retorno neto
    const retornoNeto =
      totalIngresos -
      newBalance.cmv -
      newBalance.desperdicio -
      newBalance.consumos -
      newBalance.contribucionMarginal -
      totalServicios -
      newBalance.fee -
      newBalance.alquiler -
      newBalance.sueldos -
      newBalance.gastos -
      newBalance.ebit -
      newBalance.iva -
      newBalance.iibb -
      newBalance.ccss -
      newBalance.tarjeta

    return {
      totalIngresos,
      totalServicios,
      cmvPorcentaje,
      sueldosPorcentaje,
      retornoNeto,
    }
  }

  const totales = calcularTotales()

  const handleExportCSV = () => {
    // Preparar datos para exportar
    const data = balances.map((balance) => ({
      Local: balance.local,
      Mes: monthNames[balance.month - 1],
      Año: balance.year,
      "Ventas Rappi": balance.ventasRappi,
      "Ventas PedidosYa": balance.ventasPedidosYa,
      "Ventas Débito/Crédito/QR": balance.ventasDebitoCreditoQR,
      "Ventas Efectivo": balance.ventasEfectivo,
      CMV: balance.cmv,
      "CMV %": balance.cmvPorcentaje.toFixed(2) + "%",
      Desperdicio: balance.desperdicio,
      Consumos: balance.consumos,
      "Contribución Marginal": balance.contribucionMarginal,
      Servicios: balance.servicios,
      Fee: balance.fee,
      Alquiler: balance.alquiler,
      Sueldos: balance.sueldos,
      "Sueldos %": balance.sueldosPorcentaje.toFixed(2) + "%",
      Gastos: balance.gastos,
      EBIT: balance.ebit,
      IVA: balance.iva,
      IIBB: balance.iibb,
      CCSS: balance.ccss,
      Tarjeta: balance.tarjeta,
      "Retorno Neto": balance.retornoNeto,
    }))

    exportToCSV(data, `balances_${selectedYear}_${selectedMonth ? monthNames[selectedMonth - 1] : "todos"}`)
  }

  const handleSubmit = async () => {
    try {
      setIsSaving(true)

      // Crear nuevo balance
      try {
        const createdBalance = await balanceService.createBalance(newBalance, newServices)

        // Actualizar la lista de balances
        setBalances((prev) => [...prev, createdBalance])

        // Mostrar mensaje de éxito
        toast({
          title: "Balance creado",
          description: "El balance ha sido registrado correctamente",
        })

        // Cerrar el diálogo y resetear el formulario
        setIsDialogOpen(false)
        setNewBalance({
          localId: "",
          local: "BR Cabildo",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          ventasRappi: 0,
          ventasPedidosYa: 0,
          ventasDebitoCreditoQR: 0,
          ventasEfectivo: 0,
          cmv: 0,
          desperdicio: 0,
          consumos: 0,
          contribucionMarginal: 0,
          fee: 0,
          alquiler: 0,
          sueldos: 0,
          gastos: 0,
          ebit: 0,
          iva: 0,
          iibb: 0,
          ccss: 0,
          tarjeta: 0,
        })

        setNewServices({
          prosegur: 0,
          internet: 0,
          seguro: 0,
          desinfectacion: 0,
          edenor: 0,
          metrogas: 0,
          abl: 0,
          expensas: 0,
          autonomo: 0,
          abogado: 0,
          contador: 0,
          datalive: 0,
          payway: 0,
          personal: 0,
        })
      } catch (error) {
        console.error("Error al crear balance:", error)
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? `Error al registrar el balance: ${error.message}`
              : "No se pudo registrar el balance. Por favor, intente nuevamente.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const columns: ColumnDef<Balance>[] = [
    {
      accessorKey: "local",
      header: "Local",
    },
    {
      accessorKey: "month",
      header: "Mes",
      cell: ({ row }) => monthNames[row.original.month - 1],
    },
    {
      accessorKey: "year",
      header: "Año",
    },
    {
      id: "ingresos",
      header: "Ingresos Totales",
      cell: ({ row }) => {
        const total =
          row.original.ventasRappi +
          row.original.ventasPedidosYa +
          row.original.ventasDebitoCreditoQR +
          row.original.ventasEfectivo
        return `$${total.toLocaleString()}`
      },
    },
    {
      id: "cmv",
      header: "CMV",
      cell: ({ row }) => `$${row.original.cmv.toLocaleString()} (${row.original.cmvPorcentaje.toFixed(2)}%)`,
    },
    {
      accessorKey: "retornoNeto",
      header: "Retorno Neto",
      cell: ({ row }) => {
        const retornoNeto = row.original.retornoNeto
        return (
          <div className="flex items-center">
            {retornoNeto >= 0 ? (
              <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
            )}
            <span className={retornoNeto >= 0 ? "text-green-600" : "text-red-600"}>
              ${retornoNeto.toLocaleString()}
            </span>
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
              router.push(`/balances/${row.original.id}`)
            }}
          >
            <FileText className="mr-1 h-4 w-4" />
            Ver Detalles
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
            <h2 className="text-3xl font-bold tracking-tight">Balances</h2>
            <p className="text-muted-foreground">Gestiona los balances financieros de los locales</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Balance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Balance</DialogTitle>
                <DialogDescription>Completa el formulario para registrar un nuevo balance</DialogDescription>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="general">Información General</TabsTrigger>
                  <TabsTrigger value="ingresos">Ingresos y Costos</TabsTrigger>
                  <TabsTrigger value="servicios">Servicios</TabsTrigger>
                </TabsList>

                {/* Pestaña de Información General */}
                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="local">Local</Label>
                      <Select
                        value={newBalance.local}
                        onValueChange={(value) => setNewBalance((prev) => ({ ...prev, local: value }))}
                      >
                        <SelectTrigger id="local">
                          <SelectValue placeholder="Seleccionar local" />
                        </SelectTrigger>
                        <SelectContent>
                          {locales.map((local) => (
                            <SelectItem key={local.id} value={local.name}>
                              {local.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="month">Mes</Label>
                      <Select
                        value={newBalance.month.toString()}
                        onValueChange={(value) => setNewBalance((prev) => ({ ...prev, month: Number.parseInt(value) }))}
                      >
                        <SelectTrigger id="month">
                          <SelectValue placeholder="Seleccionar mes" />
                        </SelectTrigger>
                        <SelectContent>
                          {monthNames.map((name, index) => (
                            <SelectItem key={index} value={(index + 1).toString()}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Año</Label>
                      <Select
                        value={newBalance.year.toString()}
                        onValueChange={(value) => setNewBalance((prev) => ({ ...prev, year: Number.parseInt(value) }))}
                      >
                        <SelectTrigger id="year">
                          <SelectValue placeholder="Seleccionar año" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={(new Date().getFullYear() - 1).toString()}>
                            {new Date().getFullYear() - 1}
                          </SelectItem>
                          <SelectItem value={new Date().getFullYear().toString()}>
                            {new Date().getFullYear()}
                          </SelectItem>
                          <SelectItem value={(new Date().getFullYear() + 1).toString()}>
                            {new Date().getFullYear() + 1}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button type="button" onClick={() => setActiveTab("ingresos")}>
                      Siguiente: Ingresos y Costos
                    </Button>
                  </div>
                </TabsContent>

                {/* Pestaña de Ingresos y Costos */}
                <TabsContent value="ingresos" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Ingresos</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ventasRappi">Ventas Rappi</Label>
                        <Input
                          id="ventasRappi"
                          type="number"
                          value={newBalance.ventasRappi || ""}
                          onChange={(e) =>
                            setNewBalance((prev) => ({ ...prev, ventasRappi: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ventasPedidosYa">Ventas PedidosYa</Label>
                        <Input
                          id="ventasPedidosYa"
                          type="number"
                          value={newBalance.ventasPedidosYa || ""}
                          onChange={(e) =>
                            setNewBalance((prev) => ({ ...prev, ventasPedidosYa: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ventasDebitoCreditoQR">Débito/Crédito/QR</Label>
                        <Input
                          id="ventasDebitoCreditoQR"
                          type="number"
                          value={newBalance.ventasDebitoCreditoQR || ""}
                          onChange={(e) =>
                            setNewBalance((prev) => ({ ...prev, ventasDebitoCreditoQR: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ventasEfectivo">Efectivo</Label>
                        <Input
                          id="ventasEfectivo"
                          type="number"
                          value={newBalance.ventasEfectivo || ""}
                          onChange={(e) =>
                            setNewBalance((prev) => ({ ...prev, ventasEfectivo: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Ingresos:</span>
                        <span className="text-xl font-bold">${totales.totalIngresos.toLocaleString()}</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <h3 className="text-lg font-medium">Costos y Gastos</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cmv">CMV (Costo de Mercadería Vendida)</Label>
                        <Input
                          id="cmv"
                          type="number"
                          value={newBalance.cmv || ""}
                          onChange={(e) => setNewBalance((prev) => ({ ...prev, cmv: Number(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cmvPorcentaje">CMV %</Label>
                        <Input
                          id="cmvPorcentaje"
                          type="text"
                          value={`${totales.cmvPorcentaje.toFixed(2)}%`}
                          readOnly
                          className="bg-muted"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desperdicio">Desperdicio</Label>
                        <Input
                          id="desperdicio"
                          type="number"
                          value={newBalance.desperdicio || ""}
                          onChange={(e) =>
                            setNewBalance((prev) => ({ ...prev, desperdicio: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="consumos">Consumos</Label>
                        <Input
                          id="consumos"
                          type="number"
                          value={newBalance.consumos || ""}
                          onChange={(e) =>
                            setNewBalance((prev) => ({ ...prev, consumos: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contribucionMarginal">Contribución Marginal</Label>
                        <Input
                          id="contribucionMarginal"
                          type="number"
                          value={newBalance.contribucionMarginal || ""}
                          onChange={(e) =>
                            setNewBalance((prev) => ({ ...prev, contribucionMarginal: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fee">Fee</Label>
                        <Input
                          id="fee"
                          type="number"
                          value={newBalance.fee || ""}
                          onChange={(e) => setNewBalance((prev) => ({ ...prev, fee: Number(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="alquiler">Alquiler</Label>
                        <Input
                          id="alquiler"
                          type="number"
                          value={newBalance.alquiler || ""}
                          onChange={(e) =>
                            setNewBalance((prev) => ({ ...prev, alquiler: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sueldos">Sueldos</Label>
                        <Input
                          id="sueldos"
                          type="number"
                          value={newBalance.sueldos || ""}
                          onChange={(e) => setNewBalance((prev) => ({ ...prev, sueldos: Number(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sueldosPorcentaje">Sueldos %</Label>
                        <Input
                          id="sueldosPorcentaje"
                          type="text"
                          value={`${totales.sueldosPorcentaje.toFixed(2)}%`}
                          readOnly
                          className="bg-muted"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gastos">Gastos</Label>
                        <Input
                          id="gastos"
                          type="number"
                          value={newBalance.gastos || ""}
                          onChange={(e) => setNewBalance((prev) => ({ ...prev, gastos: Number(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <h3 className="text-lg font-medium">Impuestos y Retenciones</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ebit">EBIT</Label>
                        <Input
                          id="ebit"
                          type="number"
                          value={newBalance.ebit || ""}
                          onChange={(e) => setNewBalance((prev) => ({ ...prev, ebit: Number(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="iva">IVA</Label>
                        <Input
                          id="iva"
                          type="number"
                          value={newBalance.iva || ""}
                          onChange={(e) => setNewBalance((prev) => ({ ...prev, iva: Number(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="iibb">IIBB</Label>
                        <Input
                          id="iibb"
                          type="number"
                          value={newBalance.iibb || ""}
                          onChange={(e) => setNewBalance((prev) => ({ ...prev, iibb: Number(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ccss">CCSS</Label>
                        <Input
                          id="ccss"
                          type="number"
                          value={newBalance.ccss || ""}
                          onChange={(e) => setNewBalance((prev) => ({ ...prev, ccss: Number(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tarjeta">Tarjeta</Label>
                        <Input
                          id="tarjeta"
                          type="number"
                          value={newBalance.tarjeta || ""}
                          onChange={(e) => setNewBalance((prev) => ({ ...prev, tarjeta: Number(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("general")}>
                        Anterior: Información General
                      </Button>
                      <Button type="button" onClick={() => setActiveTab("servicios")}>
                        Siguiente: Servicios
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Pestaña de Servicios */}
                <TabsContent value="servicios" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Servicios</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prosegur">Prosegur</Label>
                        <Input
                          id="prosegur"
                          type="number"
                          value={newServices.prosegur || ""}
                          onChange={(e) =>
                            setNewServices((prev) => ({ ...prev, prosegur: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="internet">Internet</Label>
                        <Input
                          id="internet"
                          type="number"
                          value={newServices.internet || ""}
                          onChange={(e) =>
                            setNewServices((prev) => ({ ...prev, internet: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="seguro">Seguro</Label>
                        <Input
                          id="seguro"
                          type="number"
                          value={newServices.seguro || ""}
                          onChange={(e) => setNewServices((prev) => ({ ...prev, seguro: Number(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desinfectacion">Desinfectación</Label>
                        <Input
                          id="desinfectacion"
                          type="number"
                          value={newServices.desinfectacion || ""}
                          onChange={(e) =>
                            setNewServices((prev) => ({ ...prev, desinfectacion: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edenor">Edenor</Label>
                        <Input
                          id="edenor"
                          type="number"
                          value={newServices.edenor || ""}
                          onChange={(e) => setNewServices((prev) => ({ ...prev, edenor: Number(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="metrogas">Metrogas</Label>
                        <Input
                          id="metrogas"
                          type="number"
                          value={newServices.metrogas || ""}
                          onChange={(e) =>
                            setNewServices((prev) => ({ ...prev, metrogas: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="abl">ABL</Label>
                        <Input
                          id="abl"
                          type="number"
                          value={newServices.abl || ""}
                          onChange={(e) => setNewServices((prev) => ({ ...prev, abl: Number(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expensas">Expensas</Label>
                        <Input
                          id="expensas"
                          type="number"
                          value={newServices.expensas || ""}
                          onChange={(e) =>
                            setNewServices((prev) => ({ ...prev, expensas: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="autonomo">Autónomo</Label>
                        <Input
                          id="autonomo"
                          type="number"
                          value={newServices.autonomo || ""}
                          onChange={(e) =>
                            setNewServices((prev) => ({ ...prev, autonomo: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="abogado">Abogado</Label>
                        <Input
                          id="abogado"
                          type="number"
                          value={newServices.abogado || ""}
                          onChange={(e) =>
                            setNewServices((prev) => ({ ...prev, abogado: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contador">Contador</Label>
                        <Input
                          id="contador"
                          type="number"
                          value={newServices.contador || ""}
                          onChange={(e) =>
                            setNewServices((prev) => ({ ...prev, contador: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="datalive">Datalive</Label>
                        <Input
                          id="datalive"
                          type="number"
                          value={newServices.datalive || ""}
                          onChange={(e) =>
                            setNewServices((prev) => ({ ...prev, datalive: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payway">Payway</Label>
                        <Input
                          id="payway"
                          type="number"
                          value={newServices.payway || ""}
                          onChange={(e) => setNewServices((prev) => ({ ...prev, payway: Number(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="personal">Personal</Label>
                        <Input
                          id="personal"
                          type="number"
                          value={newServices.personal || ""}
                          onChange={(e) =>
                            setNewServices((prev) => ({ ...prev, personal: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Servicios:</span>
                        <span className="text-xl font-bold">${totales.totalServicios.toLocaleString()}</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <h3 className="text-lg font-medium">Resumen</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalIngresos">Ingresos Totales</Label>
                        <Input
                          id="totalIngresos"
                          type="text"
                          value={`$${totales.totalIngresos.toLocaleString()}`}
                          readOnly
                          className="bg-muted"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="retornoNeto">Retorno Neto</Label>
                        <Input
                          id="retornoNeto"
                          type="text"
                          value={`$${totales.retornoNeto.toLocaleString()}`}
                          readOnly
                          className={`bg-muted ${totales.retornoNeto >= 0 ? "text-green-600" : "text-red-600"}`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("ingresos")}>
                        Anterior: Ingresos y Costos
                      </Button>
                      <Button type="submit" onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Balance
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalIngresos.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{balances.length} balances en el período</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalGastos.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {totalIngresos > 0 ? ((totalGastos / totalIngresos) * 100).toFixed(2) : "0"}% de los ingresos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retorno Neto</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalRetornoNeto >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${totalRetornoNeto.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {totalIngresos > 0 ? ((totalRetornoNeto / totalIngresos) * 100).toFixed(2) : "0"}% de margen
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de distribución de gastos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Gastos</CardTitle>
            <CardDescription>Desglose de gastos por categoría</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {expenseChartData ? (
              <PieChart data={expenseChartData} />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-muted-foreground">No hay datos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Historial de Balances</CardTitle>
            <CardDescription>Consulta y gestiona los balances financieros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4 space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={(new Date().getFullYear() - 1).toString()}>
                      {new Date().getFullYear() - 1}
                    </SelectItem>
                    <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                    <SelectItem value={(new Date().getFullYear() + 1).toString()}>
                      {new Date().getFullYear() + 1}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedMonth ? selectedMonth.toString() : "all"}
                  onValueChange={(value) => setSelectedMonth(value === "all" ? 0 : Number.parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los meses</SelectItem>
                    {monthNames.map((name, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 max-w-sm">
                <Select value={selectedLocal} onValueChange={setSelectedLocal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los locales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los locales</SelectItem>
                    {locales.map((local) => (
                      <SelectItem key={local.id} value={local.name}>
                        {local.name}
                      </SelectItem>
                    ))}
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

            <DataTable
              columns={columns}
              data={balances}
              searchColumn="local"
              searchPlaceholder="Buscar por local..."
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
