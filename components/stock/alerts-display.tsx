"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockAlerts } from "@/lib/mock-data"
import { dbService } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

export function AlertsDisplay() {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Cargar alertas al montar el componente
  useEffect(() => {
    setIsClient(true)
    const loadAlerts = async () => {
      try {
        // Intentar cargar desde la base de datos
        try {
          const { data, error } = await dbService.supabase
            .from("alerts")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5)

          if (error) throw error

          if (data && data.length > 0) {
            setAlerts(
              data.map((alert) => ({
                ...alert,
                // Asegurar que las fechas sean strings
                date: alert.date ? new Date(alert.date).toISOString() : new Date().toISOString(),
                createdAt: alert.created_at ? new Date(alert.created_at).toISOString() : new Date().toISOString(),
                updatedAt: alert.updated_at ? new Date(alert.updated_at).toISOString() : new Date().toISOString(),
                resolvedAt: alert.resolved_at ? new Date(alert.resolved_at).toISOString() : null,
              })),
            )
          } else {
            // Si no hay datos en la base de datos, intentar cargar desde localStorage
            const localAlerts = localStorage.getItem("localAlerts")
            if (localAlerts) {
              setAlerts(JSON.parse(localAlerts))
            } else {
              // Si no hay datos en localStorage, usar los datos de mock
              setAlerts(mockAlerts.slice(0, 5))
            }
          }
        } catch (dbError) {
          console.error("Error al cargar alertas desde la base de datos:", dbError)
          // Intentar cargar desde localStorage
          if (isClient) {
            const localAlerts = localStorage.getItem("localAlerts")
            if (localAlerts) {
              setAlerts(JSON.parse(localAlerts))
            } else {
              // Usar datos de mock como fallback
              setAlerts(mockAlerts.slice(0, 5))
            }
          }
        }
      } catch (error) {
        console.error("Error al cargar alertas:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las alertas. Se están usando datos de ejemplo.",
          variant: "destructive",
        })
        setAlerts(mockAlerts.slice(0, 5))
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
  }, [toast, isClient])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "alta":
        return "destructive"
      case "media":
        return "warning"
      case "baja":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pendiente":
        return "destructive"
      case "revisada":
        return "warning"
      case "resuelta":
        return "success"
      default:
        return "secondary"
    }
  }

  // Formatear moneda
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return ""
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas Recientes</CardTitle>
          <CardDescription>Cargando alertas...</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p>Cargando...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Alertas Recientes</CardTitle>
          <CardDescription>Últimas alertas generadas por el sistema</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => (window.location.href = "/admin/alerts")}>
          Ver Todas
        </Button>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay alertas recientes</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Severidad</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(alert.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {alert.type === "stock"
                        ? "Stock"
                        : alert.type === "caja"
                          ? "Caja"
                          : alert.type === "decomiso"
                            ? "Decomiso"
                            : alert.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    {alert.description}
                    {alert.monetaryValue && (
                      <div className="text-sm text-red-500 mt-1">
                        Impacto financiero: {formatCurrency(alert.monetaryValue)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(alert.status)}>
                      {alert.status === "pendiente"
                        ? "Pendiente"
                        : alert.status === "revisada"
                          ? "Revisada"
                          : alert.status === "resuelta"
                            ? "Resuelta"
                            : alert.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}



