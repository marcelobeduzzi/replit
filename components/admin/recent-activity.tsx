"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockAlerts, mockUsers } from "@/lib/mock-data"

export function RecentActivity() {
  // Generar actividades basadas en alertas y acciones ficticias
  const generateActivities = () => {
    const alertActivities = mockAlerts.map((alert) => {
      const user = mockUsers.find((u) => u.id === alert.userId) || {
        name: "Usuario desconocido",
        email: "",
        initials: "??",
      }

      let action = ""
      if (alert.type === "stock") {
        action = `registró una diferencia de stock en ${alert.localName}`
      } else if (alert.type === "caja") {
        action = `reportó una diferencia en caja en ${alert.localName}`
      } else if (alert.type === "decomiso") {
        action = `registró decomisos excesivos en ${alert.localName}`
      }

      return {
        id: `alert-activity-${alert.id}`,
        user,
        action,
        timestamp: formatTimeAgo(new Date(alert.createdAt)),
      }
    })

    // Agregar algunas actividades ficticias adicionales
    const additionalActivities = [
      {
        id: "activity-1",
        user: mockUsers[3], // Ana Martínez
        action: "generó un reporte de ventas",
        timestamp: "hace 15 minutos",
      },
      {
        id: "activity-2",
        user: mockUsers[4], // Roberto Sánchez
        action: "configuró una nueva alerta",
        timestamp: "hace 1 hora",
      },
      {
        id: "activity-3",
        user: mockUsers[0], // Juan Pérez
        action: "actualizó el stock inicial en BR Cabildo",
        timestamp: "hace 3 horas",
      },
    ]

    return [...alertActivities, ...additionalActivities]
      .sort((a, b) => {
        // Ordenar por timestamp (convertir "hace X" a un valor numérico aproximado)
        const getTimeValue = (time) => {
          if (time.includes("minuto")) return Number.parseInt(time.split(" ")[1]) * 60
          if (time.includes("hora")) return Number.parseInt(time.split(" ")[1]) * 3600
          if (time.includes("día")) return Number.parseInt(time.split(" ")[1]) * 86400
          return 0
        }

        return getTimeValue(a.timestamp) - getTimeValue(b.timestamp)
      })
      .slice(0, 5) // Mostrar solo las 5 actividades más recientes
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "hace menos de un minuto"
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`
    return `hace ${Math.floor(diffInSeconds / 86400)} días`
  }

  const activities = generateActivities()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Últimas acciones realizadas en el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={`/placeholder.svg?height=36&width=36`} alt={activity.user.name} />
                <AvatarFallback>{activity.user.initials}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{activity.user.name}</p>
                <p className="text-sm text-muted-foreground">{activity.action}</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">{activity.timestamp}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

