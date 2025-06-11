"use client"

import { Button } from "@/components/ui/button"
import type React from "react"
import { useState, useEffect, useCallback, memo, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Users, DollarSign, Calendar, Settings, ChevronDown, Menu, TrendingUp, LogOut, ClipboardCheck, ReceiptText, PieChart, LayoutDashboard, Star, MessageSquare, ShoppingCart, CreditCard, Package, Shield, Calculator, Truck, CreditCardIcon, History, Store, Tag, Boxes, AlertTriangle, ShoppingBag } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { LoadingSpinner } from "@/components/loading-spinner"
import { SessionRefreshHandler } from "@/components/session-refresh-handler"
import { sessionManager } from "@/lib/session-manager"

interface NavItem {
  title: string
  href: string
  icon: any
  roles?: string[] // Lista de roles que pueden ver este elemento
  submenu?: NavItem[]
}

// Componente memoizado para NavLink para evitar re-renderizados innecesarios
const NavLink = memo(
  ({
    item,
    pathname,
    toggleSubmenu,
    openSubmenu,
    userRole,
  }: {
    item: NavItem
    pathname: string
    toggleSubmenu: (title: string) => void
    openSubmenu: string | null
    userRole: string | undefined
  }) => {
    const isActive = pathname === item.href
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isSubmenuOpen = openSubmenu === item.title
    const isSubmenuActive = item.submenu?.some((subItem) => pathname === subItem.href)

    // Verificar si el usuario tiene acceso a este elemento
    const hasAccess =
      !item.roles || item.roles.length === 0 || item.roles.includes(userRole || "") || userRole === "admin"

    // Añadir log para depuración
    console.log(
      `NavItem ${item.title}: userRole=${userRole}, roles=${JSON.stringify(item.roles)}, hasAccess=${hasAccess}`,
    )

    // Si no tiene acceso, no renderizar nada
    if (!hasAccess) {
      return null
    }

    if (hasSubmenu) {
      return (
        <div>
          <button
            onClick={() => toggleSubmenu(item.title)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              isSubmenuOpen || isSubmenuActive ? "bg-accent text-accent-foreground" : "",
            )}
          >
            <div className="flex items-center">
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isSubmenuOpen ? "rotate-180" : "")} />
          </button>

          {isSubmenuOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {item.submenu
                ?.filter(
                  (subItem) =>
                    !subItem.roles ||
                    subItem.roles.length === 0 ||
                    subItem.roles.includes(userRole || "") ||
                    userRole === "admin",
                )
                .map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === subItem.href ? "bg-accent text-accent-foreground" : "",
                    )}
                  >
                    <subItem.icon className="mr-2 h-4 w-4" />
                    <span>{subItem.title}</span>
                  </Link>
                ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          isActive ? "bg-accent text-accent-foreground" : "",
        )}
      >
        <item.icon className="mr-2 h-4 w-4" />
        <span>{item.title}</span>
      </Link>
    )
  },
)

NavLink.displayName = "NavLink"

