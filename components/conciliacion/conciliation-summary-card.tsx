"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, XCircle, CircleDollarSign, PackageOpen } from 'lucide-react'

interface ConciliationSummaryCardProps {
  stockValue: number
  cashValue: number
  date?: string
  localName?: string
}

export function ConciliationSummaryCard({ stockValue, cashValue, date, localName }: ConciliationSummaryCardProps) {
  // Determinar el estado de compensación
  const compensationStatus = getCompensationStatus(stockValue, cashValue)
  const netDifference = stockValue + cashValue

  // Formatear valores monetarios
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Resumen de Conciliación
          {localName && ` - ${localName}`}
          {date && ` (${new Date(date).toLocaleDateString("es-AR")})`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Stock</p>
            <div className="flex items-center mt-1">
              <PackageOpen
                className={`h-4 w-4 mr-1 ${stockValue < 0 ? "text-red-500" : stockValue > 0 ? "text-green-500" : "text-gray-500"}`}
              />
              <p className={`font-medium ${stockValue < 0 ? "text-red-600" : stockValue > 0 ? "text-green-600" : ""}`}>
                {formatCurrency(stockValue)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Caja</p>
            <div className="flex items-center mt-1">
              <CircleDollarSign
                className={`h-4 w-4 mr-1 ${cashValue < 0 ? "text-red-500" : cashValue > 0 ? "text-green-500" : "text-gray-500"}`}
              />
              <p className={`font-medium ${cashValue < 0 ? "text-red-600" : cashValue > 0 ? "text-green-600" : ""}`}>
                {formatCurrency(cashValue)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Estado</p>
            <div className="flex items-center mt-1">
              <Badge
                variant="outline"
                className={`${getStatusColor(compensationStatus.status)} flex items-center gap-1`}
              >
                {getStatusIcon(compensationStatus.status)}
                <span>{compensationStatus.message}</span>
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Balance Total:</p>
            <p
              className={`font-medium ${netDifference < 0 ? "text-red-600" : netDifference > 0 ? "text-green-600" : "text-blue-600"}`}
            >
              {formatCurrency(netDifference)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{getExplanationSummary(compensationStatus.status)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Función para determinar si hay compensación entre stock y caja
function getCompensationStatus(stockValue: number, cashValue: number) {
  // Si ambos son cercanos a cero (dentro de un margen de error)
  const margin = 0.1 // 10 centavos de margen
  if (Math.abs(stockValue) < margin && Math.abs(cashValue) < margin) {
    return {
      status: "balanced",
      message: "Balanceado",
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
        percentage: 100 - (diff / maxValue) * 100,
      }
    }

    // Si la diferencia es menor al 20% del valor máximo, consideramos que hay compensación parcial
    if (diff / maxValue < 0.2) {
      return {
        status: "partially_compensated",
        message: "Parcial",
        percentage: 100 - (diff / maxValue) * 100,
      }
    }

    // Compensación débil
    return {
      status: "weakly_compensated",
      message: "Débil",
      percentage: 100 - (diff / maxValue) * 100,
    }
  }

  // Si ambos son del mismo signo (ambos faltantes o ambos sobrantes)
  if ((stockValue < 0 && cashValue < 0) || (stockValue > 0 && cashValue > 0)) {
    return {
      status: "same_direction",
      message: "Sin compensación",
    }
  }

  // Uno es cero y el otro no
  if (Math.abs(stockValue) < margin && Math.abs(cashValue) >= margin) {
    return {
      status: "cash_only",
      message: "Solo caja",
    }
  }

  if (Math.abs(cashValue) < margin && Math.abs(stockValue) >= margin) {
    return {
      status: "stock_only",
      message: "Solo stock",
    }
  }

  return {
    status: "unknown",
    message: "Desconocido",
  }
}

// Función para obtener el color según el estado
function getStatusColor(status: string) {
  switch (status) {
    case "compensated":
      return "bg-green-100 text-green-800 hover:bg-green-200"
    case "partially_compensated":
    case "weakly_compensated":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
    case "same_direction":
      return "bg-red-100 text-red-800 hover:bg-red-200"
    case "balanced":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200"
    case "cash_only":
    case "stock_only":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }
}

// Función para obtener el ícono según el estado
function getStatusIcon(status: string) {
  switch (status) {
    case "compensated":
      return <CheckCircle2 className="h-3 w-3" />
    case "partially_compensated":
    case "weakly_compensated":
      return <AlertCircle className="h-3 w-3" />
    case "same_direction":
      return <XCircle className="h-3 w-3" />
    case "balanced":
      return <CheckCircle2 className="h-3 w-3" />
    case "cash_only":
      return <CircleDollarSign className="h-3 w-3" />
    case "stock_only":
      return <PackageOpen className="h-3 w-3" />
    default:
      return <AlertCircle className="h-3 w-3" />
  }
}

// Función para obtener una explicación resumida
function getExplanationSummary(status: string): string {
  switch (status) {
    case "compensated":
      return "Las discrepancias de stock y caja se compensan perfectamente."
    case "partially_compensated":
    case "weakly_compensated":
      return "Hay compensación parcial entre las discrepancias de stock y caja."
    case "same_direction":
      return "Las discrepancias van en la misma dirección, sin compensación."
    case "balanced":
      return "No hay discrepancias significativas en stock ni en caja."
    case "cash_only":
      return "Solo hay discrepancias en caja, sin afectación en stock."
    case "stock_only":
      return "Solo hay discrepancias en stock, sin afectación en caja."
    default:
      return "No se puede determinar un patrón claro en las discrepancias."
  }
}