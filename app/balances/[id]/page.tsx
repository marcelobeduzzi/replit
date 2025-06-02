"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { balanceService } from "@/lib/balance-service"
import type { Balance, BalanceServicios } from "@/types/balance"
import { ArrowLeft, Download, Printer, TrendingUp, TrendingDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function BalanceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { toast } = useToast()
  const [balance, setBalance] = useState<Balance | null>(null)
  const [services, setServices] = useState<BalanceServicios | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Obtener balance
        const balanceData = await balanceService.getBalanceById(id)
        if (!balanceData) {
          toast({
            title: "Error",
            description: "No se encontró el balance solicitado",
            variant: "destructive",
          })
          router.push("/balances")
          return
        }

        setBalance(balanceData)

        // Obtener servicios
        const servicesData = await balanceService.getBalanceServices(id)
        setServices(servicesData)
      } catch (error) {
        console.error("Error al cargar datos del balance:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del balance",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, router, toast])

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    if (!balance) return

    // Preparar datos para exportar
    const data = [
      {
        Local: balance.local,
        Mes: new Date(0, balance.month - 1).toLocaleString("es-ES", { month: "long" }),
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
      },
    ]

    // Si hay servicios, agregar al CSV
    if (services) {
      data[0]["Prosegur"] = services.prosegur
      data[0]["Internet"] = services.internet
      data[0]["Seguro"] = services.seguro
      data[0]["Desinfectación"] = services.desinfectacion
      data[0]["Edenor"] = services.edenor
      data[0]["Metrogas"] = services.metrogas
      data[0]["ABL"] = services.abl
      data[0]["Expensas"] = services.expensas
      data[0]["Autónomo"] = services.autonomo
      data[0]["Abogado"] = services.abogado
      data[0]["Contador"] = services.contador
      data[0]["Datalive"] = services.datalive
      data[0]["Payway"] = services.payway
      data[0]["Personal"] = services.personal
    }

    const fileName = `balance_${balance.local.replace(/\s+/g, "_")}_${balance.month}_${balance.year}`
    import("@/lib/export-utils").then((module) => {
      module.exportToCSV(data, fileName)
    })
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            <span className="ml-2">Cargando datos del balance...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!balance) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h2 className="text-red-800 font-medium">Error</h2>
            <p className="text-red-700 mt-1">No se pudo encontrar el balance solicitado.</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/balances")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Balances
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  // Calcular totales
  const totalIngresos =
    balance.ventasRappi + balance.ventasPedidosYa + balance.ventasDebitoCreditoQR + balance.ventasEfectivo

  const totalGastos =
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
    balance.tarjeta

  // Obtener nombre del mes
  const monthName = new Date(0, balance.month - 1).toLocaleString("es-ES", { month: "long" })

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 print:p-0">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push("/balances")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Balance: {balance.local}</h2>
              <p className="text-muted-foreground">
                {monthName} {balance.year}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Encabezado para impresión */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold text-center">
            Balance: {balance.local} - {monthName} {balance.year}
          </h1>
        </div>

        {/* Resumen */}
        <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalIngresos.toLocaleString()}</div>
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
                {((totalGastos / totalIngresos) * 100).toFixed(2)}% de los ingresos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retorno Neto</CardTitle>
              <div className={balance.retornoNeto >= 0 ? "text-green-500" : "text-red-500"}>
                {balance.retornoNeto >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance.retornoNeto >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${balance.retornoNeto.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {((balance.retornoNeto / totalIngresos) * 100).toFixed(2)}% de margen
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalles del Balance */}
        <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
          {/* Ingresos */}
          <Card>
            <CardHeader>
              <CardTitle>Ingresos</CardTitle>
              <CardDescription>Desglose de ingresos por canal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Ventas Rappi</div>
                <div className="text-right">${balance.ventasRappi.toLocaleString()}</div>

                <div className="text-sm font-medium">Ventas PedidosYa</div>
                <div className="text-right">${balance.ventasPedidosYa.toLocaleString()}</div>

                <div className="text-sm font-medium">Débito/Crédito/QR</div>
                <div className="text-right">${balance.ventasDebitoCreditoQR.toLocaleString()}</div>

                <div className="text-sm font-medium">Efectivo</div>
                <div className="text-right">${balance.ventasEfectivo.toLocaleString()}</div>

                <Separator className="col-span-2 my-2" />

                <div className="text-sm font-bold">Total Ingresos</div>
                <div className="text-right font-bold">${totalIngresos.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          {/* Costos y Gastos */}
          <Card>
            <CardHeader>
              <CardTitle>Costos y Gastos</CardTitle>
              <CardDescription>Desglose de costos operativos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">CMV</div>
                <div className="text-right">
                  ${balance.cmv.toLocaleString()} ({balance.cmvPorcentaje.toFixed(2)}%)
                </div>

                <div className="text-sm font-medium">Desperdicio</div>
                <div className="text-right">${balance.desperdicio.toLocaleString()}</div>

                <div className="text-sm font-medium">Consumos</div>
                <div className="text-right">${balance.consumos.toLocaleString()}</div>

                <div className="text-sm font-medium">Contribución Marginal</div>
                <div className="text-right">${balance.contribucionMarginal.toLocaleString()}</div>

                <div className="text-sm font-medium">Fee</div>
                <div className="text-right">${balance.fee.toLocaleString()}</div>

                <div className="text-sm font-medium">Alquiler</div>
                <div className="text-right">${balance.alquiler.toLocaleString()}</div>

                <div className="text-sm font-medium">Sueldos</div>
                <div className="text-right">
                  ${balance.sueldos.toLocaleString()} ({balance.sueldosPorcentaje.toFixed(2)}%)
                </div>

                <div className="text-sm font-medium">Gastos</div>
                <div className="text-right">${balance.gastos.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          {/* Impuestos y Retenciones */}
          <Card>
            <CardHeader>
              <CardTitle>Impuestos y Retenciones</CardTitle>
              <CardDescription>Desglose de impuestos y retenciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">EBIT</div>
                <div className="text-right">${balance.ebit.toLocaleString()}</div>

                <div className="text-sm font-medium">IVA</div>
                <div className="text-right">${balance.iva.toLocaleString()}</div>

                <div className="text-sm font-medium">IIBB</div>
                <div className="text-right">${balance.iibb.toLocaleString()}</div>

                <div className="text-sm font-medium">CCSS</div>
                <div className="text-right">${balance.ccss.toLocaleString()}</div>

                <div className="text-sm font-medium">Tarjeta</div>
                <div className="text-right">${balance.tarjeta.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          {/* Servicios */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios</CardTitle>
              <CardDescription>Desglose de gastos en servicios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {services ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium">Prosegur</div>
                  <div className="text-right">${services.prosegur.toLocaleString()}</div>

                  <div className="text-sm font-medium">Internet</div>
                  <div className="text-right">${services.internet.toLocaleString()}</div>

                  <div className="text-sm font-medium">Seguro</div>
                  <div className="text-right">${services.seguro.toLocaleString()}</div>

                  <div className="text-sm font-medium">Desinfectación</div>
                  <div className="text-right">${services.desinfectacion.toLocaleString()}</div>

                  <div className="text-sm font-medium">Edenor</div>
                  <div className="text-right">${services.edenor.toLocaleString()}</div>

                  <div className="text-sm font-medium">Metrogas</div>
                  <div className="text-right">${services.metrogas.toLocaleString()}</div>

                  <div className="text-sm font-medium">ABL</div>
                  <div className="text-right">${services.abl.toLocaleString()}</div>

                  <div className="text-sm font-medium">Expensas</div>
                  <div className="text-right">${services.expensas.toLocaleString()}</div>

                  <div className="text-sm font-medium">Autónomo</div>
                  <div className="text-right">${services.autonomo.toLocaleString()}</div>

                  <div className="text-sm font-medium">Abogado</div>
                  <div className="text-right">${services.abogado.toLocaleString()}</div>

                  <div className="text-sm font-medium">Contador</div>
                  <div className="text-right">${services.contador.toLocaleString()}</div>

                  <div className="text-sm font-medium">Datalive</div>
                  <div className="text-right">${services.datalive.toLocaleString()}</div>

                  <div className="text-sm font-medium">Payway</div>
                  <div className="text-right">${services.payway.toLocaleString()}</div>

                  <div className="text-sm font-medium">Personal</div>
                  <div className="text-right">${services.personal.toLocaleString()}</div>

                  <Separator className="col-span-2 my-2" />

                  <div className="text-sm font-bold">Total Servicios</div>
                  <div className="text-right font-bold">${services.total.toLocaleString()}</div>
                </div>
              ) : (
                <div className="text-muted-foreground italic">No hay datos de servicios disponibles</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen Final */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen Final</CardTitle>
            <CardDescription>Resultado financiero del período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Ingresos</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium">Total Ingresos</div>
                  <div className="text-right font-bold">${totalIngresos.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Gastos</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium">CMV</div>
                  <div className="text-right">${balance.cmv.toLocaleString()}</div>

                  <div className="text-sm font-medium">Desperdicio</div>
                  <div className="text-right">${balance.desperdicio.toLocaleString()}</div>

                  <div className="text-sm font-medium">Consumos</div>
                  <div className="text-right">${balance.consumos.toLocaleString()}</div>

                  <div className="text-sm font-medium">Contribución Marginal</div>
                  <div className="text-right">${balance.contribucionMarginal.toLocaleString()}</div>

                  <div className="text-sm font-medium">Servicios</div>
                  <div className="text-right">${balance.servicios.toLocaleString()}</div>

                  <div className="text-sm font-medium">Fee</div>
                  <div className="text-right">${balance.fee.toLocaleString()}</div>

                  <div className="text-sm font-medium">Alquiler</div>
                  <div className="text-right">${balance.alquiler.toLocaleString()}</div>

                  <div className="text-sm font-medium">Sueldos</div>
                  <div className="text-right">${balance.sueldos.toLocaleString()}</div>

                  <div className="text-sm font-medium">Gastos</div>
                  <div className="text-right">${balance.gastos.toLocaleString()}</div>

                  <div className="text-sm font-medium">EBIT</div>
                  <div className="text-right">${balance.ebit.toLocaleString()}</div>

                  <div className="text-sm font-medium">IVA</div>
                  <div className="text-right">${balance.iva.toLocaleString()}</div>

                  <div className="text-sm font-medium">IIBB</div>
                  <div className="text-right">${balance.iibb.toLocaleString()}</div>

                  <div className="text-sm font-medium">CCSS</div>
                  <div className="text-right">${balance.ccss.toLocaleString()}</div>

                  <div className="text-sm font-medium">Tarjeta</div>
                  <div className="text-right">${balance.tarjeta.toLocaleString()}</div>

                  <Separator className="col-span-2 my-2" />

                  <div className="text-sm font-bold">Total Gastos</div>
                  <div className="text-right font-bold">${totalGastos.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex justify-between items-center">
              <div className="text-xl font-bold">Retorno Neto</div>
              <div className={`text-2xl font-bold ${balance.retornoNeto >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${balance.retornoNeto.toLocaleString()}
              </div>
            </div>
            <div className="text-sm text-muted-foreground text-right">
              {((balance.retornoNeto / totalIngresos) * 100).toFixed(2)}% de margen
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