// Componente principal con exportación por defecto
export default function DashboardLayout({ 
  children, 
  isLoading 
}: { 
  children: React.ReactNode; 
  isLoading?: boolean 
}) {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const { user, logout, refreshSession } = useAuth()
  const router = useRouter()

  // Add error state
  const [error, setError] = useState<string | null>(null)

  // Intentar refrescar la sesión al cargar el componente
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Usar el sessionManager para refrescar la sesión
        await sessionManager.getSession()
        console.log("Session refreshed")

        // También llamar al refreshSession del contexto para mantener compatibilidad
        if (refreshSession) {
          await refreshSession()
        }
      } catch (error) {
        console.error("Error refreshing session:", error)
      }
    }

    loadUserData()
  }, [refreshSession])

  // Check if user is authenticated
  useEffect(() => {
    console.log("User object:", user)
    console.log("User metadata:", user?.user_metadata)
    console.log("User role:", user?.role) // Cambiado de user?.user_metadata?.role a user?.role
  }, [user])

  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/login")
    }
  }, [user, router, isLoading])

  const navItems = useMemo(
    () => [
      {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        roles: ["admin", "gerente", "supervisor", "encargado"],
      },
      {
        title: "Empleados",
        href: "#",
        icon: Users,
        roles: ["admin", "gerente", "supervisor"],
        submenu: [
          {
            title: "Lista de Empleados",
            href: "/empleados",
            icon: Users,
            roles: ["admin", "gerente", "supervisor"],
          },
          {
            title: "Nuevo Empleado",
            href: "/empleados/nuevo",
            icon: Users,
            roles: ["admin", "gerente", "supervisor"],
          },
          {
            title: "Nómina",
            href: "/nomina",
            icon: DollarSign,
            roles: ["admin", "gerente", "supervisor"],
          },
        ],
      },
      {
        title: "Control de Asistencias",
        href: "/asistencias",
        icon: Calendar,
        roles: ["admin", "gerente", "encargado"],
      },
      {
        title: "Sistema de Ventas",
        href: "#",
        icon: Store,
        roles: ["admin", "gerente", "supervisor", "encargado"],
        submenu: [
          {
            title: "Productos",
            href: "/ventas/productos",
            icon: Tag,
            roles: ["admin", "gerente", "supervisor", "encargado"],
          },
          {
            title: "Inventario",
            href: "/ventas/inventario",
            icon: Boxes,
            roles: ["admin", "gerente", "supervisor", "encargado"],
          },
          {
            title: "Registro de Ventas",
            href: "/ventas/registro",
            icon: ShoppingBag,
            roles: ["admin", "gerente", "supervisor", "encargado"],
          },
          {
            title: "Alertas de Stock",
            href: "/ventas/alertas",
            icon: AlertTriangle,
            roles: ["admin", "gerente", "supervisor", "encargado"],
          },
        ],
      },
      {
        title: "Control de Caja",
        href: "/caja",
        icon: CreditCard,
        roles: ["admin", "gerente", "supervisor", "encargado"],
      },
      {
        title: "Planilla Stock Matrix",
        href: "/stock-matrix",
        icon: Package,
        roles: ["admin", "gerente", "supervisor", "encargado"],
      },
	  {
		title: "Conciliación",
		href: "/conciliacion",
		icon: Package,
        roles: ["admin", "gerente", "supervisor"],
		},
      {
        title: "Delivery",
        href: "#",
        icon: TrendingUp,
        roles: ["admin"],
        submenu: [
          {
            title: "PedidosYa",
            href: "/delivery/pedidosya",
            icon: TrendingUp,
            roles: ["admin"],
          },
          {
            title: "Rappi",
            href: "/delivery/rappi",
            icon: TrendingUp,
            roles: ["admin"],
          },
          {
            title: "MercadoPago",
            href: "/delivery/mercadopago",
            icon: TrendingUp,
            roles: ["admin"],
          },
          {
            title: "Delivery Propio",
            href: "/delivery/propio",
            icon: TrendingUp,
            roles: ["admin"],
          },
        ],
      },
      {
        title: "Auditorías",
        href: "/auditorias",
        icon: ClipboardCheck,
        roles: ["admin", "gerente", "supervisor"],
      },
      {
        title: "Pedidos Brozziano",
        href: "/pedidos-brozziano",
        icon: ShoppingCart,
        roles: ["admin", "gerente"],
      },
      {
        title: "Productividad Empleados",
        href: "/productividad",
        icon: PieChart,
        roles: ["admin", "gerente"],
      },
      {
        title: "Facturación",
        href: "/facturacion",
        icon: ReceiptText,
        roles: ["admin", "gerente"],
      },
      {
        title: "Proveedores y Pagos",
        href: "#",
        icon: Truck,
        roles: ["admin", "gerente", "supervisor"],
        submenu: [
          {
            title: "Dashboard",
            href: "/proveedores-pagos",
            icon: LayoutDashboard,
            roles: ["admin", "gerente", "supervisor"],
          },
          {
            title: "Gestión de Proveedores",
            href: "/proveedores-pagos/proveedores",
            icon: Truck,
            roles: ["admin", "gerente", "supervisor"],
          },
          {
            title: "Pago a Proveedores",
            href: "/proveedores-pagos/pagos",
            icon: CreditCardIcon,
            roles: ["admin", "gerente", "supervisor"],
          },
          {
            title: "Historial de Pagos",
            href: "/proveedores-pagos/historial",
            icon: History,
            roles: ["admin", "gerente", "supervisor"],
          },
          {
            title: "Simulación de Costos",
            href: "/proveedores-pagos/simulacion-costos",
            icon: Calculator,
            roles: ["admin", "gerente", "supervisor"],
          },
        ],
      },
      {
        title: "Sistema de Puntos",
        href: "/puntos",
        icon: Star,
        roles: ["admin"],
      },
      {
        title: "Chat Interno",
        href: "/chat",
        icon: MessageSquare,
        roles: ["admin"],
      },
      {
        title: "Balances",
        href: "/balances",
        icon: PieChart,
        roles: ["admin", "gerente"],
      },
      {
        title: "Reportes",
        href: "/reportes",
        icon: BarChart3,
        roles: ["admin", "gerente"],
      },
      {
        title: "Panel de Administración",
        href: "/admin",
        icon: Shield,
        roles: ["admin", "gerente"],
      },
      {
        title: "Configuración",
        href: "/configuracion",
        icon: Settings,
        roles: ["admin"],
      },
    ],
    [],
  )

  const toggleSubmenu = useCallback((title: string) => {
    setOpenSubmenu((prev) => (prev === title ? null : title))
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      // Usar el sessionManager para cerrar sesión
      await sessionManager.logout()

      // También llamar al logout del contexto para mantener compatibilidad
      logout()
    } catch (error) {
      console.error("Error during logout:", error)
      // Fallback manual para logout en caso de error
      localStorage.removeItem("user")
      router.push("/login")
    }
  }, [logout, router])

  // Memoizar el contenido de la barra lateral para evitar re-renderizados innecesarios
  const sidebarContent = useMemo(
    () => (
      <>
        <div className="mb-6 px-2">
          <h1 className="text-xl font-bold">Quadrifoglio</h1>
          <p className="text-sm text-muted-foreground">Sistema de Gestión</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.title}
              item={item}
              pathname={pathname}
              toggleSubmenu={toggleSubmenu}
              openSubmenu={openSubmenu}
              userRole={user?.role} // Cambiado de user?.user_metadata?.role a user?.role
            />
          ))}
        </nav>
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <span className="text-sm font-medium">{user?.name ? user.name.charAt(0) : "U"}</span>
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium">{user?.name || "Usuario"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || "usuario@quadrifoglio.com"}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </>
    ),
    [pathname, toggleSubmenu, openSubmenu, user, handleLogout, navItems],
  )

  // Update the return statement to handle loading and errors
  return (
    <div className="flex min-h-screen flex-col">
      {/* Agrega el SessionRefreshHandler */}
      <SessionRefreshHandler />

      <div className="flex min-h-screen bg-background">
        {/* Sidebar para desktop */}
        <aside className="hidden w-64 flex-col border-r bg-card px-4 py-6 md:flex">{sidebarContent}</aside>

        {/* Sidebar móvil */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden absolute top-4 left-4 z-10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <h1 className="text-xl font-bold">Quadrifoglio</h1>
                <p className="text-sm text-muted-foreground">Sistema de Gestión</p>
              </div>
              <nav className="flex-1 overflow-auto p-4 space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.title}
                    item={item}
                    pathname={pathname}
                    toggleSubmenu={toggleSubmenu}
                    openSubmenu={openSubmenu}
                    userRole={user?.role} // Cambiado de user?.user_metadata?.role a user?.role
                  />
                ))}
              </nav>
              <div className="p-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <span className="text-sm font-medium">{user?.name ? user.name.charAt(0) : "U"}</span>
                    </div>
                    <div className="ml-2">
                      <p className="text-sm font-medium">{user?.name || "Usuario"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email || "usuario@quadrifoglio.com"}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Header />

          {error ? (
            <div className="flex-1 p-8 flex items-center justify-center">
              <div className="bg-destructive/10 p-4 rounded-md text-destructive max-w-md">
                <h3 className="font-semibold mb-2">Error</h3>
                <p>{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => setError(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex-1 p-8 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}