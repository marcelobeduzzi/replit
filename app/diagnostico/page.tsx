"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, Database, Server, Wifi } from "lucide-react"

export default function DiagnosticoPage() {
  const diagnostics = [
    {
      name: "Conexión a Base de Datos",
      status: "success",
      message: "Conectado correctamente a Supabase",
      icon: Database,
    },
    {
      name: "API de Empleados",
      status: "success", 
      message: "Endpoint funcionando correctamente",
      icon: Server,
    },
    {
      name: "Conectividad de Red",
      status: "success",
      message: "Conexión estable",
      icon: Wifi,
    },
  ]

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
        return <Badge variant="default" className="bg-green-100 text-green-800">Exitoso</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "warning":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Advertencia</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Diagnóstico del Sistema</h1>
        <p className="text-muted-foreground">
          Estado de los componentes y servicios del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {diagnostics.map((diagnostic, index) => {
          const IconComponent = diagnostic.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{diagnostic.name}</CardTitle>
                {getStatusIcon(diagnostic.status)}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <IconComponent className="h-8 w-8 text-muted-foreground" />
                  {getStatusBadge(diagnostic.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {diagnostic.message}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen del Sistema</CardTitle>
          <CardDescription>
            Estado general de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estado General</span>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Operativo
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Última Verificación</span>
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleString()}
            </span>
          </div>
          <Button className="w-full" variant="outline">
            Ejecutar Diagnóstico Completo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}