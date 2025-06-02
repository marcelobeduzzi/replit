"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, Bell } from "lucide-react"

export function Header() {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState<{ id: string; message: string; read: boolean }[]>([
    { id: "1", message: "Nueva auditoría programada para mañana", read: false },
    { id: "2", message: "Recordatorio: Cargar datos de delivery", read: false },
    { id: "3", message: "Nómina de Mayo lista para revisión", read: true },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleLogout = () => {
    logout()
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4 md:hidden">
          {/* Mobile logo */}
          <span className="font-bold">Quadrifoglio</span>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificaciones</span>
                <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
                  Marcar todas como leídas
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No hay notificaciones</div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start p-4 ${notification.read ? "" : "bg-muted/50"}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="text-sm">{notification.message}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{notification.read ? "Leída" : "No leída"}</div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-sm font-medium">{user?.name ? user.name.charAt(0) : "U"}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="flex flex-col">
                <span>{user?.name || "Usuario"}</span>
                <span className="text-xs text-muted-foreground">{user?.email || "usuario@quadrifoglio.com"}</span>
                <span className="mt-1 text-xs font-medium text-muted-foreground">
                  {user?.role === "admin"
                    ? "Administrador"
                    : user?.role === "manager"
                      ? "Gerente"
                      : user?.role === "supervisor"
                        ? "Supervisor"
                        : user?.role === "employee"
                          ? "Empleado"
                          : user?.role === "cashier"
                            ? "Cajero"
                            : user?.role === "waiter"
                              ? "Mesero"
                              : user?.role === "kitchen"
                                ? "Cocina"
                                : "Usuario"}
                </span>
                {user?.local && <span className="text-xs text-muted-foreground">Local: {user.local}</span>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Mi perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

