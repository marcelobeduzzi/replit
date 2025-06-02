"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  AlertCircle,
  ArrowDownUp,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  FileBarChart,
  PackageOpen,
  XCircle,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Tipos para los datos de conciliación
interface AnalisisConciliacionProps {
  // Datos de discrepancias de stock
  stockDiscrepancies: {
    id: string
    productId?: string
    productName?: string
    expectedQuantity?: number
    actualQuantity?: number
    quantityDifference?: number
    unitPrice?: number
    totalValue: number // Valor monetario de la discrepancia
  }[]

  // Datos de discrepancias de caja
  cashDiscrepancies: {
    id: string
    category?: string
    expectedAmount?: number
    actualAmount?: number
    difference: number // Diferencia monetaria
  }[]

  // Fecha de la conciliación (opcional)
  fecha?: string

  // Local (opcional)
  local?: string

  // Turno (opcional)
  turno?: string
}

export function AnalisisConciliacion({
  stockDiscrepancies,
  cashDiscrepancies,
  fecha,
  local,
  turno,
}: AnalisisConciliacionProps) {
  // Eliminar duplicados de cashDiscrepancies basados en la combinación de category y difference
  const uniqueCashDiscrepancies = removeDuplicateCashDiscrepancies(cashDiscrepancies)

  // Calcular totales
  const totalStockDiscrepancy = stockDiscrepancies.reduce((sum, item) => sum + item.totalValue, 0)
  const totalCashDiscrepancy = uniqueCashDiscrepancies.reduce((sum, item) => sum + item.difference, 0)
  const balanceTotal = totalStockDiscrepancy + totalCashDiscrepancy

  // Determinar el estado de compensación
  const compensationStatus = getCompensationStatus(totalStockDiscrepancy, totalCashDiscrepancy)

  // Calcular estadísticas
  const stockItemsCount = stockDiscrepancies.length
  const cashItemsCount = uniqueCashDiscrepancies.length
  const stockWithDiscrepancy = stockDiscrepancies.filter((item) => item.totalValue !== 0).length
  const cashWithDiscrepancy = uniqueCashDiscrepancies.filter((item) => item.difference !== 0).length

  // Formatear valores monetarios
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(value)
  }

  // Formatear valores monetarios con notación abreviada
  const formatAbbreviatedCurrency = (value: number) => {
    const absValue = Math.abs(value)
    if (absValue >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`
    } else if (absValue >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    } else {
      return value.toFixed(2)
    }
  }

  // Construir título contextualizado
  const buildContextTitle = () => {
    let title = "Análisis de Conciliación"
    if (local) {
      title += ` - ${local}`
    }
    if (turno && turno !== "todos") {
      title += ` - Turno ${turno}`
    }
    return title
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{buildContextTitle()}</CardTitle>
          <CardDescription>
            Relación entre discrepancias de stock y caja
            {fecha && ` - ${new Date(fecha).toLocaleDateString("es-AR")}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Resumen de valores */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">
                              {totalStockDiscrepancy < 0 ? "-" : ""}$
                              {formatAbbreviatedCurrency(Math.abs(totalStockDiscrepancy))}
                            </div>
                            <PackageOpen
                              className={`h-5 w-5 ${
                                totalStockDiscrepancy < 0
                                  ? "text-red-500"
                                  : totalStockDiscrepancy > 0
                                    ? "text-green-500"
                                    : "text-gray-500"
                              }`}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{formatCurrency(totalStockDiscrepancy)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalStockDiscrepancy < 0
                        ? "Faltante de stock"
                        : totalStockDiscrepancy > 0
                          ? "Sobrante de stock"
                          : "Sin discrepancias"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Caja</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">
                              {totalCashDiscrepancy < 0 ? "-" : ""}$
                              {formatAbbreviatedCurrency(Math.abs(totalCashDiscrepancy))}
                            </div>
                            <CircleDollarSign
                              className={`h-5 w-5 ${
                                totalCashDiscrepancy < 0
                                  ? "text-red-500"
                                  : totalCashDiscrepancy > 0
                                    ? "text-green-500"
                                    : "text-gray-500"
                              }`}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{formatCurrency(totalCashDiscrepancy)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalCashDiscrepancy < 0
                        ? "Faltante de caja"
                        : totalCashDiscrepancy > 0
                          ? "Sobrante de caja"
                          : "Sin discrepancias"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">
                              {balanceTotal < 0 ? "-" : ""}${formatAbbreviatedCurrency(Math.abs(balanceTotal))}
                            </div>
                            <ArrowDownUp
                              className={`h-5 w-5 ${
                                balanceTotal < 0
                                  ? "text-red-500"
                                  : balanceTotal > 0
                                    ? "text-green-500"
                                    : "text-blue-500"
                              }`}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{formatCurrency(balanceTotal)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <p className="text-xs text-muted-foreground mt-1">{compensationStatus.message}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Estadísticas */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Estadísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Items de stock con discrepancia</span>
                      <span className="text-xs font-medium">
                        {stockWithDiscrepancy} de {stockItemsCount}
                      </span>
                    </div>
                    <Progress
                      value={(stockWithDiscrepancy / (stockItemsCount || 1)) * 100}
                      className="h-1 bg-gray-200"
                      indicatorClassName="bg-blue-500"
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-xs">Items de caja con discrepancia</span>
                      <span className="text-xs font-medium">
                        {cashWithDiscrepancy} de {cashItemsCount}
                      </span>
                    </div>
                    <Progress
                      value={(cashWithDiscrepancy / (cashItemsCount || 1)) * 100}
                      className="h-1 bg-gray-200"
                      indicatorClassName="bg-amber-500"
                    />

                    {compensationStatus.percentage !== undefined && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Nivel de compensación</span>
                          <span className="text-xs font-medium">{Math.round(compensationStatus.percentage)}%</span>
                        </div>
                        <Progress
                          value={compensationStatus.percentage}
                          className="h-1 bg-gray-200"
                          indicatorClassName="bg-green-500"
                        />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Análisis de compensación */}
            <div className="col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base">Análisis de Compensación</CardTitle>
                  <CardDescription>Interpretación de la relación entre discrepancias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Alerta de estado */}
                    <Alert className={getAlertStyle(compensationStatus.status)}>
                      {getStatusIcon(compensationStatus.status)}
                      <AlertTitle>{compensationStatus.title || compensationStatus.message}</AlertTitle>
                      <AlertDescription>
                        {compensationStatus.description}
                        {compensationStatus.percentage !== undefined && (
                          <span className="block mt-1 font-medium">
                            Nivel de compensación: {Math.round(compensationStatus.percentage)}%
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>

                    {/* Recomendaciones */}
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Recomendaciones</h3>
                      <div className="space-y-2">
                        {getRecommendations(compensationStatus.status, totalStockDiscrepancy, totalCashDiscrepancy).map(
                          (rec, index) => (
                            <div key={index} className="flex items-start">
                              <div className="flex-shrink-0 mt-0.5">
                                <ArrowRight className="h-4 w-4 text-primary" />
                              </div>
                              <div className="ml-2">
                                <p className="text-sm">{rec}</p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    {/* Explicación */}
                    <div className="mt-4 p-4 bg-muted/50 rounded-md">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <FileBarChart className="h-4 w-4 mr-2" />
                        Interpretación de Resultados
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {getExplanation(compensationStatus.status, totalStockDiscrepancy, totalCashDiscrepancy)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Función para eliminar duplicados en las discrepancias de caja
function removeDuplicateCashDiscrepancies(cashDiscrepancies: any[]) {
  const uniqueMap = new Map()

  cashDiscrepancies.forEach((item) => {
    const key = `${item.category || ""}-${item.expectedAmount || 0}-${item.actualAmount || 0}`
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item)
    }
  })

  return Array.from(uniqueMap.values())
}

// Función para determinar si hay compensación entre stock y caja
function getCompensationStatus(stockValue: number, cashValue: number) {
  // Si ambos son cercanos a cero (dentro de un margen de error)
  const margin = 0.1 // 10 centavos de margen
  if (Math.abs(stockValue) < margin && Math.abs(cashValue) < margin) {
    return {
      status: "balanced",
      message: "Balanceado",
      title: "Sin Discrepancias Significativas",
      description: "No hay discrepancias significativas en stock ni en caja.",
    }
  }

  // Si ambos son del mismo signo (ambos faltantes o ambos sobrantes)
  if ((stockValue < 0 && cashValue < 0) || (stockValue > 0 && cashValue > 0)) {
    const status = stockValue < 0 ? "same_direction_negative" : "same_direction_positive"
    return {
      status,
      message: "Sin compensación",
      title: "Discrepancias en la Misma Dirección",
      description:
        stockValue < 0
          ? "Hay faltantes tanto en stock como en caja. Esto puede indicar problemas serios como pérdidas, robos o errores significativos de registro."
          : "Hay sobrantes tanto en stock como en caja. Esto puede indicar errores en el registro de compras, ingresos o en el conteo de inventario.",
    }
  }

  // Si los valores son de signo opuesto y cercanos en magnitud (compensación)
  if ((stockValue < 0 && cashValue > 0) || (stockValue > 0 && cashValue < 0)) {
    const diff = Math.abs(stockValue + cashValue)
    const maxValue = Math.max(Math.abs(stockValue), Math.abs(cashValue))

    // Si la diferencia es menor al 5% del valor máximo, consideramos que hay compensación perfecta
    if (diff / maxValue < 0.05) {
      return {
        status: "compensated",
        message: "Compensado",
        title: "Compensación Perfecta",
        description:
          "Las discrepancias de stock y caja se compensan casi perfectamente. Esto sugiere que los productos faltantes fueron vendidos pero no registrados correctamente, y el dinero está en caja (o viceversa).",
        difference: diff,
        percentage: 100 - (diff / maxValue) * 100,
      }
    }

    // Si la diferencia es menor al 20% del valor máximo, consideramos que hay compensación parcial
    if (diff / maxValue < 0.2) {
      return {
        status: "partially_compensated",
        message: "Parcialmente compensado",
        title: "Compensación Parcial",
        description:
          "Hay una compensación parcial entre stock y caja. Esto puede indicar descuentos no registrados, errores parciales de registro o posibles problemas con los precios.",
        difference: diff,
        percentage: 100 - (diff / maxValue) * 100,
      }
    }

    // Compensación débil
    return {
      status: "weakly_compensated",
      message: "Débilmente compensado",
      title: "Compensación Débil",
      description:
        "Hay una compensación débil entre stock y caja. Las discrepancias van en direcciones opuestas pero con magnitudes muy diferentes.",
      difference: diff,
      percentage: 100 - (diff / maxValue) * 100,
    }
  }

  // Uno es cero y el otro no
  if (Math.abs(stockValue) < margin && Math.abs(cashValue) >= margin) {
    return {
      status: "cash_only",
      message: "Solo discrepancia en caja",
      title: "Solo Discrepancia en Caja",
      description:
        "Solo hay discrepancia en caja, sin afectación en el stock. Esto puede indicar errores en el manejo de efectivo o en el registro de pagos.",
    }
  }

  if (Math.abs(cashValue) < margin && Math.abs(stockValue) >= margin) {
    return {
      status: "stock_only",
      message: "Solo discrepancia en stock",
      title: "Solo Discrepancia en Stock",
      description:
        "Solo hay discrepancia en stock, sin afectación en caja. Esto puede indicar errores de inventario, pérdidas o problemas en el registro de productos.",
    }
  }

  return {
    status: "unknown",
    message: "Estado desconocido",
    title: "Estado Indeterminado",
    description: "No se puede determinar un patrón claro en las discrepancias.",
  }
}

// Función para obtener el estilo de la alerta según el estado
function getAlertStyle(status: string) {
  switch (status) {
    case "compensated":
      return "bg-green-50 text-green-800 border-green-200"
    case "partially_compensated":
      return "bg-yellow-50 text-yellow-800 border-yellow-200"
    case "weakly_compensated":
      return "bg-amber-50 text-amber-800 border-amber-200"
    case "same_direction_negative":
      return "bg-red-50 text-red-800 border-red-200"
    case "same_direction_positive":
      return "bg-orange-50 text-orange-800 border-orange-200"
    case "balanced":
      return "bg-blue-50 text-blue-800 border-blue-200"
    case "cash_only":
    case "stock_only":
      return "bg-purple-50 text-purple-800 border-purple-200"
    default:
      return "bg-gray-50 text-gray-800 border-gray-200"
  }
}

// Función para obtener el ícono según el estado
function getStatusIcon(status: string) {
  switch (status) {
    case "compensated":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case "partially_compensated":
    case "weakly_compensated":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    case "same_direction_negative":
      return <XCircle className="h-4 w-4 text-red-500" />
    case "same_direction_positive":
      return <AlertCircle className="h-4 w-4 text-orange-500" />
    case "balanced":
      return <CheckCircle2 className="h-4 w-4 text-blue-500" />
    case "cash_only":
      return <CircleDollarSign className="h-4 w-4 text-purple-500" />
    case "stock_only":
      return <PackageOpen className="h-4 w-4 text-purple-500" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />
  }
}

// Función para obtener recomendaciones según el estado
function getRecommendations(status: string, stockValue: number, cashValue: number): string[] {
  switch (status) {
    case "compensated":
      if (stockValue < 0 && cashValue > 0) {
        return [
          "Verificar los procedimientos de registro de ventas.",
          "Capacitar al personal sobre la importancia de registrar correctamente todas las transacciones.",
          "Revisar si hay productos que se están vendiendo sin registrar en el sistema.",
        ]
      } else {
        return [
          "Verificar los procedimientos de registro de devoluciones y ajustes de inventario.",
          "Revisar si hay ingresos de caja que no se están registrando correctamente.",
          "Comprobar si hay errores en el conteo de inventario.",
        ]
      }

    case "partially_compensated":
    case "weakly_compensated":
      if (stockValue < 0 && cashValue > 0) {
        return [
          "Investigar las posibles causas de la diferencia parcial.",
          "Revisar descuentos, promociones o errores de precio.",
          "Verificar si hay productos que se venden por debajo del precio registrado.",
          "Comprobar si hay transacciones que no se están registrando correctamente.",
        ]
      } else {
        return [
          "Investigar las posibles causas de la diferencia parcial.",
          "Revisar los procedimientos de registro de devoluciones y ajustes de inventario.",
          "Verificar si hay errores en el conteo de inventario o en el registro de pagos.",
        ]
      }

    case "same_direction_negative":
      return [
        "Investigar posibles pérdidas o robos.",
        "Revisar los procedimientos de seguridad y control de inventario.",
        "Considerar implementar medidas adicionales de supervisión.",
        "Verificar si hay errores en el registro de ventas o en el conteo de inventario.",
        "Revisar si hay ventas no registradas o dinero no depositado.",
      ]

    case "same_direction_positive":
      return [
        "Revisar los procedimientos de registro de compras e ingresos.",
        "Verificar si hay productos o ingresos que no se están registrando correctamente.",
        "Comprobar si hay errores en el conteo de inventario o en el cierre de caja.",
        "Revisar si hay depósitos duplicados o mercadería no registrada en el sistema.",
      ]

    case "balanced":
      return [
        "Mantener los procedimientos actuales de control.",
        "Realizar verificaciones periódicas para asegurar que se mantiene el balance.",
        "Documentar las buenas prácticas que han llevado a este resultado.",
      ]

    case "cash_only":
      if (cashValue < 0) {
        return [
          "Revisar los procedimientos de manejo de efectivo.",
          "Verificar si hay errores en el registro de pagos o en el cierre de caja.",
          "Comprobar si hay transacciones que no están siendo registradas correctamente.",
          "Investigar posibles faltantes de caja.",
        ]
      } else {
        return [
          "Revisar los procedimientos de registro de ingresos.",
          "Verificar si hay pagos o depósitos duplicados.",
          "Comprobar si hay transacciones que no están siendo registradas correctamente.",
        ]
      }

    case "stock_only":
      if (stockValue < 0) {
        return [
          "Revisar los procedimientos de control de inventario.",
          "Verificar si hay errores en el conteo o registro de productos.",
          "Comprobar si hay productos que se están perdiendo o dañando sin registro.",
          "Investigar posibles pérdidas o robos de mercadería.",
        ]
      } else {
        return [
          "Revisar los procedimientos de registro de inventario.",
          "Verificar si hay errores en el conteo o registro de productos.",
          "Comprobar si hay productos que se están recibiendo sin registro adecuado.",
        ]
      }

    default:
      return [
        "Realizar un análisis más detallado de las discrepancias.",
        "Revisar los procedimientos de registro de ventas, inventario y manejo de efectivo.",
        "Considerar implementar controles adicionales para identificar la causa de las discrepancias.",
      ]
  }
}

// Función para obtener una explicación detallada según el estado
function getExplanation(status: string, stockValue: number, cashValue: number): string {
  // Formatear valores monetarios
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(Math.abs(value))
  }

  switch (status) {
    case "compensated":
      if (stockValue < 0 && cashValue > 0) {
        return `El faltante de stock valorizado en ${formatCurrency(stockValue)} se compensa casi perfectamente con el sobrante en caja de ${formatCurrency(cashValue)}. Esto sugiere que se vendieron productos sin registrar la venta en el sistema, pero el dinero sí ingresó a la caja.`
      } else {
        return `El sobrante de stock valorizado en ${formatCurrency(stockValue)} se compensa casi perfectamente con el faltante en caja de ${formatCurrency(cashValue)}. Esto podría indicar devoluciones o ajustes de inventario que no fueron registrados correctamente.`
      }

    case "partially_compensated":
    case "weakly_compensated":
      if (stockValue < 0 && cashValue > 0) {
        return `El faltante de stock valorizado en ${formatCurrency(stockValue)} se compensa parcialmente con el sobrante en caja de ${formatCurrency(cashValue)}. Esto podría indicar ventas no registradas con descuentos, o una combinación de problemas de registro.`
      } else {
        return `El sobrante de stock valorizado en ${formatCurrency(stockValue)} se compensa parcialmente con el faltante en caja de ${formatCurrency(cashValue)}. Esto podría indicar errores en el registro de devoluciones o ajustes de inventario.`
      }

    case "same_direction_negative":
      return `Hay un faltante tanto en stock (${formatCurrency(stockValue)}) como en caja (${formatCurrency(cashValue)}). Esta situación es preocupante y podría indicar pérdidas, robos o errores significativos de registro. Se recomienda una investigación detallada.`

    case "same_direction_positive":
      return `Hay un sobrante tanto en stock (${formatCurrency(stockValue)}) como en caja (${formatCurrency(cashValue)}). Esto podría indicar errores en el registro de compras, ingresos o en el conteo de inventario.`

    case "balanced":
      return "No hay discrepancias significativas en stock ni en caja. Los controles y procedimientos actuales están funcionando correctamente."

    case "cash_only":
      if (cashValue < 0) {
        return `Solo hay un faltante en caja de ${formatCurrency(cashValue)}, sin discrepancias significativas en stock. Esto podría indicar errores en el manejo de efectivo o en el registro de pagos.`
      } else {
        return `Solo hay un sobrante en caja de ${formatCurrency(cashValue)}, sin discrepancias significativas en stock. Esto podría indicar pagos o ingresos no registrados correctamente.`
      }

    case "stock_only":
      if (stockValue < 0) {
        return `Solo hay un faltante en stock valorizado en ${formatCurrency(stockValue)}, sin discrepancias significativas en caja. Esto podría indicar pérdidas, daños o errores en el conteo de inventario.`
      } else {
        return `Solo hay un sobrante en stock valorizado en ${formatCurrency(stockValue)}, sin discrepancias significativas en caja. Esto podría indicar errores en el registro de productos o en el conteo de inventario.`
      }

    default:
      return "No se puede determinar un patrón claro en las discrepancias. Se recomienda un análisis más detallado."
  }
}
