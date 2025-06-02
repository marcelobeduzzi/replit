"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Users,
  DollarSign,
  Calendar,
  Settings,
  TrendingUp,
  ClipboardCheck,
  ReceiptText,
  PieChart,
  LayoutDashboard,
  Star,
  MessageSquare,
  ShoppingCart,
  CreditCard,
  Package,
  Shield,
  Calculator,
  Truck,
  History,
  LogOut,
  Plus,
  ClipboardList,
} from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <Sidebar>
      <SidebarHeader className="mb-2">
        <div className="px-2">
          <h1 className="text-xl font-bold">Quadrifoglio</h1>
          <p className="text-sm text-muted-foreground">Sistema de Gestión</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Dashboard">
              <Link href="/">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup>
          <SidebarGroupLabel>Empleados</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/empleados"} tooltip="Lista de Empleados">
                  <Link href="/empleados">
                    <Users />
                    <span>Lista de Empleados</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/empleados/nuevo"} tooltip="Nuevo Empleado">
                  <Link href="/empleados/nuevo">
                    <Users />
                    <span>Nuevo Empleado</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/nomina"} tooltip="Nómina">
                  <Link href="/nomina">
                    <DollarSign />
                    <span>Nómina</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/asistencias"} tooltip="Control de Asistencias">
              <Link href="/asistencias">
                <Calendar />
                <span>Control de Asistencias</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/caja"} tooltip="Control de Caja">
              <Link href="/caja">
                <CreditCard />
                <span>Control de Caja</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/stock-control"} tooltip="Control de Stock">
              <Link href="/stock-control">
                <Package />
                <span>Control de Stock</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Agregar la nueva sección de Planilla de Stock */}
        <SidebarGroup>
          <SidebarGroupLabel>Planilla de Stock</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/stock-check"} tooltip="Planillas">
                  <Link href="/stock-check">
                    <ClipboardList />
                    <span>Planillas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/stock-check/new"} tooltip="Nueva Planilla">
                  <Link href="/stock-check/new">
                    <Plus />
                    <span>Nueva Planilla</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/stock-check/config"} tooltip="Configuración">
                  <Link href="/stock-check/config">
                    <Settings />
                    <span>Configuración</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Delivery</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/delivery/pedidosya"} tooltip="PedidosYa">
                  <Link href="/delivery/pedidosya">
                    <TrendingUp />
                    <span>PedidosYa</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/delivery/rappi"} tooltip="Rappi">
                  <Link href="/delivery/rappi">
                    <TrendingUp />
                    <span>Rappi</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/auditorias"} tooltip="Auditorías">
              <Link href="/auditorias">
                <ClipboardCheck />
                <span>Auditorías</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/pedidos-brozziano"} tooltip="Pedidos Brozziano">
              <Link href="/pedidos-brozziano">
                <ShoppingCart />
                <span>Pedidos Brozziano</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/facturacion"} tooltip="Facturación">
              <Link href="/facturacion">
                <ReceiptText />
                <span>Facturación</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup>
          <SidebarGroupLabel>Proveedores y Pagos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/proveedores-pagos"} tooltip="Dashboard">
                  <Link href="/proveedores-pagos">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/proveedores-pagos/proveedores"}
                  tooltip="Gestión de Proveedores"
                >
                  <Link href="/proveedores-pagos/proveedores">
                    <Truck />
                    <span>Gestión de Proveedores</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/proveedores-pagos/pagos"}
                  tooltip="Pago a Proveedores"
                >
                  <Link href="/proveedores-pagos/pagos">
                    <CreditCard />
                    <span>Pago a Proveedores</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/proveedores-pagos/historial"}
                  tooltip="Historial de Pagos"
                >
                  <Link href="/proveedores-pagos/historial">
                    <History />
                    <span>Historial de Pagos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/proveedores-pagos/simulacion-costos"}
                  tooltip="Simulación de Costos"
                >
                  <Link href="/proveedores-pagos/simulacion-costos">
                    <Calculator />
                    <span>Simulación de Costos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/puntos"} tooltip="Sistema de Puntos">
              <Link href="/puntos">
                <Star />
                <span>Sistema de Puntos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/chat"} tooltip="Chat Interno">
              <Link href="/chat">
                <MessageSquare />
                <span>Chat Interno</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/balances"} tooltip="Balances">
              <Link href="/balances">
                <PieChart />
                <span>Balances</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/reportes"} tooltip="Reportes">
              <Link href="/reportes">
                <BarChart3 />
                <span>Reportes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/admin"} tooltip="Panel de Administración">
              <Link href="/admin">
                <Shield />
                <span>Panel de Administración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/configuracion"} tooltip="Configuración">
              <Link href="/configuracion">
                <Settings />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between px-2 py-2 border-t">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <span className="text-sm font-medium">{user?.name ? user.name.charAt(0) : "U"}</span>
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium">{user?.name || "Usuario"}</p>
              <p className="text-xs text-muted-foreground">{user?.email || "usuario@quadrifoglio.com"}</p>
            </div>
          </div>
          <button onClick={logout} className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-accent">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

