"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Wifi, 
  Users, 
  Server,
  RefreshCw
} from "lucide-react"

interface DiagnosticResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: string
}

export default function DiagnosticoPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setDiagnostics([])

    const tests = [
      {
        name: "Conexión a Base de Datos",
        test: () => fetch("/api/test-connection")
      },
      {
        name: "Estructura de Tablas",
        test: () => fetch("/api/check-tables")
      },
      {
        name: "API de Empleados",
        test: () => fetch("/api/test-employees")
      }
    ]

    for (const test of tests) {
      try {
        const response = await test.test()
        const data = await response.json()

        setDiagnostics(prev => [...prev, {
          name: test.name,
          status: response.ok && data.success ? "success" : "error",
          message: data.message || (response.ok ? "OK" : "Error"),
          details: data.error || data.details
        }])
      } catch (error) {
        setDiagnostics(prev => [...prev, {
          name: test.name,
          status: "error",
          message: "Error de conexión",
          details: error instanceof Error ? error.message : "Error desconocido"
        }])
      }
    }

    setIsRunning(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">OK</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Advertencia</Badge>
      default:
        return <Badge variant="secondary">Desconocido</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Diagnóstico del Sistema</h2>
            <p className="text-muted-foreground">
              Verificación del estado de conexiones y servicios
            </p>
          </div>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Ejecutando..." : "Ejecutar Diagnóstico"}
          </Button>
        </div>

        <div className="grid gap-4">
          {diagnostics.map((diagnostic, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getStatusIcon(diagnostic.status)}
                  {diagnostic.name}
                </CardTitle>
                {getStatusBadge(diagnostic.status)}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {diagnostic.message}
                </p>
                {diagnostic.details && (
                  <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted p-2 rounded">
                    {diagnostic.details}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

          {diagnostics.length === 0 && !isRunning && (
            <Card>
              <CardContent className="flex items-center justify-center py-6">
                <p className="text-muted-foreground">No hay diagnósticos disponibles. Haz clic en "Ejecutar Diagnóstico".</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}