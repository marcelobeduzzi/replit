"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Search, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function Header() {
  const pathname = usePathname()
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Nueva alerta de stock",
      description: "Faltante de 10 unidades de Empanadas",
      read: false,
    },
    {
      id: 2,
      title: "Alerta de caja",
      description: "Diferencia de $6,500 en caja",
      read: false,
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  // Determinar el título de la página basado en la ruta
  const getPageTitle = () => {
    if (pathname === "/admin/dashboard") return "Panel de Administración"
    if (pathname === "/admin/alerts") return "Alertas del Sistema"
    if (pathname === "/admin/actions") return "Acciones Correctivas"
    if (pathname === "/stock-control") return "Control de Stock"
    if (pathname.startsWith("/stock-control/")) return "Control de Stock"
    return "Panel de Administración"
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver al Dashboard Principal
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <form className="hidden md:flex">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Buscar..." className="w-64 rounded-lg bg-background pl-8" />
          </div>
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificaciones</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-auto text-xs" onClick={markAllAsRead}>
                  Marcar todas como leídas
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No hay notificaciones</div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="cursor-pointer p-4"
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className={`h-2 w-2 rounded-full mt-1 ${notification.read ? "bg-muted" : "bg-blue-500"}`} />
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/alerts" className="flex w-full justify-center text-sm font-medium">
                Ver todas las alertas
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Configuración</span>
        </Button>
      </div>
    </header>
  )
}



