"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  BarChart3,
  Settings,
  Package,
  DollarSign,
  Calendar,
  FileText,
  ShoppingCart,
} from "lucide-react"
import { mockAlerts } from "@/lib/mock-data"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  // Filtrar alertas activas (no resueltas)
  const activeAlerts = mockAlerts.filter((alert) => alert.status !== "resuelta")

  return (
    <div className={cn("pb-12 w-64 border-r bg-gray-100/40 dark:bg-gray-900/40", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Panel de Administración</h2>
          <div className="space-y-1">
            <Button
              variant={pathname === "/admin" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant={pathname === "/admin/users" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Usuarios
              </Link>
            </Button>
            <Button
              variant={pathname === "/admin/alerts" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/alerts">
                <div className="flex items-center">
                  <AlertTriangle className={`mr-2 h-4 w-4 ${activeAlerts.length > 0 ? "text-red-500" : ""}`} />
                  <span>Alertas</span>
                  {activeAlerts.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-medium rounded-full px-2 py-0.5">
                      {activeAlerts.length}
                    </span>
                  )}
                </div>
              </Link>
            </Button>
            <Button
              variant={pathname === "/admin/reports" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/reports">
                <BarChart3 className="mr-2 h-4 w-4" />
                Reportes
              </Link>
            </Button>
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Gestión</h2>
          <div className="space-y-1">
            <Button
              variant={pathname === "/admin/stock-control" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/stock-control">
                <Package className="mr-2 h-4 w-4" />
                Control de Stock
              </Link>
            </Button>
            <Button
              variant={pathname === "/admin/cash-register" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/cash-register">
                <DollarSign className="mr-2 h-4 w-4" />
                Cierres de Caja
              </Link>
            </Button>
            <Button
              variant={pathname === "/admin/schedule" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/schedule">
                <Calendar className="mr-2 h-4 w-4" />
                Horarios
              </Link>
            </Button>
            <Button
              variant={pathname === "/admin/inventory" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/inventory">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Inventario
              </Link>
            </Button>
            <Button
              variant={pathname === "/admin/documents" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/documents">
                <FileText className="mr-2 h-4 w-4" />
                Documentos
              </Link>
            </Button>
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Configuración</h2>
          <Button
            variant={pathname === "/admin/settings" ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/admin/settings">
              <Settings className="mr-2 h-4 w-4" />
              Ajustes
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

