"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Tag,
  Boxes,
  AlertTriangle,
  Store,
  ChevronRight,
  BarChart,
  ShoppingCart,
  Truck,
  History,
  LayoutDashboard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import DashboardLayout from "@/app/dashboard-layout"

interface SidebarItem {
  title: string
  href: string
  icon: any
  section?: string
}

export default function VentasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const sidebarItems: SidebarItem[] = [
    // Sección principal
    {
      title: "Dashboard",
      href: "/ventas",
      icon: LayoutDashboard,
      section: "principal",
    },

    // Sección de operaciones
    {
      title: "Punto de Venta",
      href: "/pos",
      icon: ShoppingCart,
      section: "operaciones",
    },
    {
      title: "Pedidos Delivery",
      href: "/ventas/delivery",
      icon: Truck,
      section: "operaciones",
    },
    {
      title: "Historial de Ventas",
      href: "/ventas/historial",
      icon: History,
      section: "operaciones",
    },

    // Sección de catálogo
    {
      title: "Productos",
      href: "/ventas/productos",
      icon: Tag,
      section: "catalogo",
    },
    {
      title: "Inventario",
      href: "/ventas/inventario",
      icon: Boxes,
      section: "catalogo",
    },
    {
      title: "Alertas de Stock",
      href: "/ventas/alertas",
      icon: AlertTriangle,
      section: "catalogo",
    },

    // Sección de análisis
    {
      title: "Reportes",
      href: "/ventas/reportes",
      icon: BarChart,
      section: "analisis",
    },
  ]

  // Agrupar elementos por sección
  const groupedItems = sidebarItems.reduce(
    (acc, item) => {
      const section = item.section || "otros"
      if (!acc[section]) {
        acc[section] = []
      }
      acc[section].push(item)
      return acc
    },
    {} as Record<string, SidebarItem[]>,
  )

  // Títulos de las secciones
  const sectionTitles = {
    principal: "Principal",
    operaciones: "Operaciones",
    catalogo: "Catálogo",
    analisis: "Análisis",
    otros: "Otros",
  }

  return (
    <DashboardLayout>
      <div className="flex min-h-screen">
        {/* Sidebar interno para la sección de ventas */}
        <aside className="hidden w-64 border-r bg-card p-4 md:block">
          <div className="mb-6 flex items-center">
            <Store className="mr-2 h-5 w-5" />
            <h2 className="text-lg font-semibold">Sistema de Ventas</h2>
          </div>

          <nav className="space-y-6">
            {Object.entries(groupedItems).map(([section, items]) => (
              <div key={section} className="space-y-1">
                <h3 className="px-3 text-xs font-medium uppercase text-muted-foreground tracking-wider">
                  {sectionTitles[section as keyof typeof sectionTitles]}
                </h3>

                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === item.href || pathname.startsWith(`${item.href}/`)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                    {pathname === item.href && <ChevronRight className="ml-auto h-4 w-4" />}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Versión móvil: Navegación horizontal */}
        <div className="md:hidden w-full border-b bg-card p-2 flex overflow-x-auto space-x-2">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          ))}
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </DashboardLayout>
  )
}
